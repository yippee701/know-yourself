import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import Bmob from 'hydrogen-js-sdk';
import { useReport } from '../../contexts/ReportContext';
import { useUser } from '../../hooks/useUser';
import { getCurrentUsername } from '../../utils/user';
import { generateReportTitle } from '../../utils/chat';
import { getModeFromSearchParams } from '../../constants/modes';

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
function ConversionZone() {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-52 flex flex-col items-center justify-end pb-8 z-50"
      style={{
        background: 'linear-gradient(to top, #FFFFFF 85%, rgba(255, 255, 255, 0) 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-4 mb-4 w-full max-w-md px-6">
        {/* 按钮组 */}
        <div className="flex gap-3 w-full">
          <button 
            className="flex-1 h-12 rounded-full text-base font-medium transition-all active:scale-[0.98]"
            style={{
              color: '#374151',
              backgroundColor: 'rgba(243, 244, 246, 0.8)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
            }}
          >
            邀请好友
          </button>
          <button 
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
 * 报告内容渲染组件
 * 使用 XMarkdown 渲染 Markdown 格式的报告
 */
function ReportContent({ content }) {
  return (
    <XMarkdown 
      content={content}
    />
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
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 0.7) 20%, rgba(255, 255, 255, 0.95) 40%, #FFFFFF 60%)',
        backdropFilter: 'blur(2px)',
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
  const { content, isComplete, isFromHistory } = useReport();
  const { isLoggedIn, isLoading: userLoading } = useUser();
  const username = getCurrentUsername() || '探索者';
  
  // 从 URL 参数获取模式
  const mode = useMemo(() => getModeFromSearchParams(searchParams), [searchParams]);
  const hasSavedRef = useRef(false); // 防止重复保存

  // 跳转到登录页（带返回地址）
  const handleGoToLogin = useCallback(() => {
    const returnUrl = `/report-result?mode=${mode}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [navigate, mode]);

  // 保存报告
  const saveReport = useCallback(async (reportContent) => {
    // 未登录时不保存
    if (!isLoggedIn) return;
    
    try {
      const title = generateReportTitle(mode);
      
      const query = Bmob.Query('Report');
      query.set('content', reportContent);
      query.set('username', username);
      query.set('title', title);
      query.set('status', 'completed');
      query.set('mode', mode);
      
      const res = await query.save();
      console.log('报告保存成功:', res);
      return res;
    } catch (err) {
      console.error('报告保存失败:', err);
      throw err;
    }
  }, [username, mode, isLoggedIn]);

  // 报告生成完成后保存到数据库（仅登录用户，且非历史报告）
  useEffect(() => {
    if (isComplete && content && !hasSavedRef.current && isLoggedIn && !isFromHistory) {
      hasSavedRef.current = true;
      saveReport(content);
    }
  }, [isComplete, content, saveReport, isLoggedIn, isFromHistory]);

  // 如果没有报告内容，重定向到首页
  useEffect(() => {
    if (!content && !isComplete) {
      navigate('/');
    }
  }, [content, isComplete, navigate]);

  // 没有内容时显示加载
  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p style={{ color: '#6B7280' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col overflow-hidden relative">
      {/* 背景装饰光晕 */}
      <BackgroundGlow />

      {/* 顶部标题栏 */}
      <header 
        className="flex items-center justify-between px-4 py-4 relative z-50"
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
      <div className="flex-1 overflow-y-auto pb-[220px] px-5 relative z-10">
        <div className="max-w-md mx-auto py-6">
          <ReportContent content={content} />
        </div>
      </div>

      {/* 未登录蒙层 */}
      {!userLoading && !isLoggedIn && (
        <LoginOverlay 
          onLogin={handleGoToLogin} 
          registerUrl={`/register?returnUrl=${encodeURIComponent(`/report-result?mode=${mode}`)}`}
        />
      )}

      {/* 底部转化区 */}
      <ConversionZone />
    </div>
  );
}

