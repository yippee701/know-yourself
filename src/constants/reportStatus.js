/**
 * 报告状态枚举
 */
export const REPORT_STATUS = {
  COMPLETED: 1,
  PENDING: 2, // 对话中
  GENERATING: 3, // 生成中
  FAILED: 4,
  EXPIRED: 5, // 已过期
};