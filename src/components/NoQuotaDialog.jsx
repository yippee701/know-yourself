import { Link } from 'react-router-dom';

/**
 * 对话次数不足弹窗
 */
export default function NoQuotaDialog({ isOpen, onClose }) {
  if (!isOpen) return null;
  
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            免费对话次数已用完
          </h3>
          
          {/* 描述 */}
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            可以到个人主页解锁更多免费对话次数
          </p>
          
          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-gray-600 bg-gray-100 font-medium transition-colors hover:bg-gray-200"
            >
              取消
            </button>
            <Link
              to="/profile"
              className="flex-1 py-3 rounded-xl text-white bg-gray-900 font-medium transition-colors hover:bg-black text-center"
              onClick={onClose}
            >
              去解锁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
