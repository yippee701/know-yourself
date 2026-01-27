import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useReport } from '../../contexts/ReportContext';
import { getModeFromSearchParams } from '../../constants/modes';

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

// 玻璃态球体组件
function GlassOrb() {
  return (
    <div className="relative w-56 h-56 animate-breathe">
      {/* 底部阴影 */}
      <div 
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl animate-breathe-shadow"
        style={{ background: 'rgba(167, 139, 250, 0.15)' }}
      />

      {/* 主球体容器 */}
      <div className="relative w-full h-full rounded-full">
        {/* 外层发光 */}
        <div 
          className="absolute inset-0 rounded-full blur-3xl animate-glow-pulse"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.6), rgba(139, 168, 255, 0.5) 50%, rgba(147, 197, 253, 0.4) 80%, transparent)',
          }}
        />

        {/* 二层发光 */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl animate-glow-pulse-delayed"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(196, 181, 253, 0.5), rgba(167, 139, 250, 0.4) 60%, transparent)',
          }}
        />
        
        {/* 玻璃球体基底 */}
        <div 
          className="absolute inset-2 rounded-full blur-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.8) 0%, rgba(139, 168, 255, 0.85) 40%, rgba(167, 139, 250, 0.75) 100%)',
            boxShadow: '0 20px 50px rgba(139, 92, 246, 0.2), inset 0 0 50px rgba(255, 255, 255, 0.2)',
          }}
        />

        {/* 流动渐变层 */}
        <div
          className="absolute inset-2 rounded-full blur-sm animate-rotate-slow"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(167, 139, 250, 0.6) 20%, rgba(139, 168, 255, 0.7) 40%, rgba(147, 197, 253, 0.6) 60%, transparent 80%)',
            opacity: 0.6,
          }}
        />

        {/* 磨砂玻璃层 */}
        <div 
          className="absolute inset-4 rounded-full backdrop-blur-sm"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.7), rgba(221, 214, 254, 0.45) 35%, rgba(196, 181, 253, 0.35) 70%, transparent 95%)',
          }}
        />

        {/* 顶部高光 */}
        <div 
          className="absolute top-10 left-10 w-32 h-18 rounded-full blur-xl animate-highlight-pulse"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.95), transparent 65%)',
          }}
        />

        {/* 粒子光点 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/60 rounded-full blur-sm animate-particle"
            style={{
              top: `${20 + Math.sin(i * 1.047) * 30}%`,
              left: `${50 + Math.cos(i * 1.047) * 35}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// 加载进度指示
function LoadingDots() {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-6 text-left">{dots}</span>;
}

// 进度条组件
function ProgressBar({ current, total }) {
  const progress = Math.min((current / total) * 100, 100);
  
  return (
    <div className="w-64 mt-8">
      {/* 进度条背景 */}
      <div 
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)' }}
      >
        {/* 进度条填充 */}
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #A78BFA, #8B5CF6)',
          }}
        />
      </div>
      {/* 进度文字 */}
      <p className="mt-2 text-xs text-center" style={{ color: '#9CA3AF' }}>
        已生成 {current.toLocaleString()} 字
      </p>
    </div>
  );
}

export default function ReportLoading() {
  const REPORT_TOTAL_CHARS = 3000;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isComplete, content, currentReportId } = useReport();
  
  // 从 URL 参数获取模式
  const mode = useMemo(() => getModeFromSearchParams(searchParams), [searchParams]);
  
  // 计算进度
  const currentChars = content ? content.length : 0;
  const totalChars = Math.max(REPORT_TOTAL_CHARS, currentChars);

  // 报告生成完成后跳转到结果页
  useEffect(() => {
    if (isComplete && content) {
      navigate(`/report-result?mode=${mode}&reportId=${currentReportId}`);
    }
  }, [isComplete, content, navigate, mode, currentReportId]);

  return (
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden relative">
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
        <h1 className="text-gray-900 font-medium">生成报告中</h1>
        <div className="w-10 h-10" />
      </header>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-32 max-w-md mx-auto">
        {/* 玻璃态球体 */}
        <GlassOrb />

        {/* 加载文字 */}
        <p 
          className="mt-16 text-xl tracking-wide text-center"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            color: '#374151',
            fontWeight: 500,
          }}
        >
          Dora 正在解析你的内心档案<LoadingDots />
        </p>
        <p className="mt-3 text-sm text-gray-400">
          请稍候，这需要一些时间...
        </p>
        
        {/* 进度条 */}
        <ProgressBar current={currentChars} total={totalChars} />
      </div>
    </div>
  );
}

