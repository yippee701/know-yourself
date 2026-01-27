/**
 * Chat API - 支持两种调用方式
 * 1. proxy - 通过 Python 后端代理（推荐，不暴露 API KEY）
 * 2. direct - 直接调用大模型 API（需要在前端配置 API KEY）
 */

// Mock 数据导入 - 删除 mock 功能时，删除此行和 mockData.js 文件
import { mockSendMessage } from './mockData';
import { CREDENTIALS_LOCAL_STORAGE_KEY } from '../constants/global';

// 聊天模式
export const CHAT_MODES = {
  DISCOVER_SELF: 'discover-self',
  UNDERSTAND_OTHERS: 'understand-others',
};

// ========== 配置 ==========

/**
 * API 模式：
 * - 'proxy': 通过 Python 后端代理（默认，推荐）
 * - 'direct': 直接调用大模型 API
 */
const API_MODE = import.meta.env.VITE_API_MODE || 'direct';

// Mock 模式：当显式设置 VITE_MOCK_MODE=true 时启用
export const IS_MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';

// 代理模式配置
const PROXY_CONFIG = {
  serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:80',
};

// 直连模式配置
const DIRECT_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.openai.com/v1',
  apiKey: import.meta.env.VITE_API_KEY || '',
  model: import.meta.env.VITE_MODEL,
  maxTokens: parseInt(import.meta.env.VITE_MAX_TOKENS),
};

// ========== 工具函数 ==========

/**
 * 打字机效果 - 逐字显示文本
 */
export function typewriterEffect(text, onUpdate, speed = 30) {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      onUpdate(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        resolve(text);
      }
    }, speed);
  });
}

async function sendMessageViaProxy(messages, onStream = null, mode) {
  const credentials = localStorage.getItem(CREDENTIALS_LOCAL_STORAGE_KEY);
  const credentialsObj = JSON.parse(credentials);
  const token = credentialsObj.access_token;
  const response = await fetch(`https://inner-book-server-220939-8-1251129499.sh.run.tcloudbase.com/v1/cloudrun/inner-book-server/chat`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      mode,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: !!onStream,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API 请求失败: ${response.status}`);
  }

  // 流式输出 - 使用云函数专用的处理函数
  if (onStream) {
    return handleStreamResponse(response, onStream);
  }

  // 非流式输出
  const data = await response.json();
  return data.content || '抱歉，我暂时无法回应。';
}

// ========== 流式响应处理 ==========

/**
 * 处理 SSE 流式响应
 */
async function handleStreamResponse(response, onStream) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;
      
      const data = trimmedLine.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onStream(fullContent);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }

  // 处理缓冲区剩余数据
  if (buffer.trim()) {
    const trimmedLine = buffer.trim();
    if (trimmedLine.startsWith('data:')) {
      const data = trimmedLine.slice(5).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            onStream(fullContent);
          }
        } catch {
          // 忽略
        }
      }
    }
  }

  return fullContent;
}

// ========== 主入口函数 ==========

/**
 * 发送消息（自动选择模式）
 * @param {Array} messages - 对话历史 [{role: 'user'|'assistant', content: string}]
 * @param {Function} onStream - 流式输出回调（可选）
 * @param {string} mode - 聊天模式：'discover-self' | 'understand-others'
 * @returns {Promise<string>} AI 回复内容
 */
export async function sendMessage(messages, onStream = null, mode = CHAT_MODES.DISCOVER_SELF) {
  // Mock 模式
  if (IS_MOCK_MODE) {
    console.log(`[Mock Mode] 使用模拟数据 (${mode})，未调用真实 API`);
    return mockSendMessage(messages, onStream, mode);
  }

  try {
    console.log(`[Proxy Mode] 通过后端代理调用 (${mode})`);
    return await sendMessageViaProxy(messages, onStream, mode);
  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}

/**
 * 发送消息并使用打字机效果显示（备用方案）
 * @param {Array} messages - 对话历史
 * @param {Function} onUpdate - 更新回调
 * @param {number} typingSpeed - 打字速度
 * @param {string} mode - 聊天模式
 */
export async function sendMessageWithTypewriter(messages, onUpdate, typingSpeed = 25, mode = CHAT_MODES.DISCOVER_SELF) {
  // Mock 模式
  if (IS_MOCK_MODE) {
    console.log(`[Mock Mode] 使用模拟数据 (${mode})，未调用真实 API`);
    return mockSendMessage(messages, onUpdate, mode);
  }

  try {
    let content;

    const response = await fetch(`${PROXY_CONFIG.serverUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    content = data.content || '抱歉，我暂时无法回应。';
    
    // 使用打字机效果逐字显示
    await typewriterEffect(content, onUpdate, typingSpeed);
    
    return content;
  } catch (error) {
    console.error('API 调用失败:', error);
    throw error;
  }
}