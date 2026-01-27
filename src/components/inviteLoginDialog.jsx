import { Link } from 'react-router-dom';

/**
 * 邀请登录对话框
 */
export default function InviteLoginDialog({ isOpen, onClose, returnUrl }) {
  if (!isOpen) return null;

  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
  const registerUrl = returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* 图标 */}
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            登录后查看报告
          </h3>
          
          {/* 描述 */}
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            登录后可以保存报告到个人主页，随时查看
          </p>
          
          {/* 按钮 */}
          <div className="flex flex-col gap-3">
            <Link
              to={loginUrl}
              className="w-full py-3 rounded-xl text-white bg-gray-900 font-medium transition-colors hover:bg-black text-center"
              onClick={onClose}
            >
              登录
            </Link>
            <Link
              to={registerUrl}
              className="w-full py-3 rounded-xl text-gray-600 bg-gray-100 font-medium transition-colors hover:bg-gray-200 text-center"
              onClick={onClose}
            >
              注册
            </Link>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-gray-500 font-medium transition-colors hover:text-gray-700"
            >
              稍后再说
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
