import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { Bubble, Actions } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { RedoOutlined, CopyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Space, Typography } from 'antd';

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

// 动态省略号组件
function AnimatedDots() {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-4 text-left">{dots}</span>;
}

const loadingRender = () => {
  return (
    <div className="flex items-center">
      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse mr-2"></div>
      <p style={{ color: '#6B7280' }}>
        Dora 正在思考<AnimatedDots />
      </p>
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

// 系统气泡样式（与 AI 气泡风格一致）
const systemBubbleStyles = {
  content: {
    fontFamily: '"Noto Sans SC", sans-serif',
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.6',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(129, 128, 128, 0.3)',
  },
};

const MessageList = forwardRef(function MessageList({ messages, keyboardHeight = 0, onRetry, recommendedAnswers = [], onSuggestionClick }, ref) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastMessage = messages[messages.length - 1];

  // 用户消息数：1=第 1 轮已发（自动「你好，我准备好了...」），2=第 2 轮已发，3=第 3 轮已发，4=第 4 轮已发
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  // 推荐从第 2 轮开始：userMessageCount=1 时展示第 2 轮推荐，2 时第 3 轮，3 时第 4 轮
  const currentRoundIndex = userMessageCount - 1; // 0=第2轮, 1=第3轮, 2=第4轮
  const currentRoundSuggestion = Array.isArray(recommendedAnswers) && currentRoundIndex >= 0 && currentRoundIndex <= 2
    ? recommendedAnswers[currentRoundIndex]
    : null;
  const roundLabel = currentRoundIndex >= 0 && currentRoundIndex <= 2 ? currentRoundIndex + 2 : null; // 2, 3, 4
  const lastContent = lastMessage?.content;
  const isStreaming = lastMessage?.status === 'loading';

  // 获取滚动容器（向上查找第一个可滚动的父元素）
  const getScrollContainer = useCallback(() => {
    if (!messagesEndRef.current) return null;
    
    let parent = messagesEndRef.current.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    // 如果没找到，返回 window
    return window;
  }, []);

  // 滚动到底部（考虑键盘高度）
  const scrollToBottom = useCallback((instant = false, overrideKeyboardHeight = null) => {
    const container = getScrollContainer();
    
    if (!container) return;
    
    // 使用传入的键盘高度，如果没有则使用 prop 中的值
    const currentKeyboardHeight = overrideKeyboardHeight !== null ? overrideKeyboardHeight : keyboardHeight;
    
    if (container === window) {
      // 如果容器是 window，使用 scrollIntoView
      const endElement = messagesEndRef.current;
      if (endElement) {
        endElement.scrollIntoView({ 
          behavior: instant ? 'instant' : 'smooth',
          block: 'end'
        });
      }
    } else {
      // 使用 visualViewport 获取实际可视区域高度（考虑键盘）
      const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
      const containerRect = container.getBoundingClientRect();
      
      // 计算容器在可视区域内的实际可用高度
      // 容器顶部到可视区域底部的距离
      const containerTopInViewport = Math.max(0, containerRect.top);
      // 考虑键盘高度：可用高度 = 可视区域高度 - 容器顶部位置 - 键盘高度
      const availableHeight = visualViewportHeight - containerTopInViewport - currentKeyboardHeight;
      
      // 直接使用 scrollHeight 计算滚动到底部的位置
      // scrollTop = scrollHeight - availableHeight
      const scrollHeight = container.scrollHeight;
      const padding = 20; // 底部边距
      const targetScrollTop = scrollHeight - availableHeight + padding;
      
      // 确保滚动位置在有效范围内
      const maxScrollTop = scrollHeight - container.clientHeight;
      const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
      
      if (instant) {
        container.scrollTop = finalScrollTop;
      } else {
        container.scrollTo({
          top: finalScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [getScrollContainer, keyboardHeight]);

  // 暴露 scrollToBottom 方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToBottom,
  }), [scrollToBottom]);

  // 节流滚动（打字时用，每 150ms 最多触发一次）
  const throttledScroll = useCallback(() => {
    throttle(() => scrollToBottom(true), 150)();
  }, [scrollToBottom]);

  // 消息数量变化或内容更新时滚动（使用当前的 keyboardHeight）
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
    <div ref={containerRef} className="pt-4 space-y-6">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const isStreaming = msg.status === 'loading';
        const isLoading = isStreaming && !msg.content;

        if (isUser) {
          const isFailed = msg.status === 'error';
          
          // 失败消息的 footer actions
          const actionItems = isFailed ? [
            {
              key: 'retry',
              icon: <RedoOutlined />,
              label: '重新发送',
            },
            {
              key: 'copy',
              icon: <CopyOutlined />,
              label: '复制',
            },
          ] : [];

          const extraSlot = isFailed ? () => (
            <ExclamationCircleOutlined
              className="pt-5"
              style={{
                color: 'red',
              }}
            />
          ) : null;

          const handleActionClick = (event, content) => {
            const { key } = event;
            if (key === 'retry') {
              onRetry?.(msg.id);
            } else if (key === 'copy') {
              navigator.clipboard.writeText(content).catch(err => {
                console.error('复制失败:', err);
              });
            }
          };

          return (
            <Bubble
              key={msg.id || index}
              content={msg.content}
              extra={extraSlot}
              footer={(content) => (
                <Actions 
                  items={actionItems} 
                  onClick={(key) => handleActionClick(key, content)} 
                />
              )}
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
      {currentRoundSuggestion != null && roundLabel != null && (
        <Bubble.System
          content={
            <Space>
            {`第 ${roundLabel} 轮你上次这样回答过：${currentRoundSuggestion}`}
            <Typography.Link onClick={() => onSuggestionClick?.(currentRoundSuggestion)}>输入</Typography.Link>
          </Space>
          }
          variant="outlined"
          shape="corner"
          styles={systemBubbleStyles}
        />
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;

