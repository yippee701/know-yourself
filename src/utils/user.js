
/**
 * 从 localStorage 获取当前用户名
 */
export function getCurrentUsername() {
  try {
    const bmobData = localStorage.getItem('bmob');
    if (!bmobData) return null;
    const parsed = JSON.parse(bmobData);
    return parsed.username || null;
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
    const bmobData = localStorage.getItem('bmob');
    if (!bmobData) return false;
    
    const parsed = JSON.parse(bmobData);
    return parsed.sessionToken ? true : false;
  } catch {
    return false;
  }
}