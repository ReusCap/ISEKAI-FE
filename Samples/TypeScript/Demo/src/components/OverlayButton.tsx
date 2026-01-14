import React from 'react';
import styled from '@emotion/styled';

interface OverlayButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/**
 * 반투명 오버레이 버튼 컴포넌트
 * 채팅 페이지의 뒤로가기, 줌 버튼 등에 사용
 */
const OverlayButton: React.FC<OverlayButtonProps> = ({
  onClick,
  disabled = false,
  size = 'md',
  className,
  children,
}) => {
  return (  
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={className}
    >
      {children}
    </StyledButton>
  );
};

export default OverlayButton;

const sizeMap = {
  sm: { width: '32px', height: '32px', fontSize: '16px' },
  md: { width: '44px', height: '44px', fontSize: '20px' },
  lg: { width: '56px', height: '56px', fontSize: '24px' },
};

const StyledButton = styled.button<{ size: 'sm' | 'md' | 'lg'; disabled?: boolean }>`
  width: ${({ size }) => sizeMap[size].width};
  height: ${({ size }) => sizeMap[size].height};
  font-size: ${({ size }) => sizeMap[size].fontSize};
  
  background: ${({ disabled }) => disabled ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)'};
  color: ${({ disabled }) => disabled ? 'rgba(255, 255, 255, 0.4)' : '#fff'};
  
  border: none;
  border-radius: 50%;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  img {
    width: 60%;
    height: 60%;
    object-fit: contain;
  }
`;
