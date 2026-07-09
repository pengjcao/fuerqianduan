export const groupsSeed = [
  {
    id: "grp-01",
    name: "呼吸与危重症临床试验组",
    specialty: "呼吸/ICU",
    leader: "周立",
    contact: "138-1234-5678",
    members: 18,
    trials: 6,
    status: "active",
    updatedAt: "2025-01-05",
  },
  {
    id: "grp-02",
    name: "肿瘤早筛与免疫专业组",
    specialty: "肿瘤",
    leader: "刘颖",
    contact: "139-0000-8899",
    members: 24,
    trials: 9,
    status: "active",
    updatedAt: "2025-01-03",
  },
  {
    id: "grp-03",
    name: "心血管介入研究组",
    specialty: "心内",
    leader: "王昊",
    contact: "137-0099-1122",
    members: 12,
    trials: 3,
    status: "paused",
    updatedAt: "2024-12-28",
  },
];

export const membersSeed = [
  {
    id: "mem-01",
    name: "张敏",
    role: "研究护士",
    groupId: "grp-01",
    skills: ["方案执行", "受试者管理"],
    status: "active",
    contact: "188-8888-1111",
  },
  {
    id: "mem-02",
    name: "陈俊",
    role: "研究协调员",
    groupId: "grp-02",
    skills: ["中心沟通", "数据核查"],
    status: "active",
    contact: "155-7777-6666",
  },
  {
    id: "mem-03",
    name: "李娜",
    role: "药物管理员",
    groupId: "grp-03",
    skills: ["IMP管理", "温控记录"],
    status: "inactive",
    contact: "177-6666-3333",
  },
];

export const trialsSeed = [];

export const piRecordsSeed = [
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

// 基于“备案专业名称”图片，简化为三级结构：大科室-一级专业-二级专业
export const specialtiesSeed = [
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
