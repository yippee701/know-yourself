import { useEffect, useRef, useCallback } from 'react';
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

// 节流函数
function throttle(fn, delay) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

const renderMarkdown = content => {
  return (
    <XMarkdown content={content} />
  );
};

// AI 消息样式配置（基础）
const aiBubbleBaseProps = {
  placement: 'start',
  variant: 'borderless',
  styles: {
    content: {
      maxWidth: '92%',
      background: 'transparent',
    },
  },
};

// 用户消息样式配置
const userBubbleProps = {
  placement: 'end',
  variant: 'filled',
  shape: 'corner',
  styles: {
    content: {
      fontFamily: '"Noto Sans SC", sans-serif',
      fontSize: '14px',
      color: '#4A5A55',
      lineHeight: '1.5',
      maxWidth: '80%',
      backgroundColor: 'rgba(232, 244, 248, 0.6)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 2px 8px rgba(143, 168, 155, 0.05)',
      borderRadius: '16px',
      borderTopRightRadius: '4px',
      padding: '8px 12px',
      wordBreak: 'normal',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },
  },
};

export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);
  const lastMessage = messages[messages.length - 1];
  const lastContent = lastMessage?.content;
  const isStreaming = lastMessage?.status === 'loading';

  // 滚动到底部
  const scrollToBottom = useCallback((instant = false) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: instant ? 'instant' : 'smooth' 
    });
  }, []);

  // 节流滚动（打字时用，每 150ms 最多触发一次）
  const throttledScroll = useCallback(
    throttle(() => scrollToBottom(true), 150),
    [scrollToBottom]
  );

  // 消息数量变化或内容更新时滚动
  useEffect(() => {
    if (isStreaming) {
      // 流式输出时使用即时滚动
      scrollToBottom(true);
    } else {
      // 非流式时使用平滑滚动
      scrollToBottom();
    }
  }, [messages.length, lastContent, isStreaming, scrollToBottom]);

  return (
    <div className="pt-1 space-y-2">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isStreaming = msg.status === 'loading';
        const isLoading = isStreaming && !msg.content;

        if (isUser) {
          return (
            <Bubble
              key={msg.id || index}
              content={msg.content}
              {...userBubbleProps}
            />
          );
        }

        return (
          <Bubble
            key={msg.id || index}
            content={msg.content}
            loading={isLoading}
            streaming={isStreaming}
            typing={{ effect: 'typing', step: 2, interval: 30 }}
            onTyping={throttledScroll}
            contentRender={renderMarkdown}
            {...aiBubbleBaseProps}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

