import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Bmob from "hydrogen-js-sdk"
import Homepage from './pages/Homepage'
import Chat from './pages/chat/Chat'
import ProfilePage from './pages/settings/profile/profile'
import LoginPage from './pages/settings/user/login'
import RegisterPage from './pages/settings/user/register'
import ReportLoading from './pages/report/ReportLoading'
import ReportResult from './pages/report/Result'
import { ToastProvider } from './components/Toast'
import { ReportProvider } from './contexts/ReportContext'
import './index.css'

function App() {
  const appSecret = import.meta.env.VITE_BMOB_APP_SECRET;
  const apiSecCode = import.meta.env.VITE_BMOB_API_SEC_CODE;
  Bmob.initialize(appSecret, apiSecCode);

  // let data = {"model":"gpt-3.5-turbo","messages":[{"content":"你好","role":"user"},{"content":"你好，有什么我可以为你提供的帮助吗？","role":"assistant"},{"content":"请问Bmob是什么产品","role":"user"}]}
  // const ChatAI = Bmob.ChatAI();
  
  // setTimeout(() => {
  //   ChatAI.send(JSON.stringify(data))  
  //   let msg = ''
  //   ChatAI.onMessage((res)=>{
  //     if(res=="done"){
  //       console.log(msg);
  //     }else{
  //       msg = msg+res
  //     }
  //   })
  // }, 3000);

  return (
    <ReportProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/report-loading" element={<ReportLoading />} />
            <Route path="/report-result" element={<ReportResult />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ReportProvider>
  )
}

export default App
