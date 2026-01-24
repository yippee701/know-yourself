import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getCurrentUsername, getCurrentUserObjectId, isLoggedIn } from '../utils/user';
import { generateReportTitle, extractReportSubTitle } from '../utils/chat';
import { useRdb } from './cloudbaseContext';
import { REPORT_STATUS } from '../constants/reportStatus';

const ReportContext = createContext(null);

// localStorage key
const LOCAL_REPORTS_KEY = 'pendingReports';

/*
1. 开始对话
   └─ createReport() → 保存到本地 (status: generating)

2. 对话过程中
   └─ updateMessages() → 实时更新本地 messages

3. 报告生成完成
   └─ completeReport()
       ├─ 更新本地 (status: completed, 包含 content + messages)
       └─ 如果已登录 → saveReportToRemote() 保存到远端 (包含 messages)
                     └─ 成功后从本地删除

4. 登录后自动同步
   └─ syncLocalReportsToRemote()
       ├─ 只同步 status === 'completed' 的报告 (包含 messages)
       └─ 保留 status === 'generating' 的报告在本地
*/

export function ReportProvider({ children }) {
  const rdb = useRdb();
  const [reportState, setReportState] = useState({
    content: '',         // 报告内容（去除 [Report] 前缀）
    messages: [],        // 对话记录
    isGenerating: false, // 正在生成中
    isComplete: false,   // 生成完成
    isFromHistory: false, // 是否来自历史报告
    currentReportId: null, // 当前报告的本地 ID
    currentMode: null,   // 当前报告的模式
  });

  // 防止重复保存到远端
  const isSavingRef = useRef(false);
  
  // 追踪最新的状态（解决闭包捕获旧值问题）
  const reportStateRef = useRef(reportState);
  useEffect(() => {
    reportStateRef.current = reportState;
  }, [reportState]);

  const updateUserRemainingReport = useCallback(async () => {
    try {
      if (!rdb) {
        return;
      }
      const username = getCurrentUsername();
      // 先查询当前用户的剩余报告数
      const { data: userData, error: queryError } = await rdb
        .from('user_info')
        .select('remainingReport')
        .eq('username', username)
        .single();

      if (queryError) {
        console.error('查询用户信息失败:', queryError);
        throw queryError;
      }

      if (!userData) {
        console.warn('用户信息不存在');
        return;
      }

      // 将剩余报告数减1，但不能小于0
      const currentRemaining = userData.remainingReport || 0;
      const newRemaining = Math.max(0, currentRemaining - 1);

      // 更新用户剩余报告数
      const { error: updateError } = await rdb
        .from('user_info')
        .update({ remainingReport: newRemaining })
        .eq('username', username);

      if (updateError) {
        console.error('更新用户剩余报告失败:', updateError);
        throw updateError;
      }

      console.log(`用户剩余报告数已更新: ${currentRemaining} -> ${newRemaining}`);
    } catch (err) {
      console.error('更新用户剩余报告失败:', err);
      throw err;
    }
  }, [rdb]);

  // 保存报告到远端
  const saveReportToRemote = useCallback(async (report) => {
    try {
      const username = getCurrentUsername();
      if (!username) throw new Error('未获取到用户名');
      
      // 从报告内容中提取 h1 标题作为 subTitle
      const subTitle = extractReportSubTitle(report.content);
      const generateReportId = () => {
        // 随机生成一个 长度为 10 的字符串,包含 0-9a-f（16进制）
        // 去掉开头的 "0."，然后取10位
        let reportId = '';
        while (reportId.length < 10) {
          reportId += Math.random().toString(16).substring(2);
        }
        return reportId.substring(0, 10);
      }
      
      // 从 content 中移除 h1 标题行（已单独存储为 subTitle）
      const contentWithoutTitle = (report.content || '').replace(/^#\s+.+\n?/m, '').trim();
      
      const { data, error } = await rdb.from('report').insert({
        content: contentWithoutTitle || '',
        username: username,
        title: report.title,
        subTitle: subTitle,
        status: REPORT_STATUS.COMPLETED,
        mode: report.mode,
        messages: JSON.stringify(report.messages || []),
        reportId: generateReportId(),
      });

      if (error) {
        console.error('报告保存到远端失败:', error);
        throw error;
      }

      console.log('报告保存到远端成功:', data, 'subTitle:', subTitle);

      await updateUserRemainingReport();

      // 把报告 id 拼到 url 参数上
      const reportId = data?.[0]?._id || data?.[0]?.id;
      if (reportId) {
        const routePath = `/report-result?mode=${report.mode}&reportId=${reportId}`;
        // 只修改 location.hash，不进行跳转
        window.location.hash = routePath;
      }

      return data;
    } catch (err) {
      console.error('报告保存到远端失败:', err);
      throw err;
    }
  }, [rdb, updateUserRemainingReport]);

  // 同步本地报告到远端（只同步已完成的报告，generating 状态的保留在本地）
  const syncLocalReportsToRemote = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      if (localReports.length === 0) return;
      
      // 区分已完成和未完成的报告
      const completedReports = localReports.filter(r => r.status === 'completed' && !r.synced);
      const pendingReports = localReports.filter(r => r.status !== 'completed' || r.synced);
      
      if (completedReports.length === 0) {
        console.log('没有需要同步的已完成报告');
        return;
      }
      
      console.log('正在同步已完成的报告到远端...', completedReports.length);
      
      for (const report of completedReports) {
        await saveReportToRemote(report);
        console.log('已同步报告:', report.title, '消息数:', report.messages?.length || 0);
      }
      
      // 只保留未完成的报告在本地
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(pendingReports));
      console.log('已完成报告同步完成，本地保留未完成报告数:', pendingReports.length);
    } catch (err) {
      console.error('同步本地报告失败:', err);
    }
  }, [saveReportToRemote]);
    
  // 检查登录状态并同步报告（供登录/注册成功后调用）
  const checkLoginAndSync = useCallback(async () => {
    const loggedIn = isLoggedIn;
    if (loggedIn) {
      // 登录状态变为 true 时，useEffect 会自动触发同步
      // 但为了确保立即同步，这里也调用一次
      await syncLocalReportsToRemote();
    }
  }, [syncLocalReportsToRemote]);

  // 保存报告到本地 localStorage
  const saveReportToLocal = useCallback((report) => {
    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const index = existingReports.findIndex(r => r.localId === report.localId);
      if (index >= 0) {
        existingReports[index] = report;
      } else {
        existingReports.push(report);
      }
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(existingReports));
      console.log('报告已保存到本地:', report.title);
    } catch (err) {
      console.error('保存到本地失败:', err);
    }
  }, []);

  // 更新本地报告
  const updateLocalReport = useCallback((localId, updates) => {
    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const index = existingReports.findIndex(r => r.localId === localId);
      if (index >= 0) {
        existingReports[index] = { ...existingReports[index], ...updates };
        localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(existingReports));
      } else {
        console.warn('未找到本地报告:', localId);
      }
    } catch (err) {
      console.error('更新本地报告失败:', err);
    }
  }, []);

  // 登录后自动同步本地报告
  useEffect(() => {
    if (isLoggedIn) {
      syncLocalReportsToRemote();
    }
  }, [isLoggedIn, syncLocalReportsToRemote]);

  // ========== 报告生命周期方法 ==========

  // 创建报告（开始对话时调用）
  // 对话过程中始终先保存在本地，完成后再同步到远端
  const createReport = useCallback(async (mode) => {
    const title = generateReportTitle(mode);
    const localId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const report = {
      localId,
      title,
      content: '',
      messages: [],
      status: 'generating',
      mode,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    // 更新状态
    setReportState(prev => ({
      ...prev,
      currentReportId: localId,
      currentMode: mode,
      messages: [],
      content: '',
      isGenerating: true,
      isComplete: false,
      isFromHistory: false,
    }));

    // 对话过程中始终先保存到本地，方便实时更新
    saveReportToLocal(report);

    return localId;
  }, [saveReportToLocal]);

  // 开始生成报告（跳转到 loading 页面时）
  const startReport = useCallback(() => {
    setReportState(prev => ({
      ...prev,
      isGenerating: true,
      isComplete: false,
    }));
  }, []);

  // 更新对话记录
  const updateMessages = useCallback((messages) => {
    setReportState(prev => {
      const newState = { ...prev, messages };
      
      // 同时更新本地存储
      if (prev.currentReportId) {
        updateLocalReport(prev.currentReportId, { messages });
        console.log('对话记录已更新到本地, 消息数:', messages.length);
      }
      
      return newState;
    });
  }, [updateLocalReport]);

  // 更新报告内容（流式）
  const updateReportContent = useCallback((content) => {
    const cleanContent = content.replace(/^\[Report\]\s*/i, '');
    setReportState(prev => ({
      ...prev,
      content: cleanContent,
    }));
  }, []);

  // 完成报告生成
  const completeReport = useCallback(async () => {
    // 防止严格模式下重复调用
    if (isSavingRef.current) {
      console.log('已在保存中，跳过重复调用');
      return;
    }

    // 使用 ref 获取最新状态（解决闭包捕获旧值问题）
    const currentState = reportStateRef.current;
    const reportId = currentState.currentReportId;
    const reportContent = currentState.content;
    const reportMessages = currentState.messages;

    console.log('completeReport - reportId:', reportId, 'content length:', reportContent?.length);

    // 更新状态
    setReportState(prev => ({
      ...prev,
      isGenerating: false,
      isComplete: true,
    }));

    // 副作用：保存到本地和远端
    if (reportId) {
      isSavingRef.current = true; // 标记正在保存
      
      const reportUpdate = {
        content: reportContent,
        messages: reportMessages,
        status: 'completed',
      };

      // 先更新本地
      updateLocalReport(reportId, reportUpdate);

      // 如果已登录，同步到远端
      if (isLoggedIn) {
        try {
          const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
          const currentReport = localReports.find(r => r.localId === reportId);
          
          if (currentReport) {
            await saveReportToRemote({
              ...currentReport,
              ...reportUpdate,
            });
            
            // 同步成功后，从本地删除这条记录
            const updatedReports = localReports.filter(r => r.localId !== reportId);
            localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(updatedReports));
            console.log('报告已同步到远端并清除本地缓存');
          }
        } catch (err) {
          console.error('同步到远端失败，保留本地记录:', err);
        }
      }
      
      isSavingRef.current = false; // 重置保存状态
    }
  }, [isLoggedIn, saveReportToRemote, updateLocalReport]);

  const getReportDetail = useCallback(async (reportId) => {
    if (!reportId) {
      console.warn('reportId 为空，无法获取报告内容');
      return '';
    }
    if (!rdb) {
      console.warn('rdb 未初始化，无法获取报告内容');
      return '';
    }
    
    try {
      const { data, error } = await rdb.from('report').select('content, status, subTitle, username').eq('reportId', reportId);
      if (error) {
        console.error('获取报告内容失败:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('报告不存在:', reportId);
        return '';
      }
      
      const reportDetail = data[0] || '';
      const isCompleted = data[0]?.status === REPORT_STATUS.COMPLETED;
      
      setReportState(prev => ({
        ...prev,
        content: reportDetail.content,
        isComplete: isCompleted,
      }));
      
      return reportDetail;
    } catch (err) {
      console.error('获取报告内容异常:', err);
      return '';
    }
  }, [rdb]);

  // 获取指定模式下的未完成报告
  const getPendingReport = useCallback((mode) => {
    try {
      const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      // 查找该模式下状态为 generating 的报告
      const pendingReport = localReports.find(
        r => r.mode === mode && r.status === 'generating'
      );
      return pendingReport || null;
    } catch (err) {
      console.error('获取未完成报告失败:', err);
      return null;
    }
  }, []);

  // 恢复未完成的报告
  const resumeReport = useCallback((report) => {
    if (!report) return false;

    setReportState(prev => ({
      ...prev,
      currentReportId: report.localId,
      currentMode: report.mode,
      messages: report.messages || [],
      content: report.content || '',
      isGenerating: false, // 恢复时不是正在生成状态
      isComplete: false,
      isFromHistory: false,
    }));

    console.log('已恢复未完成的报告:', report.title, '消息数:', report.messages?.length || 0);
    return true;
  }, []);

  return (
    <ReportContext.Provider value={{
      ...reportState,
      isLoggedIn,
      createReport,
      startReport,
      updateMessages,
      updateReportContent,
      completeReport,
      getPendingReport,
      getReportDetail,
      resumeReport,
      saveReportToLocal,
      saveReportToRemote,
      syncLocalReportsToRemote,
      checkLoginAndSync, // 供登录/注册成功后调用
    }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

