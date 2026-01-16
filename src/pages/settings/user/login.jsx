import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Bmob from 'hydrogen-js-sdk';

const COUNTDOWN_SECONDS = 60;

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

function Logo({ title = '天赋发现', subtitle = '发现你的内在潜能' }) {
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
      <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: '"Noto Serif SC", serif', color: '#1F2937' }}>{title}</h1>
      <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{subtitle}</p>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, disabled, maxLength, prefix }) {
  return (
    <div className="mb-4">
      <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>{label}</label>
      <div 
        className="flex items-center px-4 py-3 rounded-xl transition-all"
        style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)', border: '1px solid rgba(167, 139, 250, 0.2)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}
      >
        {prefix && (
          <>
            <span className="text-gray-400 mr-2">{prefix}</span>
            <div className="w-px h-5 bg-gray-200 mr-3" />
          </>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="flex-1 outline-none bg-transparent text-base"
          style={{ fontFamily: '"Noto Sans SC", sans-serif', color: '#1F2937' }}
        />
      </div>
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

function Agreement() {
  return (
    <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: '#9CA3AF' }}>
      登录即表示同意
      <a href="#" className="mx-1" style={{ color: '#8B5CF6' }}>《用户协议》</a>和
      <a href="#" className="mx-1" style={{ color: '#8B5CF6' }}>《隐私政策》</a>
    </p>
  );
}

// ========== 登录页面组件 ==========

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  // 登录方式：'phone' | 'password'
  const [loginMethod, setLoginMethod] = useState('password');
  
  // 表单状态
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 验证
  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);
  const canSendCode = isValidPhone && countdown === 0;
  const canSubmitPhone = isValidPhone && code.length === 6;
  const canSubmitPassword = username.length >= 3 && password.length >= 6;

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const handleSendCode = useCallback(async () => {
    if (!canSendCode) return;
    setError('');
    try {
      await Bmob.requestSmsCode({ mobilePhoneNumber: phone });
      setCountdown(COUNTDOWN_SECONDS);
    } catch (err) {
      setError('验证码发送失败，请稍后重试');
      console.error('发送验证码失败:', err);
    }
  }, [canSendCode, phone]);

  // 处理登录成功
  const handleLoginSuccess = (res) => {
    // 如果有返回地址，则跳转到返回地址，否则跳转到首页
    navigate(returnUrl || '/');
  };

  // 手机号登录
  const handlePhoneLogin = useCallback(async () => {
    if (!canSubmitPhone || loading) return;
    setError('');
    setLoading(true);
    
    try {
      const res = await Bmob.User.signOrLoginByMobilePhone(Number(phone), Number(code));
      if (res.code && res.error) {
        throw { code: res.code, message: res.error };
      }
      handleLoginSuccess(res);
    } catch (err) {
      console.error('登录错误:', err);
      const errorCode = err.code || err.status;
      
      if (errorCode === 101) {
        setError('该手机号未注册，请先注册');
      } else {
        setError(err.message || err.error || '登录失败，请检查验证码');
      }
    } finally {
      setLoading(false);
    }
  }, [canSubmitPhone, loading, phone, code, navigate]);

  // 用户名密码登录
  const handlePasswordLogin = useCallback(async () => {
    if (!canSubmitPassword || loading) return;
    setError('');
    setLoading(true);
    
    try {
      const res = await Bmob.User.login(username, password);
      if (res.code && res.error) {
        throw { code: res.code, message: res.error };
      }
      handleLoginSuccess(res);
    } catch (err) {
      console.error('登录错误:', err);
      setError(err.message || err.error || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  }, [canSubmitPassword, loading, username, password, navigate]);

  return (
    <div className="h-screen-safe w-full bg-white relative overflow-hidden flex flex-col">
      <BackgroundDecoration />
      
      {/* 顶部返回 */}
      <header className="relative z-10 h-14 flex items-center px-4">
        <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>
      
      {/* 主内容 */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-10">
        <Logo title="登录" subtitle="欢迎回来" />
        
        <div className="w-full max-w-sm mx-auto">
          {/* 登录方式切换 */}
          <div className="flex mb-6 p-1 rounded-full" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)' }}>
            <button
              onClick={() => { setLoginMethod('password'); setError(''); }}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: loginMethod === 'password' ? '#FFFFFF' : 'transparent',
                color: loginMethod === 'password' ? '#1F2937' : '#6B7280',
                boxShadow: loginMethod === 'password' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              密码登录
            </button>
            <button
              onClick={() => { setLoginMethod('phone'); setError(''); }}
              className="flex-1 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: loginMethod === 'phone' ? '#FFFFFF' : 'transparent',
                color: loginMethod === 'phone' ? '#1F2937' : '#6B7280',
                boxShadow: loginMethod === 'phone' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              短信登录
            </button>
          </div>

          <ErrorMessage message={error} />

          {loginMethod === 'password' ? (
            <>
              <InputField
                label="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                disabled={loading}
              />
              
              <InputField
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={loading}
              />
              
              <SubmitButton onClick={handlePasswordLogin} loading={loading} disabled={!canSubmitPassword} text="登录" />
            </>
          ) : (
            <>
              <InputField
                label="手机号"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                disabled={loading}
                prefix="+86"
              />
              
              <div className="mb-6">
                <label className="block text-sm mb-2" style={{ color: '#4B5563' }}>验证码</label>
                <div className="flex items-center px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入验证码"
                    disabled={loading}
                    maxLength={6}
                    className="flex-1 outline-none bg-transparent text-base tracking-widest"
                    style={{ fontFamily: '"Noto Sans SC", sans-serif', color: '#1F2937' }}
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={!canSendCode || countdown > 0}
                    className="text-sm px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                    style={{
                      backgroundColor: canSendCode && countdown === 0 ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                      color: canSendCode && countdown === 0 ? '#8B5CF6' : '#9CA3AF',
                    }}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
              
              <SubmitButton onClick={handlePhoneLogin} loading={loading} disabled={!canSubmitPhone} text="登录" />
            </>
          )}

          {/* 注册链接 */}
          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            还没有账号？
            <Link 
              to={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'} 
              className="ml-1 font-medium" 
              style={{ color: '#8B5CF6' }}
            >
              立即注册
            </Link>
          </p>
          
          <Agreement />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.3), transparent)' }} />
    </div>
  );
}
