import { useState, useCallback } from 'react';
import { useToast } from '../../components/Toast';

/**
 * 分享弹窗组件
 */
export default function ShareDialog({ isOpen, onClose, shareUrl }) {
  const { message } = useToast();
  const [copied, setCopied] = useState(false);

  // 复制链接
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      message.error('复制失败，请手动复制');
    }
  }, [shareUrl, message]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 mx-4 max-w-md w-full"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4">
          <h3 
            className="text-lg font-semibold"
            style={{ color: '#1F2937' }}
          >
            分享报告
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* URL 显示区域 */}
        <div 
          className="mb-4 p-3 rounded-xl"
          style={{
            backgroundColor: '#F3F4F6',
            border: '1px solid rgba(167, 139, 250, 0.2)',
          }}
        >
          <p 
            className="text-sm break-all"
            style={{ color: '#6B7280' }}
          >
            {shareUrl}
          </p>
        </div>

        {/* 复制按钮 */}
        <button
          onClick={handleCopy}
          className="w-full h-12 rounded-full text-base font-medium transition-all active:scale-[0.98]"
          style={{
            backgroundColor: copied ? '#10B981' : '#1F2937',
            color: '#FFFFFF',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          {copied ? '✓ 已复制' : '一键复制'}
        </button>
      </div>
    </div>
  );
}
