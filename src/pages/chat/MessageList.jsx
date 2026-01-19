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

const reportRender = content => {
  return (
    <XMarkdown content={content} />
  );
};

const loadingRender = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse mx-2"></div>
      <p>Dora 正在思考...</p>
    </div>
  );
};

// AI 消息样式配置
const aiBubbleBaseProps = {
  placement: 'start',
  variant: 'borderless',
  styles: {
    content: {
      maxWidth: '90%',
      background: 'transparent',
      fontFamily: '"Noto Sans SC", sans-serif',
      fontSize: '15px',
      color: '#000000',
      lineHeight: '1.8',
      letterSpacing: '0.02em',
      padding: '0',
    },
  },
};

// 用户消息样式配置 - 玻璃态卡片设计
const userBubbleProps = {
  placement: 'end',
  variant: 'filled',
  shape: 'corner',
  styles: {
    content: {
      fontFamily: '"Noto Sans SC", sans-serif',
      fontSize: '15px',
      color: '#000000',
      lineHeight: '1.6',
      maxWidth: '85%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      borderRadius: '20px',
      padding: '12px 20px',
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
    <div className="pt-4 space-y-6">
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
            contentRender={reportRender}
            loadingRender={loadingRender}
            {...aiBubbleBaseProps}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

