import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useReport } from '../../contexts/ReportContext';

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
function ConversionZone({ nickname }) {
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
 * 将 Markdown 格式的报告渲染为段落
 */
function ReportContent({ content }) {
  // 按段落分割内容
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-6">
      {paragraphs.map((para, idx) => {
        const trimmed = para.trim();
        
        // 检测标题（以 # 开头）
        if (trimmed.startsWith('#')) {
          const level = trimmed.match(/^#+/)[0].length;
          const text = trimmed.replace(/^#+\s*/, '');
          const fontSize = level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg';
          
          return (
            <h2 
              key={idx}
              className={`${fontSize} font-medium mt-8 mb-4`}
              style={{ 
                fontFamily: '"Noto Serif SC", serif',
                color: '#3A3A3A',
              }}
            >
              {text}
            </h2>
          );
        }

        // 普通段落
        return (
          <p 
            key={idx}
            className="text-base leading-relaxed"
            style={{ 
              fontFamily: '"Noto Serif SC", serif',
              color: '#5d5d5d',
              lineHeight: '2',
              textIndent: '2em',
            }}
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

// ========== 主组件 ==========

export default function Result() {
  const navigate = useNavigate();
  const { content, isComplete } = useReport();
  const nickname = '探索者'; // TODO: 从用户信息中获取

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
          {nickname}的 Inner Book
        </h1>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pt-[110px] pb-[240px] px-8 relative z-10">
        <div className="max-w-lg mx-auto">
          <ReportContent content={content} />
        </div>
      </div>

      {/* 底部转化区 */}
      <ConversionZone nickname={nickname} />
    </div>
  );
}

