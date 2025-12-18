import { createContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";

export const AuthContext = createContext(null);

const roleLabels = {
  admin: "系统管理员",
  pi: "研究者（PI）",
  team: "研究团队成员",
  secretary: "机构办秘书",
  director: "机构办主任",
  chief: "机构主任",
  viewer: "只读访客",
};

// 角色权限说明（基于PI备案申请流程）
// 流程：研究者发起 → 机构办秘书审核 → 机构办主任审核 → 机构主任审核 → 机构办秘书填写完成时间
// 任意节点驳回均回到第一步
const rolePermissions = {
  pi: {
    label: "研究者（PI）",
    description: "可发起PI备案申请，查看自己的申请状态",
    canRegister: true,
  },
  team: {
    label: "研究团队成员",
    description: "协助PI工作，查看相关信息",
    canRegister: true,
  },
  secretary: {
    label: "机构办秘书",
    description: "审核PI备案申请（第一步），填写完成时间（最后一步）",
    canRegister: false,
  },
  director: {
    label: "机构办主任",
    description: "审核PI备案申请（第二步）",
    canRegister: false,
  },
  chief: {
    label: "机构主任",
    description: "审核PI备案申请（第三步，终审）",
    canRegister: false,
  },
  admin: {
    label: "系统管理员",
    description: "系统管理，拥有全部权限",
    canRegister: false,
  },
  viewer: {
    label: "只读访客",
    description: "仅可查看，不可操作",
    canRegister: true,
  },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查是否有已登录的用户
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("current_user");

      if (token && savedUser) {
        try {
          // 验证 token 并获取用户信息
          const response = await authApi.getCurrentUser();
          if (response.success && response.data) {
            setCurrentUser(response.data);
            localStorage.setItem("current_user", JSON.stringify(response.data));
          } else {
            // token 无效，清除
            authApi.logout();
          }
        } catch {
          // token 验证失败，清除
          authApi.logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authApi.login(username, password);
      // 调试日志
      console.log("[Login] API 响应:", response);

      // 响应拦截器已经返回了 data，所以 response 就是 { success: true, data: { user, token } }
      if (response && response.success && response.data) {
        const { user, token } = response.data;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("current_user", JSON.stringify(user));
        setCurrentUser(user);
        return { ok: true, user };
      } else {
        // 如果响应格式不对，可能是错误响应
        console.warn("[Login] 响应格式异常:", response);
        return {
          ok: false,
          message: response?.message || "登录失败",
        };
      }
    } catch (error) {
      // 错误响应已经被拦截器处理，error 可能是 { success: false, message: "..." }
      console.error("[Login] 登录错误:", error);
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "登录失败，请检查网络连接";
      return {
        ok: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({
      currentUser,
      login,
      logout,
      roleLabels,
      rolePermissions,
      isLoggedIn: !!currentUser,
      loading,
      hasRole: (roles) => {
        if (!currentUser) return false;
        if (!roles || roles.length === 0) return true;
        return roles.includes(currentUser.role);
      },
    }),
    [currentUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
