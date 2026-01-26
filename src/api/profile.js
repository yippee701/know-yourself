/**
 * Profile API - 用户资料和报告历史相关接口
 */

import { getCurrentUsername } from '../utils/user';

// 是否使用 Mock 数据
const IS_MOCK_MODE = true;

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:80';

// 缓存配置
const CACHE_DURATION = 30 * 1000; // 30秒
const cache = new Map();

/**
 * 获取缓存键
 */
function getCacheKey(rdb, table, params) {
  return `${table}_${JSON.stringify(params)}`;
}

/**
 * 检查缓存是否有效
 */
function getCachedData(cacheKey) {
  const cached = cache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    cache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

/**
 * 设置缓存
 */
function setCachedData(cacheKey, data) {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

// ========== Mock 数据 ==========

/**
 * Mock 裂变进度数据
 */
const MOCK_FISSION_DATA = {
  currentInvites: 0,
  targetInvites: 2,
  rewardName: '职业规划对话',
};

/**
 * Mock 对话历史数据
 */
const MOCK_CONVERSATIONS = [
  {
    id: 'conv_001',
    title: '探索我的职业价值观',
    createdAt: '2025-05-18 10:15',
    status: 'generating', // generating | completed | expired
    storageType: null, // permanent | countdown | validUntil | null
    storageInfo: null,
  },
];

// ========== Mock API 实现 ==========

/**
 * Mock: 重新开启对话
 */
async function mockRestartConversation(_conversationId) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, newConversationId: `conv_new_${Date.now()}` };
}

/**
 * 真实 API: 重新开启对话
 */
async function fetchRestartConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/restart`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('重新开启对话失败');
  return response.json();
}


// ========== 导出的 API 函数 ==========

export async function getUserExtraInfo(rdb) {
  const username = getCurrentUsername();
  if (!username) {
    return {};
  }
  
  if (!rdb) {
    console.warn('rdb 未初始化，无法获取用户信息');
    return {};
  }
  
  // 检查缓存
  const cacheKey = getCacheKey(rdb, 'user_extra_info', { username });
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    console.log('[getUserExtraInfo] 使用缓存数据');
    return cached;
  }
  
  try {
    const { data, error } = await rdb
      .from("user_info")
      .select('level, remainingReport, currentInvites')
      .eq('username', username);

    if (error) {
      console.error('获取用户信息失败:', error);
      return {};
    }

    const result = data[0] || {};
    
    // 设置缓存
    setCachedData(cacheKey, result);
    
    return result;
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return {};
  }
}

/**
 * 重新开启对话
 */
export async function restartConversation(conversationId) {
  if (IS_MOCK_MODE) {
    return mockRestartConversation(conversationId);
  }
  return fetchRestartConversation(conversationId);
}

export async function getReports(rdb) {
  const username = getCurrentUsername();
  if (!username) {
    return [];
  }
  
  if (!rdb) {
    console.warn('rdb 未初始化，无法获取报告列表');
    return [];
  }
  
  // 检查缓存
  const cacheKey = getCacheKey(rdb, 'reports', { username });
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    console.log('[getReports] 使用缓存数据');
    return cached;
  }
  
  try {
    const { data, error } = await rdb
      .from("report")
      .select('title, createdAt, status, reportId')
      .eq('username', username);
    
    if (error) {
      console.error('获取对话历史失败:', error);
      return [];
    }

    const result = data || [];
    
    // 设置缓存
    setCachedData(cacheKey, result);
    
    return result;
  } catch (err) {
    console.error('获取报告列表失败:', err);
    return [];
  }
}
