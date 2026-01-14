import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import XMarkdown from '@ant-design/x-markdown';
import Bmob from 'hydrogen-js-sdk';
import { useReport } from '../../contexts/ReportContext';
import { useUser, getCurrentUsername } from '../../hooks/useUser';
import { getModeLabel, getModeFromSearchParams } from '../../constants/modes';

// ========== 子组件 ==========

/**
 * 噪点纹理背景
 */
function NoiseBackground() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/**
 * 咖啡杯水印装饰
 */
function CoffeeWatermark() {
  return (
    <div 
      className="absolute bottom-48 -right-10 text-[200px] -rotate-[15deg] pointer-events-none select-none"
      style={{ color: '#3A3A3A', opacity: 0.03 }}
    >
      ☕
    </div>
  );
}

/**
 * 底部转化区组件
 */
function ConversionZone({ username }) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 h-60 flex flex-col items-center justify-end pb-8 z-50"
      style={{
        background: 'linear-gradient(to top, #F5F1ED 85%, rgba(245, 241, 237, 0) 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-5 mb-5 w-full">
        {/* 邀请好友按钮 */}
        <div className="flex flex-col items-center gap-2">
          <button 
            className="w-44 h-12 rounded-3xl text-base transition-all active:scale-[0.98]"
            style={{
              fontFamily: '"Noto Serif SC", serif',
              color: '#3A3A3A',
              backgroundColor: 'rgba(245, 241, 237, 0.8)',
              border: '1px solid #A8C5B8',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(168, 197, 184, 0.15)',
            }}
          >
            邀请好友查看
          </button>
          <p 
            className="text-xs text-center underline underline-offset-2"
            style={{ color: '#9A9A9A', letterSpacing: '0.5px' }}
          >
            限时活动: 邀请好友注册成功，可免费升级当前 Inner Book
          </p>
        </div>

        {/* 升级按钮 */}
        <button 
          className="w-44 h-12 rounded-3xl text-base text-white transition-all active:scale-[0.98]"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            backgroundColor: '#A8C5B8',
            boxShadow: '0 6px 16px rgba(168, 197, 184, 0.4)',
            letterSpacing: '1px',
          }}
        >
          升级 Inner Book
        </button>
      </div>

      {/* 签名 */}
      <div 
        className="flex items-center gap-1.5 text-xs tracking-widest uppercase"
        style={{ color: '#B0B0B0' }}
      >
        <span className="w-5 h-px" style={{ backgroundColor: '#D0D0D0' }} />
        <span>Inner Book Authenticity</span>
        <span className="w-5 h-px" style={{ backgroundColor: '#D0D0D0' }} />
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
        background: 'linear-gradient(to bottom, transparent 0%, rgba(245, 241, 237, 0.7) 20%, rgba(245, 241, 237, 0.95) 40%, #F5F1ED 60%)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div 
        className="flex flex-col items-center p-8 rounded-2xl mx-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
      >
        {/* 锁图标 */}
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(168, 197, 184, 0.2), rgba(168, 197, 184, 0.1))',
          }}
        >
          <svg className="w-8 h-8" style={{ color: '#A8C5B8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h3 
          className="text-lg mb-2"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            fontWeight: 'bold',
            color: '#3A3A3A',
          }}
        >
          登录查看完整报告
        </h3>
        <p className="text-sm text-center mb-6" style={{ color: '#888', maxWidth: '240px' }}>
          登录后可以查看完整的分析报告，并保存到您的个人档案
        </p>
        
        <button
          onClick={onLogin}
          className="w-full px-8 py-3 rounded-xl text-white text-base font-medium transition-all active:scale-[0.98]"
          style={{
            backgroundColor: '#A8C5B8',
            boxShadow: '0 6px 16px rgba(168, 197, 184, 0.4)',
          }}
        >
          立即登录
        </button>
        
        <Link 
          to={registerUrl || '/register'} 
          className="mt-3 text-sm"
          style={{ color: '#A8C5B8' }}
        >
          还没有账号？立即注册
        </Link>
      </div>
    </div>
  );
}

// ========== 主组件 ==========

/**
 * 生成报告标题
 * @param {string} mode - 模式
 * @returns {string} 标题
 */
function generateReportTitle(mode) {
  const modeLabel = getModeLabel(mode);
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `${modeLabel}-${timeStr}`;
}

export default function Result() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { content, isComplete } = useReport();
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

  // 报告生成完成后保存到数据库（仅登录用户）
  useEffect(() => {
    if (isComplete && content && !hasSavedRef.current && isLoggedIn) {
      hasSavedRef.current = true;
      saveReport(content);
    }
  }, [isComplete, content, saveReport, isLoggedIn]);

  // 如果没有报告内容，重定向到首页
  useEffect(() => {
    if (!content && !isComplete) {
      navigate('/');
    }
  }, [content, isComplete, navigate]);

  // 没有内容时显示加载
  if (!content) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F5F1ED' }}
      >
        <p style={{ color: '#6A6A6A' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F5F1ED' }}
    >
      <NoiseBackground />
      <CoffeeWatermark />

      {/* 顶部标题栏 */}
      <header 
        className="absolute top-5 left-5 right-5 h-[60px] flex items-center justify-center rounded-xl z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
        }}
      >
        <Link 
          to="/"
          className="absolute left-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: '#8C8C8C' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
          </svg>
        </Link>
        <h1 
          className="text-[22px]"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            color: '#3A3A3A',
            letterSpacing: '0.5px',
          }}
        >
          {username}的 Inner Book
        </h1>
        <Link 
          to="/profile"
          className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
          style={{ color: '#8C8C8C' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pt-[110px] pb-[240px] px-8 relative z-10">
        <div className="max-w-lg mx-auto">
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
      <ConversionZone username={username} />
    </div>
  );
}

