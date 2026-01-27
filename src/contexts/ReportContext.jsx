import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getCurrentUsername, isLoggedIn, getCurrentUserId } from '../utils/user';
import { generateReportTitle, extractReportSubTitle, cleanReportContent, generateReportId } from '../utils/chat';
import { useRdb, useAuth, useCloudbaseApp } from './cloudbaseContext';
import { REPORT_STATUS } from '../constants/reportStatus';
import { getReportDetail, verifyInviteCode } from '../api/report';

const ReportContext = createContext(null);

// localStorage key
const LOCAL_REPORTS_KEY = 'pendingReports';

/*
1. 开始对话
   └─  createReport() → 保存到本地，并且同步到远端，report.lock=1 report.status=pending
      └─ 如果已登录，保存一下 username 和 _openid
      └─ 如果未登录，也要同步到远端，但是不保存 username 和 _openid

2. 对话过程中
   └─ updateMessages() → 实时更新本地 messages

3. 报告生成完成
   └─ completeReport()
      └─ 更新本地 (status: completed, 包含 content + subTitle + messages)
      └─ 更新远端 (包含 content + subTitle + messages，report.lock=1 report.status=completed)
        └─ 如果已登录 → 保存一下 username 和 _openid
        └─ 如果未登录，也要同步到远端，但是不保存 username 和 _openid
      └─ 提示输入邀请码，使用 inviteCodeDialog 组件
      └─ 输入邀请码后，验证邀请码是否有效
        └─ 如果有效，则 report.lock=0 report.inviteCode=邀请码 (会在服务端服务实现解锁逻辑)
        └─ 如果无效，则提示邀请码无效
      └─ 解锁后可以查看报告
        └─ 如果未登录，则弹出 inviteLoginDialog 组件，邀请登录
        └─ 如果已登录 → 保存一下 username 和 _openid

4. 登录后自动同步
   └─ syncLocalReportsToRemote()
       ├─ 只同步 status === 'completed' 的报告 (包含 messages)，保存 username 和 _openid
       └─ 保留 status === 'pending' 的报告在本地

5. 报告详情页
   └─ 查看报告详情
      └─ 如果报告未解锁，则弹出 inviteCodeDialog 组件，邀请输入邀请码
      └─ 输入邀请码后，验证邀请码是否有效
        └─ 如果有效，则 report.lock=0 report.inviteCode=邀请码 (会在服务端服务实现解锁逻辑)
        └─ 如果无效，则提示邀请码无效
      └─ 解锁后可以查看报告
        └─ 如果未登录，则弹出 inviteLoginDialog 组件，邀请登录
        └─ 如果已登录 → 保存一下 username 和 _openid
*/

