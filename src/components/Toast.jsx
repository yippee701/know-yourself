import { useState, useCallback, useMemo, createContext, useContext } from 'react';

// Toast Context
const ToastContext = createContext(null);

// Toast 组件
function ToastItem({ message, type = 'info', onClose }) {
  const bgColors = {
    info: 'bg-gray-800/90',
    success: 'bg-green-600/90',
    warning: 'bg-amber-500/90',
    error: 'bg-red-500/90',
  };

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`${bgColors[type]} text-white px-6 py-3 min-w-[280px] max-w-[420px] rounded-xl shadow-lg flex items-center justify-center gap-3 animate-toast-in backdrop-blur-sm relative`}
      style={{
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* {icons[type]} */}
      <span className="text-sm font-medium w-full text-center">{message}</span>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Toast Container 组件
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast Provider 组件
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 便捷方法 - 使用 useMemo 创建对象，避免修改 useCallback 返回值
  const message = useMemo(() => {
    const msg = (text, duration) => addToast(text, 'info', duration);
    msg.info = (text, duration) => addToast(text, 'info', duration);
    msg.success = (text, duration) => addToast(text, 'success', duration);
    msg.warning = (text, duration) => addToast(text, 'warning', duration);
    msg.error = (text, duration) => addToast(text, 'error', duration);
    return msg;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ message, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// useToast Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;

