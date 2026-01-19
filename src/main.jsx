import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 检查 URL 参数，如果 debug=true 则加载 vconsole
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
  // 动态加载 vconsole
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/vconsole@latest/dist/vconsole.min.js';
  script.onload = () => {
    if (window.VConsole) {
      new window.VConsole();
      console.log('VConsole 已加载 (debug=true)');
    }
  };
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
