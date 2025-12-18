import axios from "axios";

// 创建 axios 实例
const request = axios.create({
  baseURL: "/api", // 基础路径，实际项目中可配置为真实后端地址
  timeout: 10000,
});

// 请求拦截器 - 添加 token 和权限信息
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加用户角色信息（用于权限验证）
    const currentUser = localStorage.getItem("current_user");
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        config.headers["X-User-Role"] = user.role;
        config.headers["X-User-Id"] = user.id;
      } catch (e) {
        console.error("Failed to parse current_user", e);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理权限和错误
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 如果后端返回了新的 token，更新本地存储
    if (data.token) {
      localStorage.setItem("auth_token", data.token);
    }

    return data;
  },
  (error) => {
    // 处理 401 未授权
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
      // 可以在这里触发登出逻辑
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // 处理 403 权限不足
    if (error.response?.status === 403) {
      console.error("权限不足", error.response.data?.message);
    }

    // 如果错误响应中有 data，直接返回 data（保持与成功响应一致）
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }

    // 否则返回完整的错误对象
    return Promise.reject(error);
  }
);

export default request;
