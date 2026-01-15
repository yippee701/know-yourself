import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// 组件
import MessageList from './MessageList';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';

// Hook & Context
import { useChat } from '../../hooks/useChat';
import { useReport } from '../../contexts/ReportContext';
import { getWelcomeMessage } from '../../api/chat';
import { getModeFromSearchParams } from '../../constants/modes';

// 粒子光圈图标组件 - 玻璃态设计
function ParticleIcon() {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      {/* 玻璃态球体 */}
      <div 
        className="absolute w-8 h-8 rounded-full backdrop-blur-xl shadow-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.6), rgba(96, 165, 250, 0.4))',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      />
      {/* 高光 */}
      <div className="absolute w-3 h-3 top-1 left-1.5 rounded-full bg-white/60" />
      {/* 内部光晕 */}
      <div className="absolute w-4 h-4 rounded-full bg-purple-200/40 blur-sm" />
    </div>
  );
}

// 背景装饰光晕 - 浅紫色弥散效果
function BackgroundGlow() {
  return (
    <>
      <div 
        className="absolute top-10 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(196, 181, 253, 0.25)' }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(221, 214, 254, 0.2)' }}
      />
      <div 
        className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(233, 213, 255, 0.3)' }}
      />
    </>
  );
}

// localStorage key（与 ReportContext 保持一致）
const LOCAL_REPORTS_KEY = 'pendingReports';

// 直接从 localStorage 获取未完成的报告
function getLocalPendingReport(mode) {
  try {
    const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
    const pendingReport = localReports.find(
      r => r.mode === mode && r.status === 'generating'
    );
    console.log('检查本地报告, mode:', mode, '找到:', pendingReport?.title || '无');
    return pendingReport || null;
  } catch (err) {
    console.error('获取本地报告失败:', err);
    return null;
  }
}

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 根据 URL 参数确定聊天模式（提前计算，不使用 useMemo）
  const chatMode = getModeFromSearchParams(searchParams);

  const [hasStarted, setHasStarted] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  
  // 组件挂载时检查是否有未完成的报告
  useEffect(() => {
    const pending = getLocalPendingReport(chatMode);
    if (pending && pending.messages?.length > 0) {
      console.log('发现未完成的对话:', pending.title, '消息数:', pending.messages.length);
      setPendingReport(pending);
    }
  }, [chatMode]);
  
  const { 
    startReport, 
    updateReportContent, 
    completeReport, 
    createReport,
    updateMessages,
    resumeReport,
  } = useReport();

  // 获取对应模式的欢迎消息
  const welcomeMessage = getWelcomeMessage(chatMode);

  // 报告检测回调
  const handleReportStart = useCallback(() => {
    startReport();
    navigate(`/report-loading?mode=${chatMode}`);
  }, [startReport, navigate, chatMode]);

  const handleReportUpdate = useCallback((content) => {
    updateReportContent(content);
  }, [updateReportContent]);

  const handleReportComplete = useCallback(() => {
    completeReport();
  }, [completeReport]);

  const { messages, isLoading, sendUserMessage, restoreMessages } = useChat({
    mode: chatMode,
    onReportStart: handleReportStart,
    onReportUpdate: handleReportUpdate,
    onReportComplete: handleReportComplete,
  });
  
  // 计算当前问题进度（基于 AI 回复数量）
  const aiMessageCount = messages.filter(m => m.role === 'assistant').length;
  const progress = Math.min(aiMessageCount, 10);

  // 对话记录变化时同步到 ReportContext
  useEffect(() => {
    if (hasStarted && messages.length > 0) {
      updateMessages(messages);
    }
  }, [hasStarted, messages, updateMessages]);

  // 恢复上次未完成的对话
  const handleResume = useCallback(() => {
    if (pendingReport) {
      resumeReport(pendingReport);
      restoreMessages(pendingReport.messages);
      setHasStarted(true);
      setPendingReport(null);
    }
  }, [pendingReport, resumeReport, restoreMessages]);

  // 开始新对话（放弃上次的）
  const handleStartNew = useCallback(async () => {
    setPendingReport(null);
    setHasStarted(true);
    // 先创建报告记录
    await createReport(chatMode);
    // 然后发送第一条消息
    await sendUserMessage('你好，我准备好了，请开始吧。');
  }, [chatMode, createReport, sendUserMessage]);

  // 开始对话
  const handleStart = async () => {
    // 如果有未完成的报告，先恢复
    if (pendingReport) {
      handleResume();
    } else {
      await handleStartNew();
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden max-w-md mx-auto relative">
      {/* 背景装饰光晕 */}
      <BackgroundGlow />

      {/* 顶部标题栏 */}
      <header 
        className="flex items-center justify-between px-4 py-4 relative z-10"
        style={{ borderBottom: '1px solid rgba(243, 244, 246, 1)' }}
      >
        <Link 
          to="/"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-gray-900 font-medium">Talking with Dora</h1>
        <div className="w-10 h-10" />
      </header>
      
      {/* Progress 状态栏 */}
      <div className="flex items-center justify-between px-5 py-3 relative z-10">
        <ParticleIcon />
        <span 
          className="text-gray-500 tracking-wide text-sm"
          style={{ fontFamily: 'monospace, serif' }}
        >
          Progress: {String(progress).padStart(2, '0')}/10
        </span>
      </div>

      {/* 聊天内容区 */}
      <div className="flex-1 overflow-y-auto px-5 pb-32 relative z-10">
        <div className="max-w-lg mx-auto">
          {!hasStarted ? (
            <WelcomeScreen 
              onStart={handleStart} 
              onResume={handleResume}
              onStartNew={handleStartNew}
              hasPendingReport={!!pendingReport}
              welcomeMessage={welcomeMessage} 
            />
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
      </div>

      {/* 输入区域 */}
      {hasStarted && (
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white px-5 pb-8 z-20">
        <div 
          className="w-full rounded-full flex items-center px-5 gap-3"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <div className="flex-1">
            <ChatInput 
              onSend={sendUserMessage} 
              isLoading={isLoading}
              disabled={!hasStarted}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          推荐使用输入法的语音输入功能
        </p>
      </div>
      )}
    </div>
  );
}
