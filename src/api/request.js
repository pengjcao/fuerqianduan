import axios from "axios";

// 根据环境变量决定 baseURL
// 开发环境：使用 /api，由 Vite 代理转发到后端
// 生产环境：可以配置为实际的后端地址
const baseURL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || "/api" // 生产环境可通过环境变量配置
  : "/api"; // 开发环境使用代理

// 创建 axios 实例
const request = axios.create({
  baseURL,
  timeout: 10000,
});

// 请求拦截器 - 添加 token 和权限信息
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    // 后端 JWT token header 名称是 "cao"（根据 application.properties 中的 userTokenName）
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.cao = token; // 使用后端配置的 token header 名称
    }

    // 如果是 FormData，确保 Content-Type 没有被手动设置（让浏览器自动设置包含 boundary）
    if (config.data instanceof FormData && config.headers["Content-Type"]) {
      // 如果手动设置了 multipart/form-data，删除它（浏览器会自动添加 boundary）
      if (config.headers["Content-Type"].includes("multipart/form-data")) {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理后端 Result 格式（code/msg/data）
request.interceptors.response.use(
  (response) => {
    const { data } = response;

    // 后端返回格式：Result<T> = { code: 1|0, msg: string, data: T }
    // code: 1 表示成功，0 或其他数字表示失败
    if (data.code === 1) {
      // 成功：如果后端返回了新的 token，更新本地存储
      if (data.data?.token) {
        localStorage.setItem("auth_token", data.data.token);
      }
      // 返回统一格式：{ success: true, data: ..., message: null }
      return {
        success: true,
        data: data.data,
        message: null,
      };
    } else {
      // 失败：抛出错误
      return Promise.reject({
        success: false,
        message: data.msg || "请求失败",
        data: null,
      });
    }
  },
  (error) => {
    // 处理 HTTP 错误（401, 403 等）
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (error.response?.status === 403) {
      console.error("权限不足", error.response.data?.msg);
    }

    // 如果后端返回了 Result 格式的错误
    if (error.response?.data) {
      const result = error.response.data;
      return Promise.reject({
        success: false,
        message: result.msg || "请求失败",
        data: null,
      });
    }

    // 网络错误等其他情况
    return Promise.reject({
      success: false,
      message: error.message || "网络错误，请检查网络连接",
      data: null,
    });
  }
);

export default request;
