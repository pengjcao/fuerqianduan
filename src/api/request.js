import axios from "axios";

// 根据环境决定 baseURL
// 开发环境：使用 /api，由 Vite 代理转发到后端（见 vite.config.js）
// 生产环境：同样使用 /api，由 Nginx 将 /api 转发到后端 8080
// 这样前端和后端在浏览器看来是同源访问，不再触发浏览器的 CORS 校验
const baseURL = "/api";

// 创建 axios 实例
const request = axios.create({
  baseURL,
  timeout: 120000,
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
    if (config.data instanceof FormData) {
      // 删除可能存在的 Content-Type，让浏览器自动设置（包含 boundary）
      delete config.headers["Content-Type"];
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

    if (error.response?.status === 413) {
      return Promise.reject({
        success: false,
        message: "上传文件过大，请压缩文件或联系管理员调整上传大小限制",
        data: null,
      });
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
