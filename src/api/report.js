/**
 * Report API - 报告相关接口
 */

import { REPORT_STATUS } from '../constants/reportStatus';

// 缓存配置
const CACHE_DURATION = 300 * 1000; // 5分钟
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
 */
export async function getReportDetail(rdb, reportId) {
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
  const cached = getCachedData(cacheKey);
  if (cached !== null) {
    console.log('[getReportDetail] 使用缓存数据');
    return cached;
  }
  
  try {
    const { data, error } = await rdb
      .from('report')
      .select('content, status, subTitle, username')
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
      isCompleted: reportDetail.status === REPORT_STATUS.COMPLETED
    };
    
    // 设置缓存
    setCachedData(cacheKey, result);
    
    return result;
  } catch (err) {
    console.error('获取报告详情失败:', err);
    throw err;
  }
}
