import { useState, useEffect } from 'react';
import { Sender, XProvider } from '@ant-design/x';

export default function ChatInput({ onSend, isLoading, disabled, suggestionToFill, onSuggestionConsumed }) {
  const [inputValue, setInputValue] = useState('');

  // 点击系统推荐气泡时，将推荐内容填入输入框
  useEffect(() => {
    if (suggestionToFill != null && suggestionToFill !== '') {
      setInputValue(suggestionToFill);
      onSuggestionConsumed?.();
    }
  }, [suggestionToFill, onSuggestionConsumed]);

  const handleSubmit = (message) => {
    if (!message?.trim() || isLoading || disabled) return;
    onSend(message.trim());
    setInputValue('');
  };

  return (
    <XProvider theme={{
      token: {
        colorPrimary: '#324155',
        paddingSM: 4,
      },
    }}>
      <Sender
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        loading={isLoading}
        disabled={disabled || isLoading}
        placeholder="输入消息..."
        autoSize={{ minRows: 1, maxRows: 4 }}
        style={{
          background: 'transparent',
          borderRadius: '9999px',
          border: 'none',
          boxShadow: 'none',
        }}
        styles={{
          input: {
            fontFamily: '"Noto Sans SC", sans-serif',
            color: '#000000',
            fontSize: '14px',
            padding: '8px 0',
            minHeight: '40px',
            background: 'transparent',
          },
          suffix: {
            paddingBottom: '3px',
          },
        }}
      />
    </XProvider>
  );
}

