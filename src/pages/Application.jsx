import { useContext, useMemo, useState, useEffect } from "react";
import {
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Row,
  Select,
  Tabs,
  Upload,
  Button,
  Table,
  Divider,
  Space,
  Tag,
  Alert,
  Empty,
  Typography,
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { AppDataContext } from "../context/AppDataContext";
import { AuthContext } from "../context/AuthContext";
import { professionalGroupApi, piRecordApi } from "../api";

const { TextArea } = Input;
const { Dragger } = Upload;

// 备案专业名称（根据文档完整列表）
const SPECIALTY_OPTIONS = [
  // 一级：预防保健科
  { value: "预防保健科", label: "预防保健科" },
  // 一级：全科医疗科
  { value: "全科医疗科", label: "全科医疗科" },
  // 一级：内科
  { value: "内科/呼吸内科专业", label: "内科 - 呼吸内科专业" },
  { value: "内科/消化内科专业", label: "内科 - 消化内科专业" },
  { value: "内科/神经内科专业", label: "内科 - 神经内科专业" },
  { value: "内科/心血管内科专业", label: "内科 - 心血管内科专业" },
  { value: "内科/血液内科专业", label: "内科 - 血液内科专业" },
  { value: "内科/肾病学专业", label: "内科 - 肾病学专业" },
  { value: "内科/内分泌专业", label: "内科 - 内分泌专业" },
  { value: "内科/免疫学专业", label: "内科 - 免疫学专业" },
  { value: "内科/变态反应专业", label: "内科 - 变态反应专业" },
  { value: "内科/老年病专业", label: "内科 - 老年病专业" },
  { value: "内科/其他", label: "内科 - 其他（需填写）" },
  // 一级：外科
  {
    value: "外科/普通外科专业/肝脏移植项目",
    label: "外科 - 普通外科专业 - 肝脏移植项目",
  },
  {
    value: "外科/普通外科专业/胰腺移植项目",
    label: "外科 - 普通外科专业 - 胰腺移植项目",
  },
  {
    value: "外科/普通外科专业/小肠移植项目",
    label: "外科 - 普通外科专业 - 小肠移植项目",
  },
  { value: "外科/神经外科专业", label: "外科 - 神经外科专业" },
  { value: "外科/骨科专业", label: "外科 - 骨科专业" },
  {
    value: "外科/泌尿外科专业/肾病移植项目",
    label: "外科 - 泌尿外科专业 - 肾病移植项目",
  },
  {
    value: "外科/胸外科专业/肺脏移植项目",
    label: "外科 - 胸外科专业 - 肺脏移植项目",
  },
  {
    value: "外科/心脏大血管外科专业/心脏移植项目",
    label: "外科 - 心脏大血管外科专业 - 心脏移植项目",
  },
  { value: "外科/烧伤外科专业", label: "外科 - 烧伤外科专业" },
  { value: "外科/整形外科专业", label: "外科 - 整形外科专业" },
  { value: "外科/其他", label: "外科 - 其他（需填写）" },
  // 一级：妇产科
  { value: "妇产科/妇科专业", label: "妇产科 - 妇科专业" },
  { value: "妇产科/产科专业", label: "妇产科 - 产科专业" },
  { value: "妇产科/计划生育专业", label: "妇产科 - 计划生育专业" },
  { value: "妇产科/优生学专业", label: "妇产科 - 优生学专业" },
  {
    value: "妇产科/生殖健康与不孕症专业",
    label: "妇产科 - 生殖健康与不孕症专业",
  },
  { value: "妇产科/其他", label: "妇产科 - 其他" },
  // 一级：妇女保健科
  { value: "妇女保健科/青春期保健专业", label: "妇女保健科 - 青春期保健专业" },
  { value: "妇女保健科/围产期保健专业", label: "妇女保健科 - 围产期保健专业" },
  { value: "妇女保健科/更年期保健专业", label: "妇女保健科 - 更年期保健专业" },
  {
    value: "妇女保健科/妇女心理卫生专业",
    label: "妇女保健科 - 妇女心理卫生专业",
  },
  { value: "妇女保健科/妇女营养专业", label: "妇女保健科 - 妇女营养专业" },
  { value: "妇女保健科/其他", label: "妇女保健科 - 其他（需填写）" },
  // 一级：儿科
  { value: "儿科/新生儿专业", label: "儿科 - 新生儿专业" },
  { value: "儿科/小儿传染病专业", label: "儿科 - 小儿传染病专业" },
  { value: "儿科/小儿消化专业", label: "儿科 - 小儿消化专业" },
  { value: "儿科/小儿呼吸专业", label: "儿科 - 小儿呼吸专业" },
  { value: "儿科/小儿心脏病专业", label: "儿科 - 小儿心脏病专业" },
  { value: "儿科/小儿肾病专业", label: "儿科 - 小儿肾病专业" },
  { value: "儿科/小儿血液病专业", label: "儿科 - 小儿血液病专业" },
  { value: "儿科/小儿神经病学专业", label: "儿科 - 小儿神经病学专业" },
  { value: "儿科/小儿内分泌专业", label: "儿科 - 小儿内分泌专业" },
  { value: "儿科/小儿遗传病专业", label: "儿科 - 小儿遗传病专业" },
  { value: "儿科/小儿免疫专业", label: "儿科 - 小儿免疫专业" },
  { value: "儿科/其他", label: "儿科 - 其他（需填写）" },
  // 一级：小儿外科
  { value: "小儿外科/小儿普通外科专业", label: "小儿外科 - 小儿普通外科专业" },
  { value: "小儿外科/小儿骨科专业", label: "小儿外科 - 小儿骨科专业" },
  { value: "小儿外科/小儿泌尿外科专业", label: "小儿外科 - 小儿泌尿外科专业" },
  { value: "小儿外科/小儿胸心外科专业", label: "小儿外科 - 小儿胸心外科专业" },
  { value: "小儿外科/小儿神经外科专业", label: "小儿外科 - 小儿神经外科专业" },
  { value: "小儿外科/其他", label: "小儿外科 - 其他（需填写）" },
  // 一级：儿童保健科
  { value: "儿童保健科/眼科", label: "儿童保健科 - 眼科" },
  // 一级：耳鼻咽喉科
  { value: "耳鼻咽喉科/耳科专业", label: "耳鼻咽喉科 - 耳科专业" },
  { value: "耳鼻咽喉科/鼻科专业", label: "耳鼻咽喉科 - 鼻科专业" },
  { value: "耳鼻咽喉科/咽喉科专业", label: "耳鼻咽喉科 - 咽喉科专业" },
  { value: "耳鼻咽喉科/其他", label: "耳鼻咽喉科 - 其他" },
  // 一级：口腔科
  { value: "口腔科/牙体牙髓病专业", label: "口腔科 - 牙体牙髓病专业" },
  { value: "口腔科/牙周病专业", label: "口腔科 - 牙周病专业" },
  { value: "口腔科/口腔粘膜病专业", label: "口腔科 - 口腔粘膜病专业" },
  { value: "口腔科/儿童口腔专业", label: "口腔科 - 儿童口腔专业" },
  { value: "口腔科/口腔颌面外科专业", label: "口腔科 - 口腔颌面外科专业" },
  { value: "口腔科/口腔修复专业", label: "口腔科 - 口腔修复专业" },
  { value: "口腔科/口腔正畸专业", label: "口腔科 - 口腔正畸专业" },
  { value: "口腔科/口腔种植专业", label: "口腔科 - 口腔种植专业" },
  { value: "口腔科/口腔麻醉专业", label: "口腔科 - 口腔麻醉专业" },
  {
    value: "口腔科/口腔颌面医学影像专业",
    label: "口腔科 - 口腔颌面医学影像专业",
  },
  { value: "口腔科/口腔病理专业", label: "口腔科 - 口腔病理专业" },
  { value: "口腔科/预防口腔专业", label: "口腔科 - 预防口腔专业" },
  { value: "口腔科/其他", label: "口腔科 - 其他（需填写）" },
  // 一级：皮肤科
  { value: "皮肤科/医疗美容科", label: "皮肤科 - 医疗美容科" },
  // 一级：精神科
  { value: "精神科/精神病专业", label: "精神科 - 精神病专业" },
  { value: "精神科/精神卫生专业", label: "精神科 - 精神卫生专业" },
  { value: "精神科/药物依赖专业", label: "精神科 - 药物依赖专业" },
  { value: "精神科/精神康复专业", label: "精神科 - 精神康复专业" },
  { value: "精神科/社区防治专业", label: "精神科 - 社区防治专业" },
  { value: "精神科/临床心理专业", label: "精神科 - 临床心理专业" },
  { value: "精神科/司法精神专业", label: "精神科 - 司法精神专业" },
  { value: "精神科/其他", label: "精神科 - 其他（需填写）" },
  // 一级：传染科
  { value: "传染科/结核病科", label: "传染科 - 结核病科" },
  { value: "传染科/地方病科", label: "传染科 - 地方病科" },
  // 一级：肿瘤科
  { value: "肿瘤科", label: "肿瘤科" },
  // 一级：急诊医学科
  { value: "急诊医学科", label: "急诊医学科" },
  // 一级：康复医学科
  { value: "康复医学科", label: "康复医学科" },
  // 一级：运动医学科
  { value: "运动医学科", label: "运动医学科" },
  // 一级：职业病科
  { value: "职业病科/临终关怀科", label: "职业病科 - 临终关怀科" },
  {
    value: "职业病科/特种医学与军事医学科",
    label: "职业病科 - 特种医学与军事医学科",
  },
  // 一级：麻醉科
  { value: "麻醉科", label: "麻醉科" },
  // 一级：疼痛科
  { value: "疼痛科", label: "疼痛科" },
  // 一级：重症医学科
  { value: "重症医学科", label: "重症医学科" },
  // 一级：医学检验科
  { value: "医学检验科", label: "医学检验科" },
  // 一级：病理科
  { value: "病理科", label: "病理科" },
  // 一级：医学影像科
  { value: "医学影像科/X线诊断专业", label: "医学影像科 - X线诊断专业" },
  { value: "医学影像科/CT诊断专业", label: "医学影像科 - CT诊断专业" },
  {
    value: "医学影像科/磁共振成像诊断专业",
    label: "医学影像科 - 磁共振成像诊断专业",
  },
  { value: "医学影像科/核医学专业", label: "医学影像科 - 核医学专业" },
  { value: "医学影像科/超声诊断专业", label: "医学影像科 - 超声诊断专业" },
  { value: "医学影像科/心电诊断专业", label: "医学影像科 - 心电诊断专业" },
  {
    value: "医学影像科/脑电及脑血流图诊断专业",
    label: "医学影像科 - 脑电及脑血流图诊断专业",
  },
  {
    value: "医学影像科/神经肌肉电图专业",
    label: "医学影像科 - 神经肌肉电图专业",
  },
  { value: "医学影像科/介入放射学专业", label: "医学影像科 - 介入放射学专业" },
  { value: "医学影像科/放射治疗专业", label: "医学影像科 - 放射治疗专业" },
  { value: "医学影像科/其他", label: "医学影像科 - 其他（需填写）" },
  // 一级：中医科
  { value: "中医科/内科专业", label: "中医科 - 内科专业" },
  { value: "中医科/外科专业", label: "中医科 - 外科专业" },
  { value: "中医科/妇产科专业", label: "中医科 - 妇产科专业" },
  { value: "中医科/儿科专业", label: "中医科 - 儿科专业" },
  { value: "中医科/皮肤科专业", label: "中医科 - 皮肤科专业" },
  { value: "中医科/眼科专业", label: "中医科 - 眼科专业" },
  { value: "中医科/耳鼻咽喉科", label: "中医科 - 耳鼻咽喉科" },
  { value: "中医科/口腔科专业", label: "中医科 - 口腔科专业" },
  { value: "中医科/肿瘤科专业", label: "中医科 - 肿瘤科专业" },
  { value: "中医科/骨伤科专业", label: "中医科 - 骨伤科专业" },
  { value: "中医科/肛肠科专业", label: "中医科 - 肛肠科专业" },
  { value: "中医科/老年病科专业", label: "中医科 - 老年病科专业" },
  { value: "中医科/针灸科专业", label: "中医科 - 针灸科专业" },
  { value: "中医科/推拿科专业", label: "中医科 - 推拿科专业" },
  { value: "中医科/康复医学专业", label: "中医科 - 康复医学专业" },
  { value: "中医科/急诊科专业", label: "中医科 - 急诊科专业" },
  { value: "中医科/预防保健科专业", label: "中医科 - 预防保健科专业" },
  { value: "中医科/其他", label: "中医科 - 其他（需填写）" },
  // 一级：民族医学科
  { value: "民族医学科/中西医结合科", label: "民族医学科 - 中西医结合科" },
  {
    value: "民族医学科/重症监护室（综合）",
    label: "民族医学科 - 重症监护室（综合）",
  },
  // 一级：其他
  {
    value: "其他/I期临床试验研究室/I期药物临床试验",
    label: "其他 - I期临床试验研究室 - I期药物临床试验",
  },
  {
    value: "其他/I期临床试验研究室/生物等效性试验",
    label: "其他 - I期临床试验研究室 - 生物等效性试验",
  },
  { value: "其他/其他", label: "其他 - 其他（需填写）" },
];

const statusDisplay = {
  draft: "草稿",
  under_secretary: "机构办秘书待审核",
  under_director: "机构办主任待审核",
  under_chief: "机构主任待审核",
  completed: "待填写PI备案时间",
  rejected: "已驳回（需重新提交）",
};

function Application() {
  const { addPiRecord, piRecords, progressPiRecord } =
    useContext(AppDataContext);
  const { currentUser, hasRole, roleLabels } = useContext(AuthContext);

  const [types, setTypes] = useState({ group: true, pi: true });

  // 新增专业组表单
  const [groupForm, setGroupForm] = useState({
    trialTypes: [],
    specialty: "",
    campus: [],
    selfReport: null,
  });

  // 新增 PI 表单
  const [piForm, setPiForm] = useState(() => {
    // 使用初始化函数生成 ID，避免在 render 中调用不纯函数
    const generateId = () =>
      `proof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      trialTypes: [],
      specialty: "",
      piPhoto: null, // PI形象照
      idCardCopy: null, // 身份证复印件
      seniorTitleCertificate: null, // 高级职称证书
      seniorTitleAppointment: null, // 高级职称受聘证明文件
      signedResume: null, // 签字版简历
      qualificationCertificate: null, // 资格证书
      practiceCertificate: null, // 执业证书
      gcpCertificate: null, // GCP证书
      expertise: "", // 擅长领域
      // 参与临床试验证明材料（动态添加）
      trialProofs: [
        {
          id: generateId(), // 唯一标识
          projectName: "", // 项目名称
          approvalDoc: [], // 国家药监局批件
          authorizationTable: [], // 授权分工表
          trainingRecord: [], // 培训记录表
          processFiles: [], // 参与试验的过程性文件
          centerSummary: [], // 结题证明文件如分中心小结表
          otherFiles: [], // 其他证明材料
        },
      ],
      // 若所有证明材料都删除，显示此说明原因
      noProofReason: "",
    };
  });

  const [toast, setToast] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("group"); // 控制当前激活的标签页
  
  // 审批日志相关状态
  const [approvalLogs, setApprovalLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const toggleType = (key) => {
    setTypes((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      // 如果勾选"新增专业组"，必须同时勾选"新增主要研究者（PI）"
      if (key === "group" && newState.group) {
        newState.pi = true;
      }
      return newState;
    });
  };

  const handleFile = (setter, key) => (file) => {
    // Ant Design Upload 组件传递的 file 对象结构：
    // 如果是新上传的文件：{ originFileObj: File, ... }
    // 我们需要保存这个对象，以便后续访问 originFileObj
    setter((prev) => ({
      ...prev,
      [key]: file, // 保存完整的文件对象（包含 originFileObj）
    }));
    return false; // 阻止自动上传，仅做前端展示
  };

  // 通用文件预览：优先使用 url，其次使用浏览器临时 URL
  const handlePreview = async (file) => {
    let src = file.url;
    if (!src && file.originFileObj) {
      src = URL.createObjectURL(file.originFileObj);
    }
    if (src) {
      window.open(src, "_blank", "noopener,noreferrer");
    } else {
      message.info("当前文件暂不支持在线预览，仅记录名称和大小。");
    }
  };

  // 处理证明材料中的多文件上传
  const handleProofFile = (proofId, fieldName) => (file) => {
    setPiForm((prev) => {
      const newProofs = [...prev.trialProofs];
      const proofIndex = newProofs.findIndex((p) => p.id === proofId);
      if (proofIndex !== -1) {
        // 保存完整的 File 对象（Ant Design Upload 组件会包装为 { originFileObj: File, ... }）
        const fileInfo = file.originFileObj ? file : { originFileObj: file };
        newProofs[proofIndex] = {
          ...newProofs[proofIndex],
          [fieldName]: [...(newProofs[proofIndex][fieldName] || []), fileInfo],
        };
      }
      return { ...prev, trialProofs: newProofs };
    });
    return false;
  };

  // 删除证明材料中的文件
  const removeProofFile = (proofId, fieldName, fileIndex) => {
    setPiForm((prev) => {
      const newProofs = [...prev.trialProofs];
      const proofIndex = newProofs.findIndex((p) => p.id === proofId);
      if (proofIndex !== -1) {
        newProofs[proofIndex] = {
          ...newProofs[proofIndex],
          [fieldName]: newProofs[proofIndex][fieldName].filter(
            (_, idx) => idx !== fileIndex
          ),
        };
      }
      return { ...prev, trialProofs: newProofs };
    });
  };

  // 添加证明材料
  const addTrialProof = () => {
    setPiForm((prev) => ({
      ...prev,
      trialProofs: [
        ...prev.trialProofs,
        {
          id: `proof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          projectName: "",
          approvalDoc: [],
          authorizationTable: [],
          trainingRecord: [],
          processFiles: [],
          centerSummary: [],
          otherFiles: [],
        },
      ],
    }));
  };

  // 删除证明材料
  const removeTrialProof = (proofId) => {
    setPiForm((prev) => ({
      ...prev,
      trialProofs: prev.trialProofs.filter((p) => p.id !== proofId),
    }));
  };

  // 提交表单（根据是否勾选新增专业组，调用不同接口）
  const submitForm = async () => {
    if (!hasRole(["pi", "admin"])) {
      setToast("仅 PI 或管理员可提交申请");
      message.error("仅 PI 或管理员可提交申请");
      return;
    }

    try {
      // 构建 FormData，匹配后端 PiInfoDTO 格式
      const formData = new FormData();
      const clinicalFileMappings = [
        { frontKey: "approvalDoc", backendKey: "nmpaApproval" },
        { frontKey: "authorizationTable", backendKey: "delegationTable" },
        { frontKey: "trainingRecord", backendKey: "trainingRecord" },
        { frontKey: "processFiles", backendKey: "processFiles" },
        { frontKey: "centerSummary", backendKey: "completionFiles" },
        { frontKey: "otherFiles", backendKey: "otherFiles" },
      ];
      const getFileObj = (fileObj) => {
        if (!fileObj) return null;
        if (fileObj instanceof File) {
          return fileObj;
        }
        if (fileObj.originFileObj && fileObj.originFileObj instanceof File) {
          return fileObj.originFileObj;
        }
        return null;
      };
      const hasClinicalFiles = (proof) =>
        clinicalFileMappings.some(({ frontKey }) =>
          (proof[frontKey] || []).some((file) => !!getFileObj(file))
        );
      const activeTrialProofs = piForm.trialProofs.filter(
        (proof) => (proof.projectName || "").trim() || hasClinicalFiles(proof)
      );

      // 基本字段
      formData.append("Id", currentUser?.id || "");
      formData.append("professional", types.group ? groupForm.specialty : piForm.specialty || "");
      formData.append("applyType", types.group ? "1" : "0");
      formData.append("shanchang", piForm.expertise || "");
      formData.append("clinicalParticipation", activeTrialProofs.length > 0);
      if (piForm.noProofReason) {
        formData.append("clinicalReason", piForm.noProofReason);
      }

      // 如果勾选了"新增专业组"，需要添加专业组相关字段
      if (types.group) {
        // recordTypes: 将前端的值转换为后端需要的中文名称
        const typeMap = {
          drug: "药物临床试验",
          device: "医疗器械临床试验",
        };
        const recordTypes = groupForm.trialTypes.map(
          (type) => typeMap[type] || type
        );
        recordTypes.forEach((type) => {
          formData.append("recordTypes", type);
        });

        // hospitalAreas: 专业组备案院区
        groupForm.campus.forEach((area) => {
          formData.append("hospitalAreas", area);
        });

        const selfReportFile = getFileObj(groupForm.selfReport);
        if (selfReportFile) {
          formData.append("selfAssessmentReport", selfReportFile);
        }
      }

      // PI相关文件字段
      // PI形象照
      const piPhotoFile = getFileObj(piForm.piPhoto);
      if (piPhotoFile) {
        formData.append("piPhoto", piPhotoFile);
      }

      // 身份证复印件
      const idCardCopyFile = getFileObj(piForm.idCardCopy);
      if (idCardCopyFile) {
        formData.append("idCardCopy", idCardCopyFile);
      }

      // 高级职称证书
      const seniorTitleCertFile = getFileObj(piForm.seniorTitleCertificate);
      if (seniorTitleCertFile) {
        formData.append("seniorTitleCertificate", seniorTitleCertFile);
      }

      // 高级职称受聘证明文件
      const seniorTitleAppointmentFile = getFileObj(
        piForm.seniorTitleAppointment
      );
      if (seniorTitleAppointmentFile) {
        formData.append("seniorTitleAppointment", seniorTitleAppointmentFile);
      }

      // 签字版简历
      const resumeFile = getFileObj(piForm.signedResume);
      if (resumeFile) {
        formData.append("signedResume", resumeFile);
      }

      // 资格证书
      const qualificationFile = getFileObj(piForm.qualificationCertificate);
      if (qualificationFile) {
        formData.append("qualificationCertificate", qualificationFile);
      }

      // 执业证书
      const practiceFile = getFileObj(piForm.practiceCertificate);
      if (practiceFile) {
        formData.append("practiceCertificate", practiceFile);
      }

      // GCP证书
      const gcpFile = getFileObj(piForm.gcpCertificate);
      if (gcpFile) {
        formData.append("gcpCertificate", gcpFile);
      }

      // 参与临床试验证明材料（clinicalMaterials）
      activeTrialProofs.forEach((proof, index) => {
        formData.append(
          `clinicalMaterials[${index}].projectName`,
          proof.projectName || ""
        );

        clinicalFileMappings.forEach(({ frontKey, backendKey }) => {
          (proof[frontKey] || []).forEach((file) => {
            const rawFile = getFileObj(file);
            if (rawFile) {
              formData.append(`clinicalMaterials[${index}].${backendKey}`, rawFile);
            }
          });
        });
      });

      // 根据是否勾选"新增专业组"调用不同接口
      let response;
      if (types.group) {
        // 新增专业组（必须包含PI信息），调用 /zhuanyezu 接口
        response = await professionalGroupApi.submit(formData);
        if (response && response.success) {
          message.success("专业组及PI信息提交成功");
          return;
        } else {
          throw new Error(response?.message || "提交失败");
        }
      } else {
        // 只新增PI，调用 /piinfo 接口
        try {
          await addPiRecord(formData);
          message.success("PI信息提交成功");
          return;
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      message.error(error.message || "提交失败，请重试");
    }
  };


  const isPi = currentUser?.role === "pi";

  // 如果用户信息还未加载，显示加载中
  if (!currentUser) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-heading">专业组及 PI 备案申请</h1>
        <Alert
          message="加载中"
          description="正在加载用户信息..."
          type="info"
          showIcon
        />
      </div>
    );
  }

  // 审核视图相关逻辑（机构办秘书/主任/机构主任）
  const detail = useMemo(
    () => piRecords.find((r) => r.id === detailId),
    [detailId, piRecords]
  );

  const canAct = (record) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (record.status === "under_secretary" && role === "secretary")
      return true;
    if (record.status === "under_director" && role === "director") return true;
    if (record.status === "under_chief" && role === "chief") return true;
    return false;
  };

  const handleAction = async (record, action) => {
    const role = currentUser?.role;
    if (!role) return;
    const mapAction = {
      approve_secretary: {
        allow: record.status === "under_secretary" && role === "secretary",
      },
      approve_director: {
        allow: record.status === "under_director" && role === "director",
      },
      approve_chief: {
        allow: record.status === "under_chief" && role === "chief",
      },
      reject: {
        allow:
          (record.status === "under_secretary" && role === "secretary") ||
          (record.status === "under_director" && role === "director") ||
          (record.status === "under_chief" && role === "chief"),
      },
    };
    const can = mapAction[action]?.allow;
    if (!can) return;

    try {
      // action 可能是 "approve_secretary", "approve_director", "approve_chief", "reject"
      // 后端需要的是 approve (boolean)
      const approve = action.startsWith("approve");

      await progressPiRecord({
        id: record.id,
        action: approve ? "approve" : "reject",
        comment,
      });
      setComment("");
      message.success("操作成功");
    } catch (error) {
      message.error(error.message || "操作失败，请重试");
    }
  };

  const renderActions = (record) => {
    if (!canAct(record)) return null;
    const role = currentUser?.role;
    const actions = [];
    if (record.status === "under_secretary" && role === "secretary") {
      actions.push({ key: "approve_secretary", label: "秘书同意" });
      actions.push({ key: "reject", label: "驳回" });
    }
    if (record.status === "under_director" && role === "director") {
      actions.push({ key: "approve_director", label: "主任同意" });
      actions.push({ key: "reject", label: "驳回" });
    }
    if (record.status === "under_chief" && role === "chief") {
      actions.push({ key: "approve_chief", label: "机构主任同意" });
      actions.push({ key: "reject", label: "驳回" });
    }
    return (
      <div className="table-actions">
        <input
          className="search"
          style={{ minWidth: 160 }}
          placeholder="审批意见（可选）"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {actions.map((a) => (
          <button
            key={a.key}
            className={`btn ${a.key.includes("reject") ? "" : "primary"}`}
            onClick={() => handleAction(record, a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  const filteredForAudit = useMemo(
    () =>
      piRecords.filter((r) =>
        statusFilter === "all" ? true : r.status === statusFilter
      ),
    [piRecords, statusFilter]
  );

  // 获取审批日志
  const fetchApprovalLogs = async () => {
    if (!isPi) return; // 只有研究者才能查看审批日志
    setLoadingLogs(true);
    try {
      const response = await piRecordApi.getApprovalLogs();
      console.log("[Application] 审批日志API响应:", response);
      
      if (response && response.success) {
        // API 成功返回，更新数据（即使为空数组也要更新，因为这是最新状态）
        const data = response.data;
        // 确保 data 是数组格式
        if (Array.isArray(data)) {
          setApprovalLogs(data);
          if (data.length > 0) {
            message.success(`刷新成功，共 ${data.length} 条记录`);
          } else {
            message.info("暂无审批记录");
          }
        } else {
          // 如果返回的不是数组，可能是数据格式问题
          console.warn("[Application] 审批日志数据格式异常:", data);
          setApprovalLogs([]);
          message.warning("数据格式异常，已清空显示");
        }
      } else {
        // API 返回失败，显示错误信息，但不清空已有数据（可能是临时网络问题）
        const errorMsg = response?.message || "获取审批日志失败";
        console.error("[Application] 审批日志API返回失败:", response);
        message.error(errorMsg);
        // 保持当前数据不变，不调用 setApprovalLogs
      }
    } catch (error) {
      console.error("[Application] 获取审批日志异常:", error);
      // 网络错误或其他异常，显示错误，但不清空已有数据
      message.error(error?.message || "获取审批日志失败，请稍后重试");
      // 保持当前数据不变，不调用 setApprovalLogs
    } finally {
      setLoadingLogs(false);
    }
  };

  // 组件挂载时获取审批日志（仅研究者）
  useEffect(() => {
    if (isPi) {
      fetchApprovalLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 格式化时间戳
  const formatLogDate = (timestamp) => {
    if (!timestamp) return "未知";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "未知";
    }
  };

  // 角色名称映射
  const roleNameMap = {
    1: "研究者",
    2: "机构办秘书",
    3: "机构办主任",
    4: "机构主任",
    5: "其他",
  };

  // 状态名称映射
  const statusNameMap = {
    APPROVE: { color: "green", text: "通过" },
    REJECT: { color: "red", text: "驳回" },
    REJECTED: { color: "red", text: "驳回" },
    PENDING_APPROVAL: { color: "orange", text: "待审核" },
  };

  if (!isPi) {
    // 审核视图：机构办秘书 / 主任 / 机构主任
    return (
      <div>
        <h1 className="page-heading">PI 备案审核</h1>
        <Card
          style={{ marginBottom: 16 }}
          title="PI 备案列表"
          extra={
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 220 }}
              allowClear={false}
              size="small"
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="under_secretary">
                机构办秘书待审核
              </Select.Option>
              <Select.Option value="under_director">
                机构办主任待审核
              </Select.Option>
              <Select.Option value="under_chief">机构主任待审核</Select.Option>
              <Select.Option value="completed">
                待填写 PI 备案时间
              </Select.Option>
            </Select>
          }
        >
          <Table
            dataSource={filteredForAudit}
            rowKey="id"
            size="small"
            onRow={(record) => ({
              onClick: () => setDetailId(record.id),
              style: { cursor: "pointer" },
            })}
            columns={[
              { title: "备案项目", dataIndex: "title", key: "title" },
              {
                title: "申请人（PI）",
                dataIndex: "applicant",
                key: "applicant",
              },
              {
                title: "科室/专业",
                dataIndex: "department",
                key: "department",
              },
              {
                title: "审核状态",
                dataIndex: "status",
                key: "status",
                render: (value) => statusDisplay[value] || value,
              },
              {
                title: "当前节点",
                dataIndex: "step",
                key: "step",
              },
              {
                title: "提交日期",
                dataIndex: "submitDate",
                key: "submitDate",
              },
              {
                title: "操作",
                key: "actions",
                render: (_, record) => renderActions(record),
              },
            ]}
          />
        </Card>

        {detail && (
          <Card style={{ marginTop: 12 }} title={`流转记录：${detail.title}`}>
            <div className="small muted" style={{ marginBottom: 8 }}>
              当前节点：{detail.step} · 状态：
              {statusDisplay[detail.status] || detail.status}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作人</th>
                  <th>角色</th>
                  <th>动作</th>
                  <th>意见</th>
                </tr>
              </thead>
              <tbody>
                {detail.history
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.date}</td>
                      <td>{h.actor}</td>
                      <td>{roleLabels[h.role] || h.role}</td>
                      <td>{h.action}</td>
                      <td className="muted">{h.comment || "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  }

  // PI 视图：发起备案申请
  return (
    <div>
      <h1 className="page-heading">专业组及 PI 备案申请</h1>
      {!currentUser && (
        <Alert
          type="warning"
          message="请先登录后再发起备案申请。"
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div className="section-title">备案类型选择</div>
            <div className="small muted">
              参考文档：可勾选 “新增专业组 /
              新增主要研究者（PI）”，系统将展开对应填写板块。
              {types.group && (
                <span style={{ color: "#1890ff", marginLeft: 8 }}>
                  新增专业组后，请至少添加一个主要研究者（PI）。
                </span>
              )}
            </div>
          </Col>
          <Col>
            <Checkbox
              checked={types.group}
              onChange={() => toggleType("group")}
              style={{ marginRight: 12 }}
            >
              新增专业组
            </Checkbox>
            <Checkbox
              checked={types.pi}
              onChange={() => {
                // 如果"新增专业组"已勾选，则不允许取消"新增主要研究者（PI）"
                if (types.group && types.pi) {
                  return;
                }
                toggleType("pi");
              }}
              disabled={types.group}
            >
              新增主要研究者（PI）
            </Checkbox>
          </Col>
        </Row>
      </Card>

      <Tabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          types.pi && {
            key: "pi",
            label: types.group ? "新增专业组及PI" : "新增PI",
            children: (
              <Card>
                <Form layout="vertical" onFinish={submitForm}>
                  {/* 如果勾选了"新增专业组"，显示专业组相关字段 */}
                  {types.group && (
                    <>
                      <Divider orientation="left">专业组备案信息</Divider>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="专业组备案类型（多选）">
                            <Checkbox.Group
                              options={[
                                { label: "药物临床试验", value: "drug" },
                                { label: "医疗器械临床试验", value: "device" },
                              ]}
                              value={groupForm.trialTypes}
                              onChange={(val) =>
                                setGroupForm((prev) => ({
                                  ...prev,
                                  trialTypes: val,
                                }))
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="专业组备案名称（下拉，来源于备案专业名称）">
                            <Select
                              allowClear
                              placeholder="请选择备案专业"
                              value={groupForm.specialty}
                              onChange={(val) => {
                                setGroupForm((prev) => ({
                                  ...prev,
                                  specialty: val,
                                }));
                                // 同时更新PI表单的专业字段
                                setPiForm((prev) => ({
                                  ...prev,
                                  specialty: val,
                                }));
                              }}
                              showSearch
                              filterOption={(input, option) =>
                                (option?.label ?? "")
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                            >
                              {SPECIALTY_OPTIONS.map((option) => (
                                <Select.Option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item label="专业组备案院区（多选）">
                            <Checkbox.Group
                              options={["江南院区", "渝中院区"]}
                              value={groupForm.campus}
                              onChange={(val) =>
                                setGroupForm((prev) => ({ ...prev, campus: val }))
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="专业组自评报告（Word 文档上传）">
                            <Dragger
                              beforeUpload={handleFile(setGroupForm, "selfReport")}
                              maxCount={1}
                              accept=".doc,.docx"
                              style={{ padding: 8, borderStyle: "dashed" }}
                              onPreview={handlePreview}
                            >
                              <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                              </p>
                              <p className="ant-upload-text">
                                点击或拖拽上传自评报告（Word）
                              </p>
                              {groupForm.selfReport && (
                                <p className="small muted">
                                  已选择：{groupForm.selfReport.name}
                                </p>
                              )}
                            </Dragger>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Divider />
                    </>
                  )}

                  {/* PI备案信息 */}
                  <Divider orientation="left">PI备案信息</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="所属专业（下拉，来源于备案专业名称）">
                        <Select
                          placeholder="请选择所属专业"
                          value={piForm.specialty}
                          onChange={(val) =>
                            setPiForm((prev) => ({ ...prev, specialty: val }))
                          }
                          showSearch
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {SPECIALTY_OPTIONS.map((option) => (
                            <Select.Option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="PI 形象照">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "piPhoto")}
                          maxCount={1}
                          accept="image/*"
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传 PI 形象照
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="身份证复印件">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "idCardCopy")}
                          maxCount={1}
                          accept=".pdf,.jpg,.jpeg,.png"
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传身份证复印件
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="高级职称证书">
                        <Upload
                          beforeUpload={handleFile(
                            setPiForm,
                            "seniorTitleCertificate"
                          )}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传高级职称证书
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="高级职称受聘证明文件">
                        <Upload
                          beforeUpload={handleFile(
                            setPiForm,
                            "seniorTitleAppointment"
                          )}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传高级职称受聘证明文件
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="签字版简历">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "signedResume")}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传签字版简历
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="资格证书">
                        <Upload
                          beforeUpload={handleFile(
                            setPiForm,
                            "qualificationCertificate"
                          )}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传资格证书
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="执业证书">
                        <Upload
                          beforeUpload={handleFile(
                            setPiForm,
                            "practiceCertificate"
                          )}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传执业证书
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="GCP 证书">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "gcpCertificate")}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传 GCP 证书
                          </Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="擅长领域 / 研究方向">
                    <TextArea
                      rows={3}
                      value={piForm.expertise}
                      onChange={(e) =>
                        setPiForm((prev) => ({
                          ...prev,
                          expertise: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>

                  <Divider orientation="left">参与临床试验证明材料</Divider>

                  {/* 证明材料列表 */}
                  {piForm.trialProofs.length > 0 ? (
                    <>
                      {piForm.trialProofs.map((proof, proofIndex) => (
                        <Card
                          key={proof.id}
                          title={`参与临床试验证明材料 ${proofIndex + 1}`}
                          size="small"
                          style={{ marginBottom: 16 }}
                          extra={
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeTrialProof(proof.id)}
                              title="删除此证明材料"
                            >
                              删除
                            </Button>
                          }
                        >
                          <Form.Item label="项目名称">
                            <Input
                              placeholder="填写参与的临床试验项目全称"
                              value={proof.projectName}
                              onChange={(e) => {
                                setPiForm((prev) => {
                                  const newProofs = [...prev.trialProofs];
                                  const index = newProofs.findIndex(
                                    (p) => p.id === proof.id
                                  );
                                  if (index !== -1) {
                                    newProofs[index] = {
                                      ...newProofs[index],
                                      projectName: e.target.value,
                                    };
                                  }
                                  return {
                                    ...prev,
                                    trialProofs: newProofs,
                                  };
                                });
                              }}
                            />
                          </Form.Item>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label="国家药监局批件">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "approvalDoc"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传批件扫描件
                                  </Button>
                                </Upload>
                                {proof.approvalDoc.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.approvalDoc.map((file, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={() =>
                                          removeProofFile(
                                            proof.id,
                                            "approvalDoc",
                                            idx
                                          )
                                        }
                                        style={{ marginBottom: 4 }}
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Form.Item>

                              <Form.Item label="授权分工表">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "authorizationTable"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传授权分工文件
                                  </Button>
                                </Upload>
                                {proof.authorizationTable.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.authorizationTable.map(
                                      (file, idx) => (
                                        <Tag
                                          key={idx}
                                          closable
                                          onClose={() =>
                                            removeProofFile(
                                              proof.id,
                                              "authorizationTable",
                                              idx
                                            )
                                          }
                                          style={{ marginBottom: 4 }}
                                        >
                                          {file.name}
                                        </Tag>
                                      )
                                    )}
                                  </div>
                                )}
                              </Form.Item>

                              <Form.Item label="培训记录表">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "trainingRecord"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传培训记录
                                  </Button>
                                </Upload>
                                {proof.trainingRecord.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.trainingRecord.map((file, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={() =>
                                          removeProofFile(
                                            proof.id,
                                            "trainingRecord",
                                            idx
                                          )
                                        }
                                        style={{ marginBottom: 4 }}
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="参与试验的过程性文件">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "processFiles"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传知情同意书、随访记录、检查检验单等
                                  </Button>
                                </Upload>
                                {proof.processFiles.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.processFiles.map((file, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={() =>
                                          removeProofFile(
                                            proof.id,
                                            "processFiles",
                                            idx
                                          )
                                        }
                                        style={{ marginBottom: 4 }}
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Form.Item>

                              <Form.Item label="结题证明文件如分中心小结表">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "centerSummary"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传结题证明文件
                                  </Button>
                                </Upload>
                                {proof.centerSummary.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.centerSummary.map((file, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={() =>
                                          removeProofFile(
                                            proof.id,
                                            "centerSummary",
                                            idx
                                          )
                                        }
                                        style={{ marginBottom: 4 }}
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Form.Item>

                              <Form.Item label="其他证明材料">
                                <Upload
                                  beforeUpload={handleProofFile(
                                    proof.id,
                                    "otherFiles"
                                  )}
                                  multiple
                                  listType="text"
                                  onPreview={handlePreview}
                                >
                                  <Button
                                    type="dashed"
                                    icon={<PaperClipOutlined />}
                                  >
                                    上传其他证明材料
                                  </Button>
                                </Upload>
                                {proof.otherFiles.length > 0 && (
                                  <div style={{ marginTop: 8 }}>
                                    {proof.otherFiles.map((file, idx) => (
                                      <Tag
                                        key={idx}
                                        closable
                                        onClose={() =>
                                          removeProofFile(
                                            proof.id,
                                            "otherFiles",
                                            idx
                                          )
                                        }
                                        style={{ marginBottom: 4 }}
                                      >
                                        {file.name}
                                      </Tag>
                                    ))}
                                  </div>
                                )}
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}

                      {/* 添加证明材料按钮 */}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={addTrialProof}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加参与临床试验证明材料
                        </Button>
                      </Form.Item>
                    </>
                  ) : (
                    <>
                      {/* 若没有任何证明材料，显示不上传的说明原因 */}
                      <Form.Item label="说明原因（若不上传参与临床试验证明材料需填写）">
                        <TextArea
                          rows={4}
                          placeholder="请说明不上传参与临床试验证明材料的原因"
                          value={piForm.noProofReason}
                          onChange={(e) => {
                            setPiForm((prev) => ({
                              ...prev,
                              noProofReason: e.target.value,
                            }));
                          }}
                        />
                      </Form.Item>

                      {/* 即使不上传，也允许后续再添加证明材料 */}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={addTrialProof}
                          block
                          icon={<PlusOutlined />}
                        >
                          添加参与临床试验证明材料
                        </Button>
                      </Form.Item>
                    </>
                  )}

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      {types.group ? "提交专业组及PI备案申请" : "提交PI备案申请"}
                    </Button>
                  </Form.Item>
                  {toast && <p className="small">{toast}</p>}
                </Form>
              </Card>
            ),
          },
          // 我的审批进度 Tab（仅研究者可见）
          isPi && {
            key: "logs",
            label: "我的审批进度",
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    onClick={fetchApprovalLogs}
                    loading={loadingLogs}
                  >
                    刷新
                  </Button>
                </div>
                {loadingLogs ? (
                  <div style={{ textAlign: "center", padding: 40 }}>
                    <Space>
                      <div className="ant-spin ant-spin-spinning">
                        <span className="ant-spin-dot ant-spin-dot-spin">
                          <i></i>
                          <i></i>
                          <i></i>
                          <i></i>
                        </span>
                      </div>
                      <span>加载中...</span>
                    </Space>
                  </div>
                ) : approvalLogs.length === 0 ? (
                  <Empty description="暂无审批记录" />
                ) : (
                  <div>
                    {approvalLogs.map((logGroup, index) => (
                      <Card
                        key={logGroup.piInfoId || index}
                        title={`PI备案 ID: ${logGroup.piInfoId}`}
                        style={{ marginBottom: 16 }}
                        extra={
                          <Space>
                            <Tag
                              color={
                                statusNameMap[logGroup.applyStatus]?.color ||
                                "default"
                              }
                            >
                              {statusNameMap[logGroup.applyStatus]?.text ||
                                logGroup.applyStatus}
                            </Tag>
                            <span>当前步骤: {logGroup.currentStep}</span>
                          </Space>
                        }
                      >
                        <Table
                          dataSource={logGroup.logs || []}
                          rowKey={(record, idx) =>
                            `${logGroup.piInfoId}-${idx}-${record.approveTime}`
                          }
                          pagination={false}
                          size="small"
                          columns={[
                            {
                              title: "审批时间",
                              dataIndex: "approveTime",
                              key: "approveTime",
                              width: 180,
                              render: (time) => formatLogDate(time),
                            },
                            {
                              title: "审批人ID",
                              dataIndex: "approverId",
                              key: "approverId",
                              width: 120,
                            },
                            {
                              title: "审批人角色",
                              dataIndex: "role",
                              key: "role",
                              width: 120,
                              render: (role) => roleNameMap[role] || `角色${role}`,
                            },
                            {
                              title: "步骤",
                              dataIndex: "currentStep",
                              key: "currentStep",
                              width: 80,
                            },
                            {
                              title: "审批结果",
                              dataIndex: "applyStatus",
                              key: "applyStatus",
                              width: 100,
                              render: (status) => {
                                const statusInfo =
                                  statusNameMap[status] ||
                                  statusNameMap[status?.toUpperCase()] || {
                                    color: "default",
                                    text: status || "未知",
                                  };
                                return (
                                  <Tag color={statusInfo.color}>
                                    {statusInfo.text}
                                  </Tag>
                                );
                              },
                            },
                            {
                              title: "审批意见",
                              dataIndex: "comment",
                              key: "comment",
                              ellipsis: true,
                              render: (comment) => comment || "-",
                            },
                          ]}
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            ),
          },
        ].filter(Boolean)}
      />
    </div>
  );
}

export default Application;
