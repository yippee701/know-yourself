import { useState, useEffect, useCallback } from 'react';
import Bmob from 'hydrogen-js-sdk';

/**
 * 用户信息 Hook - 获取当前登录用户信息
 */
export function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 获取 Bmob 存储的 session 信息
  const getBmobSession = useCallback(() => {
    try {
      const bmobData = localStorage.getItem('bmob');
      if (!bmobData) return null;
      
      const parsed = JSON.parse(bmobData);
      return parsed.sessionToken ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  // 从 Bmob 获取用户信息
  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 检查 bmob 存储中是否有 sessionToken
      const bmobSession = getBmobSession();
      
      if (!bmobSession || !bmobSession.sessionToken) {
        // 没有 sessionToken，视为未登录
        setIsLoggedIn(false);
        setUser(null);
        return null;
      }

      const res = await Bmob.User.users();
      
      if (res && res.results && res.results.length > 0) {
        // 通过 username 找到当前登录的用户
        const currentUser = res.results.find(u => u.username === bmobSession.username);
        
        if (currentUser) {
          // 转换为统一格式
          const userData = {
            username: currentUser.username || '用户',
            nickname: currentUser.username || '用户',
            avatar: currentUser.avatar || null,
            level: currentUser.level || '普通用户',
            remainingChats: currentUser.remainingChats || 10,
            phone: currentUser.phone,
            email: currentUser.email,
          };
          
          setUser(userData);
          setIsLoggedIn(true);
          return userData;
        }
      }
      
      // 未找到用户，视为未登录
      setIsLoggedIn(false);
      setUser(null);
      return null;
    } catch (err) {
      console.error('获取用户信息失败:', err);
      setIsLoggedIn(false);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getBmobSession]);

  // 初始加载
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 刷新用户信息
  const refresh = useCallback(() => {
    return fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isLoggedIn,
    refresh,
  };
}
