import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { getCurrentUsername, isLoggedIn, getCurrentUserId } from '../utils/user';
import { generateReportTitle, extractReportSubTitle, cleanReportContent, generateReportId } from '../utils/chat';
import { useRdb, useAuth, useCloudbaseApp, useDb } from './cloudbaseContext';
import { REPORT_STATUS } from '../constants/reportStatus';
import { getReportDetail, verifyInviteCode, saveMessages } from '../api/report';
import { useToast } from '../components/Toast';

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
        └─ 如果已登录 → 保存一下 username 和 _openid，并且从本地删除该记录
        └─ 如果未登录，也要同步到远端，但是不保存 username 和 _openid，并且暂时保存在本地，不要从本地删除
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
6. 本地报告管理
   └─ 本地保存的 Completed 报告，上限只保存 3 个，超出使用 LRU 算法删除最早的报告
   └─ 本地保存的 Pending 报告， 同一个 mode 上限只保存 1 个，超出使用 LRU 算法删除最早的报告
*/

const ReportContext = createContext(null);

// localStorage keys
const LOCAL_REPORTS_KEY = 'pendingReports';
const DISCOVER_SELF_FIRST_3_ANSWERS_KEY = 'discoverSelfFirst3Answers';

/** 本地报告 LRU 裁剪：Completed 最多 3 个，Pending 同一 mode 最多 1 个 */
function trimLocalReports(reports) {
  const completed = reports.filter(r => r.status === 'completed');
  const pending = reports.filter(r => r.status === 'pending');
  // Completed: 按 createdAt 降序，保留最新 3 个
  const completedKeep = [...completed]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);
  // Pending: 每个 mode 保留最新 1 个（按 createdAt 取最新）
  const pendingByMode = {};
  pending.forEach(r => {
    const m = r.mode || 'unknown';
    if (!pendingByMode[m] || new Date(r.createdAt) > new Date(pendingByMode[m].createdAt)) {
      pendingByMode[m] = r;
    }
  });
  const pendingKeep = Object.values(pendingByMode);
  return [...completedKeep, ...pendingKeep];
}

