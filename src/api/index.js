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

  // 获取已备案 PI 列表（GET /user/approvedPiList）
  // 如果后端没有此接口，可以暂时使用 getPendingList 然后前端过滤
  getApprovedList: () => request.get("/user/approvedPiList"),

  // 获取已备案 PI 列表（按专业组分组）（GET /user/approvedPiListGroup）
  // 返回: { success: true, data: Map<String, List<PiInfoVO>> } (专业组名称 -> PI列表)
  getApprovedListGroup: () => request.get("/user/approvedPiListGroup"),

  // 提交 PI 信息（POST /user/upload/piinfo）
  // 使用 FormData 格式（multipart/form-data）
  // 注意：不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
  submitPiInfo: (formData) => request.post("/user/upload/piinfo", formData),

  // 审批 PI（POST /user/shenpi）
  // 参数: { userId: string, pi_info_id: number, approve: boolean, comment?: string }
  review: (userId, pi_info_id, approve, comment) =>
    request.post("/user/shenpi", null, {
      params: {
        userId,
        pi_info_id,
        approve,
        comment: comment || "",
      },
    }),

  // 获取研究者自己的审批日志（GET /user/piApprovalLogs）
  // 不需要传递参数，后端从token中获取当前登录的研究者ID
  getApprovalLogs: () => request.get("/user/piApprovalLogs"),

  // 填写药监局备案时间（POST /user/drug-admin-record-time）
  // 参数: { piInfoId: number, recordTime: string } (recordTime格式: "yyyy-MM-dd HH:mm:ss")
  fillDrugAdminRecordTime: (piInfoId, recordTime) =>
    request.post("/user/drug-admin-record-time", null, {
      params: {
        piInfoId,
        recordTime,
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

// 部门相关 API（用于通知分组等功能，老接口）
export const departmentApi = {
  // 获取部门列表（GET /user/department 或 /admin/department）
  getList: () => request.get("/user/department"),

  // 获取部门用户列表（GET /user/departmentuser?keshi=xxx）
  getUsers: (keshi) =>
    request.get("/user/departmentuser", { params: { keshi } }),
};

// 科室 / 专业组资质 下的科室管理相关 API（新接口）
export const keshiDepartmentApi = {
  // 创建科室（POST /user/keshi_zhaunyezu/creatkeshi）
  // 参数: { keshi: string }
  create: (data) => request.post("/user/keshi_zhaunyezu/creatkeshi", data),

  // 获取科室列表（GET /user/keshi_zhaunyezu/listkeshi）
  // 返回: Array<{ id: number, keshi: string, professionalGroup: string }>
  getList: () => request.get("/user/keshi_zhaunyezu/listkeshi"),

  // 创建科室专业组（POST /user/keshi_zhaunyezu/create-professional-group）
  // 参数: { departmentId: number, keshi: string, groupPath: string, createBy: string }
  createProfessionalGroup: (data) =>
    request.post("/user/keshi_zhaunyezu/create-professional-group", data),

  // 查询科室下的专业组（GET /user/keshi_zhaunyezu/list-professional-group?departmentId=xxx）
  // 返回: Array<{ id: number, departmentId: number, keshi: string, groupPath: string }>
  listProfessionalGroup: (departmentId) =>
    request.get("/user/keshi_zhaunyezu/list-professional-group", {
      params: { departmentId },
    }),
};

// 专业组成员（研究团队）相关 API
export const professionalGroupMemberApi = {
  // 新增研究团队成员（POST /user/professional-group-members/add-member）
  // 参数: FormData (包含 departmentId, keshi, groupPath, personType, name, roles, resumeText, resumeFile, gcpCertFile, practiceCertFile, createBy)
  addMember: (formData) =>
    request.post("/user/professional-group-members/add-member", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // 查询研究团队成员（GET /user/professional-group-members/query-members?departmentId=xxx&groupPath=xxx）
  // 返回: Array<ProfessionalGroupMemberVO>
  queryMembers: (departmentId, groupPath) =>
    request.get("/user/professional-group-members/query-members", {
      params: { departmentId, groupPath },
    }),
};

// 机构团队成员相关 API
export const institutionTeamMemberApi = {
  // 保存或更新机构团队成员（POST /user/institution/save）
  // 使用 FormData 格式（multipart/form-data）
  save: (formData) => request.post("/user/institution/save", formData),

  // 获取机构团队成员列表（GET /user/institution/list）
  getList: () => request.get("/user/institution/list"),

  // 删除机构团队成员（DELETE /user/institution/delete/{ziziId}）
  delete: (ziziId) => request.delete(`/user/institution/delete/${ziziId}`),
};

// 机构文件相关 API（旧版，已废弃）
export const institutionFileApi = {
  // 查询机构制度文件记录（最新文件）（GET /user/institution/fileselect）
  getLatestFiles: () => request.get("/user/institution/fileselect"),

  // 上传【临床试验管理制度】文件（POST /user/institution/trialManagement/upload）
  // 使用 FormData 格式（multipart/form-data）
  uploadTrialManagement: (formData) =>
    request.post("/user/institution/trialManagement/upload", formData),

  // 查询【临床试验管理制度】历史记录列表（GET /user/institution/trialManagement/history）
  getTrialManagementHistory: () =>
    request.get("/user/institution/trialManagement/history"),
};

// 文件体系相关 API（新版）
export const institutionFileSystemApi = {
  // 创建文件体系（POST /user/institution-file-system/create）
  // 参数: { systemCode?: string, systemName: string, description?: string }
  // 返回: { success: true, data: "成功创建文件体系" }
  // 可选参数:
  // - keshi：科室名称
  // - groupPath：专业组路径
  create: (data, keshi, groupPath) =>
    request.post("/user/institution-file-system/create", data, {
      params:
        keshi || groupPath
          ? {
              ...(keshi ? { keshi } : {}),
              ...(groupPath ? { groupPath } : {}),
            }
          : undefined,
    }),

  // 获取文件体系列表（GET /user/institution-file-system/list）
  // 返回: { success: true, data: Array<{ id, systemCode?, systemName, description?, createdTime }> }
  // 可选参数:
  // - keshi：按科室过滤（不传则按后端默认逻辑返回）
  // - groupPath：专业组路径（用于进一步定位到专业组下的文件体系）
  getList: (keshi, groupPath) =>
    request.get("/user/institution-file-system/list", {
      params:
        keshi || groupPath
          ? {
              ...(keshi ? { keshi } : {}),
              ...(groupPath ? { groupPath } : {}),
            }
          : undefined,
    }),

  // 上传文件到文件体系（POST /user/institution-file-system/uploadfile）
  // 参数: FormData { systemId: Long, files: MultipartFile[], keshi?: string, groupPath?: string }
  // 返回: { success: true, data: null }
  uploadFiles: (formData, keshi, groupPath) => {
    // 如果有 keshi 或 groupPath，添加到 FormData
    if (keshi) {
      formData.append("keshi", keshi);
    }
    if (groupPath) {
      formData.append("groupPath", groupPath);
    }
    return request.post("/user/institution-file-system/uploadfile", formData);
  },

  // 查询某个文件体系下的文件列表（GET /user/institution-file-system/query-by-system?systemId=xxx&keshi=xxx&groupPath=xxx）
  // 返回: { success: true, data: Array<{ id, systemId, fileName, currentPath, createdBy, createdTime, updatedTime }> }
  getFilesBySystem: (systemId, keshi, groupPath) =>
    request.get("/user/institution-file-system/query-by-system", {
      params: {
        systemId,
        ...(keshi ? { keshi } : {}),
        ...(groupPath ? { groupPath } : {}),
      },
    }),

  // 覆盖上传文件（POST /user/institution-file-system/overwrite）
  // 参数: FormData { fileId: Long, file: MultipartFile, remark?: string }
  // 返回: { success: true, data: "文件更改成功" }
  overwriteFile: (formData) =>
    request.post("/user/institution-file-system/overwrite", formData),

  // 查询文件历史记录（GET /user/institution-file-system/file-history?fileId=xxx）
  // 返回: { success: true, data: Array<{ id, fileName, currentPath, operatedBy, remark?, createdTime }> }
  getFileHistory: (fileId) =>
    request.get("/user/institution-file-system/file-history", {
      params: { fileId },
    }),

  // 删除文件体系（DELETE /user/institution-file-system/system/delete?systemId=xxx）
  // 参数: systemId (Long)
  // 返回: { success: true, data: "文件体系删除成功" }
  deleteSystem: (systemId) =>
    request.delete("/user/institution-file-system/system/delete", {
      params: { systemId },
    }),

  // 删除单个文件（DELETE /user/institution-file-system/file/delete?fileId=xxx）
  // 参数: fileId (Long)
  // 返回: { success: true, data: "单个文件删除成功" }
  deleteFile: (fileId) =>
    request.delete("/user/institution-file-system/file/delete", {
      params: { fileId },
    }),

  // 使文件失效（POST /user/institution-file-system/file/invalidate?fileId=xxx）
  // 参数: fileId (Long)
  // 返回: { success: true, data: "文件已失效" }
  invalidateFile: (fileId) =>
    request.post("/user/institution-file-system/file/invalidate", null, {
      params: { fileId },
    }),
};

// 系统通知相关 API
export const systemNoticeApi = {
  // 发布通知（POST /user/publishnotice）
  // 使用 FormData 格式（multipart/form-data）
  // 参数: { title: string, content: string, files: File[], groupIds: number[] }
  publish: (formData) => request.post("/user/publishnotice", formData),

  // 获取通知列表（所有用户可见）（GET /user/noticelist）
  // 返回: { success: true, data: Array<{ noticeId, title, content, attachmentUrls, publisherId, publisherRole, createTime }> }
  getList: () => request.get("/user/noticelist"),

  // 获取当前用户所属分组可见的通知（GET /user/noticelist/group）
  // 返回: { success: true, data: Array<{ noticeId, title, content, attachmentUrls, publisherId, publisherRole, createTime }> }
  getListByGroup: () => request.get("/user/noticelist/group"),

  // 获取通知详情（GET /user/detail/{noticeId}）
  // 返回: { success: true, data: { noticeId, title, content, attachmentUrls, publisherId, publisherRole, createTime } }
  getDetail: (noticeId) => request.get(`/user/detail/${noticeId}`),
};

// 通知分组相关 API
export const noticeGroupApi = {
  // 创建通知分组（POST /user/creategroup）
  // 参数: { groupName: string, creatorId: string }
  // 返回: { success: true, data: groupId (number) }
  createGroup: (data) => request.post("/user/creategroup", data),

  // 给分组添加用户（POST /user/group/{groupId}/addUsers）
  // 参数: userIds: string[]
  // 返回: { success: true, data: "用户绑定成功" }
  addUsersToGroup: (groupId, userIds) =>
    request.post(`/user/group/${groupId}/addUsers`, userIds),

  // 获取当前用户创建的所有分组（GET /user/getallGroups）
  // 返回: { success: true, data: Array<{ groupId, groupName, creatorId, userIds }> }
  getList: () => request.get("/user/getallGroups"),

  // 删除分组（DELETE /user/group/{groupId}）
  // 返回: { success: true, data: "分组删除成功" }
  deleteGroup: (groupId) => request.delete(`/user/group/${groupId}`),

  // 查询分组下的所有研究者（GET /user/group/{groupId}/users）
  // 返回: { success: true, data: string[] } (用户ID列表)
  getUsersByGroup: (groupId) => request.get(`/user/group/${groupId}/users`),
};
