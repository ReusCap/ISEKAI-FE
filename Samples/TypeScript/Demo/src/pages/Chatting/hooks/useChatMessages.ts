import { useState, useCallback, useRef } from 'react';
import { ChatMessage, EmotionType } from '@/types/chat';
import { getChatHistory } from '@/api/chat';

/** 스트리밍 메시지 ID 상수 */
const STREAMING_USER_ID = 'streaming-user';
const STREAMING_BOT_ID = 'streaming-bot';

/** 고유 ID 생성 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * 채팅 메시지 상태 관리 훅
 * 
 * USER_SUBTITLE_CHUNK와 USER_SUBTITLE_COMPLETE 관계:
 * - 청크들이 실시간으로 오다가, 문장이 완성되면 USER_SUBTITLE_COMPLETE로 옴
 * - USER_SUBTITLE_COMPLETE는 "본인 청크들"만 대체 (이전 문장은 유지)
 * 
 * 예시:
 * 청크 "안", "녕" → SENTENCE "안녕" → 청크 "하", "세", "요" → SENTENCE "하세요"
 * 결과: "안녕" + "하세요" = "안녕하세요"
 */
export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('NEUTRAL');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // 확정된 사용자 텍스트 (USER_SUBTITLE_COMPLETE로 확정된 부분)
  const confirmedUserTextRef = useRef('');

  // ========== 헬퍼 함수 ==========

  const createStreamingMessage = (
    id: string,
    type: 'user' | 'ai',
    text: string
  ): ChatMessage => ({
    id,
    type,
    text,
    timestamp: Date.now(),
    status: 'streaming'
  });

  const createCompleteMessage = (
    type: 'user' | 'ai',
    text: string
  ): ChatMessage => ({
    id: generateId(),
    type,
    text,
    timestamp: Date.now(),
    status: 'complete'
  });

  const clearStreamingMessages = useCallback(() => {
    setMessages(prev => prev.filter(
      m => m.id !== STREAMING_USER_ID && m.id !== STREAMING_BOT_ID
    ));
    confirmedUserTextRef.current = '';
  }, []);

  // ========== API 호출 ==========

  const loadChatHistory = useCallback(async (characterId: string) => {
    setIsLoadingHistory(true);
    try {
      // page 1, size 100 (충분히 많이 가져오기)
      // 필요하다면 나중에 무한 스크롤 등을 구현할 수 있음
      const data = await getChatHistory(characterId, 1, 100);
      
      const historyMessages: ChatMessage[] = data.content.map((item, index) => {
        const timestamp = item.createdAt ? new Date(item.createdAt).getTime() : 0;
        return {
          id: `history-${timestamp}-${index}-${Math.random()}`, // 고유 ID 생성
          type: item.speaker === 'USER' ? 'user' : 'ai',
          text: item.content,
          timestamp: timestamp,
          status: 'complete'
        };
      });

      // 기존 메시지 앞에 붙이기 (혹은 덮어쓰기?)
      // 여기서는 초기 진입시 로드하므로 덮어쓰는게 나을 수도 있지만,
      // 일단 useState 초기값이 [] 이므로 setMessages로 설정
      setMessages(historyMessages);
    } catch (error) {
      console.error('[useChatMessages] 채팅 내역 불러오기 실패:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // ========== WebSocket 이벤트 핸들러 ==========

  const handleServerReady = useCallback(() => {
    console.log('[useChatMessages] 서버 준비 완료');
  }, []);

  /**
   * USER_SUBTITLE_CHUNK: 청크를 임시로 이어붙이기
   * 확정된 텍스트 + 새 청크들
   */
  const handleUserSubtitleChunk = useCallback((chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      
      if (last?.id === STREAMING_USER_ID) {
        return [
          ...prev.slice(0, -1),
          createStreamingMessage(STREAMING_USER_ID, 'user', last.text + chunk)
        ];
      }
      
      return [...prev, createStreamingMessage(STREAMING_USER_ID, 'user', chunk)];
    });
  }, []);

  /**
   * USER_SUBTITLE_COMPLETE: 본인 청크들만 대체 (이전 문장 유지)
   * 확정된 텍스트 + 새 문장 = 전체 스트리밍 텍스트
   * 
   * 단, 마지막 메시지가 텍스트로 보낸 완료된 user 메시지인 경우 무시
   * (텍스트 메시지는 addUserTextMessage로 바로 complete 상태로 추가됨)
   */
  const handleUserSentence = useCallback((sentence: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      
      // 마지막 메시지가 완료된 user 메시지인 경우 (텍스트 메시지) 무시
      if (last?.type === 'user' && last?.status === 'complete') {
        return prev;
      }
      
      // 서버가 전체 누적 문장을 보내므로, sentence를 그대로 사용
      confirmedUserTextRef.current = sentence;
      
      if (last?.id === STREAMING_USER_ID) {
        return [
          ...prev.slice(0, -1),
          createStreamingMessage(STREAMING_USER_ID, 'user', sentence)
        ];
      }
      
      return [...prev, createStreamingMessage(STREAMING_USER_ID, 'user', sentence)];
    });
  }, []);

  /**
   * BOT_IS_THINKING: 봇이 생각 중
   */
  const handleBotIsThinking = useCallback(() => {
    console.log('[useChatMessages] 봇 생각 중');
    setIsBotThinking(true);
  }, []);

  /**
   * TURN_COMPLETE: 대화 턴 완료
   * 봇 스트리밍 → 완료 메시지로 교체
   */
  const handleTurnComplete = useCallback((user: string, bot: string) => {
    setMessages(prev => [
      ...prev.slice(0, -1),
      createCompleteMessage('user', user),
      createCompleteMessage('ai', bot),
    ]);
    clearStreamingMessages();
    setIsBotResponding(false);
    setIsBotThinking(false);
  }, []);

  const handleEmotion = useCallback((emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  }, []);

  const handleInterrupted = useCallback(() => {
    //인터럽트에 대한 처리로직 (예: 사용자 발화 중 봇 응답 중단)
  }, [clearStreamingMessages]);

  const handleError = useCallback((errorCode: string, message: string) => {
    console.error('[useChatMessages] 에러:', errorCode, message);
    clearStreamingMessages();
    setIsBotResponding(false);
  }, [clearStreamingMessages]);

  // 텍스트 메시지 전송 시 사용 (TEXT_MESSAGE는 USER_SUBTITLE이 안 오므로 직접 추가)
  const addUserTextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, createCompleteMessage('user', text)]);
  }, []);

  return {
    messages,
    isBotResponding,
    isBotThinking,
    currentEmotion,
    isLoadingHistory,
    loadChatHistory,
    addUserTextMessage,
    
    handlers: {
      onServerReady: handleServerReady,
      onUserSubtitleChunk: handleUserSubtitleChunk,
      onUserSentence: handleUserSentence,
      onBotIsThinking: handleBotIsThinking,
      onTurnComplete: handleTurnComplete,
      onEmotion: handleEmotion,
      onInterrupted: handleInterrupted,
      onError: handleError
    }
  };
};
