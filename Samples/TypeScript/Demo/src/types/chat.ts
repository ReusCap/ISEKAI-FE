/**
 * 채팅 메시지 타입 정의
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: number;
  /** 메시지 상태: streaming = 실시간 입력 중, complete = 완료됨 */
  status: 'streaming' | 'complete';
}

/**
 * WebSocket 메시지 타입 enum
 */
export type WebSocketMessageType =
  | 'SERVER_READY'
  | 'USER_SUBTITLE_CHUNK'
  | 'USER_ONE_SENTENCE_SUBTITLE'
  | 'BOT_SUBTITLE'
  | 'TURN_COMPLETE'
  | 'EMOTION'
  | 'INTERRUPTED'
  | 'ERROR';

/**
 * 감정 타입
 */
export type EmotionType =
  | 'SAD'
  | 'SHY'
  | 'HAPPY'
  | 'ANGRY'
  | 'NEUTRAL'
  | 'SURPRISED'
  | 'DESPISE';

/**
 * 각 메시지 content 타입 정의
 */
export interface ServerReadyContent {
  '@type': 'serverReady';
  text: string;
}

export interface SubtitleContent {
  '@type': 'subtitle';
  text: string;
}

export interface TurnCompleteContent {
  '@type': 'turnComplete';
  user: string;
  bot: string;
}

export interface EmotionContent {
  '@type': 'emotion';
  emotion: EmotionType;
}

export interface InterruptedContent {
  '@type': 'interrupted';
  text: string;
}

export interface ErrorContent {
  '@type': 'error';
  errorCode: string;
  message: string;
}

/**
 * WebSocket 메시지 타입 (제네릭)
 */
export type WebSocketMessage =
  | { messageType: 'SERVER_READY'; content: ServerReadyContent }
  | { messageType: 'USER_SUBTITLE_CHUNK'; content: SubtitleContent }
  | { messageType: 'USER_ONE_SENTENCE_SUBTITLE'; content: SubtitleContent }
  | { messageType: 'BOT_SUBTITLE'; content: SubtitleContent }
  | { messageType: 'TURN_COMPLETE'; content: TurnCompleteContent }
  | { messageType: 'EMOTION'; content: EmotionContent }
  | { messageType: 'INTERRUPTED'; content: InterruptedContent }
  | { messageType: 'ERROR'; content: ErrorContent };

/**
 * WebSocket 이벤트 핸들러 타입
 */
export interface WebSocketEventHandlers {
  onServerReady?: () => void;
  onUserSubtitleChunk?: (text: string) => void;
  onUserSentence?: (text: string) => void;
  onBotSubtitle?: (text: string) => void;
  onTurnComplete?: (user: string, bot: string) => void;
  onEmotion?: (emotion: EmotionType) => void;
  onInterrupted?: () => void;
  onError?: (errorCode: string, message: string) => void;
}
