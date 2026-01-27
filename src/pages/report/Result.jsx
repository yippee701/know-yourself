import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import { useReport } from '../../contexts/ReportContext';
import { generateReportTitle} from '../../utils/chat';
import { getModeFromSearchParams } from '../../constants/modes';
import { useToast } from '../../components/Toast';
import ShareDialog from '../share/shareDialog';
import InviteCodeDialog from '../../components/inviteCodeDialog';
import InviteLoginDialog from '../../components/inviteLoginDialog';
import { useRdb } from '../../contexts/cloudbaseContext';
import { getReportDetail as getReportDetailApi } from '../../api/report';

// ========== 子组件 ==========

/**
 * 背景装饰光晕 - 浅紫色弥散效果
 */
function BackgroundGlow() {
  return (
    <>
      <div 
        className="absolute top-10 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(196, 181, 253, 0.2)' }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(221, 214, 254, 0.15)' }}
      />
      <div 
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(233, 213, 255, 0.2)' }}
      />
    </>
  );
}

/**
 * 底部转化区组件
 */
function ConversionZone({ onUpgrade, onShare }) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-32 flex flex-col items-center justify-end pb-4 z-50"
      style={{
        background: 'linear-gradient(to top, #FFFFFF 85%, rgba(255, 255, 255, 0) 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-4 mb-4 w-full max-w-md px-6">
        {/* 按钮组 */}
        <div className="flex gap-3 w-full">
          <button 
            onClick={onShare}
            className="flex-1 h-12 rounded-full text-base font-medium transition-all active:scale-[0.98]"
            style={{
              color: '#374151',
              backgroundColor: 'rgba(243, 244, 246, 0.8)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
            }}
          >
            分享好友
          </button>
          <button 
            onClick={onUpgrade}
            className="flex-1 h-12 rounded-full text-base text-white font-medium transition-all active:scale-[0.98]"
            style={{
              backgroundColor: '#1F2937',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
            }}
          >
            升级 Inner Book
          </button>
        </div>
      </div>

      {/* 签名 */}
      <div 
        className="flex items-center gap-1.5 text-xs tracking-widest uppercase"
        style={{ color: '#9CA3AF' }}
      >
        <span className="w-5 h-px" style={{ backgroundColor: '#D1D5DB' }} />
        <span>Inner Book</span>
        <span className="w-5 h-px" style={{ backgroundColor: '#D1D5DB' }} />
      </div>
    </div>
  );
}

/**
 * 发光球体组件
 */
function GlowingSphere() {
  return (
    <div 
      className="w-16 h-16 rounded-full relative mb-6 mx-auto"
      style={{
        background: 'radial-gradient(circle at 30% 30%, rgba(107, 107, 255, 0.1), rgba(139, 92, 246, 0.4))',
        boxShadow: '0 0 30px rgba(107, 107, 255, 0.3)',
      }}
    >
      {/* 网格图案 */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
          transform: 'rotate(15deg)',
          maskImage: 'radial-gradient(black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(black, transparent 70%)',
        }}
      />
      {/* 高光 */}
      <div 
        className="absolute top-[15%] left-[15%] w-[20%] h-[20%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent 70%)',
          filter: 'blur(4px)',
        }}
      />
    </div>
  );
}

/**
 * 自定义 Markdown 组件 - 用于结构化展示报告
 * 注意：XMarkdown 的 components prop 接收 domNode 和 streamStatus，需要用 children 获取子元素
 */
