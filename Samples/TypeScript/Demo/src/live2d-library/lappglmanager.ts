// src/live2d-library/lappglmanager.ts

export class LAppGlManager {
  public constructor() {
    this._gl = null;
  }

  public initialize(canvas: HTMLCanvasElement): boolean {
    // 1. 우선 WebGL 2.0 시도
    this._gl = canvas.getContext('webgl2');

    // 2. WebGL 2.0이 지원되지 않으면 WebGL 1.0 시도
    if (!this._gl) {
      console.log('[APP] WebGL2 not supported, trying WebGL1...');
      this._gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    }

    if (!this._gl) {
      // 3. 둘 다 실패할 경우 에러 알림
      alert('WebGL을 초기화할 수 없습니다. 브라우저가 WebGL을 지원하지 않거나 하드웨어 가속이 꺼져 있을 수 있습니다.');
      this._gl = null;
      return false;
    }
    
    return true;
  }

  public release(): void {}

  public getGl(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._gl;
  }

  private _gl: WebGLRenderingContext | WebGL2RenderingContext = null;
}