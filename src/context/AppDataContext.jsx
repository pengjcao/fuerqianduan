import { createContext, useEffect, useMemo, useState } from 'react';
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
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始化时从 API 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取待审核 PI 列表
        const piRes = await piRecordApi.getPendingList();
        
        if (piRes.success) {
          setPiRecords(piRes.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  // 注意：后端接口目前可能需要 pi_info_id，但目前后端代码中硬编码为 1
  // 如果后端需要传递 id，需要调整 API
  const progressPiRecord = async ({ id, action, comment }) => {
    try {
      const approve = action === "approve"; // action: "approve" | "reject"
      const response = await piRecordApi.review(approve, comment);
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
  const refreshPiRecords = async () => {
    try {
      const response = await piRecordApi.getPendingList();
      if (response.success) {
        setPiRecords(response.data || []);
      }
    } catch (error) {
      console.error("Failed to refresh PI records:", error);
    }
  };

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
        specialties,
        addGroup,
        addMember,
        addTrial,
        addPiRecord,
        progressPiRecord,
        refreshPiRecords,
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

