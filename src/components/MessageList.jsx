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
      fontSize: '18px',
      color: '#3A3A3A',
      letterSpacing: '0.02em',
      lineHeight: '1.3',
    }}
  >
    {content}
  </XMarkdown>
);

// AI 消息样式配置
const aiBubbleProps = {
  placement: 'start',
  variant: 'borderless',
  typing: { step: 1, interval: 50 },
  contentRender: renderMarkdown,
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
      fontSize: '16px',
      color: '#4A5A55',
      lineHeight: '1.3',
      maxWidth: '80%',
      backgroundColor: 'rgba(232, 244, 248, 0.6)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 2px 10px rgba(143, 168, 155, 0.05)',
      borderRadius: '20px',
      borderTopRightRadius: '4px',
    },
  },
};

/**
 * 消息列表组件 - 使用 @ant-design/x Bubble 实现
 * @see https://x.ant.design/components/bubble
 */
export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="pt-2 space-y-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isLoading = msg.status === 'loading' && !msg.content;
        const bubbleProps = isUser ? userBubbleProps : aiBubbleProps;

        return (
          <Bubble
            key={msg.id || index}
            content={msg.content}
            loading={isLoading}
            {...bubbleProps}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

