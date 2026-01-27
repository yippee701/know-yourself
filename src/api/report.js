/**
 * Report API - 报告相关接口
 */

import { REPORT_STATUS } from '../constants/reportStatus';

/**
 * 验证邀请码
 */
export async function verifyInviteCode(cloudbaseApp , inviteCode, reportId) {
  if (!cloudbaseApp) {
    throw new Error('cloudbaseApp 未初始化');
  }
  const result = await cloudbaseApp.callFunction({
    name: 'invite-code',
    data: {
      action: 'consume',
      reportId: reportId,
      inviteCode: inviteCode,
    },
  });

  return result;
}

// 缓存配置
const CACHE_DURATION = 5 * 1000; // 5s
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

/**
 * 获取报告详情
 * @param {boolean} skipCache - 是否跳过缓存（用于解锁后重新加载）
 */
export async function getReportDetail(rdb, reportId, skipCache = false) {
  if (!reportId) {
    console.warn('reportId 为空，无法获取报告内容');
    return null;
  }
  
  if (!rdb) {
    console.warn('rdb 未初始化，无法获取报告内容');
    return null;
  }
  
  // 检查缓存
  const cacheKey = getCacheKey(rdb, 'report_detail', { reportId });
  if (!skipCache) {
    const cached = getCachedData(cacheKey);
    if (cached !== null) {
      console.log('[getReportDetail] 使用缓存数据');
      return cached;
    }
  } else {
    // 跳过缓存时，清除旧缓存
    cache.delete(cacheKey);
  }
  
  try {
    const { data, error } = await rdb
      .from('report')
      .select('content, status, subTitle, username, lock, inviteCode')
      .eq('reportId', reportId);
    
    if (error) {
      console.error('获取报告内容失败:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('报告不存在:', reportId);
      return null;
    }
    
    const reportDetail = data[0];
    const result = {
      content: reportDetail.content || '',
      status: reportDetail.status,
      subTitle: reportDetail.subTitle || '',
      username: reportDetail.username,
      lock: reportDetail.lock !== undefined ? reportDetail.lock : 1, // 默认锁定
      inviteCode: reportDetail.inviteCode || '',
      isCompleted: reportDetail.status === REPORT_STATUS.COMPLETED,
      isLocked: reportDetail.lock !== undefined ? reportDetail.lock === 1 : true
    };
    
    // 设置缓存
    setCachedData(cacheKey, result);
    
    return result;
  } catch (err) {
    console.error('获取报告详情失败:', err);
    throw err;
  }
}
