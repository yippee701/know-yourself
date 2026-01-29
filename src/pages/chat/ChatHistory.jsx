import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import { useDb } from '../../contexts/cloudbaseContext';
import { getMessages as getMessagesApi } from '../../api/report';

function BackgroundGlow() {
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
    </>
  );
}

export default function ChatHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const db = useDb();
  const reportId = searchParams.get('reportId');
  const messageListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportId || !db) {
      if (!reportId) navigate('/');
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMessagesApi(db, reportId)
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const list = data.map((item, index) => ({
          id: item._id ?? item.id ?? `msg-${index}`,
          role: item.role ?? 'user',
          content: item.content ?? '',
        }));
        setMessages(list);
      })
      .catch((err) => {
        if (!cancelled) console.error('获取历史对话失败:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [db, reportId, navigate]);

  if (!reportId) return null;

  return (
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden max-w-md mx-auto relative">
      <BackgroundGlow />

      <header
        className="flex items-center justify-between px-4 py-1 relative z-10"
        style={{ borderBottom: '1px solid rgba(243, 244, 246, 1)' }}
      >
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-gray-900 font-medium">完整对话过程</h1>
        <div className="w-10 h-10" />
      </header>

      <div className="flex-1 px-5 relative z-10 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">加载对话中...</div>
          ) : (
            <MessageList
              ref={messageListRef}
              messages={messages}
              keyboardHeight={0}
              recommendedAnswers={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
