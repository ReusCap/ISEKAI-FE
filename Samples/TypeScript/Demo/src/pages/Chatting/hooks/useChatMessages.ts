import { useState, useCallback, useRef } from 'react';
import { ChatMessage, EmotionType } from '@/types/chat';

/** 스트리밍 메시지 ID 상수 */
const STREAMING_USER_ID = 'streaming-user';
const STREAMING_BOT_ID = 'streaming-bot';

/** 고유 ID 생성 */
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * 채팅 메시지 상태 관리 훅
 * 
 * USER_SUBTITLE_CHUNK와 USER_ONE_SENTENCE_SUBTITLE 관계:
 * - 청크들이 실시간으로 오다가, 문장이 완성되면 USER_ONE_SENTENCE_SUBTITLE로 옴
 * - USER_ONE_SENTENCE_SUBTITLE는 "본인 청크들"만 대체 (이전 문장은 유지)
 * 
 * 예시:
 * 청크 "안", "녕" → SENTENCE "안녕" → 청크 "하", "세", "요" → SENTENCE "하세요"
 * 결과: "안녕" + "하세요" = "안녕하세요"
 */
export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('NEUTRAL');
  
  // 확정된 사용자 텍스트 (USER_ONE_SENTENCE_SUBTITLE로 확정된 부분)
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
   * USER_ONE_SENTENCE_SUBTITLE: 본인 청크들만 대체 (이전 문장 유지)
   * 확정된 텍스트 + 새 문장 = 전체 스트리밍 텍스트
   */
  const handleUserSentence = useCallback((sentence: string) => {
    // 확정된 텍스트에 새 문장 추가
    const newConfirmedText = confirmedUserTextRef.current + sentence;
    confirmedUserTextRef.current = newConfirmedText;
    
    setMessages(prev => {
      const last = prev[prev.length - 1];
      
      if (last?.id === STREAMING_USER_ID) {
        return [
          ...prev.slice(0, -1),
          createStreamingMessage(STREAMING_USER_ID, 'user', newConfirmedText)
        ];
      }
      
      return [...prev, createStreamingMessage(STREAMING_USER_ID, 'user', newConfirmedText)];
    });
  }, []);

  /**
   * BOT_SUBTITLE: 봇 응답 시작
   * - 사용자 스트리밍 있으면 → 완료 처리 + 봇 스트리밍 시작
   * - 봇 스트리밍 있으면 → 이어붙이기
   */
  const handleBotSubtitle = useCallback((chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];

      if (last?.id === STREAMING_USER_ID) {
        setIsBotResponding(true);
        confirmedUserTextRef.current = '';  // 사용자 발화 끝났으니 초기화
        return [
          ...prev.slice(0, -1),
          createCompleteMessage('user', last.text),
          createStreamingMessage(STREAMING_BOT_ID, 'ai', chunk)
        ];
      }

      if (last?.id === STREAMING_BOT_ID) {
        return [
          ...prev.slice(0, -1),
          createStreamingMessage(STREAMING_BOT_ID, 'ai', last.text + chunk)
        ];
      }

      setIsBotResponding(true);
      return [...prev, createStreamingMessage(STREAMING_BOT_ID, 'ai', chunk)];
    });
  }, []);

  /**
   * TURN_COMPLETE: 대화 턴 완료
   * 봇 스트리밍 → 완료 메시지로 교체
   */
  const handleTurnComplete = useCallback((_user: string, bot: string) => {
    setMessages(prev => [
      ...prev.slice(0, -1),
      createCompleteMessage('ai', bot)
    ]);
    setIsBotResponding(false);
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
    currentEmotion,
    addUserTextMessage,
    
    handlers: {
      onServerReady: handleServerReady,
      onUserSubtitleChunk: handleUserSubtitleChunk,
      onUserSentence: handleUserSentence,
      onBotSubtitle: handleBotSubtitle,
      onTurnComplete: handleTurnComplete,
      onEmotion: handleEmotion,
      onInterrupted: handleInterrupted,
      onError: handleError
    }
  };
};
