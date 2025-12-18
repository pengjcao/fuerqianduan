import request from "./request";
import "./mock"; // 导入 mock 服务

// 认证相关 API
export const authApi = {
  // 登录
  login: (username, password) =>
    request.post("/auth/login", { username, password }),

  // 注册
  register: (data) => request.post("/auth/register", data),

  // 获取当前用户信息
  getCurrentUser: () => request.get("/auth/me"),

  // 登出（前端清除 token 即可）
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
  },
};

// PI 备案相关 API
export const piRecordApi = {
  // 获取 PI 备案列表
  getList: () => request.get("/pi-records"),

  // 创建 PI 备案
  create: (data) => request.post("/pi-records", data),

  // 更新 PI 备案状态（审核/驳回）
  update: (id, action, comment) =>
    request.patch(`/pi-records/${id}`, { action, comment }),
};

// 专业组相关 API
export const specialtyApi = {
  // 获取专业组列表
  getList: () => request.get("/specialties"),
};