export function ReportProvider({ children }) {
  const rdb = useRdb();
  const db = useDb();
  const auth = useAuth();
  const cloudbaseApp = useCloudbaseApp();
  const { message: toastMessage } = useToast();
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
  
  // 防止重复提示（记录是否已经提示过未完成报告）
  const hasShownPendingReportToastRef = useRef(false);
  
  // 追踪最新的状态（解决闭包捕获旧值问题）
  const reportStateRef = useRef(reportState);
  useEffect(() => {
    reportStateRef.current = reportState;
  }, [reportState]);

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

      // 对话记录保存到文档型数据库
      try {
        await saveMessages(db, reportId, report.messages || []);
      } catch (err) {
        console.error('对话记录保存到文档型数据库失败:', err);
      }

      return { data, reportId };
    } catch (err) {
      console.error('报告保存到远端失败:', err);
      throw err;
    }
  }, [rdb, db, auth]);

  // 同步本地报告到远端（只同步已完成的报告，pending 状态的保留在本地）
  const syncLocalReportsToRemote = useCallback(async () => {
    
    try {
      const localReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      if (localReports.length === 0) return;
      
      // 区分已完成和未完成的报告
      const completedReports = localReports.filter(r => r.status === 'completed' && !r.synced);
      const pendingReports = localReports.filter(r => r.status !== 'completed' || r.synced);
      
      // 如果有未完成的报告，但用户未登录，提示登录（只提示一次）
      if (completedReports.length > 0 && !isLoggedIn()) {
        if (!hasShownPendingReportToastRef.current) {
          toastMessage.info('检测到你本地有仍未完成的报告，建议登录后自动保存到个人档案', 6000);
          hasShownPendingReportToastRef.current = true;
        }
        return;
      }
      
      // 如果已登录，重置提示标记（下次未登录时可以再次提示）
      if (isLoggedIn()) {
        hasShownPendingReportToastRef.current = false;
      }
      
      if (completedReports.length === 0) {
        console.log('没有需要同步的已完成报告');
        return;
      }

      if (!isLoggedIn()) {
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
      
      // 只保留未完成的报告在本地（按 LRU 裁剪）
      const trimmed = trimLocalReports(pendingReports);
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(trimmed));
      console.log('已完成报告同步完成，本地保留未完成报告数:', trimmed.length);
    } catch (err) {
      console.error('同步本地报告失败:', err);
    }
  }, [saveReportToRemote, toastMessage]);
    
  // 检查登录状态并同步报告（供登录/注册成功后调用）
  const checkLoginAndSync = useCallback(async () => {
    const loggedIn = isLoggedIn;
    if (loggedIn) {
      // 登录状态变为 true 时，useEffect 会自动触发同步
      // 但为了确保立即同步，这里也调用一次
      await syncLocalReportsToRemote();
    }
  }, [syncLocalReportsToRemote]);

  // 保存报告到本地 localStorage（写入前按 LRU 裁剪）
  const saveReportToLocal = useCallback((report) => {
    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const index = existingReports.findIndex(r => r.reportId === report.reportId);
      if (index >= 0) {
        existingReports[index] = report;
      } else {
        existingReports.push(report);
      }
      const trimmed = trimLocalReports(existingReports);
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(trimmed));
      console.log('报告已保存到本地:', report.title);
    } catch (err) {
      console.error('保存到本地失败:', err);
    }
  }, []);

  // 更新本地报告（写入前按 LRU 裁剪）
  const updateLocalReport = useCallback((reportId, updates) => {
    try {
      const existingReports = JSON.parse(localStorage.getItem(LOCAL_REPORTS_KEY) || '[]');
      const index = existingReports.findIndex(r => r.reportId === reportId);
      if (index >= 0) {
        existingReports[index] = { ...existingReports[index], ...updates };
        const trimmed = trimLocalReports(existingReports);
        localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(trimmed));
      } else {
        console.warn('未找到本地报告:', reportId);
      }
    } catch (err) {
      console.error('更新本地报告失败:', err);
    }
  }, []);

  // 登录后自动同步本地报告
  useEffect(() => {
    syncLocalReportsToRemote();
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

      // discover-self 模式下，保存第 2、3、4 轮用户答案用于下次推荐（第 1 轮为自动发送的「你好，我准备好了，请开始吧」）
      // 与上次记录合并：本次没有的轮次保留上次的，避免新聊天覆盖掉旧推荐
      if (prev.currentMode === 'discover-self' && Array.isArray(messages)) {
        const userContents = messages
          .filter(m => m.role === 'user' && m.content)
          .map(m => (typeof m.content === 'string' ? m.content : m.content?.text || '').trim())
          .filter(Boolean);
        // 第 2、3、4 轮对应索引 0、1、2
        const round2To4 = userContents.slice(1, 4);
        try {
          let existing = [null, null, null];
          const raw = localStorage.getItem(DISCOVER_SELF_FIRST_3_ANSWERS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              existing = [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null];
            }
          }
          // 当前有的轮次用当前值，没有的保留上次
          const merged = [
            round2To4[0] ?? existing[0],
            round2To4[1] ?? existing[1],
            round2To4[2] ?? existing[2],
          ];
          if (merged.some(Boolean)) {
            localStorage.setItem(DISCOVER_SELF_FIRST_3_ANSWERS_KEY, JSON.stringify(merged));
          }
        } catch (e) {
          console.warn('保存第 2/3/4 轮答案失败:', e);
        }
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
          
          // 同步成功后，如果已登录，则从本地删除这条记录，如果未登录则暂时保存在本地
          if(loggedIn) {
            const updatedReports = trimLocalReports(localReports.filter(r => r.reportId !== reportId));
            localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(updatedReports));
          }
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

  // 获取 discover-self 模式下保存的前三轮用户答案（用于推荐）
  // 返回 [第2轮, 第3轮, 第4轮]，可能含 null（未填的保留上次或空）
  const getDiscoverSelfFirst3Answers = useCallback(() => {
    try {
      const raw = localStorage.getItem(DISCOVER_SELF_FIRST_3_ANSWERS_KEY);
      if (!raw) return [null, null, null];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [null, null, null];
      return [arr[0] ?? null, arr[1] ?? null, arr[2] ?? null];
    } catch (e) {
      return [null, null, null];
    }
  }, []);

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
      getDiscoverSelfFirst3Answers,
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