const markdownComponents = {
  // 一级标题 - 主标题（通常是报告标题）
  h1: ({ children }) => (
    <div className="text-center mb-2">
      <GlowingSphere />
      <h1 
        className="text-2xl mb-2"
        style={{ 
          fontFamily: '"Noto Serif SC", serif',
          fontWeight: 900,
          color: '#1F2937',
          letterSpacing: '-0.5px',
        }}
      >
        {children}
      </h1>
      <p className="text-base" style={{ color: '#777777' }}>By Dora</p>
    </div>
  ),

  // 二级标题 - 章节标题
  h2: ({ children }) => (
    <div className="mb-5 mt-10 first:mt-0">
      <h2 
        className="text-xl"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
          fontWeight: 700,
          color: '#1F2937',
        }}
      >
        {children}
      </h2>
    </div>
  ),

  // 三级标题 - 副标题
  h3: ({ children }) => (
    <p 
      className="text-base mb-4 -mt-3"
      style={{ color: '#666666' }}
        >
      {children}
        </p>
  ),

  // 四级标题 - 子章节
  h4: ({ children }) => (
    <p 
      className="text-sm mb-3 mt-6 pl-1"
      style={{ color: '#666666' }}
    >
      {children}
    </p>
  ),

  // 引用块 - 核心洞察框
  blockquote: ({ children }) => (
        <div 
      className="rounded-2xl p-5 mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
        >
      <div 
        className="text-base leading-relaxed"
        style={{ 
          color: '#1F2937',
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  ),

  // 段落
  p: ({ children }) => (
    <p 
      className="text-[15px] leading-[1.7] mb-3"
      style={{ color: '#1F2937' }}
    >
      {children}
    </p>
  ),

  // 无序列表
  ul: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 列表项 - insight-box 包裹 + 发光圆点
  li: ({ children }) => (
    <div 
      className="rounded-2xl p-4 mb-4 last:mb-0"
      style={{
        background: 'linear-gradient(135deg, rgba(107, 107, 255, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex gap-3 items-start">
        {/* 发光圆点 */}
        <div 
          className="flex-shrink-0 mt-1 w-4 h-4 rounded-full relative"
          style={{
            background: 'linear-gradient(135deg, #6B6BFF, #8B5CF6)',
            boxShadow: '0 0 8px rgba(107, 107, 255, 0.5)',
          }}
        >
          <div 
            className="absolute top-[3px] left-[3px] w-1 h-1 rounded-full"
              style={{ 
              background: 'rgba(255,255,255,0.8)',
              filter: 'blur(1px)',
              }}
          />
        </div>
        {/* 文字 */}
        <div 
          className="flex-1 text-[15px] leading-[1.7]"
          style={{ color: '#1F2937' }}
            >
          {children}
        </div>
      </div>
    </div>
  ),

  // 有序列表
  ol: ({ children }) => (
    <div className="mt-2 mb-4">
      {children}
    </div>
  ),

  // 加粗文字
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: '#1F2937' }}>
      {children}
    </strong>
  ),

  // 斜体
  em: ({ children }) => (
    <em style={{ color: '#8B5CF6' }}>{children}</em>
  ),

  // 分割线
  hr: () => (
    <div 
      className="my-8 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
      }}
    />
  ),
};

/**
 * 报告内容渲染组件
 * 使用 XMarkdown 渲染 Markdown 格式的报告，带自定义样式
 */
function ReportContent({ content, subTitle }) {
    return (
      <div 
      className="rounded-3xl p-4 sm:p-8"
        style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
      <XMarkdown 
        content={`# ${subTitle}\n\n ${content}`}
        components={markdownComponents}
      />
      </div>
    );
}

/**
 * 未登录蒙层组件
 */
function LoginOverlay({ onLogin, registerUrl }) {
  return (
    <div 
      className="absolute inset-0 z-40 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(1px)',
      }}
    >
      <div 
        className="flex flex-col items-center p-8 rounded-2xl mx-6"
            style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(167, 139, 250, 0.2)',
            }}
          >
        {/* 锁图标 */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(139, 168, 255, 0.1))',
          }}
        >
          <svg className="w-8 h-8" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 
          className="text-lg mb-2"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            fontWeight: 'bold',
            color: '#1F2937',
          }}
        >
          登录查看完整报告
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: '#6B7280', maxWidth: '240px' }}>
          登录后可以查看完整的分析报告，并保存到您的个人档案
        </p>
        
        <button
          onClick={onLogin}
          className="w-full px-8 py-3 rounded-full text-white text-base font-medium transition-all active:scale-[0.98]"
          style={{
            backgroundColor: '#1F2937',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          立即登录
        </button>
        
        <Link 
          to={registerUrl || '/register'} 
          className="mt-3 text-sm"
          style={{ color: '#8B5CF6' }}
      >
          还没有账号？立即注册
        </Link>
      </div>
    </div>
  );
}

// ========== 主组件 ==========

