import { useEffect, useRef } from 'react';
import { Bubble } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';

/**
 * 渲染 Markdown 内容
 * @see https://x.ant.design/components/bubble#bubble-demo-markdown
 */
const renderMarkdown = (content) => (
  <XMarkdown
    style={{
      fontFamily: '"Noto Serif SC", serif',
      fontSize: '15px',
      color: '#3A3A3A',
      letterSpacing: '0.01em',
      lineHeight: '1.5',
    }}
  >
    {content}
  </XMarkdown>
);

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
    },
  },
};

export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // 获取最后一条消息的内容，用于触发滚动
  const lastMessage = messages[messages.length - 1];
  const lastContent = lastMessage?.content || '';

  // 自动滚动到底部（消息变化或内容更新时）
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, lastContent]);

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

        // AI 消息：流式输出时用打字机效果，完成后渲染 Markdown
        return (
          <Bubble
            key={msg.id || index}
            content={msg.content}
            loading={isLoading}
            streaming={isStreaming}
            typing={{ effect: 'typing', step: 2, interval: 30 }}
            // contentRender={isStreaming ? undefined : renderMarkdown}
            {...aiBubbleBaseProps}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

