import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import Live2DViewer from '@/components/Live2DViewer';
import { LAppDelegate } from '@/live2d-library/lappdelegate';
import { COLORS, FONTS } from '@/constants';

const ChattingPage = () => {
  const wsUrl = import.meta.env.VITE_WS_SERVER_URL;
  const navigate = useNavigate();
  
  // 오버레이가 삭제되었으므로 진입 시 바로 시작 상태로 설정하거나 
  // 필요에 따라 권한 획득 시 true로 변경되게 유지합니다.
  const [isStarted, setIsStarted] = useState(true); 

  const modelConfig = {
    emotionMap: {
      'angry': 'exp_01',
      'sad': 'exp_02',
      'happy': 'exp_03'
    },
    layout: {
      x: 0.0, 
      y: 0.0,
      scaleX: 1.0,
      scaleY: 1.0
    }
  };

  // 마이크 권한 체크 (백그라운드에서 권한 확인 용도만 남김)
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          // 이미 허용되어 있다면 바로 마이크 세션이 연결되도록 유도
          if (status.state === 'granted') setIsStarted(true);
        }
      } catch (e) { console.warn(e); }
    };
    checkPermission();
  }, []);

  // --- 테스트용 채팅 로직 ---
  useEffect(() => {
    const inputElement = document.getElementById('emotion-input') as HTMLInputElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && inputElement.value.trim() !== '') {
        const keyword = inputElement.value.trim();
        const delegate = LAppDelegate.getInstance();
        const manager = delegate.getLive2DManager();
        const view = delegate.getView();

        if (view && view.getChatManager()) {
          view.getChatManager().addUserMessage(keyword);
          setTimeout(() => {
            view.getChatManager().showMessage('AI', `"${keyword}"에 대한 AI 테스트 응답입니다!`);
          }, 1000);
        } else {
          const list = document.getElementById('message-list');
          if (list) {
            const userB = document.createElement('div');
            userB.className = 'bubble user';
            userB.innerText = keyword;
            list.appendChild(userB);
            
            setTimeout(() => {
              const aiB = document.createElement('div');
              aiB.className = 'bubble ai';
              aiB.innerText = '시스템: 아직 모델이 로드되지 않았습니다.';
              list.appendChild(aiB);
              list.scrollTop = list.scrollHeight;
            }, 800);
            list.scrollTop = list.scrollHeight;
          }
        }

        if (manager) manager.startMotionWithEmotion(keyword);
        inputElement.value = '';
      }
    };

    inputElement?.addEventListener('keydown', handleKeyDown);
    return () => inputElement?.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <PageContainer id="page-chat">
      {/* 1. 배경 이미지 */}
      <Background className="chat-bg" />

      {/* 2. 뒤로가기 버튼 */}
      <BackButton onClick={() => navigate(-1)}>
        <img src="/Resources/arrow-back.png" alt="뒤로가기" />
      </BackButton>

      {/* 3. Live2D 컨테이너 (좌측 50%) */}
      <Live2DContainer id="live2d-container">
        <Live2DWrapper>
          <Live2DViewer
            modelUrl="/Resources/ANIYA.zip"
            webSocketUrl={isStarted ? wsUrl : undefined}
            modelConfig={modelConfig}
          />
        </Live2DWrapper>
      </Live2DContainer>

      {/* 4. 채팅 UI (우측 50%) */}
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
  font-family: ${FONTS.family.netmarble.medium}, sans-serif;
  background-color: #000;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/Resources/anime-school-background.jpg'); 
  background-size: cover;
  background-position: center;
  filter: blur(3px) brightness(1.0);
  transform: scale(1.1);
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
  padding: 10px;
  display: flex;
  img { width: 24px; height: 24px; }
`;

const Live2DContainer = styled.div`
  position: absolute;
  top: 0; 
  left: 0; 
  width: 50%; 
  height: 100%;
  z-index: 2; 
  display: flex; 
  align-items: center; 
  justify-content: center;
`;

const Live2DWrapper = styled.div` width: 100%; height: 100%; `;

const ChatUIWrapper = styled.div`
  position: absolute;
  top: 0; 
  right: 0; 
  width: 50%; 
  height: 100%;
  z-index: 3; 
  display: flex; 
  flex-direction: column;
  padding: 40px 80px; 
  box-sizing: border-box;
`;

const MessageList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  padding-bottom: 20px;
  
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .bubble {
    max-width: 80%;
    padding: 12px 20px;
    border-radius: 20px;
    font-size: 1.1rem;
    line-height: 1.5;
    word-break: break-word;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .bubble.ai {
    align-self: flex-start;
    background-color: rgba(255, 255, 255, 0.95);
    color: #333;
    border-bottom-left-radius: 4px;
  }

  .bubble.user {
    align-self: flex-end;
    background-color: #7fc8ba; 
    color: #fff;
    border-bottom-right-radius: 4px;
  }
`;

const InputWrapper = styled.div` width: 100%; margin-top: 20px; `;

const EmotionInput = styled.input`
  width: 100%;
  padding: 16px 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(10px);
`;