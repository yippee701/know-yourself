
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