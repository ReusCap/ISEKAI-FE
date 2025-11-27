export class WebSocketManager {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private nextStartTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // 현재 오디오 설정 저장용 (첫 패킷에서 읽은 값 유지)
  private currentChannels: number = 1;
  private currentSampleRate: number = 24000;

  constructor(private serverUrl: string) {}
  public async initialize(): Promise<void> {
    await this.connectWebSocket();
    await this.startAudioStreaming();
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('[WebSocket] 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] 에러:', error);
          this.isConnected = false;
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] 연결 종료');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            this.handleServerMessage(event.data);
          } else if (event.data instanceof ArrayBuffer) {
            this.handleBinaryMessage(event.data);
          }
        };
      } catch (error) {
        console.error('[WebSocket] 연결 실패:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] 최대 재연결 시도 횟수 초과');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] ${this.reconnectDelay / 1000}초 후 재연결 시도... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.initialize().catch((error) => {
        console.error('[WebSocket] 재연결 실패:', error);
      });
    }, this.reconnectDelay);
  }

  private async startAudioStreaming(): Promise<void> {
    try {
      console.log('[Audio] 마이크 접근 요청...');

      // 마이크 권한 요청
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[Audio] 마이크 접근 허용됨');

      // AudioContext 생성
      if (!this.audioContext) {
        this.audioContext = new AudioContext({ sampleRate: 16000 });
      } else if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet 로드 및 생성
      try {
        await this.audioContext.audioWorklet.addModule('audio-processor.js');
      } catch (e) {
        // 이미 로드된 경우 무시
      }
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-processor'
      );

      // 오디오 데이터 수신 및 전송
      this.audioWorkletNode.port.onmessage = (event) => {
        const audioData: Float32Array = event.data;
        this.sendAudioData(audioData);
      };

      // 오디오 노드 연결
      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      console.log('[Audio] 실시간 스트리밍 시작');
    } catch (error) {
      console.error('[Audio] 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  private sendAudioData(audioData: Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const int16Data = this.float32ToInt16(audioData);
      this.ws.send(int16Data.buffer);
    } catch (error) {
      console.error('[WebSocket] 오디오 전송 실패:', error);
    }
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private handleServerMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.messageType) {
        case 'SERVER_READY':
          console.log('[WebSocket] 서버 준비 완료:', message.content.text);
          break;
        
        case 'SUBTITLE':
          console.log('[Subtitle] 자막 수신:', message.content.text);
          break;

        default:
          console.log('[WebSocket] 알 수 없는 메시지:', message);
      }
    } catch (error) {
      console.error('[WebSocket] 메시지 파싱 실패:', error);
    }
  }

  // 오디오 큐 관리
  private audioQueue: Float32Array[] = [];

  private handleBinaryMessage(buffer: ArrayBuffer): void {
    if (buffer.byteLength === 0) {
      console.log('[Audio] 수신 스트리밍 종료');
      return;
    }

    const view = new DataView(buffer);
    let pcmData = buffer;

    // WAV 헤더 확인 ('RIFF' = 0x52494646)
    if (buffer.byteLength >= 44 && view.getUint32(0, false) === 0x52494646) {
      try {
        const parsedChannels = view.getUint16(22, true);
        const parsedSampleRate = view.getUint32(24, true);

        if (parsedChannels > 0 && parsedChannels <= 2 && 
            parsedSampleRate >= 8000 && parsedSampleRate <= 96000) {
          
          this.currentChannels = parsedChannels;
          this.currentSampleRate = parsedSampleRate;
          
          pcmData = buffer.slice(44); // 헤더 제거
          console.log(`[Audio] WAV 헤더 감지: ${this.currentChannels}ch, ${this.currentSampleRate}Hz`);
        }
      } catch (e) {
        console.warn('[Audio] 헤더 파싱 중 오류 발생. 기존 설정 유지.');
      }
    }
    
    if (pcmData.byteLength > 0) {
      this.enqueueAudioData(pcmData);
    }
  }

  private enqueueAudioData(buffer: ArrayBuffer): void {
    if (!this.audioContext) return;

    // 1. Int16 -> Float32 변환
    const int16Data = new Int16Array(buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    // 2. 실시간 재생 큐에 추가
    this.audioQueue.push(float32Data);

    // 3. 즉시 처리
    this.processAudioQueue();
  }

  private processAudioQueue(): void {
    if (!this.audioContext) return;

    // 큐에 있는 모든 데이터를 꺼내서 스케줄링
    while (this.audioQueue.length > 0) {
      const float32Data = this.audioQueue.shift();
      if (!float32Data) break;

      this.schedulePlayback(float32Data);
    }
  }

  private schedulePlayback(float32Data: Float32Array): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;

    // 단순화된 스케줄링:
    // 1. 예약된 시간이 미래면? -> 예약된 시간에 재생 (매끄러움)
    // 2. 예약된 시간이 과거면(늦었으면)? -> 지금 당장 재생 (끊김 최소화)
    const startTime = Math.max(currentTime, this.nextStartTime);

    const channels = this.currentChannels;
    const frameCount = float32Data.length / channels;
    const audioBuffer = this.audioContext.createBuffer(channels, frameCount, this.currentSampleRate);

    // 채널 분리 (De-interleaving)
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = float32Data[i * channels + channel];
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Analyser 연결
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    
    // GainNode(페이드) 제거하고 직접 연결 (지지직거림 방지)
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    source.start(startTime);
    
    // 다음 재생 시간 갱신
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  public getIsConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  public getCurrentRms(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // RMS 계산 (단순 평균)
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    // 0~1 사이 값으로 정규화 (256은 바이트 최대값)
    // 감도 조절을 위해 값을 조금 키움 (* 2.5)
    const average = sum / this.dataArray.length;
    return (average / 256) * 2.5;
  }

  public dispose(): void {
    console.log('[WebSocket] 리소스 정리 중...');

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.close();
      this.audioWorkletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('[WebSocket] 리소스 정리 완료');
  }
}