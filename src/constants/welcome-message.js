import { CHAT_MODES } from './modes';

// 挖掘自己 - 欢迎消息
export const DISCOVER_SELF_WELCOME_MESSAGE = `你好！我是 Dora。
很高兴看到你选择暂时放下外界，回过头来审视最真实的自己。
很多时候我们感到疲惫，是因为看不清潜意识里的“出厂设置”。
接下来的 10 轮对话，我会帮你从繁杂的情绪中精准提炼出你的核心性格底色。
对话结束时，你将获得一份独一无二的 Inner Book 报告——
它会帮你看清你从未觉察的优势与心理边界。
这不仅仅是一次对话，更是你重新掌控人生、停止内耗的开始。
`;

// 了解他人 - 欢迎消息
export const UNDERSTAND_OTHERS_WELCOME_MESSAGE = `你好！我是 Dora，很高兴能在这里遇见你。
在一段关系里，最昂贵的代价就是“我以为我懂他”。
接下来的 10 轮逻辑拆解，是为了帮你穿透对方的言语伪装，直达他的核心动机。
对话结束，我会为你生成一份关于他的 Inner Book 深度画像——
帮你预判他的行为逻辑，看清你们之间的博弈点，甚至掌握维系或止损的主动权。
别再凭直觉猜测了，让我们用理性的视角，看清那个人隐藏最深的灵魂底色。
`;

export function getWelcomeMessage(mode) {
  switch (mode) {
    case CHAT_MODES.UNDERSTAND_OTHERS:
      return UNDERSTAND_OTHERS_WELCOME_MESSAGE;
    case CHAT_MODES.DISCOVER_SELF:
      return DISCOVER_SELF_WELCOME_MESSAGE;
    default:
      return DISCOVER_SELF_WELCOME_MESSAGE;
  }
}