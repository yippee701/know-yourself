import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Chat from './pages/Chat'
import ProfilePage from './pages/settings/profile'
import ReportLoading from './pages/report/ReportLoading'
import ReportResult from './pages/report/Result'
import { ToastProvider } from './components/Toast'
import { ReportProvider } from './contexts/ReportContext'
import './index.css'

function App() {
  return (
    <ReportProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/chat-to-know-yourself" element={<Chat />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report-loading" element={<ReportLoading />} />
            <Route path="/report-result" element={<ReportResult />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ReportProvider>
  )
}

export default App
