import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReport } from '../../contexts/ReportContext';

// 环境光效果
function AmbientLight() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(180deg, rgba(42,42,42,0.05) 0%, rgba(245,241,237,0) 40%, rgba(245,241,237,1) 100%)',
      }}
    />
  );
}

// 纹理背景
function TextureBackground() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(#D3CDC6 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }}
    />
  );
}

// 粒子组件
function Particle({ top, left, size, delay = 0 }) {
  return (
    <div 
      className="absolute rounded-full"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: '#9FB6C3',
        opacity: 0.6,
        filter: 'blur(1px)',
        animation: `float 3s ease-in-out infinite ${delay}s`,
      }}
    />
  );
}

// 粒子光圈组件
function ParticleAperture() {
  return (
    <div className="relative w-72 h-72 flex justify-center items-center">
      {/* 旋转粒子容器 */}
      <div 
        className="absolute w-full h-full"
        style={{ animation: 'spin 20s linear infinite' }}
      >
        <Particle top="10%" left="50%" size="4px" />
        <Particle top="80%" left="20%" size="3px" delay={0.5} />
        <Particle top="30%" left="80%" size="5px" delay={1} />
        <Particle top="70%" left="75%" size="2px" delay={1.5} />
        <Particle top="20%" left="30%" size="3px" delay={2} />
      </div>

      {/* 三层光圈 */}
      <div 
        className="absolute w-72 h-72 rounded-full animate-breathe"
        style={{
          border: '1px solid rgba(159, 182, 195, 0.2)',
          background: 'radial-gradient(circle, transparent 60%, rgba(148, 168, 154, 0.05) 100%)',
          boxShadow: '0 0 20px rgba(148, 168, 154, 0.2)',
        }}
      />
      <div 
        className="absolute w-60 h-60 rounded-full animate-breathe"
        style={{
          border: '1px solid rgba(159, 182, 195, 0.4)',
          boxShadow: '0 0 30px rgba(159, 182, 195, 0.15)',
          animationDelay: '0.5s',
        }}
      />
      <div 
        className="absolute w-48 h-48 rounded-full animate-breathe"
        style={{
          border: '1.5px solid rgba(148, 168, 154, 0.6)',
          background: 'radial-gradient(circle, rgba(245, 241, 237, 0.1) 0%, rgba(159, 182, 195, 0.1) 100%)',
          boxShadow: 'inset 0 0 20px rgba(148, 168, 154, 0.1)',
          animationDelay: '1s',
        }}
      />
    </div>
  );
}

// 关键帧卡片
function KeyframeCard({ color, title, content }) {
  return (
    <div 
      className="flex-1 flex flex-col gap-1.5 p-3 rounded-xl"
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
        <span 
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{ color: '#6A6A6A' }}
        >
          {title}
        </span>
      </div>
      <p 
        className="text-[10px] leading-snug line-clamp-3"
        style={{ color: '#2A2A2A', opacity: 0.8 }}
      >
        {content}
      </p>
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

export default function ReportLoading() {
  const navigate = useNavigate();
  const { isComplete, content } = useReport();

  // 报告生成完成后跳转到结果页
  useEffect(() => {
    if (isComplete && content) {
      navigate('/report-result');
    }
  }, [isComplete, content, navigate]);

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F5F1ED' }}
    >
      <TextureBackground />
      <AmbientLight />

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-32">
        {/* 粒子光圈 */}
        <ParticleAperture />

        {/* 加载文字 */}
        <p 
          className="mt-16 text-xl tracking-wide"
          style={{
            fontFamily: '"Noto Serif SC", serif',
            color: '#6A6A6A',
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          Dora 正在解析你的内心档案<LoadingDots />
        </p>
      </div>

      {/* 底部关键帧卡片 */}
      <div className="absolute bottom-6 left-0 right-0 px-4 flex gap-2 z-20">
        <KeyframeCard 
          color="#94A89A"
          title="Keyframe 1-2s"
          content="粒子光圈向中心坍缩，直径缩至200px，密度增加，光效增强。"
        />
        <KeyframeCard 
          color="#9FB6C3"
          title="Keyframe 2-4s"
          content="光圈向两侧展开，变形为长方形书封(240x320)，保持流动。"
        />
        <KeyframeCard 
          color="#D4A373"
          title="Keyframe 4-6s"
          content="轮廓成型，粒子凝固为纸质纹理，底色过渡至纸质微亮色。"
        />
      </div>

      {/* 返回首页按钮 */}
      <Link 
        to="/"
        className="absolute top-4 left-4 z-50 flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
        style={{ color: '#8C8C8C' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
        </svg>
      </Link>
    </div>
  );
}