export default function Result() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    getReportDetail, 
    content, 
    subTitle, 
    isLoggedIn: reportIsLoggedIn,
    handleInviteCodeSubmit,
    registerInviteCodeDialog,
    registerInviteLoginDialog,
  } = useReport();
  const rdb = useRdb();
  const [displayContent, setDisplayContent] = useState('');
  const { message } = useToast();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  
  // 对话框状态
  const [showInviteCodeDialog, setShowInviteCodeDialog] = useState(false);
  const [showInviteLoginDialog, setShowInviteLoginDialog] = useState(false);
  const [isVerifyingInviteCode, setIsVerifyingInviteCode] = useState(false);
  const [pendingUnlockReportId, setPendingUnlockReportId] = useState(null);
  
  // 从 URL 参数获取模式
  const mode = useMemo(() => getModeFromSearchParams(searchParams), [searchParams]);
  
  // 注册对话框回调
  useEffect(() => {
    if (registerInviteCodeDialog) {
      registerInviteCodeDialog((reportId) => {
        setPendingUnlockReportId(reportId);
        setShowInviteCodeDialog(true);
      });
    }
    if (registerInviteLoginDialog) {
      registerInviteLoginDialog(() => {
        setShowInviteLoginDialog(true);
      });
    }
  }, [registerInviteCodeDialog, registerInviteLoginDialog]);
  
  // 处理邀请码提交
  const handleInviteCodeSubmitWrapper = useCallback(async (inviteCode) => {
    if (!pendingUnlockReportId) {
      message.warning('报告 ID 不存在');
      return;
    }
    
    setIsVerifyingInviteCode(true);
    try {
      await handleInviteCodeSubmit(pendingUnlockReportId, inviteCode);
      setShowInviteCodeDialog(false);
      const unlockedReportId = pendingUnlockReportId;
      setPendingUnlockReportId(null);
      message.success('邀请码验证成功，报告已解锁');
      
      // 重新加载报告内容（跳过缓存）
      if (rdb) {
        const reportDetail = await getReportDetailApi(rdb, unlockedReportId, true);
        if (reportDetail) {
          setDisplayContent(reportDetail.content || '');
        }
      }
    } catch (err) {
      message.error(err.message || '邀请码验证失败');
      throw err;
    } finally {
      setIsVerifyingInviteCode(false);
    }
  }, [pendingUnlockReportId, handleInviteCodeSubmit, getReportDetail, message]);
  
  // 跳转到登录页（带返回地址）
  const handleGoToLogin = useCallback(() => {
    const returnUrl = `/profile`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [navigate, mode]);

  // 处理升级按钮点击
  const handleUpgrade = useCallback(() => {
    message.info('功能开发中');
  }, [message]);

  // 处理分享按钮点击
  const handleShare = useCallback(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');
    if (!reportId) {
      message.warning('报告 ID 不存在，无法分享');
      return;
    }
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${baseUrl}#/share?mode=${mode}&reportId=${reportId}`;    
    setShareUrl(shareUrl);
    setIsShareDialogOpen(true);
  }, [message, mode]);

  // 关闭分享弹窗
  const handleCloseShareDialog = useCallback(() => {
    setIsShareDialogOpen(false);
  }, []);

  // 加载报告内容
  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const reportId = currentSearchParams.get('reportId');

    // 情况1：从 ReportLoading 跳转过来 或者已经拉取过一次了
    // if (content && re) {
    //   setDisplayContent(content);
    //   setIsLoadingReport(false);
    //   return;
    // }

    // 情况2：从历史记录点击进来，需要从数据库拉取
    // 等待 rdb 和 getReportDetail 初始化完成
    if (!rdb || !getReportDetail) {
      return;
    }

    if (!reportId) {
      message.warning('报告 ID 不存在，无法查看');
      navigate('/');
      return;
    }

    const loadReport = async () => {
      setIsLoadingReport(true);
      try {
        const reportDetail = await getReportDetail(reportId);
        if (!reportDetail) {
          message.warning('报告内容不存在');
          navigate('/');
          return;
        }
        // 从数据库获取的 content 已经移除了 h1 标题，直接使用
        setDisplayContent(reportDetail.content || '');

        if (reportDetail.lock === 1) {
          setShowInviteCodeDialog(true);
        }
      } catch (err) {
        console.error('加载报告失败:', err);
        message.error('加载报告失败，请稍后重试');
        navigate('/');
      } finally {
        setIsLoadingReport(false);
      }
    };

    loadReport();
  }, [navigate, getReportDetail, message, rdb, content, subTitle]);

  // 没有内容时显示加载
  if (isLoadingReport || !displayContent) {
    return (
      <div className="h-screen-safe flex items-center justify-center bg-white">
        <p style={{ color: '#6B7280' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden relative">
      {/* 背景装饰光晕 */}
      <BackgroundGlow />

      {/* 顶部标题栏 */}
      <header 
        className="flex items-center justify-between px-4 py-2 relative z-50"
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
        <h1 className="text-gray-900 font-medium">
          {generateReportTitle(mode)}
        </h1>
        <Link 
          to="/profile"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-[220px] px-3 relative z-10">
        <div className="max-w-md mx-auto py-3">
          <ReportContent content={displayContent} subTitle={subTitle} />
        </div>
      </div>

      {/* 未登录蒙层 */}
      {!reportIsLoggedIn && (
        <LoginOverlay 
          onLogin={handleGoToLogin} 
          registerUrl={`/register?returnUrl=${encodeURIComponent(`/profile`)}`}
        />
      )}

      {/* 底部转化区 */}
      <ConversionZone onUpgrade={handleUpgrade} onShare={handleShare} />

      {/* 分享弹窗 */}
      <ShareDialog 
        isOpen={isShareDialogOpen}
        onClose={handleCloseShareDialog}
        shareUrl={shareUrl}
      />
      
      {/* 邀请码对话框 */}
      <InviteCodeDialog
        isOpen={showInviteCodeDialog}
        onClose={() => {
          setShowInviteCodeDialog(false);
          setPendingUnlockReportId(null);
        }}
        onSubmit={handleInviteCodeSubmitWrapper}
        isLoading={isVerifyingInviteCode}
      />
      
      {/* 邀请登录对话框 */}
      <InviteLoginDialog
        isOpen={showInviteLoginDialog}
        onClose={() => setShowInviteLoginDialog(false)}
        returnUrl={window.location.hash.replace('#', '')}
      />
    </div>
  );
}

