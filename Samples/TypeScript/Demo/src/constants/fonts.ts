// src/constants/fonts.ts
export const FONTS = {
  family: {
    pretendard: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
    netmarble: {
      light: 'NetmarbleL',
      medium: 'NetmarbleM',
      bold: 'NetmarbleB',
    },
  },
  size: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '40px',
    cardTitle: '16px',
    cardDesc: '14px',
  },
  weight: {
    thin : 100,
    extralight : 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
} as const;

// 폰트 페이스 정의 - 파일명 대소문자와 확장자를 실제 파일과 일치시켰습니다.
export const FONT_FACES = `
  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Thin.woff2') format('woff2');
    font-weight: 100;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-ExtraLight.woff2') format('woff2');
    font-weight: 200;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Light.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Medium.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-SemiBold.woff2') format('woff2');
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-ExtraBold.woff2') format('woff2');
    font-weight: 800;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url('/src/assets/fonts/pretendard/Pretendard-Black.woff2') format('woff2');
    font-weight: 900;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleL';
    src: url('/src/assets/fonts/netmarble_font/netmarbleL.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleM';
    src: url('/src/assets/fonts/netmarble_font/netmarbleM.ttf') format('truetype');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleB';
    src: url('/src/assets/fonts/netmarble_font/netmarbleB.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
  }
`;