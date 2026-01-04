import { useState } from 'react';
import { Sender } from "@ant-design/x";

/**
 * 聊天输入组件 - 使用 @ant-design/x 的 Sender 组件
 */
export default function ChatInput({ onSend, isLoading }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (message) => {
    if (!message || !message.trim()) return;
    setInputValue('');
    onSend(message);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Sender
        value={inputValue}
        onChange={setInputValue}
        placeholder="输入你的回答..."
        onSubmit={handleSubmit}
        loading={isLoading}
        allowSpeech
        style={{
          background: 'rgba(26, 26, 58, 0.8)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '24px',
        }}
      />
    </div>
  );
}

