import { CLOUDBASE_ENV, USER_INFO_LOCAL_STORAGE_KEY } from '../constants/global';

/**
 * 从 localStorage 获取当前用户名
 */
export function getCurrentUsername() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.name || null;
  } catch {
    return null;
  }
}

/**
 * 从 localStorage 获取当前用户 reportId
 */
export function getCurrentUserId() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return null;
    const parsed = JSON.parse(localUserInfo);
    return parsed.content?.uid || null;
  } catch {
    return null;
  }
}

/**
 * 判断是否登录，先简单用是否有 token判断，后面要根据 token 是否过期判断
 * // TODO: 根据 token 是否过期判断
 * @returns boolean
 */
export function isLoggedIn() {
  try {
    const localUserInfo = localStorage.getItem(USER_INFO_LOCAL_STORAGE_KEY);
    if (!localUserInfo) return false;
    
    const parsed = JSON.parse(localUserInfo);
    return parsed.content ? (parsed.content.name === 'anonymous' ? false : true) : false;
  } catch {
    return false;
  }
}