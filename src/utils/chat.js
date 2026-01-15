import { getModeLabel } from '../constants/modes';

/**
 * 生成报告标题
 * @param {string} mode - 模式
 * @returns {string} 标题
 */
export function generateReportTitle(mode) {
  const modeLabel = getModeLabel(mode);
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return `${modeLabel}-${timeStr}`;
}