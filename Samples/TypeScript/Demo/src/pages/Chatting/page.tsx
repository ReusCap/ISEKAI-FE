import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import Live2DViewer from '@/components/Live2DViewer';
import { LAppDelegate } from '@/live2d-library/lappdelegate';
import { COLORS, FONTS } from '@/constants'; // 폰트 설정을 위해 추가

const ChattingPage = () => {
  const wsUrl = import.meta.env.VITE_WS_SERVER_URL;
  const navigate = useNavigate();
  const [isStarted, setIsStarted] = useState(false);

  const modelConfig = {
    emotionMap: {
      'angry': 'exp_01',
      'sad': 'exp_02',
      'happy': 'exp_03'
    },
    layout: {
      x: -0.5,
      y: 0.0,
      scaleX: 1.0,
      scaleY: 1.0
    }
  };

  useEffect(() => {
    const inputElement = document.getElementById('emotion-input') as HTMLInputElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && inputElement.value.trim() !== '') {
        const keyword = inputElement.value.trim();
        const delegate = LAppDelegate.getInstance();
        const manager = delegate.getLive2DManager();
        const view = delegate.getView();

        if (manager) manager.startMotionWithEmotion(keyword);
        if (view && view.getChatManager()) view.getChatManager().addUserMessage(keyword);
        inputElement.value = '';
      }
    };

    inputElement?.addEventListener('keydown', handleKeyDown);
    return () => inputElement?.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PageContainer id="page-chat">
      {/* 1. 배경 이미지 (원본 CSS 스타일 복원) */}
      <Background className="chat-bg" />

      {/* 2. 뒤로가기 버튼 */}
      <BackButton onClick={() => navigate(-1)}>
        <img src="/Resources/arrow-back.png" alt="뒤로가기" />
      </BackButton>

      {/* 3. 시작 오버레이 */}
      {!isStarted && (
        <StartOverlay>
          <StartButton onClick={() => setIsStarted(true)}>
            대화 시작하기 (마이크 활성화)
          </StartButton>
        </StartOverlay>
      )}

      {/* 4. Live2D 컨테이너 */}
      <Live2DContainer id="live2d-container">
        <Live2DWrapper>
          <Live2DViewer
            modelUrl="/Resources/ANIYA.zip"
            webSocketUrl={isStarted ? wsUrl : undefined}
            modelConfig={modelConfig}
          />
        </Live2DWrapper>
      </Live2DContainer>

      {/* 5. 채팅 UI (우측 50% 레이아웃 복원) */}
      <ChatUIWrapper className="chat-ui-wrapper">
        <MessageList id="message-list" />
        <InputWrapper className="input-wrapper">
          <EmotionInput 
            type="text" 
            id="emotion-input" 
            placeholder="감정 키워드를 입력하세요 (예: 슬픔, 웃음)" 
          />
        </InputWrapper>
      </ChatUIWrapper>
    </PageContainer>
  );
};

export default ChattingPage;

// --- Styled Components ---

const PageContainer = styled.section`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 원본 CSS의 폰트 설정 반영 */
  font-family: ${FONTS.family.netmarble.medium}, sans-serif;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 수정: 원본 CSS 파일명으로 복구 */
  background-image: url('/Resources/anime-school-background.jpg'); 
  background-size: cover;
  background-position: center;
  /* 원본 CSS의 필터 효과 추가 */
  filter: blur(12px) brightness(0.7);
  transform: scale(1.1); /* 블러 처리 시 외곽선 흰 여백 방지 */
  z-index: 1;
`;

const BackButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 24px;
    height: 24px;
  }
`;

const StartOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
`;

const StartButton = styled.button`
  padding: 16px 32px;
  background-color: #ff4d4d;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
`;

const Live2DContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
`;

const Live2DWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const ChatUIWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  /* 원본 CSS 설정 반영: 우측 50% */
  width: 50%; 
  height: 100%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  padding: 40px;
  box-sizing: border-box;
`;

const MessageList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;
  
  /* 스크롤바 숨김 (원본 CSS 설정) */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .bubble {
    max-width: 80%;
    padding: 12px 20px;
    border-radius: 20px;
    font-size: 1.1rem;
    line-height: 1.5;
    word-break: break-word;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .bubble.ai {
    align-self: flex-start;
    background-color: rgba(255, 255, 255, 0.95);
    color: #333;
    border-bottom-left-radius: 4px;
  }

  .bubble.user {
    align-self: flex-end;
    /* 원본 CSS의 색상(#7fc8ba)으로 복구 */
    background-color: #7fc8ba; 
    color: #fff;
    border-bottom-right-radius: 4px;
  }
`;

const InputWrapper = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const EmotionInput = styled.input`
  width: 100%;
  padding: 16px 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(5px);
`;