import React from 'react';
import styled from '@emotion/styled';

interface OverlayContainerProps {
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/**
 * 반투명 오버레이 컨테이너 컴포넌트
 * 여러 버튼을 그룹으로 묶거나 패널을 만들 때 사용
 */
const OverlayContainer: React.FC<OverlayContainerProps> = ({
  padding = 'md',
  className,
  children,
}) => {
  return (
    <StyledContainer padding={padding} className={className}>
      {children}
    </StyledContainer>
  );
};

export default OverlayContainer;

const paddingMap = {
  sm: '8px 6px',
  md: '12px 8px',
  lg: '16px 12px',
};

const StyledContainer = styled.div<{ padding: 'sm' | 'md' | 'lg' }>`
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20px;
  padding: ${({ padding }) => paddingMap[padding]};
  backdrop-filter: blur(8px);
  
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;
