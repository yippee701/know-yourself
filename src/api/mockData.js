/**
 * Mock 数据文件
 * 用于测试时模拟大模型回复，不消耗 API 额度
 * 
 * 删除此文件时，请同时修改 chat.js 中的相关导入和调用
 */

// Mock 回复数据 - 模拟天赋探索对话
const MOCK_RESPONSES = [
  `你好！很高兴能和你一起开启这段探索之旅。

在开始之前，我想先了解一下你——我们的第一个问题会带你回到16岁之前，那个还没被社会完全"规训"的你。

**请回忆一下：在你16岁之前，有哪些事情是没人逼你，你也会废寝忘食去做的？**

或者换一个角度——**有哪些从小到大被批评的"顽固缺点"**，比如爱插嘴、太敏感、爱发呆、太固执等？

这些"缺点"往往藏着天赋的种子，请诚实地告诉我。`,

  `谢谢你的分享，这很有价值。我能感受到你在描述这些时，眼睛里是有光的。

让我追问一下：**当你沉浸在那件事情中时，具体是什么感觉？是时间变快了？是忘记吃饭？还是一种"这就是我该做的事"的笃定？**

请具体描述一下当时的状态。`,

  `非常好的觉察！

现在让我们来到成年后的你。在工作或生活中，**有没有哪件事让你觉得"这还需要学吗？这不是显而易见的吗？"——但周围人却觉得很难？**

这个问题在寻找你的"无意识胜任区"——那些你觉得理所当然、但其实是你独特天赋的领域。`,

  `很有意思的例子！这说明你在某些方面有着别人不具备的敏锐度。

下一个问题：**有哪件事，做完后虽然身体累，但精神却极度亢奋、充满能量？**

这个问题在做"能量审计"——真正的天赋是让你回血的事，而不是你单纯擅长但做完很累的事。`,

  `我注意到你反复提到了一些关键词，这很重要。

最后一个问题可能有点冒犯，但它非常关键：**你曾经对谁（或哪种生活状态）产生过强烈的嫉妒或"酸溜溜"的感觉？**

嫉妒通常是"被压抑的天赋"在发出信号。请诚实面对，这对找到你的真正天赋很有帮助。`,

  `感谢你如此坦诚的分享。根据我们的对话，我已经捕捉到了一些重要的信号。

让我再深入一下：**在你描述的这些经历中，你觉得有什么共同的底层模式吗？**比如都涉及到"帮助他人"、"解决复杂问题"、"创造新事物"等？`,
];

// 最终报告模板（mock）
const MOCK_FINAL_REPORT = `[Report]# 个人天赋使用说明书

---

## 写在前面

亲爱的朋友，感谢你愿意花时间与我进行这场深度对话。在过去的几轮交流中，我见证了你对自我的真诚探索，也捕捉到了许多珍贵的信号。现在，请允许我为你呈现这份专属的《天赋说明书》。

## 一、你的核心天赋地图

### 主天赋：[洞察力 × 同理心]

通过我们的对话，我发现你身上有一种非常稀有的组合能力——**深度洞察**与**情感共鸣**的结合。这不是学来的技能，而是你的出厂设置。

### 辅助天赋

1. **模式识别力**：你能在看似混乱的信息中找到规律
2. **语言转化力**：你善于把复杂的东西用简单的话说清楚
3. **持久专注力**：一旦进入状态，你可以长时间保持高质量输出

## 二、天赋的使用场景

你的天赋最适合以下场景...

（这是一份 mock 示例报告，实际使用时会根据真实对话生成完整的万字报告）

---

*这是测试模式下的模拟输出。配置真实的 API_KEY 后将获得完整的 AI 分析。*`;

/**
 * 打字机效果 - 逐字显示文本（mock 专用）
 */
function typewriterEffect(text, onUpdate, speed = 30) {
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

/**
 * Mock 发送消息 - 模拟 AI 回复
 * @param {Array} messages - 对话历史
 * @param {Function} onStream - 流式输出回调
 * @returns {Promise<string>} 模拟的 AI 回复
 */
export async function mockSendMessage(messages, onStream = null) {
  // 根据对话轮数选择回复
  const userMessages = messages.filter(m => m.role === 'user');
  const roundIndex = userMessages.length;
  
  // 如果超过预设回复数量，返回最终报告
  const mockReply = roundIndex >= MOCK_RESPONSES.length 
    ? MOCK_FINAL_REPORT 
    : MOCK_RESPONSES[roundIndex] || MOCK_RESPONSES[0];

  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  if (onStream) {
    // 模拟流式输出（打字机效果）
    await typewriterEffect(mockReply, onStream, 15);
  }

  return mockReply;
}

