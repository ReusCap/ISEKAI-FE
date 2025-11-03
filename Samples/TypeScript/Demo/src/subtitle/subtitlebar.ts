export class SubtitleBar {
  private _subtitleContainer: HTMLElement | null;
  private _nameElement: HTMLElement | null;
  private _messageElement: HTMLElement | null;

  constructor() {
    this._subtitleContainer = document.getElementById('subtitle-container');
    this._nameElement = document.getElementById('charactor-name');
    this._messageElement = document.getElementById('subtitle-message');

    if (!this._subtitleContainer || !this._nameElement || !this._messageElement) {
      console.error('Subtitle UI elements not found!');
      return;
    }

    this.hide(); // 초기에는 숨겨둡니다.
  }

  /**
   * 자막바를 보여줍니다.
   */
  public show(): void {
    this._subtitleContainer?.classList.remove('hidden');
  }

  /**
   * 자막바를 숨깁니다.
   */
  public hide(): void {
    this._subtitleContainer?.classList.add('hidden');
  }

  /**
   * 이름과 메시지 텍스트를 설정하고 자막바를 보여줍니다.
   * @param name - 표시할 캐릭터 이름
   * @param message - 표시할 메시지
   */
  public showMessage(name: string, message: string): void {
    if (this._nameElement) {
      this._nameElement.innerText = name;
    }
    if (this._messageElement) {
      this._messageElement.innerText = message;
    }
    this.show();
  }
}