/**
 * Profile API - 用户资料和对话历史相关接口
 */

import Bmob from 'hydrogen-js-sdk';
import { getCurrentUsername } from '../utils/user';

// 是否使用 Mock 数据
const IS_MOCK_MODE = true;

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:80';

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
async function mockRestartConversation(conversationId) {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, newConversationId: `conv_new_${Date.now()}` };
}


/**
 * 真实 API: 获取对话历史列表（从 Bmob Report 表查询）
 */
async function fetchReports() {
  const username = getCurrentUsername();
  if (!username) {
    return [];
  }

  try {
    const query = Bmob.Query('Report');
    query.equalTo('username', '==', username);
    query.order('-createdAt'); // 按创建时间倒序
    
    const res = await query.find();
    
    if (res && res.length > 0) {
      // 转换为对话列表格式
      return res.map(report => ({
        id: report.objectId,
        title: report.title || '未命名报告',
        createdAt: report.createdAt,
        status: report.status || 'completed',
        storageType: report.storageType || null,
        storageInfo: report.storageInfo || null,
        content: report.content,
      }));
    }
    
    return [];
  } catch (err) {
    console.error('获取对话历史失败:', err);
    return [];
  }
}

async function fetchUserExtraInfo() {
  const username = getCurrentUsername();
  if (!username) {
    return {};
  }

  try {
    const query = Bmob.Query('_User');
    query.equalTo('username', '==', username);
    const res = await query.find();
    if (res && res.length > 0) {
      return res[0];
    }
    
    return {};
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return {};
  }
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

export async function getUserExtraInfo() {
  return fetchUserExtraInfo();
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

export async function getReports() {
  return fetchReports();
}
