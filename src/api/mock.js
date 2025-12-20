import Mock from "mockjs";

// 只在开发环境启用 Mock.js 拦截
// 可以通过环境变量 VITE_USE_MOCK=false 来禁用 mock，使用真实后端
const useMock =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== "false";

if (useMock) {
  console.log(
    "[Mock] Mock.js 已启用，如需使用真实后端，请设置 VITE_USE_MOCK=false"
  );
  Mock.setup({ timeout: "300-800" });

  // ============ 内存数据（体验账号 + 示例数据） ============
  const users = [
    {
      id: "u-admin",
      username: "admin",
      password: "123456",
      role: "admin",
      displayName: "系统管理员",
      dept: "临床试验管理办公室",
    },
    {
      id: "u-secretary",
      username: "secretary",
      password: "123456",
      role: "secretary",
      displayName: "机构办秘书",
      dept: "机构办",
    },
    {
      id: "u-director",
      username: "director",
      password: "123456",
      role: "director",
      displayName: "机构办主任",
      dept: "机构办",
    },
    {
      id: "u-chief",
      username: "chief",
      password: "123456",
      role: "chief",
      displayName: "机构主任",
      dept: "医院",
    },
    {
      id: "u-pi-demo",
      username: "pi",
      password: "123456",
      role: "pi",
      displayName: "示例研究者（PI）",
      dept: "肿瘤科",
    },
    {
      id: "u-viewer",
      username: "viewer",
      password: "123456",
      role: "viewer",
      displayName: "只读访客",
      dept: "外部访客",
    },
  ];

  const piRecords = [
    {
      id: "pi-001",
      title: "重症患者血液净化多中心研究",
      applicant: "张三",
      department: "ICU",
      submitDate: "2025-01-10",
      status: "draft",
      step: "pi",
      attachments: [],
      history: [
        {
          actor: "张三",
          role: "pi",
          action: "create",
          comment: "草稿创建",
          date: "2025-01-10",
        },
      ],
    },
    {
      id: "pi-002",
      title: "PD-1 联合免疫治疗随访",
      applicant: "李四",
      department: "肿瘤科",
      submitDate: "2025-01-08",
      status: "under_secretary",
      step: "secretary",
      attachments: [{ name: "方案V1.pdf", size: "1.2MB" }],
      history: [
        {
          actor: "李四",
          role: "pi",
          action: "submit",
          comment: "提交备案",
          date: "2025-01-08",
        },
      ],
    },
    {
      id: "pi-003",
      title: "新型支架注册研究",
      applicant: "王五",
      department: "心内科",
      submitDate: "2024-12-30",
      status: "completed",
      step: "done",
      attachments: [{ name: "伦理批件.pdf", size: "800KB" }],
      history: [
        {
          actor: "王五",
          role: "pi",
          action: "submit",
          comment: "提交备案",
          date: "2024-12-25",
        },
        {
          actor: "机构办秘书A",
          role: "secretary",
          action: "approve",
          comment: "资料齐全",
          date: "2024-12-26",
        },
        {
          actor: "机构办主任B",
          role: "director",
          action: "approve",
          comment: "同意",
          date: "2024-12-27",
        },
        {
          actor: "机构主任C",
          role: "chief",
          action: "approve",
          comment: "备案完成",
          date: "2024-12-28",
        },
      ],
    },
  ];

  const specialties = [
    {
      id: "dept-internal",
      department: "内科系统",
      groups: [
        {
          name: "呼吸内科",
          primary: ["呼吸内科专业"],
          secondary: ["重症医学专业", "肺部肿瘤相关专业"],
        },
        {
          name: "消化内科",
          primary: ["消化内科专业"],
          secondary: ["消化内镜专业"],
        },
        {
          name: "心内科",
          primary: ["心血管内科专业"],
          secondary: ["介入心脏病学专业"],
        },
      ],
    },
    {
      id: "dept-surgery",
      department: "外科系统",
      groups: [
        {
          name: "普外科",
          primary: ["普通外科专业"],
          secondary: ["肝胆胰外科专病", "甲乳外科专病"],
        },
        {
          name: "骨科",
          primary: ["骨科专业"],
          secondary: ["关节外科", "脊柱外科"],
        },
      ],
    },
  ];

  // 工具函数：生成 token
  const createToken = (userId) => `mock_token_${userId}_${Date.now()}`;

  // ============ 登录 ============
  Mock.mock(/\/api\/auth\/login$/, "post", (options) => {
    try {
      const body = JSON.parse(options.body || "{}");
      const { username, password } = body;
      const user = users.find(
        (u) => u.username === username && u.password === password
      );
      if (!user) {
        return { success: false, message: "账号或密码错误" };
      }
      const { password: _pwd, ...safeUser } = user;
      const token = createToken(user.id);
      return {
        success: true,
        data: { user: safeUser, token },
      };
    } catch {
      return { success: false, message: "登录请求解析失败" };
    }
  });

  // ============ 获取当前用户信息 ============
  Mock.mock(/\/api\/auth\/me$/, "get", (options) => {
    try {
      const authHeader =
        options.headers?.Authorization || options.headers?.authorization;
      const token = authHeader?.replace("Bearer ", "") || "";
      const userId = token.split("_")[2];
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { success: false, message: "未登录或用户不存在" };
      }
      const { password: _pwd, ...safeUser } = user;
      return { success: true, data: safeUser };
    } catch {
      return { success: false, message: "获取用户信息失败" };
    }
  });

  // ============ 注册 ============
  Mock.mock(/\/api\/auth\/register$/, "post", (options) => {
    try {
      const body = JSON.parse(options.body || "{}");
      const { username, password, displayName, role = "pi", dept } = body;
      if (!username || !password) {
        return { success: false, message: "账号和密码必填" };
      }
      if (users.some((u) => u.username === username)) {
        return { success: false, message: "账号已存在" };
      }
      const canRegisterRoles = ["pi", "team", "viewer"];
      if (!canRegisterRoles.includes(role)) {
        return {
          success: false,
          message: "该角色不支持自助注册，请联系机构办公室创建",
        };
      }
      const newUser = {
        id: `u-${Date.now()}`,
        username,
        password,
        role,
        displayName: displayName || username,
        dept: dept || "",
      };
      users.push(newUser);
      const { password: _pwd, ...safeUser } = newUser;
      return { success: true, data: safeUser, message: "注册成功" };
    } catch {
      return { success: false, message: "注册请求解析失败" };
    }
  });

  // ============ PI 备案列表 ============
  Mock.mock(/\/api\/pi-records$/, "get", () => ({
    success: true,
    data: piRecords,
  }));

  // ============ 创建 PI 备案 ============
  Mock.mock(/\/api\/pi-records$/, "post", (options) => {
    try {
      const body = JSON.parse(options.body || "{}");
      const today = new Date().toISOString().slice(0, 10);
      const newRecord = {
        id: `pi-${Date.now()}`,
        status: "draft",
        step: "pi",
        attachments: [],
        history: [
          {
            actor: body.applicant || "PI",
            role: "pi",
            action: "create",
            comment: "草稿创建",
            date: today,
          },
        ],
        ...body,
        submitDate: today,
      };
      piRecords.unshift(newRecord);
      return { success: true, data: newRecord };
    } catch {
      return { success: false, message: "创建 PI 备案失败" };
    }
  });

  // ============ 更新 PI 备案状态 ============
  Mock.mock(/\/api\/pi-records\/[^/]+$/, "patch", (options) => {
    try {
      const url = options.url || "";
      const id = url.split("/").pop();
      const body = JSON.parse(options.body || "{}");
      const { action, comment } = body;
      const record = piRecords.find((r) => r.id === id);
      if (!record) {
        return { success: false, message: "记录不存在" };
      }
      const map = {
        submit: { status: "under_secretary", step: "secretary" },
        approve_secretary: { status: "under_director", step: "director" },
        approve_director: { status: "under_chief", step: "chief" },
        approve_chief: { status: "completed", step: "done" },
        reject: { status: "rejected", step: "pi" },
        resubmit: { status: "under_secretary", step: "secretary" },
      };
      const nextMeta = map[action] || {};
      const today = new Date().toISOString().slice(0, 10);
      let currentUser = null;
      try {
        currentUser = JSON.parse(localStorage.getItem("current_user") || "{}");
      } catch {
        currentUser = null;
      }
      record.status = nextMeta.status || record.status;
      record.step = nextMeta.step || record.step;
      record.history.push({
        actor: currentUser?.displayName || currentUser?.username || "系统",
        role: currentUser?.role || "unknown",
        action,
        comment: comment || "",
        date: today,
      });
      return { success: true, data: record };
    } catch {
      return { success: false, message: "更新 PI 备案失败" };
    }
  });

  // ============ 专业组列表 ============
  Mock.mock(/\/api\/specialties$/, "get", () => ({
    success: true,
    data: specialties,
  }));
} else if (import.meta.env.DEV) {
  console.log("[Mock] Mock.js 已禁用，将使用真实后端 API");
}
