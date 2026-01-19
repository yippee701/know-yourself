import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
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

const MessageList = forwardRef(function MessageList({ messages, keyboardHeight = 0 }, ref) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const lastMessage = messages[messages.length - 1];
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
    const endElement = messagesEndRef.current;
    
    if (!endElement || !container) return;
    
    // 使用传入的键盘高度，如果没有则使用 prop 中的值
    const currentKeyboardHeight = overrideKeyboardHeight !== null ? overrideKeyboardHeight : keyboardHeight;
    
    if (container === window) {
      // 如果容器是 window，使用 scrollIntoView
      endElement.scrollIntoView({ 
        behavior: instant ? 'instant' : 'smooth',
        block: 'end'
      });
    } else {
      // 使用 visualViewport 获取实际可视区域高度（考虑键盘）
      const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
      const containerRect = container.getBoundingClientRect();
      
      // 计算容器在可视区域内的实际可用高度
      // 容器顶部到可视区域底部的距离
      const containerTopInViewport = Math.max(0, containerRect.top);
      // 考虑键盘高度：可用高度 = 可视区域高度 - 容器顶部位置 - 键盘高度
      const availableHeight = visualViewportHeight - containerTopInViewport - currentKeyboardHeight;
      
      // 计算消息底部元素在容器内容中的位置
      // 方法：从元素向上遍历到容器，累加 offsetTop
      let element = endElement;
      let endTopInContainer = 0;
      while (element && element !== container) {
        endTopInContainer += element.offsetTop;
        element = element.offsetParent;
      }
      const endBottomInContainer = endTopInContainer + endElement.offsetHeight;
      
      // 计算目标滚动位置：让消息底部在可视区域底部可见
      const padding = 30;
      const targetScrollTop = endBottomInContainer - availableHeight + padding;
      
      console.log('滚动计算:', {
        keyboardHeight: currentKeyboardHeight,
        visualViewportHeight,
        containerTop: containerRect.top,
        containerClientHeight: container.clientHeight,
        availableHeight,
        endTopInContainer,
        endBottomInContainer,
        targetScrollTop,
        scrollHeight: container.scrollHeight,
        currentScrollTop: container.scrollTop
      });
      
      // 确保滚动位置在有效范围内
      const maxScrollTop = container.scrollHeight - container.clientHeight;
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
  const throttledScroll = useCallback(
    throttle(() => scrollToBottom(true), 150),
    [scrollToBottom]
  );

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
});

export default MessageList;

