class VadAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.vadThreshold = 0.015;
    this.noiseGate = 0.005;
    this.smoothingFactor = 0.9;
    this.currentEnergy = 0;
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;

    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.vadThreshold = event.data.vadThreshold || this.vadThreshold;
        this.noiseGate = event.data.noiseGate || this.noiseGate;
      }
    };
  }

  calculateRMS(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  applyNoiseGate(data, energy) {
    if (energy < this.noiseGate) {
      for (let i = 0; i < data.length; i++) {
        data[i] = 0;
      }
    }
    return data;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    
    if (input.length > 0 && input[0]) {
      const inputData = input[0];
      const processedData = new Float32Array(inputData.length);
      
      for (let i = 0; i < inputData.length; i++) {
        processedData[i] = inputData[i];
      }
      
      const rms = this.calculateRMS(processedData);
      this.currentEnergy = this.smoothingFactor * this.currentEnergy + (1 - this.smoothingFactor) * rms;
      const isActive = this.currentEnergy > this.vadThreshold;
      this.applyNoiseGate(processedData, this.currentEnergy);

      for (let i = 0; i < processedData.length; i++) {
        this.buffer[this.bufferIndex++] = processedData[i];
        
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage({ type: 'stats', isActive: isActive, energy: this.currentEnergy });
          if (isActive) {
            this.port.postMessage({ type: 'audio', buffer: this.buffer.slice() });
          }
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('vad-audio-processor', VadAudioProcessor);