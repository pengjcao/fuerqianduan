import request from "./request";
import "./mock"; // 导入 mock 服务

// 认证相关 API
export const authApi = {
  // 用户登录（POST /user/login）
  // 请求体: { username: string, password: string }
  // 返回: { success: true, data: { id, password, token, role } }
  login: (username, password) =>
    request.post("/user/login", { username, password }),

  // 获取用户角色（GET /user/role?ID=xxx）
  getRole: (ID) => request.get("/user/role", { params: { ID } }),

  // 获取部门列表（GET /user/department）
  getDepartments: () => request.get("/user/department"),

  // 获取部门用户列表（GET /user/departmentuser?keshi=xxx）
  getDepartmentUsers: (keshi) =>
    request.get("/user/departmentuser", { params: { keshi } }),

  // 登出（前端清除 token 即可）
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
  },
};

// PI 备案相关 API
export const piRecordApi = {
  // 获取待审核 PI 列表（GET /user/pendingPiList）
  getPendingList: () => request.get("/user/pendingPiList"),

  // 提交 PI 信息（POST /user/upload/piinfo）
  // 使用 FormData 格式（multipart/form-data）
  // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
  submitPiInfo: (formData) => request.post("/user/upload/piinfo", formData),

  // 审批 PI（POST /user/secretaryReview）
  // 参数: { approve: boolean, comment?: string }
  review: (approve, comment) =>
    request.post("/user/secretaryReview", null, {
      params: {
        approve,
        comment: comment || "",
      },
    }),
};

// 专业组相关 API
export const professionalGroupApi = {
  // 提交专业组信息（POST /user/upload/zhuanyezu）
  // 使用 FormData 格式（multipart/form-data）
  // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
  submit: (formData) => request.post("/user/upload/zhuanyezu", formData),
};

// 部门相关 API
export const departmentApi = {
  // 获取部门列表（GET /user/department 或 /admin/department）
  getList: () => request.get("/user/department"),

  // 获取部门用户列表（GET /user/departmentuser?keshi=xxx）
  getUsers: (keshi) =>
    request.get("/user/departmentuser", { params: { keshi } }),
};
