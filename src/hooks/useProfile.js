import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, getUserExtraInfo, restartConversation } from '../api/profile';
import { isLoggedIn} from '../utils/user';

/**
 * Profile 页面数据 Hook - 管理用户资料、对话历史和裂变进度
 */
export function useProfile() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [userExtraInfo, setUserExtraInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isUserLoggedIn = isLoggedIn();

  // 加载页面数据（对话历史和裂变进度）
  const loadData = async () => {
    console.log(isLoading);
    setError(null);
    
    try {
      if (!isUserLoggedIn) {
        setReports([]);
        setUserExtraInfo({});
        return;
      }
      
      // 获取对话历史和裂变进度
      const [convData, userExtraInfo] = await Promise.all([
        getReports(),
        getUserExtraInfo(),
      ]);
      
      setReports(convData);
      setUserExtraInfo(userExtraInfo);
    } catch (err) {
      console.error('加载 Profile 数据失败:', err);
      setError(err.message || '加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfoFromLocal = () => {
    const bmobData = localStorage.getItem('bmob');
    if (!bmobData) return null;
    const parsed = JSON.parse(bmobData);
    return parsed || null;
  }

  // 初始加载
  useEffect(() => {
    loadData();
  }, []);

  // 重新开启对话
  const handleRestartConversation = useCallback(async (conversationId) => {
    try {
      const result = await restartConversation(conversationId);
      if (result.success) {
        // 刷新对话列表
        await loadData();
        return result.newConversationId;
      }
    } catch (err) {
      console.error('重新开启对话失败:', err);
      throw err;
    }
  }, [loadData]);

  // 跳转到登录页
  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return {
    reports,
    userExtraInfo,
    user: getUserInfoFromLocal(),
    isLoading: isLoading,
    error,
    restartConversation: handleRestartConversation,
    isLoggedIn: isUserLoggedIn,
    goToLogin,
  };
}

