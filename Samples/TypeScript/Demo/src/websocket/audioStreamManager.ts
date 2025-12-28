export class AudioStreamManager {
  // 송신용 (마이크 -> 서버)
  private sendAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  
  // 수신용 (서버 -> 스피커)
  private receiveAudioContext: AudioContext | null = null;
  private audioQueue: Float32Array[] = [];
  private nextStartTime: number = 0;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  // 현재 수신 오디오 설정
  private currentChannels: number = 1;
  private currentSampleRate: number = 24000;

  constructor() {}

  /**
   * 마이크 스트리밍 시작 (송신)
   * @param onAudioData - 오디오 데이터를 받을 콜백 함수
   */
  public async startMicrophoneStreaming(
    onAudioData: (data: Float32Array) => void
  ): Promise<void> {
    if (this.sendAudioContext && this.mediaStream) {
      console.log('[Audio] 이미 마이크 스트리밍 중입니다.');
      return;
    }

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
      this.sendAudioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.sendAudioContext.createMediaStreamSource(this.mediaStream);

      // AudioWorklet 로드
      try {
        await this.sendAudioContext.audioWorklet.addModule('audio-processor.js');
      } catch (e) {
        // 이미 로드된 경우 무시
      }

      this.audioWorkletNode = new AudioWorkletNode(
        this.sendAudioContext,
        'audio-processor'
      );

      // 오디오 데이터 수신 및 콜백 호출
      this.audioWorkletNode.port.onmessage = (event) => {
        const audioData: Float32Array = event.data;
        onAudioData(audioData);
      };

      // 오디오 노드 연결 (destination은 연결하지 않음 - 에코 방지)
      source.connect(this.audioWorkletNode);

      console.log('[Audio] 마이크 스트리밍 시작');
    } catch (error) {
      console.error('[Audio] 마이크 스트리밍 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 마이크 스트리밍 중지
   */
  public async stopMicrophoneStreaming(): Promise<void> {
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode.port.close();
      this.audioWorkletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sendAudioContext) {
      await this.sendAudioContext.close();
      this.sendAudioContext = null;
    }

    console.log('[Audio] 마이크 스트리밍 중지');
  }

  /**
   * 서버로부터 받은 오디오 재생 초기화 (수신)
   */
  public initializePlayback(): void {
    if (!this.receiveAudioContext) {
      this.receiveAudioContext = new AudioContext({ sampleRate: 48000 });
      
      // Analyser 초기화
      this.analyser = this.receiveAudioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      console.log('[Audio] 재생 컨텍스트 초기화 완료');
    }
  }

  /**
   * 서버로부터 받은 바이너리 데이터를 재생 큐에 추가
   * @param buffer - 서버로부터 받은 ArrayBuffer (WAV 또는 PCM)
   */
  public handleReceivedAudio(buffer: ArrayBuffer): void {
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

        if (
          parsedChannels > 0 &&
          parsedChannels <= 2 &&
          parsedSampleRate >= 8000 &&
          parsedSampleRate <= 96000
        ) {
          this.currentChannels = parsedChannels;
          this.currentSampleRate = parsedSampleRate;

          pcmData = buffer.slice(44); // 헤더 제거
          console.log(
            `[Audio] WAV 헤더 감지: ${this.currentChannels}ch, ${this.currentSampleRate}Hz`
          );
        }
      } catch (e) {
        console.warn('[Audio] 헤더 파싱 중 오류 발생. 기존 설정 유지.');
      }
    }

    if (pcmData.byteLength > 0) {
      this.enqueueAudioData(pcmData);
    }
  }

  /**
   * PCM 데이터를 Float32로 변환하여 재생 큐에 추가
   */
  private enqueueAudioData(buffer: ArrayBuffer): void {
    if (!this.receiveAudioContext) {
      this.initializePlayback();
    }

    // Int16 -> Float32 변환
    const int16Data = new Int16Array(buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    // 큐에 추가
    this.audioQueue.push(float32Data);

    // 즉시 처리
    this.processAudioQueue();
  }

  /**
   * 오디오 큐 처리 - 큐에 있는 데이터를 꺼내서 재생 스케줄링
   */
  private processAudioQueue(): void {
    if (!this.receiveAudioContext) return;

    while (this.audioQueue.length > 0) {
      const float32Data = this.audioQueue.shift();
      if (!float32Data) break;

      this.schedulePlayback(float32Data);
    }
  }

  /**
   * 오디오 버퍼를 스케줄링하여 재생
   */
  private schedulePlayback(float32Data: Float32Array): void {
    if (!this.receiveAudioContext) return;

    const currentTime = this.receiveAudioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    const channels = this.currentChannels;
    const frameCount = float32Data.length / channels;
    const audioBuffer = this.receiveAudioContext.createBuffer(
      channels,
      frameCount,
      this.currentSampleRate
    );

    // 채널 분리 (De-interleaving)
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = float32Data[i * channels + channel];
      }
    }

    const source = this.receiveAudioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Analyser 연결
    if (this.analyser) {
      source.connect(this.analyser);
      this.analyser.connect(this.receiveAudioContext.destination);
    } else {
      source.connect(this.receiveAudioContext.destination);
    }

    source.start(startTime);

    // 다음 재생 시간 갱신
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  /**
   * 현재 재생 중인 오디오의 RMS 값 반환 (0~1)
   */
  public getCurrentRms(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }

    const average = sum / this.dataArray.length;
    return (average / 256) * 2.5; // 감도 조절
  }

  /**
   * 모든 리소스 정리
   */
  public async dispose(): Promise<void> {
    console.log('[Audio] 리소스 정리 중...');

    // 송신 관련 정리
    await this.stopMicrophoneStreaming();

    // 수신 관련 정리
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.receiveAudioContext) {
      await this.receiveAudioContext.close();
      this.receiveAudioContext = null;
    }

    this.audioQueue = [];
    this.nextStartTime = 0;

    console.log('[Audio] 리소스 정리 완료');
  }
}