import { useEffect, useRef, useCallback, useState } from 'react';

interface UseMicrophoneOptions {
  sampleRate?: number;
  onAudioData?: (data: Float32Array) => void;
}

interface UseMicrophoneReturn {
  isActive: boolean;
  isSpeaking: boolean;
  getMicRms: () => number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * 마이크 훅 (Gemini Live용)
 * VAD는 서버에서 처리하므로 클라이언트는 순수 오디오만 전송
 */
export const useMicrophone = ({
  sampleRate = 16000,
  onAudioData
}: UseMicrophoneOptions = {}): UseMicrophoneReturn => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const onAudioDataRef = useRef(onAudioData);
  const micRmsRef = useRef(0);
  const speakingTimeoutRef = useRef<number | null>(null);

  // 발화 감지 임계값 (0.01 = 1%)
  const SPEAKING_THRESHOLD = 0.01;
  // 발화 종료 지연 시간 (ms)
  const SPEAKING_TIMEOUT = 300;

  // 콜백 ref 업데이트
  useEffect(() => {
    onAudioDataRef.current = onAudioData;
  }, [onAudioData]);

  const start = useCallback(async () => {
    if (audioContextRef.current) {
      console.log('[Microphone] 이미 활성화됨');
      return;
    }

    try {
      console.log('[Microphone] 마이크 접근 요청...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // AudioWorklet 로드
      await audioContext.audioWorklet.addModule('vad-audio-processor.js');

      const workletNode = new AudioWorkletNode(audioContext, 'vad-audio-processor');
      workletNodeRef.current = workletNode;

      // 메시지 핸들러 - 오디오 데이터 처리 및 RMS 계산
      workletNode.port.onmessage = event => {
        if (event.data.type === 'audio') {
          const buffer = event.data.buffer as Float32Array;
          onAudioDataRef.current?.(buffer);

          // RMS 계산 (마이크 입력 볼륨)
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
          }
          const rms = Math.sqrt(sum / buffer.length);
          micRmsRef.current = rms;

          // 발화 감지
          if (rms > SPEAKING_THRESHOLD) {
            setIsSpeaking(true);
            // 기존 타임아웃 취소
            if (speakingTimeoutRef.current) {
              clearTimeout(speakingTimeoutRef.current);
            }
            // 새 타임아웃 설정
            speakingTimeoutRef.current = window.setTimeout(() => {
              setIsSpeaking(false);
            }, SPEAKING_TIMEOUT);
          }
        }
      };

      source.connect(workletNode);

      setIsActive(true);
      console.log('[Microphone] 활성화됨');
    } catch (error) {
      console.error('[Microphone] 시작 실패:', error);
      throw error;
    }
  }, [sampleRate]);

  const stop = useCallback(async () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current.port.close();
      workletNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 타임아웃 정리
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    setIsSpeaking(false);
    setIsActive(false);
    console.log('[Microphone] 중지됨');
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        stop();
      }
    };
  }, []);

  // 마이크 RMS 값 가져오기
  const getMicRms = useCallback(() => micRmsRef.current, []);

  return { isActive, isSpeaking, getMicRms, start, stop };
};
