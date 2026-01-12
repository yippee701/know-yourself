import { useState, useCallback, useRef, useEffect } from 'react';
import { sendMessage, CHAT_MODES, IS_MOCK_MODE } from '../api/chat';

// 打字机速度配置（毫秒/字符）
const TYPEWRITER_SPEED = 15;

/**
 * 聊天逻辑 Hook - 管理消息状态和 API 调用
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 聊天模式：'discover-self' | 'understand-others'
 * @param {Function} options.onReportStart - 检测到 [Report] 开头时的回调
 * @param {Function} options.onReportUpdate - 报告内容更新时的回调
 * @param {Function} options.onReportComplete - 报告生成完成时的回调
 */
export function useChat(options = {}) {
  const { mode = CHAT_MODES.DISCOVER_SELF, onReportStart, onReportUpdate, onReportComplete } = options;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const reportStartedRef = useRef(false);
  
  // 打字机缓冲区相关
  const bufferRef = useRef('');           // 已收到但未显示的内容
  const displayedRef = useRef('');        // 已显示的内容
  const isStreamingRef = useRef(false);   // 是否正在流式输出
  const aiMsgIdRef = useRef(null);        // 当前 AI 消息 ID
  const timerRef = useRef(null);          // 打字机定时器

  // 清理打字机定时器
  const clearTypewriterTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => clearTypewriterTimer();
  }, [clearTypewriterTimer]);

  // 启动打字机效果
  const startTypewriter = useCallback(() => {
    if (timerRef.current) return; // 已经在运行

    timerRef.current = setInterval(() => {
      // 如果有未显示的内容
      if (displayedRef.current.length < bufferRef.current.length) {
        // 每次显示更多字符（加速追赶）
        const remaining = bufferRef.current.length - displayedRef.current.length;
        const step = Math.min(Math.ceil(remaining / 10) + 1, 5); // 动态步长，最多5个字符
        displayedRef.current = bufferRef.current.slice(0, displayedRef.current.length + step);
        
        const currentContent = displayedRef.current;
        const currentAiMsgId = aiMsgIdRef.current;

        // 检测报告开始
        if (!reportStartedRef.current && currentContent.startsWith('[Report]')) {
          reportStartedRef.current = true;
          onReportStart?.();
        }

        // 更新报告内容
        if (reportStartedRef.current) {
          onReportUpdate?.(currentContent);
        }

        // 更新消息状态
        setMessages(prev => prev.map(msg => 
          msg.id === currentAiMsgId 
            ? { ...msg, content: currentContent, status: 'loading' }
            : msg
        ));
      } else if (!isStreamingRef.current) {
        // 流式结束且所有内容都显示完了
        clearTypewriterTimer();
      }
    }, TYPEWRITER_SPEED);
  }, [clearTypewriterTimer, onReportStart, onReportUpdate]);

  // 发送消息给大模型
  const sendUserMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;

    // 添加用户消息
    const newUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      status: 'local'
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    reportStartedRef.current = false;

    // 重置打字机缓冲区
    bufferRef.current = '';
    displayedRef.current = '';
    isStreamingRef.current = true;
    clearTypewriterTimer();

    // 添加 AI 消息占位符
    const aiMsgId = Date.now() + 1;
    aiMsgIdRef.current = aiMsgId;
    setMessages(prev => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      status: 'loading'
    }]);

    try {
      // 构建发送给 API 的消息格式
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 判断是否使用打字机缓冲（mock 模式已有打字机效果，不需要缓冲）
      const useTypewriterBuffer = !IS_MOCK_MODE;

      // 调用 sendMessage，使用流式回调更新内容，传递聊天模式
      await sendMessage(apiMessages, (streamContent) => {
        if (useTypewriterBuffer) {
          // 真实 API：将内容放入缓冲区，启动打字机
          bufferRef.current = streamContent;
          startTypewriter();
        } else {
          // Mock 模式：直接更新（mock 已有打字机效果）
          // 检测是否是报告开始
          if (!reportStartedRef.current && streamContent.startsWith('[Report]')) {
            reportStartedRef.current = true;
            onReportStart?.();
          }

          // 如果是报告，调用报告更新回调
          if (reportStartedRef.current) {
            onReportUpdate?.(streamContent);
          }

          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, content: streamContent, status: 'loading' }
              : msg
          ));
        }
      }, mode);

      // 标记流式输出结束
      isStreamingRef.current = false;

      // 如果使用打字机缓冲，等待所有内容显示完成
      if (useTypewriterBuffer) {
        await new Promise(resolve => {
          const checkComplete = setInterval(() => {
            if (displayedRef.current.length >= bufferRef.current.length) {
              clearInterval(checkComplete);
              resolve();
            }
          }, 50);
        });
      }

      // 完成后只更新状态
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, status: 'success' }
          : msg
      ));

      // 如果是报告，调用完成回调
      if (reportStartedRef.current) {
        onReportComplete?.();
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      isStreamingRef.current = false;
      clearTypewriterTimer();
      setMessages(prev => prev.filter(msg => msg.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, mode, onReportStart, onReportUpdate, onReportComplete, clearTypewriterTimer, startTypewriter]);

  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendUserMessage,
    clearMessages,
  };
}

