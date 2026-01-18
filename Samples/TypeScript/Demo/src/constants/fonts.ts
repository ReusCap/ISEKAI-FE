// src/constants/fonts.ts

// 폰트 파일 import
import PretendardThin from '@/assets/fonts/pretendard/Pretendard-Thin.woff2';
import PretendardExtraLight from '@/assets/fonts/pretendard/Pretendard-ExtraLight.woff2';
import PretendardLight from '@/assets/fonts/pretendard/Pretendard-Light.woff2';
import PretendardRegular from '@/assets/fonts/pretendard/Pretendard-Regular.woff2';
import PretendardMedium from '@/assets/fonts/pretendard/Pretendard-Medium.woff2';
import PretendardSemiBold from '@/assets/fonts/pretendard/Pretendard-SemiBold.woff2';
import PretendardBold from '@/assets/fonts/pretendard/Pretendard-Bold.woff2';
import PretendardExtraBold from '@/assets/fonts/pretendard/Pretendard-ExtraBold.woff2';
import PretendardBlack from '@/assets/fonts/pretendard/Pretendard-Black.woff2';

import NetmarbleL from '@/assets/fonts/netmarble_font/netmarbleL.ttf';
import NetmarbleM from '@/assets/fonts/netmarble_font/netmarbleM.ttf';
import NetmarbleB from '@/assets/fonts/netmarble_font/netmarbleB.ttf';

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
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
} as const;

// 폰트 페이스 정의 - import한 경로 사용
export const FONT_FACES = `
  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardThin}) format('woff2');
    font-weight: 100;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardExtraLight}) format('woff2');
    font-weight: 200;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardLight}) format('woff2');
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardRegular}) format('woff2');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardMedium}) format('woff2');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardSemiBold}) format('woff2');
    font-weight: 600;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardBold}) format('woff2');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardExtraBold}) format('woff2');
    font-weight: 800;
    font-style: normal;
  }

  @font-face {
    font-family: 'Pretendard';
    src: url(${PretendardBlack}) format('woff2');
    font-weight: 900;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleL';
    src: url(${NetmarbleL}) format('truetype');
    font-weight: 300;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleM';
    src: url(${NetmarbleM}) format('truetype');
    font-weight: 500;
    font-style: normal;
  }

  @font-face {
    font-family: 'NetmarbleB';
    src: url(${NetmarbleB}) format('truetype');
    font-weight: 700;
    font-style: normal;
  }
`;