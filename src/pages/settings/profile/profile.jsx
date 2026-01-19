import { Link, useNavigate } from 'react-router-dom';
import Bmob from 'hydrogen-js-sdk';

import { useProfile } from '../../../hooks/useProfile';
import { useReport } from '../../../contexts/ReportContext';

// ========== 子组件 ==========

/**
 * 背景装饰光晕
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
        className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(233, 213, 255, 0.2)' }}
      />
    </>
  );
}

/**
 * 头像组件
 */
function Avatar({ avatar }) {
  return (
    <div 
      className="w-14 h-14 rounded-full flex items-center justify-center mr-4"
      style={{
        background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.4), rgba(167, 139, 250, 0.3))',
        boxShadow: '0 4px 10px rgba(139, 92, 246, 0.1)',
        border: '2px solid rgba(255, 255, 255, 0.8)',
      }}
    >
      {avatar ? (
        <img src={avatar} alt="头像" className="w-full h-full rounded-full object-cover" />
      ) : (
        <svg className="w-7 h-7" style={{ color: '#8B5CF6' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </div>
  );
}

/**
 * 用户头部信息组件
 */
function UserHeader({ user, userExtraInfo }) {
  if (!user) return null;
  return (
    <div className="flex items-center mb-5">
      <Avatar avatar={null} />
      <div className="flex-1">
        <div className="flex items-center mb-1.5">
          <span 
            className="text-xl mr-2"
            style={{ 
              fontFamily: '"Noto Serif SC", serif',
              fontWeight: 'bold',
              color: '#1F2937',
            }}
          >
            {user.username}
          </span>
          <span 
            className="text-[11px] px-2 py-0.5 rounded-full text-white"
            style={{ 
              background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
              fontFamily: '"Noto Sans SC", sans-serif',
              fontWeight: 500,
            }}
          >
            {userExtraInfo?.level || 0}
          </span>
        </div>
        
        {/* 资产卡片 */}
        <div 
          className="flex justify-between items-center px-3.5 py-2.5 rounded-xl cursor-pointer"
          style={{
            backgroundColor: 'rgba(249, 250, 251, 0.8)',
            border: '1px solid rgba(167, 139, 250, 0.2)',
          }}
        >
          <span className="text-[13px]" style={{ color: '#374151' }}>
            剩余深度对话: <strong className="mx-1 text-[15px]" style={{ color: '#8B5CF6' }}>{userExtraInfo.remainingReport}</strong> 次
          </span>
          <span className="text-xs flex items-center" style={{ color: '#8B5CF6' }}>
            升级 
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 裂变进度条组件
 */
function FissionBar({ userExtraInfo }) {
  if (!userExtraInfo) return null;
  const TARGET_INVITES = 2;
  const progress = (userExtraInfo.currentInvites / TARGET_INVITES) * 100;
  const remaining = TARGET_INVITES - userExtraInfo.currentInvites;
  
  return (
    <div className="py-3 my-1">
      <p className="text-[13px] mb-2" style={{ color: '#4B5563' }}>
        再邀请 <span className="font-bold" style={{ color: '#8B5CF6' }}>{remaining} 位好友</span> 即可解锁 
      </p>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(167, 139, 250, 0.15)' }}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #A78BFA, #8B5CF6)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * 对话卡片组件
 */
function ReportCard({ report, onRestart, onView }) {
  const { status, storageType, storageInfo, title, createdAt, content } = report;
  const isExpired = status === 'expired';
  const isGenerating = status === 'generating';
  const canView = status === 'completed' && content;
  
  // 计算倒计时进度
  const countdownProgress = storageType === 'countdown' && storageInfo
    ? (storageInfo.remainingHours / storageInfo.totalHours) * 100
    : 0;

  // 处理点击
  const handleClick = () => {
    if (canView && onView) {
      onView(report);
    }
  };

  return (
    <div 
      className={`rounded-2xl p-[18px] relative overflow-hidden transition-transform ${isExpired ? 'opacity-90' : ''} ${canView ? 'cursor-pointer active:scale-[0.98]' : ''}`}
      style={{
        backgroundColor: isExpired ? 'rgba(243, 244, 246, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        boxShadow: isExpired ? 'none' : '0 8px 20px rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(167, 139, 250, 0.15)',
      }}
      onClick={handleClick}
    >
      {/* 卡片头部 */}
      <div className="flex justify-between items-start mb-2">
        <h3 
          className="flex-1 mr-2.5 text-[17px] leading-snug"
          style={{ 
            fontFamily: '"Noto Serif SC", serif',
            fontWeight: 'bold',
            color: isExpired ? '#9CA3AF' : '#1F2937',
          }}
        >
          {title}
        </h3>
        
        {/* 状态标签 */}
        {isGenerating && (
          <span className="text-[11px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(139, 168, 255, 0.15)', color: '#6366F1' }}>
            生成中
          </span>
        )}
        {storageType === 'permanent' && (
          <span className="text-[11px] px-2 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' }}>
            永久存储
          </span>
        )}
        {storageType === 'validUntil' && storageInfo && (
          <span className="text-[11px] px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#6B7280' }}>
            有效期至 {storageInfo.validUntil}
          </span>
        )}
        {isExpired && (
          <span className="text-[11px] px-2 py-1 rounded-full" style={{ backgroundColor: 'transparent', border: '1px solid #D1D5DB', color: '#9CA3AF' }}>
            已过期
          </span>
        )}
      </div>

      {/* 时间 */}
      <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#9CA3AF' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {createdAt}
      </div>

      {/* 生成中状态 */}
      {/* {isGenerating && (
        <div className="flex items-center text-[13px] mt-2" style={{ color: '#666' }}>
          <svg className="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>等待 AI 生成结果<span className="animate-pulse">...</span></span>
        </div>
      )} */}

      {/* 倒计时存储 */}
      {/* {storageType === 'countdown' && storageInfo && (
        <>
          <span className="inline-block text-[11px] px-2 py-1 rounded-md mb-2" style={{ backgroundColor: '#FFF3E0', color: '#FF9800' }}>
            {storageInfo.totalHours}h 存储倒计时
          </span>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EEEEEE' }}>
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${countdownProgress}%`,
                background: 'linear-gradient(90deg, #A8C5B8, #FF9800)',
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5" style={{ color: '#FF9800' }}>
            <span>剩余 {storageInfo.remainingHours} 小时</span>
            <span>即将过期</span>
          </div>
        </>
      )} */}

      {/* 已过期重新开启按钮 */}
      {/* {isExpired && (
        <button
          onClick={() => onRestart(conversation.id)}
          className="w-full mt-3 py-2 rounded-xl text-[13px] text-center transition-colors"
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #BBBBBB',
            color: '#777',
          }}
        >
          <svg className="w-4 h-4 inline-block mr-1 align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重新开启对话
        </button>
      )} */}
    </div>
  );
}

/**
 * 底部导航组件
 */
function BottomNav() {
  const navItems = [
    { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: '意见反馈' },
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: '隐私政策' },
    { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '关于我们' },
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 flex justify-between px-5 py-4 z-50 backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderTop: '1px solid rgba(167, 139, 250, 0.1)',
      }}
    >
      {navItems.map((item) => (
        <a 
          key={item.label}
          href="#"
          className="flex flex-col items-center gap-1 text-xs"
          style={{ color: '#6B7280' }}
        >
          <svg className="w-5 h-5" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
          </svg>
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}

/**
 * 加载骨架屏组件
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 头部骨架 */}
      <div className="flex items-center mb-5">
        <div className="w-14 h-14 rounded-full bg-gray-200 mr-4" />
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
      
      {/* 卡片骨架 */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 mb-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ========== 主页面组件 ==========

/**
 * 未登录提示组件
 */
function NotLoggedIn({ onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* 图标 */}
      <div 
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.4), rgba(167, 139, 250, 0.3))',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.15)',
        }}
      >
        <svg className="w-10 h-10" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      
      {/* 提示文字 */}
      <h3 
        className="text-lg mb-2"
        style={{ 
          fontFamily: '"Noto Serif SC", serif',
          fontWeight: 'bold',
          color: '#1F2937',
        }}
      >
        尚未登录
      </h3>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
        登录后查看你的个人档案和对话记录
      </p>
      
      {/* 登录按钮 */}
      <button
        onClick={onLogin}
        className="px-8 py-3 rounded-full text-white text-[15px] transition-all hover:opacity-90"
        style={{
          backgroundColor: '#1F2937',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        立即登录
      </button>
      
      {/* 注册提示 */}
      <p className="mt-4 text-xs" style={{ color: '#9CA3AF' }}>
        还没有账号？
        <Link to="/register" className="ml-1" style={{ color: '#8B5CF6' }}>
          注册新账号
        </Link>
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, reports, userExtraInfo, isLoading, error, isLoggedIn, restartConversation, goToLogin } = useProfile();
  const { setHistoryReport } = useReport();

  // 处理重新开启对话
  const handleRestart = async (conversationId) => {
    try {
      await restartConversation(conversationId);
    } catch (err) {
      console.error('重新开启对话失败:', err);
    }
  };

  // 处理查看历史报告
  const handleViewReport = (report) => {
    if (report.content) {
      setHistoryReport(report.content);
      navigate('/report-result');
    }
  };

  // 处理退出登录
  const handleLogout = async () => {
    try {
      // 这里会把 localStorage 中所有数据清空，包括 pendingReport 数据
      Bmob.User.logout();
      
      // 刷新页面或跳转到首页
      navigate('/');
    } catch (err) {
      console.error('退出登录失败:', err);
    }
  };

  return (
    <div className="h-screen-safe w-full bg-white relative overflow-hidden flex flex-col">
      {/* 背景装饰光晕 */}
      <BackgroundGlow />

      {/* 顶部返回首页按钮 */}
      <div className="absolute top-5 right-5 z-11">
        <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>

      {/* 主内容区 - 可滚动 */}
      <div className="flex-1 overflow-y-auto relative z-10 px-5 pt-6 pb-24 max-w-md">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full text-white"
              style={{ backgroundColor: '#1F2937' }}
            >
              重新加载
            </button>
          </div>
        ) : !isLoggedIn ? (
          <NotLoggedIn onLogin={goToLogin} />
        ) : (
          <>
            {/* 用户头部 */}
            <UserHeader user={user} userExtraInfo={userExtraInfo} />

            {/* 退出登录按钮 */}
            <button
              onClick={handleLogout}
              className="w-full mb-6 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{
                color: '#6B7280',
                backgroundColor: 'rgba(243, 244, 246, 0.8)',
                border: '1px solid rgba(209, 213, 219, 0.5)',
              }}
            >
              退出登录
            </button>

            {/* 对话卡片列表 */}
            <div className="flex flex-col gap-4">
              {reports.map((report, index) => (
                <div key={report.id}>
                  <ReportCard 
                    report={report} 
                    onRestart={handleRestart}
                    onView={handleViewReport}
                  />
                  
                  {/* 在第二张卡片后显示裂变进度条 */}
                  {index === 1 && <FissionBar userExtraInfo={userExtraInfo}/>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 底部导航 */}
      <BottomNav />
    </div>
  );
}

