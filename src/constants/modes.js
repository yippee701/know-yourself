/**
 * 对话模式枚举
 */
export const CHAT_MODES = {
  DISCOVER_SELF: 'discover-self',
  UNDERSTAND_OTHERS: 'understand-others',
  // 后续可继续添加更多模式
  // CAREER_PLANNING: 'career-planning',
  // RELATIONSHIP: 'relationship',
};

/**
 * 模式配置信息
 */
export const MODE_CONFIG = {
  [CHAT_MODES.DISCOVER_SELF]: {
    label: '发掘自己',
    description: '深入了解自己的内心世界',
  },
  [CHAT_MODES.UNDERSTAND_OTHERS]: {
    label: '了解他人',
    description: '更好地理解他人的想法',
  },
};

/**
 * 获取模式标签
 * @param {string} mode - 模式值
 * @returns {string} 模式标签
 */
export function getModeLabel(mode) {
  return MODE_CONFIG[mode]?.label || '未知模式';
}

/**
 * 获取默认模式
 * @returns {string} 默认模式
 */
export function getDefaultMode() {
  return CHAT_MODES.DISCOVER_SELF;
}

/**
 * 检查模式是否有效
 * @param {string} mode - 模式值
 * @returns {boolean} 是否有效
 */
export function isValidMode(mode) {
  return Object.values(CHAT_MODES).includes(mode);
}

/**
 * 从 URL 参数中获取模式
 * @param {URLSearchParams} searchParams - URL 搜索参数对象
 * @returns {string} 对话模式
 */
export function getModeFromSearchParams(searchParams) {
  const modeParam = searchParams.get('mode');
  return modeParam === CHAT_MODES.UNDERSTAND_OTHERS 
    ? CHAT_MODES.UNDERSTAND_OTHERS 
    : CHAT_MODES.DISCOVER_SELF;
}
