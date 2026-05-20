import { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import { piRecordApi, departmentApi } from '../api';

export const AppDataContext = createContext(null);

const statusMap = {
  active: '运行中',
  paused: '暂停',
  inactive: '未启用',
  ongoing: '进行中',
  pending: '待启动',
  completed: '已完成',
};

const randomId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export function AppDataProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [trials, setTrials] = useState([]);
  const [piRecords, setPiRecords] = useState([]);
  const [approvedPis, setApprovedPis] = useState([]); // 已备案的PI列表
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取已备案 PI 列表
  const fetchApprovedPis = useCallback(async () => {
    try {
      // 如果后端有专门的已备案接口，使用它；否则使用getPendingList并过滤
      let response;
      try {
        response = await piRecordApi.getApprovedList();
      } catch (error) {
        // 如果接口不存在，尝试从待审核列表中过滤已备案的
        // 或者返回空数组，等待后端添加接口
        console.warn("已备案PI接口不存在，使用待审核列表过滤");
        const pendingResponse = await piRecordApi.getPendingList();
        if (pendingResponse.success) {
          // 过滤出已备案的（applyStatus不是PENDING_APPROVAL的）
          const approved = (pendingResponse.data || []).filter(
            (pi) => pi.applyStatus && pi.applyStatus !== "PENDING_APPROVAL"
          );
          setApprovedPis(approved);
          return;
        }
        setApprovedPis([]);
        return;
      }
      
      if (response.success) {
        setApprovedPis(response.data || []);
      } else {
        setApprovedPis([]);
      }
    } catch (error) {
      console.error("Failed to fetch approved PIs:", error);
      setApprovedPis([]);
    }
  }, []);

  // 初始化时从 API 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取待审核 PI 列表
        const piRes = await piRecordApi.getPendingList();
        
        if (piRes.success) {
          setPiRecords(piRes.data || []);
        }
        
        // 获取已备案 PI 列表
        await fetchApprovedPis();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchApprovedPis]);

  const addGroup = (payload) => {
    const next = {
      id: randomId('grp'),
      members: 0,
      trials: 0,
      status: 'active',
      updatedAt: new Date().toISOString().slice(0, 10),
      ...payload,
    };
    setGroups((prev) => [next, ...prev]);
  };

  const addMember = (payload) => {
    const next = {
      id: randomId('mem'),
      status: 'active',
      ...payload,
    };
    setMembers((prev) => [next, ...prev]);
  };

  const addTrial = (payload) => {
    const next = {
      id: randomId('tri'),
      status: 'pending',
      patients: 0,
      startDate: new Date().toISOString().slice(0, 10),
      ...payload,
    };
    setTrials((prev) => [next, ...prev]);
  };

  // 提交 PI 信息（使用 FormData）
  const addPiRecord = async (formData) => {
    try {
      const response = await piRecordApi.submitPiInfo(formData);
      if (response.success) {
        // 刷新列表
        await refreshPiRecords();
        return response.data;
      }
      throw new Error(response.message || "提交失败");
    } catch (error) {
      console.error("Failed to submit PI info:", error);
      throw error;
    }
  };

  // 审批 PI（approve: true=通过, false=驳回）
  // 参数: { userId: string, pi_info_id: number, action: "approve" | "reject", comment?: string }
  const progressPiRecord = async ({ userId, pi_info_id, action, comment }) => {
    try {
      const approve = action === "approve"; // action: "approve" | "reject"
      const response = await piRecordApi.review(userId, pi_info_id, approve, comment);
      if (response.success) {
        // 刷新列表
        await refreshPiRecords();
        return response.data;
      }
      throw new Error(response.message || "审批失败");
    } catch (error) {
      console.error("Failed to review PI:", error);
      throw error;
    }
  };

  // 刷新 PI 记录列表
  const refreshPiRecords = useCallback(async () => {
    try {
      const response = await piRecordApi.getPendingList();
      if (response.success) {
        setPiRecords(response.data || []);
        return response;
      } else {
        throw new Error(response.message || "获取待审批列表失败");
      }
    } catch (error) {
      console.error("Failed to refresh PI records:", error);
      throw error;
    }
  }, []);

  const summary = useMemo(() => {
    return {
      groups: groups.length,
      members: members.length,
      trials: trials.length,
      specialties: specialties.length,
    };
  }, [groups, members, trials, specialties]);

  const getGroupName = (id) => groups.find((g) => g.id === id)?.name || '未分组';

  return (
    <AppDataContext.Provider
      value={{
        groups,
        members,
        trials,
        piRecords,
        approvedPis,
        specialties,
        addGroup,
        addMember,
        addTrial,
        addPiRecord,
        progressPiRecord,
        refreshPiRecords,
        fetchApprovedPis,
        summary,
        statusMap,
        getGroupName,
        loading,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

