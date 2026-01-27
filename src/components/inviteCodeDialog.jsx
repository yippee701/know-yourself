import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 邀请码输入对话框
 */
export default function InviteCodeDialog({ isOpen, onClose, onSubmit, isLoading = false }) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('请输入邀请码');
      return;
    }

    try {
      await onSubmit(inviteCode.trim());
      setInviteCode('');
    } catch (err) {
      setError(err.message || '邀请码验证失败');
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
    navigate('/');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            输入邀请码
          </h3>
          
          {/* 描述 */}
          <p className="text-gray-500 text-sm mb-4 leading-relaxed">
            邀请码获取方式：小红书账号 INNER BOOK
          </p>
          
          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="mb-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setError('');
              }}
              placeholder="请输入邀请码"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-center text-lg tracking-wider"
              disabled={isLoading}
              autoFocus
            />
            
            {/* 错误提示 */}
            {error && (
              <p className="text-red-500 text-sm mt-2 text-left">{error}</p>
            )}
            
            {/* 按钮 */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl text-gray-600 bg-gray-100 font-medium transition-colors hover:bg-gray-200"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl text-white bg-gray-900 font-medium transition-colors hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? '验证中...' : '确认'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
