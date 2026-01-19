import React, { useState, KeyboardEvent } from 'react';
import styled from '@emotion/styled';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 채팅 입력 컴포넌트
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = '메시지를 입력하세요...',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME 조합 중(한글 입력 등)이면 무시 - 마지막 글자 중복 방지
    if (e.nativeEvent.isComposing) return;
    
    if (e.key === 'Enter' && inputValue.trim() !== '' && !disabled) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <InputWrapper>
      <StyledInput
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </InputWrapper>
  );
};

export default ChatInput;

// --- Styled Components ---

const InputWrapper = styled.div`
  flex: 1;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 52px;
  padding: 0 24px;
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(10px);
  box-sizing: border-box;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;
