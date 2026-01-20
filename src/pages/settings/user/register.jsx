import { useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Bmob from 'hydrogen-js-sdk';

// ========== 通用组件 ==========

function BackgroundDecoration() {
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
      <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full animate-float" style={{ backgroundColor: 'rgba(167, 139, 250, 0.4)' }} />
      <div className="absolute top-[35%] right-[20%] w-1.5 h-1.5 rounded-full animate-float-delay" style={{ backgroundColor: 'rgba(139, 168, 255, 0.4)' }} />
      <div className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full animate-float-delay-2" style={{ backgroundColor: 'rgba(167, 139, 250, 0.3)' }} />
    </>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center mb-10">
      <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
        <div 
          className="absolute w-20 h-20 rounded-full animate-breathe" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(139, 168, 255, 0.3))', 
            border: '1px solid rgba(167, 139, 250, 0.4)' 
          }} 
        />
        <div 
          className="absolute w-14 h-14 rounded-full backdrop-blur-sm" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.6), rgba(167, 139, 250, 0.5))', 
            border: '1px solid rgba(255, 255, 255, 0.6)' 
          }} 
        />
        <svg className="relative z-10 w-7 h-7" style={{ color: '#FFFFFF' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: '"Noto Serif SC", serif', color: '#1F2937' }}>注册账号</h1>
      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>开启你的探索之旅</p>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, disabled, hint }) {
  return (
    <div className="mb-4">
      <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>{label}</label>
      <div 
        className="flex items-center px-4 py-3 rounded-xl transition-all"
        style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)', border: '1px solid rgba(167, 139, 250, 0.2)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 outline-none bg-transparent text-base"
          style={{ fontFamily: '"Noto Sans SC", sans-serif', color: '#1F2937' }}
        />
      </div>
      {hint && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{hint}</p>}
    </div>
  );
}

function SubmitButton({ onClick, loading, disabled, text = '确认' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-full text-white text-lg font-medium transition-all active:scale-[0.98] disabled:opacity-60"
      style={{ backgroundColor: '#1F2937', boxShadow: disabled ? 'none' : '0 8px 20px rgba(0, 0, 0, 0.15)' }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          处理中...
        </span>
      ) : text}
    </button>
  );
}

function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
      {message}
    </div>
  );
}

function SuccessMessage({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#8B5CF6' }}>
      {message}
    </div>
  );
}

function Agreement() {
  return (
    <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: '#9CA3AF' }}>
      注册即表示同意
      <a href="#" className="mx-1" style={{ color: '#8B5CF6' }}>《用户协议》</a>和
      <a href="#" className="mx-1" style={{ color: '#8B5CF6' }}>《隐私政策》</a>
    </p>
  );
}

// ========== 注册页面组件 ==========

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 验证
  const isValidUsername = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
  const isValidPassword = password.length >= 6;
  const isPasswordMatch = password === confirmPassword;
  const isValidPhone = phone === '' || /^1[3-9]\d{9}$/.test(phone);
  
  const canSubmit = isValidUsername && isValidPassword && isPasswordMatch && isValidPhone;

  // 注册
  const handleRegister = useCallback(async () => {
    if (!canSubmit || loading) return;
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const params = {
        username,
        password,
        email: `${username}@temp.com`,
        currentInvites: 0,
        remainingReport: 2,
        level: 0,
      };
      
      // 如果填写了手机号，添加到注册参数
      if (phone) {
        params.phone = phone;
      }
      
      console.log('注册参数:', params);
      
      const res = await Bmob.User.register(params);
      
      if (res.code && res.error) {
        throw { code: res.code, message: res.error };
      }
      
      console.log('注册成功:', res);
      setSuccess('注册成功！正在跳转...');
      
      // 延迟跳转
      setTimeout(() => {
        // 如果有返回地址，跳转到登录页并带上返回地址
        if (returnUrl) {
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        } else {
        navigate('/login');
        }
      }, 1500);
      
    } catch (err) {
      console.error('注册错误:', err);
      const errorCode = err.code || err.status;
      
      setError(err.message || err.error || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, loading, username, password, phone, navigate]);

  return (
    <div className="h-screen-safe w-full bg-white relative flex flex-col">
      <BackgroundDecoration />
      
      {/* 顶部返回 */}
      <header className="flex-shrink-0 relative z-10 h-14 flex items-center px-4">
        <Link 
          to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} 
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>
      
      {/* 主内容 - 可滚动 */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col justify-center px-8 pb-10">
        <Logo />
        
        <div className="w-full max-w-sm mx-auto">
          <ErrorMessage message={error} />
          <SuccessMessage message={success} />

          <InputField
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
            placeholder="请输入用户名"
            disabled={loading}
            hint="3-20位字母、数字或下划线"
          />
          
          <InputField
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            disabled={loading}
            hint="至少6位字符"
          />
          
          <InputField
            label="确认密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
            disabled={loading}
          />
          
          <InputField
            label="手机号（选填）"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="可用于短信登录"
            disabled={loading}
          />
          
          {/* 验证提示 */}
          {confirmPassword && !isPasswordMatch && (
            <p className="text-xs mb-4" style={{ color: '#EF4444' }}>两次输入的密码不一致</p>
          )}
          
          <SubmitButton onClick={handleRegister} loading={loading} disabled={!canSubmit} text="注册" />

          {/* 登录链接 */}
          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            已有账号？
            <Link 
              to={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'} 
              className="ml-1 font-medium" 
              style={{ color: '#8B5CF6' }}
            >
              立即登录
            </Link>
          </p>
          
          <Agreement />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), transparent)' }} />
    </div>
  );
}
