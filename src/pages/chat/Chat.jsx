import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// 组件
import MessageList from './MessageList';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';
import NoQuotaDialog from '../../components/NoQuotaDialog';

// Hook & Context
import { useChat } from '../../hooks/useChat';
import { useReport } from '../../contexts/ReportContext';
import { useProfile, checkCanStartChat } from '../../hooks/useProfile';
import { getWelcomeMessage } from '../../constants/welcome-message';
import { getModeFromSearchParams } from '../../constants/modes';

// 粒子光圈图标组件 - 玻璃态设计
function ParticleIcon() {
  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      {/* 玻璃态球体 */}
      <div 
        className="absolute w-5 h-5 rounded-full backdrop-blur-xl shadow-lg"
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showNoQuotaDialog, setShowNoQuotaDialog] = useState(false);
  const inputAreaRef = useRef(null);
  const messageListRef = useRef(null);
  // 记录初始视口高度（键盘未弹起时的高度）
  const initialViewportHeight = useRef(window.visualViewport?.height || window.innerHeight);

  // 获取用户信息用于检查对话次数
  const { isLoggedIn, userExtraInfo, isLoading: isProfileLoading } = useProfile();
  
  // 页面加载时检查对话次数
  useEffect(() => {
    // 等待用户信息加载完成
    if (isProfileLoading) return;
    
    // 检查是否可以开始对话
    if (!checkCanStartChat(isLoggedIn, userExtraInfo)) {
      setShowNoQuotaDialog(true);
    }
  }, [isLoggedIn, userExtraInfo, isProfileLoading]);

  // 监听键盘弹起（移动端）
  useEffect(() => {
    // 更新初始高度（取最大值，因为键盘收起时高度最大）
    const updateInitialHeight = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      if (currentHeight > initialViewportHeight.current) {
        initialViewportHeight.current = currentHeight;
      }
    };
    
    const handleViewportResize = () => {
      updateInitialHeight();
      
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      // 计算键盘高度 = 初始高度 - 当前可视区域高度
      const keyboardH = initialViewportHeight.current - currentHeight;
      const newHeight = keyboardH > 0 ? keyboardH : 0;
      
      setKeyboardHeight(newHeight);
      
      // 键盘弹起后，滚动消息列表到底部（考虑键盘高度）
      if (newHeight > 0 && hasStarted && messageListRef.current) {
        setTimeout(() => {
          messageListRef.current?.scrollToBottom(true, newHeight);
        }, 100); // 延迟一点确保键盘动画完成
      }
    };

    // 监听 visualViewport 变化
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, [hasStarted]);

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

  // 对话记录变化时同步到 ReportContext（只在消息完成时更新，不在流式输出过程中更新）
  useEffect(() => {
    if (hasStarted && messages.length > 0) {
      // 检查最后一条消息是否还在 loading 状态
      const lastMessage = messages[messages.length - 1];
      const isLastMessageLoading = lastMessage?.status === 'loading';
      
      // 只有在最后一条消息不是 loading 状态时才更新本地存储
      if (!isLastMessageLoading) {
        updateMessages(messages);
      }
    }
  }, [hasStarted, messages, updateMessages]);

  // 恢复上次未完成的对话
  const handleResume = useCallback(() => {
    if (pendingReport) {
      resumeReport(pendingReport);
      restoreMessages(pendingReport.messages);
      setHasStarted(true);
      setPendingReport(null);
      
      // 延迟滚动到底部，等待 DOM 更新
      setTimeout(() => {
        messageListRef.current?.scrollToBottom(true);
      }, 100);
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
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden max-w-md mx-auto relative">
      {/* 背景装饰光晕 */}
      <BackgroundGlow />

      {/* 顶部标题栏 */}
      <header 
        className="flex items-center justify-between px-4 py-1 relative z-10"
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
      <div className="flex items-center justify-between px-5 py-2 relative z-10">
        <ParticleIcon />
        <span 
          className="text-gray-500 tracking-wide text-sm"
          style={{ fontFamily: 'monospace, serif' }}
        >
          Progress: {String(progress).padStart(2, '0')}/10
        </span>
      </div>

      {/* 聊天内容区 */}
      <div className={`flex-1 px-5 relative z-10 ${hasStarted ? 'overflow-y-auto pb-32' : 'overflow-hidden flex flex-col'}`}>
        <div className={`max-w-lg mx-auto ${!hasStarted ? 'flex-1 flex flex-col' : ''}`}>
          {!hasStarted ? (
            <WelcomeScreen 
              onStart={handleStart} 
              onResume={handleResume}
              onStartNew={handleStartNew}
              hasPendingReport={!!pendingReport}
              welcomeMessage={welcomeMessage} 
              mode={chatMode}
            />
          ) : (
            <MessageList ref={messageListRef} messages={messages} keyboardHeight={keyboardHeight} />
          )}
        </div>
      </div>

      {/* 输入区域 */}
      {hasStarted && (
      <div 
        ref={inputAreaRef}
        className="fixed left-0 right-0 max-w-md mx-auto bg-white px-5 pb-2 pt-2 z-20"
        style={{ bottom: 0 }}
      >
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

      {/* 对话次数不足弹窗 */}
      <NoQuotaDialog 
        isOpen={showNoQuotaDialog} 
        onClose={() => {
          setShowNoQuotaDialog(false);
          navigate('/'); // 关闭弹窗时返回首页
        }} 
      />
    </div>
  );
}