export function ReportProvider({ children }) {
  const rdb = useRdb();
  const auth = useAuth();
  const cloudbaseApp = useCloudbaseApp();
  const [reportState, setReportState] = useState({
    content: '',         // 报告内容（去除 [Report] 前缀）
    messages: [],        // 对话记录
    isGenerating: false, // 正在生成中
    isComplete: false,   // 生成完成
    isFromHistory: false, // 是否来自历史报告
    currentReportId: null, // 当前报告的 ID（统一使用 reportId）
    currentMode: null,   // 当前报告的模式
  });
  
  // 对话框回调（由 Result.jsx 注册）
  const onShowInviteCodeDialogRef = useRef(null);
  const onShowInviteLoginDialogRef = useRef(null);

  // 防止重复保存到远端
  const isSavingRef = useRef(false);
  
  // 追踪最新的状态（解决闭包捕获旧值问题）
  const reportStateRef = useRef(reportState);
  useEffect(() => {
    reportStateRef.current = reportState;
  }, [reportState]);

  // const updateUserRemainingReport = useCallback(async () => {
  //   try {
  //     if (!rdb) {
  //       return;
  //     }
  //     const username = getCurrentUsername();
  //     // 先查询当前用户的剩余报告数
  //     const { data: userData, error: queryError } = await rdb
  //       .from('user_info')
  //       .select('remainingReport')
  //       .eq('username', username)
  //       .single();

  //     if (queryError) {
  //       console.error('查询用户信息失败:', queryError);
  //       throw queryError;
  //     }

  //     if (!userData) {
  //       console.warn('用户信息不存在');
  //       return;
  //     }

  //     // 将剩余报告数减1，但不能小于0
  //     const currentRemaining = userData.remainingReport || 0;
  //     const newRemaining = Math.max(0, currentRemaining - 1);

  //     // 更新用户剩余报告数
  //     const { error: updateError } = await rdb
  //       .from('user_info')
  //       .update({ remainingReport: newRemaining })
  //       .eq('username', username);

  //     if (updateError) {
  //       console.error('更新用户剩余报告失败:', updateError);
  //       throw updateError;
  //     }

  //     console.log(`用户剩余报告数已更新: ${currentRemaining} -> ${newRemaining}`);
  //   } catch (err) {
  //     console.error('更新用户剩余报告失败:', err);
  //     throw err;
  //   }
  // }, [rdb]);

  // 保存报告到远端
  const saveReportToRemote = useCallback(async (report, options = {}) => {
    try {
      if (!rdb) {
        throw new Error('rdb 未初始化');
      }
      
      const {
        status = REPORT_STATUS.PENDING,
        lock = 1,
        saveUserInfo = false, // 是否保存用户信息
      } = options;
      
      const username = saveUserInfo ? getCurrentUsername() : null;
      const openId = saveUserInfo ? getCurrentUserId() : null;
      

      const subTitle = report.subTitle;
      const reportId = report.reportId;
      
      if (!reportId) {
        throw new Error('reportId 不能为空');
      }
      
      const insertData = {
        content: cleanReportContent(report.content) || '',
        title: report.title,
        subTitle: subTitle || '',
        status: status,
        mode: report.mode,
        messages: JSON.stringify(report.messages || []),
        reportId: reportId,
        lock: lock,
      };
      
      // 如果已登录且需要保存用户信息，则添加 username 和 _openid
      if (saveUserInfo && username) {
        insertData.username = username;
      }
      if (saveUserInfo && openId) {
        insertData._openid = openId;
      }
      
      const { data, error } = await rdb.from('report').upsert(insertData, { onConflict: 'reportId' });

      if (error) {
        console.error('报告保存到远端失败:', error);
        throw error;
      }

      console.log('报告保存到远端成功:', data, 'status:', status, 'lock:', lock);

      return { data, reportId };
    } catch (err) {
      console.error('报告保存到远端失败:', err);
      throw err;
    }
  }, [rdb, auth]);

  // 同步本地报告到远端（只同步已完成的报告，pending 状态的保留在本地）
  const syncLocalReportsToRemote = useCallback(async () => {
    if (!isLoggedIn()) return;
    
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
        await saveReportToRemote(report, {
          status: REPORT_STATUS.COMPLETED,
          lock: 1,
          saveUserInfo: true, // 登录后同步，保存 username 和 _openid
        });
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
      const index = existingReports.findIndex(r => r.reportId === report.reportId);
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
  const updateLocalReport = useCallback((reportId, updates) => {
    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const index = existingReports.findIndex(r => r.reportId === reportId);
      if (index >= 0) {
        existingReports[index] = { ...existingReports[index], ...updates };
        localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(existingReports));
      } else {
        console.warn('未找到本地报告:', reportId);
      }
    } catch (err) {
      console.error('更新本地报告失败:', err);
    }
  }, []);

  // 登录后自动同步本地报告
  useEffect(() => {
    if (isLoggedIn()) {
      syncLocalReportsToRemote();
    }
  }, [syncLocalReportsToRemote]);

  // ========== 报告生命周期方法 ==========

  // 创建报告（开始对话时调用）
  // 保存到本地，并且同步到远端，report.lock=1 report.status=pending
  const createReport = useCallback(async (mode) => {
    const title = generateReportTitle(mode);
    const reportId = generateReportId();
    
    const report = {
      reportId,
      title,
      content: '',
      messages: [],
      status: 'pending',
      mode,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    // 更新状态
    setReportState(prev => ({
      ...prev,
      currentReportId: reportId,
      currentMode: mode,
      messages: [],
      content: '',
      isGenerating: true,
      isComplete: false,
      isFromHistory: false,
    }));

    // 保存到本地
    saveReportToLocal(report);

    // 同步到远端（无论是否登录）
    try {
      const loggedIn = isLoggedIn();
      await saveReportToRemote(report, {
        status: REPORT_STATUS.PENDING,
        lock: 1,
        saveUserInfo: loggedIn, // 如果已登录，保存 username 和 _openid
      });
      console.log('报告已同步到远端 (pending, lock=1)');
    } catch (err) {
      console.error('同步报告到远端失败，保留本地记录:', err);
    }

    return reportId;
  }, [saveReportToLocal, saveReportToRemote]);

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
    setReportState(prev => ({
      ...prev,
      subTitle: extractReportSubTitle(content),
      content: cleanReportContent(content),
    }));
  }, []);

  // 处理邀请码验证（由 Result.jsx 调用）
  const handleInviteCodeSubmit = useCallback(async (reportId, inviteCode) => {
    try {
      // 验证邀请码
      const response = await verifyInviteCode(cloudbaseApp, inviteCode, reportId);
      const result = response.result;
      if (result.retcode !== 0) {
        throw new Error(result.message);
      }

      // 解锁后，如果未登录，弹出登录对话框
      if (!isLoggedIn()) {
        if (onShowInviteLoginDialogRef.current) {
          onShowInviteLoginDialogRef.current();
        }
      }
      return true;
    } catch (err) {
      console.error('邀请码验证失败:', err);
      throw err;
    }
  }, [rdb, auth, cloudbaseApp]);

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
    const subTitle = currentState.subTitle;

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
        subTitle: subTitle,
        messages: reportMessages,
        status: 'completed',
      };

      // 先更新本地
      updateLocalReport(reportId, reportUpdate);

      // 同步到远端（无论是否登录）
      try {
        const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
        const currentReport = localReports.find(r => r.reportId === reportId);
        
        if (currentReport) {
          const loggedIn = isLoggedIn();
          await saveReportToRemote({
            ...currentReport,
            ...reportUpdate,
          }, {
            status: REPORT_STATUS.COMPLETED,
            lock: 1,
            saveUserInfo: loggedIn, // 如果已登录，保存 username 和 _openid
          });
          
          // 同步成功后，从本地删除这条记录
          const updatedReports = localReports.filter(r => r.reportId !== reportId);
          localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(updatedReports));
          console.log('报告已同步到远端 (completed, lock=1)');
          
          // 提示输入邀请码（通过回调通知 Result.jsx）
          if (onShowInviteCodeDialogRef.current) {
            onShowInviteCodeDialogRef.current(reportId);
          }
        }
      } catch (err) {
        console.error('同步到远端失败，保留本地记录:', err);
      }
      
      isSavingRef.current = false; // 重置保存状态
    }
  }, [saveReportToRemote, updateLocalReport]);

  const getReportDetailWrapper = useCallback(async (reportId) => {
    if (!reportId) {
      console.warn('reportId 为空，无法获取报告内容');
      return null;
    }
    if (!rdb) {
      console.warn('rdb 未初始化，无法获取报告内容');
      return null;
    }
    
    try {
      const reportDetail = await getReportDetail(rdb, reportId);
      
      if (reportDetail) {
        setReportState(prev => ({
          ...prev,
          content: reportDetail.content,
          subTitle: reportDetail.subTitle,
          isComplete: reportDetail.isCompleted,
          currentReportId: reportId,
        }));
        
        // 如果报告未解锁，弹出邀请码对话框（通过回调通知 Result.jsx）
        if (reportDetail.isLocked) {
          if (onShowInviteCodeDialogRef.current) {
            onShowInviteCodeDialogRef.current(reportId);
          }
        }
      }
      
      return reportDetail;
    } catch (err) {
      console.error('获取报告内容异常:', err);
      return null;
    }
  }, [rdb]);

  // 获取指定模式下的未完成报告
  const getPendingReport = useCallback((mode) => {
    try {
      const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      // 查找该模式下状态为 pending 的报告
      const pendingReport = localReports.find(
        r => r.mode === mode && r.status === 'pending'
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
      currentReportId: report.reportId,
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
      isLoggedIn: isLoggedIn(),
      createReport,
      startReport,
      updateMessages,
      updateReportContent,
      completeReport,
      getPendingReport,
      getReportDetail: getReportDetailWrapper,
      resumeReport,
      saveReportToLocal,
      saveReportToRemote,
      syncLocalReportsToRemote,
      checkLoginAndSync, // 供登录/注册成功后调用
      handleInviteCodeSubmit, // 邀请码验证处理函数
      // 注册对话框显示回调（由 Result.jsx 调用）
      registerInviteCodeDialog: (callback) => {
        onShowInviteCodeDialogRef.current = callback;
      },
      registerInviteLoginDialog: (callback) => {
        onShowInviteLoginDialogRef.current = callback;
      },
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
