import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../api/chat';

/**
 * 聊天逻辑 Hook - 管理消息状态和 API 调用
 * @param {Object} options - 配置选项
 * @param {Function} options.onReportStart - 检测到 [Report] 开头时的回调
 * @param {Function} options.onReportUpdate - 报告内容更新时的回调
 * @param {Function} options.onReportComplete - 报告生成完成时的回调
 */
export function useChat(options = {}) {
  const { onReportStart, onReportUpdate, onReportComplete } = options;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const reportStartedRef = useRef(false);

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

    // 添加 AI 消息占位符
    const aiMsgId = Date.now() + 1;
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

      // 调用 sendMessage，使用流式回调更新内容
      await sendMessage(apiMessages, (streamContent) => {
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
      });

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
      setMessages(prev => prev.filter(msg => msg.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, onReportStart, onReportUpdate, onReportComplete]);

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

