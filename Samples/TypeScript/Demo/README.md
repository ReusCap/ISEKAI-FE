# ISEKAI-FE TypeScript Demo

이 프로젝트는 **Live2D Cubism SDK for Web**을 기반으로 한 TypeScript 데모 애플리케이션입니다.  
기본적인 Live2D 모델 렌더링 기능 외에 **WebSocket을 통한 실시간 음성 스트리밍** 및 **감정 표현 제어** 기능이 추가되어 있습니다.

## 📋 주요 기능

1.  **Live2D 모델 렌더링 & 인터랙션**
    -   Live2D 모델을 웹 캔버스에 렌더링합니다.
    -   마우스/터치 입력을 통한 시선 처리 및 터치 반응을 지원합니다.
    -   `ANIYA`, `HoshinoAi` 등의 모델을 로드할 수 있습니다.

2.  **실시간 음성 스트리밍 (WebSocket)**
    -   브라우저의 마이크 권한을 획득하여 오디오를 캡처합니다 (16kHz, Mono).
    -   `AudioWorklet`을 사용하여 오디오 데이터를 처리하고 WebSocket을 통해 서버로 전송합니다.
    -   서버와의 연결 상태를 관리하고 자동 재연결 기능을 지원합니다.

3.  **감정 표현 및 자막 시스템**
    -   텍스트 입력창을 통해 감정 키워드(예: "두근두근", "놀람" 등)를 입력하면 모델이 해당 표정을 짓습니다.
    -   모델의 대사나 상태를 표시하는 자막(Subtitle) 시스템이 구현되어 있습니다.

## 📂 프로젝트 구조

주요 디렉토리 및 파일에 대한 설명입니다.

Samples/TypeScript/Demo/
├── src/
│   ├── main.ts                  # 애플리케이션 진입점 (Entry Point). LAppDelegate를 초기화하고 실행합니다.
│   ├── lappdelegate.ts          # 애플리케이션 클래스 (싱글톤). Cubism SDK 초기화, 이벤트 리스너 등록, WebSocket 매니저 초기화 등을 담당합니다.
│   ├── lappdefine.ts            # 상수 정의 파일. 모델 디렉토리, 캔버스 크기, 화면 배율, 로그 레벨 등을 정의합니다.
│   ├── lapplive2dmanager.ts     # Live2D 모델 관리 클래스. 모델 로드, 씬 전환, 감정 표현(표정 변경) 및 자막 표시 로직을 제어합니다.
│   ├── lappmodel.ts             # Live2D 모델 클래스. .model3.json 로드, 모션 재생, 표정 설정, 립싱크, 물리 연산 등 모델의 동작을 관리합니다.
│   ├── lappview.ts              # 렌더링 뷰 클래스. 배경 이미지, 기어 아이콘, 모델 렌더링을 담당하며 터치 이벤트를 처리합니다.
│   ├── lapppal.ts               # 플랫폼 추상화 계층 (PAL). 파일 로드, 시간 측정, 로그 출력 등 플랫폼 의존적인 기능을 캡슐화합니다.
│   ├── lappglmanager.ts         # WebGL 관리 클래스. WebGL 컨텍스트를 초기화하고 관리합니다.
│   ├── lapptexturemanager.ts    # 텍스처 관리 클래스. 이미지 파일을 로드하여 WebGL 텍스처로 변환하고 관리합니다.
│   ├── lappsprite.ts            # 스프라이트 렌더링 클래스. 배경 이미지나 아이콘 같은 2D 이미지를 그리는 기능을 제공합니다.
│   ├── lappsubdelegate.ts       # 델리게이트 보조 클래스. 캔버스 리사이징, 뷰 및 매니저 간의 조정을 담당합니다.
│   ├── lappwavfilehandler.ts    # WAV 파일 핸들러. 오디오 파일을 로드하고 RMS(음량)를 계산하여 립싱크에 활용합니다.
│   ├── touchmanager.ts          # 터치/마우스 이벤트 관리 클래스. 드래그, 탭, 플릭 등의 제스처를 감지하고 좌표를 계산합니다.
│   ├── vite-env.d.ts            # Vite 환경 변수 타입 정의 파일.
│   └── websocket/
│       └── websocketmanager.ts  # WebSocket 연결 및 오디오 스트리밍 로직 담당
├── Core/                        # Live2D Cubism Core 라이브러리
├── Resources/                   # Live2D 모델 및 에셋 리소스
├── index.html                   # 메인 HTML 파일
├── package.json                 # 프로젝트 의존성 및 스크립트
└── vite.config.mts              # Vite 빌드 설정
```

## 🚀 설치 및 실행

이 프로젝트는 [Node.js](https://nodejs.org/) 환경이 필요합니다.

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run start
```
실행 후 브라우저에서 `http://localhost:5000` (또는 터미널에 표시된 주소)으로 접속합니다.

### 3. 빌드

```bash
npm run build
```
`dist` 폴더에 배포 가능한 정적 파일이 생성됩니다.

## ⚙️ 설정 가이드

### WebSocket 서버 설정
`.env` 파일(또는 환경 변수)에 WebSocket 서버 주소를 설정해야 합니다.
```env
VITE_WS_SERVER_URL=ws://your-websocket-server-url
```

### 모델 및 뷰 설정
`src/lappdefine.ts` 파일에서 다음 항목들을 수정할 수 있습니다.
-   `ModelDir`: 로드할 모델 디렉토리 목록
-   `CanvasSize`: 캔버스 크기 (기본값: 'auto')
-   `ViewScale`, `ViewMaxScale`: 화면 확대/축소 비율
-   `DebugLogEnable`: 디버그 로그 출력 여부

## ⚠️ 주의사항
-   **마이크 권한**: 음성 스트리밍 기능을 사용하려면 브라우저에서 마이크 접근 권한을 허용해야 합니다.
-   **HTTPS/Localhost**: 최신 브라우저 보안 정책상 `AudioWorklet` 및 마이크 접근은 HTTPS 환경이나 `localhost`에서만 동작합니다.
