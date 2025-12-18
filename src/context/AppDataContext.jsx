import { createContext, useEffect, useMemo, useState } from 'react';
import { piRecordApi, specialtyApi } from '../api';

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
        const [piRes, specialtyRes] = await Promise.all([
          piRecordApi.getList(),
          specialtyApi.getList(),
        ]);
        
        if (piRes.success) {
          setPiRecords(piRes.data || []);
        }
        if (specialtyRes.success) {
          setSpecialties(specialtyRes.data || []);
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

  const addPiRecord = async (payload) => {
    try {
      const response = await piRecordApi.create(payload);
      if (response.success && response.data) {
        setPiRecords((prev) => [response.data, ...prev]);
        return response.data;
      }
      throw new Error(response.message || "创建失败");
    } catch (error) {
      console.error("Failed to create PI record:", error);
      throw error;
    }
  };

  const progressPiRecord = async ({ id, action, comment }) => {
    try {
      const response = await piRecordApi.update(id, action, comment);
      if (response.success && response.data) {
        setPiRecords((prev) =>
          prev.map((item) => (item.id === id ? response.data : item))
        );
        return response.data;
      }
      throw new Error(response.message || "更新失败");
    } catch (error) {
      console.error("Failed to update PI record:", error);
      throw error;
    }
  };

  // 刷新 PI 记录列表
  const refreshPiRecords = async () => {
    try {
      const response = await piRecordApi.getList();
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

