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

/**
 * 从报告内容中提取 h1 标题作为 subTitle
 * @param {string} content - 报告内容（Markdown 格式）
 * @returns {string} 提取的 h1 标题，如果没有则返回空字符串
 */
// TODO: 匹配到了就不要一直匹配了
export function extractReportSubTitle(content) {
  if (!content) return '';
  
  // 匹配 Markdown h1 标题：# 开头的行
  const h1Match = content.replace(/^\[Report\]\s*/i, '').match(/^#\s+(.+)$/m);
  if (h1Match) {
    // 移除可能的 markdown 格式符号
    return h1Match[1].replace(/[*_`]/g, '').trim();
  }
  
  return '';
}

/**
 * 清理报告内容，移除 [Report] 前缀 和 h1 标题
 * @param {string} content - 报告内容（Markdown 格式）
 * @returns {string} 清理后的报告内容
 */
export function cleanReportContent(content) {
  return content.replace(/^\[Report\]\s*/i, '').replace(/^#\s+.+\n?/m, '').trim();
}
/**
 * 本地生成报告唯一 id
 * @returns {string} 报告 id
 */
export function generateReportId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}