import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  message,
  Space,
  Typography,
  Row,
  Col,
  Modal,
  Divider,
  Tabs,
  Select,
  Upload,
  Tag,
} from "antd";
import {
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  InboxOutlined,
  LinkOutlined,
  ArrowLeftOutlined,
  FileOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  keshiDepartmentApi,
  professionalGroupMemberApi,
  institutionFileSystemApi,
} from "../api";
import { AuthContext } from "../context/AuthContext";

const { TextArea, Link } = Input;
const { Dragger } = Upload;

const { Title, Text } = Typography;

function KeshiManagement() {
  const { hasRole, currentUser } = useContext(AuthContext);
  const { id, groupId } = useParams();
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const [professionalGroups, setProfessionalGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  // 文件体系相关状态
  const [fileSystems, setFileSystems] = useState([]);
  const [fileSystemsLoading, setFileSystemsLoading] = useState(false);
  const [createFileSystemModalVisible, setCreateFileSystemModalVisible] = useState(false);
  const [fileSystemForm] = Form.useForm();
  const [selectedFileSystem, setSelectedFileSystem] = useState(null);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [overwriteModalVisible, setOverwriteModalVisible] = useState(false);
  const [overwriting, setOverwriting] = useState(false);
  const [overwriteForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fileHistory, setFileHistory] = useState([]);

  // 审批者和研究者（可以创建科室、新建文件体系、管理文件）：管理员 + 研究者 + 机构办秘书/主任 + 机构主任
  const isApprover = hasRole(["admin", "pi", "secretary", "director", "chief"]);
  // 研究者和审批者都可以新建专业组
  const canCreateGroup = hasRole(["admin", "pi", "secretary", "director", "chief"]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await keshiDepartmentApi.getList();
      if (response.success) {
        setDepartments(response.data || []);
      } else {
        message.error(response.message || "获取科室列表失败");
      }
    } catch (error) {
      console.error("获取科室列表失败:", error);
      message.error(error.message || "获取科室列表失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 当选择了某个科室时，获取该科室下的专业组列表
  const selectedId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const selectedKeshi = useMemo(() => {
    if (!selectedId) return null;
    return (departments || []).find((d) => Number(d?.id) === selectedId) || null;
  }, [departments, selectedId]);

  const fetchProfessionalGroups = async (departmentId) => {
    if (!departmentId) {
      setProfessionalGroups([]);
      return;
    }
    setGroupLoading(true);
    try {
      const response = await keshiDepartmentApi.listProfessionalGroup(departmentId);
      if (response.success) {
        setProfessionalGroups(response.data || []);
      } else {
        message.error(response.message || "获取专业组列表失败");
      }
    } catch (error) {
      console.error("获取专业组列表失败:", error);
      message.error(error.message || "获取专业组列表失败，请重试");
    } finally {
      setGroupLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchProfessionalGroups(selectedId);
    } else {
      setProfessionalGroups([]);
    }
  }, [selectedId]);

  // 当选择了某个专业组时，获取该专业组的详细信息
  const selectedGroupId = useMemo(() => {
    const n = Number(groupId);
    return Number.isFinite(n) ? n : null;
  }, [groupId]);

  useEffect(() => {
    if (selectedGroupId && professionalGroups.length > 0) {
      const group = professionalGroups.find((g) => Number(g?.id) === selectedGroupId);
      setSelectedGroup(group || null);
    } else {
      setSelectedGroup(null);
    }
  }, [selectedGroupId, professionalGroups]);

  // 获取研究团队成员列表
  const fetchTeamMembers = async () => {
    if (!selectedId || !selectedGroup) {
      setTeamMembers([]);
      return;
    }
    setMemberLoading(true);
    try {
      const response = await professionalGroupMemberApi.queryMembers(
        selectedId,
        selectedGroup.groupPath
      );
      if (response.success) {
        setTeamMembers(response.data || []);
      } else {
        message.error(response.message || "获取研究团队成员列表失败");
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("获取研究团队成员列表失败:", error);
      message.error(error.message || "获取研究团队成员列表失败，请重试");
      setTeamMembers([]);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    // 防止 selectedGroupId 已变但 selectedGroup 还是旧值，导致用旧 groupPath 去查
    if (
      selectedGroupId &&
      selectedGroup &&
      Number(selectedGroup?.id) === Number(selectedGroupId)
    ) {
      fetchTeamMembers();
    } else {
      setTeamMembers([]);
    }
  }, [selectedGroupId, selectedGroup]);

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        keshi: values.keshi?.trim(),
      };
      if (!payload.keshi) {
        message.error("科室名称不能为空");
        setSubmitting(false);
        return;
      }
      const response = await keshiDepartmentApi.create(payload);
      if (response.success) {
        message.success("创建科室成功");
        form.resetFields();
        fetchDepartments();
      } else {
        message.error(response.message || "创建科室失败");
      }
    } catch (error) {
      console.error("创建科室失败:", error);
      message.error(error.message || "创建科室失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async (values) => {
    if (!selectedId || !selectedKeshi) {
      message.error("请先选择科室");
      return;
    }
    setGroupSubmitting(true);
    try {
      const groupPath = values.groupPath?.trim();
      if (!groupPath) {
        message.error("专业组名称不能为空");
        setGroupSubmitting(false);
        return;
      }
      const payload = {
        departmentId: selectedId,
        keshi: selectedKeshi.keshi,
        groupPath: groupPath,
        createBy: currentUser?.id || currentUser?.username || "",
      };
      const response = await keshiDepartmentApi.createProfessionalGroup(payload);
      if (response.success) {
        message.success("创建专业组成功");
        groupForm.resetFields();
        setGroupModalVisible(false);
        fetchProfessionalGroups(selectedId);
      } else {
        message.error(response.message || "创建专业组失败");
      }
    } catch (error) {
      console.error("创建专业组失败:", error);
      message.error(error.message || "创建专业组失败，请重试");
    } finally {
      setGroupSubmitting(false);
    }
  };

  const openGroupModal = () => {
    if (!selectedId || !selectedKeshi) {
      message.warning("请先选择科室");
      return;
    }
    groupForm.resetFields();
    setGroupModalVisible(true);
  };

  const closeGroupModal = () => {
    setGroupModalVisible(false);
    groupForm.resetFields();
  };

  // 新建研究团队成员
  const handleCreateMember = async (values) => {
    if (!selectedId || !selectedKeshi || !selectedGroup) {
      message.error("请先选择科室和专业组");
      return;
    }
    setMemberSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("departmentId", selectedId);
      formData.append("keshi", selectedKeshi.keshi);
      formData.append("groupPath", selectedGroup.groupPath);
      formData.append("personType", values.personType);
      formData.append("name", values.name);
      
      // roles 是多选数组，需要转换为字符串或分别添加
      if (values.roles && Array.isArray(values.roles)) {
        values.roles.forEach((role) => {
          formData.append("roles", role);
        });
      }
      
      if (values.resumeText) {
        formData.append("resumeText", values.resumeText);
      }
      
      // 处理文件上传
      if (values.resumeFile && Array.isArray(values.resumeFile) && values.resumeFile.length > 0) {
        const file = values.resumeFile[0];
        if (file.originFileObj) {
          formData.append("resumeFile", file.originFileObj);
        } else if (file instanceof File) {
          formData.append("resumeFile", file);
        }
      }
      
      if (values.gcpCertFile && Array.isArray(values.gcpCertFile) && values.gcpCertFile.length > 0) {
        const file = values.gcpCertFile[0];
        if (file.originFileObj) {
          formData.append("gcpCertFile", file.originFileObj);
        } else if (file instanceof File) {
          formData.append("gcpCertFile", file);
        }
      }
      
      if (values.practiceCertFile && Array.isArray(values.practiceCertFile) && values.practiceCertFile.length > 0) {
        const file = values.practiceCertFile[0];
        if (file.originFileObj) {
          formData.append("practiceCertFile", file.originFileObj);
        } else if (file instanceof File) {
          formData.append("practiceCertFile", file);
        }
      }
      
      formData.append("createBy", currentUser?.id || currentUser?.username || "");

      const response = await professionalGroupMemberApi.addMember(formData);
      if (response.success) {
        message.success("添加研究团队成员成功");
        memberForm.resetFields();
        setMemberModalVisible(false);
        fetchTeamMembers();
      } else {
        message.error(response.message || "添加研究团队成员失败");
      }
    } catch (error) {
      console.error("添加研究团队成员失败:", error);
      message.error(error.message || "添加研究团队成员失败，请重试");
    } finally {
      setMemberSubmitting(false);
    }
  };

  const openMemberModal = () => {
    if (!selectedId || !selectedKeshi || !selectedGroup) {
      message.warning("请先选择科室和专业组");
      return;
    }
    memberForm.resetFields();
    setMemberModalVisible(true);
  };

  const closeMemberModal = () => {
    setMemberModalVisible(false);
    memberForm.resetFields();
  };

  // 解析专业组路径，判断是否有两级（用斜杠分开）
  const parseGroupPath = (groupPath) => {
    if (!groupPath) return { level1: "", level2: null };
    const parts = groupPath.split("/").map((s) => s.trim());
    if (parts.length === 1) {
      return { level1: parts[0], level2: null };
    } else if (parts.length >= 2) {
      return { level1: parts[0], level2: parts.slice(1).join("/") };
    }
    return { level1: groupPath, level2: null };
  };

  // ============ 文件体系相关函数 ============
  // 格式化时间（LocalDateTime 数组格式：[year, month, day, hour, minute, second]）
  const formatDate = (dateArray) => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 5) {
      return "未知";
    }
    try {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray;
      const date = new Date(year, month - 1, day, hour, minute, second);
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

  // 获取文件体系列表
  const fetchFileSystems = async () => {
    setFileSystemsLoading(true);
    try {
      // 专业组详情页下：按当前科室 + 专业组路径过滤（后端已做权限校验，前端只负责透传）
      const response = await institutionFileSystemApi.getList(
        selectedKeshi?.keshi,
        selectedGroup?.groupPath
      );
      if (response.success) {
        setFileSystems(response.data || []);
      } else {
        message.error(response.message || "获取文件体系列表失败");
        setFileSystems([]);
      }
    } catch (error) {
      console.error("Failed to fetch file systems:", error);
      message.error(error.message || "获取文件体系列表失败，请重试");
      setFileSystems([]);
    } finally {
      setFileSystemsLoading(false);
    }
  };

  // 当进入专业组详情页时，加载文件体系列表
  useEffect(() => {
    // 防止 selectedGroupId 已变但 selectedGroup 还是旧值，导致用旧 groupPath 去查
    if (
      selectedGroupId &&
      selectedGroup &&
      Number(selectedGroup?.id) === Number(selectedGroupId)
    ) {
      fetchFileSystems();
    } else {
      setFileSystems([]);
      setSelectedFileSystem(null);
      setFiles([]);
    }
  }, [selectedGroupId, selectedGroup]);

  // 切换专业组时：重置“文件体系”Tab 内部状态，避免还停留在上一个专业组的文件列表/弹窗
  useEffect(() => {
    if (!selectedGroupId) return;

    setSelectedFileSystem(null);
    setFiles([]);

    // 关闭并清理相关弹窗/临时态
    setCreateFileSystemModalVisible(false);
    fileSystemForm.resetFields();

    setUploadModalVisible(false);
    uploadForm.resetFields();

    setOverwriteModalVisible(false);
    overwriteForm.resetFields();

    setHistoryModalVisible(false);
    setFileHistory([]);

    setSelectedFile(null);
  }, [selectedGroupId]);

  // 处理创建文件体系
  const handleCreateFileSystem = async (values) => {
    try {
      const response = await institutionFileSystemApi.create(
        {
          systemCode: values.systemCode || undefined,
          systemName: values.systemName,
          description: values.description || undefined,
        },
        selectedKeshi?.keshi,
        selectedGroup?.groupPath
      );
      if (response.success) {
        message.success("创建文件体系成功");
        setCreateFileSystemModalVisible(false);
        fileSystemForm.resetFields();
        await fetchFileSystems();
      } else {
        message.error(response.message || "创建文件体系失败");
      }
    } catch (error) {
      console.error("Failed to create file system:", error);
      message.error(error.message || "创建文件体系失败，请重试");
    }
  };

  // 获取文件系统下的文件列表
  const fetchFiles = async (systemId) => {
    setFilesLoading(true);
    try {
      const response = await institutionFileSystemApi.getFilesBySystem(
        systemId,
        selectedKeshi?.keshi,
        selectedGroup?.groupPath
      );
      if (response.success) {
        setFiles(response.data || []);
      } else {
        message.error(response.message || "获取文件列表失败");
        setFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
      message.error(error.message || "获取文件列表失败，请重试");
      setFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  // 查看文件系统详情
  const handleViewFiles = (system) => {
    setSelectedFileSystem(system);
    fetchFiles(system.id);
  };

  // 返回文件体系列表
  const handleBackFromFiles = () => {
    setSelectedFileSystem(null);
    setFiles([]);
  };

  // 处理文件上传
  const handleUpload = async (values) => {
    const { fileList } = values;
    if (!fileList || fileList.length === 0) {
      message.warning("请选择要上传的文件");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("systemId", selectedFileSystem.id);
      
      fileList.forEach((file) => {
        const actualFile = file.originFileObj || file;
        if (actualFile instanceof File) {
          formData.append("files", actualFile);
        }
      });

      const response = await institutionFileSystemApi.uploadFiles(
        formData,
        selectedKeshi?.keshi,
        selectedGroup?.groupPath
      );
      if (response.success) {
        message.success("文件上传成功");
        setUploadModalVisible(false);
        uploadForm.resetFields();
        await fetchFiles(selectedFileSystem.id);
      } else {
        message.error(response.message || "文件上传失败");
      }
    } catch (error) {
      console.error("Failed to upload files:", error);
      message.error(error.message || "文件上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  // 处理覆盖上传
  const handleOverwrite = async (values) => {
    const { file, remark } = values;
    
    if (!file || !Array.isArray(file) || file.length === 0) {
      message.warning("请选择要上传的文件");
      return;
    }

    const fileItem = file[0];
    const actualFile = fileItem.originFileObj || fileItem;
    
    if (!(actualFile instanceof File)) {
      message.warning("文件格式不正确，请重新选择");
      return;
    }

    setOverwriting(true);
    try {
      const formData = new FormData();
      formData.append("fileId", selectedFile.id);
      formData.append("file", actualFile);
      
      if (remark) {
        formData.append("remark", remark);
      }

      const response = await institutionFileSystemApi.overwriteFile(formData);
      if (response.success) {
        message.success("文件覆盖上传成功");
        setOverwriteModalVisible(false);
        overwriteForm.resetFields();
        setSelectedFile(null);
        await fetchFiles(selectedFileSystem.id);
      } else {
        message.error(response.message || "文件覆盖上传失败");
      }
    } catch (error) {
      console.error("Failed to overwrite file:", error);
      message.error(error.message || "文件覆盖上传失败，请重试");
    } finally {
      setOverwriting(false);
    }
  };

  // 打开覆盖上传 Modal
  const handleOpenOverwrite = (file) => {
    setSelectedFile(file);
    setOverwriteModalVisible(true);
    overwriteForm.resetFields();
  };

  // 删除文件体系
  const handleDeleteSystem = (system) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除文件体系"${system.systemName}"吗？删除后该体系下的所有文件也将被删除，此操作不可恢复！`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.deleteSystem(system.id);
          if (response.success) {
            message.success("文件体系删除成功");
            if (selectedFileSystem && selectedFileSystem.id === system.id) {
              setSelectedFileSystem(null);
              setFiles([]);
            }
            await fetchFileSystems();
          } else {
            message.error(response.message || "文件体系删除失败");
          }
        } catch (error) {
          console.error("Failed to delete system:", error);
          message.error(error.message || "文件体系删除失败，请重试");
        }
      },
    });
  };

  // 删除单个文件
  const handleDeleteFile = (file) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除文件"${file.fileName}"吗？此操作不可恢复！`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.deleteFile(file.id);
          if (response.success) {
            message.success("文件删除成功");
            if (selectedFileSystem) {
              await fetchFiles(selectedFileSystem.id);
            }
          } else {
            message.error(response.message || "文件删除失败");
          }
        } catch (error) {
          console.error("Failed to delete file:", error);
          message.error(error.message || "文件删除失败，请重试");
        }
      },
    });
  };

  // 使文件失效（不删除）
  const handleInvalidateFile = (file) => {
    Modal.confirm({
      title: "确认失效",
      content: `确定要将文件"${file.fileName}"设为失效吗？失效后将无法覆盖上传，只能删除。`,
      okText: "确定",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.invalidateFile(file.id);
          if (response.success) {
            message.success("文件已失效");
            if (selectedFileSystem) {
              await fetchFiles(selectedFileSystem.id);
            }
          } else {
            message.error(response.message || "文件失效失败");
          }
        } catch (error) {
          console.error("Failed to invalidate file:", error);
          message.error(error.message || "文件失效失败，请重试");
        }
      },
    });
  };

  // 查看文件历史记录
  const handleViewHistory = async (file) => {
    if (!file || !file.id) {
      message.error("文件ID不存在，无法查询历史记录");
      return;
    }
    
    setSelectedFile(file);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const response = await institutionFileSystemApi.getFileHistory(file.id);
      if (response.success) {
        setFileHistory(response.data || []);
        if (!response.data || response.data.length === 0) {
          message.info("该文件暂无历史记录");
        }
      } else {
        message.error(response.message || "获取历史记录失败");
        setFileHistory([]);
      }
    } catch (error) {
      console.error("Failed to fetch file history:", error);
      message.error(error.message || "获取历史记录失败，请重试");
      setFileHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 文件体系表格列定义
  const fileSystemColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "体系编码",
      dataIndex: "systemCode",
      key: "systemCode",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "体系名称",
      dataIndex: "systemName",
      key: "systemName",
      ellipsis: true,
    },
    {
      title: "创建时间",
      key: "createdTime",
      width: 180,
      render: (_, record) => formatDate(record.createdTime),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleViewFiles(record)}
          >
            查看文件
          </Button>
          {isApprover && record?.isFixed !== true && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSystem(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 文件列表表格列定义
  const fileColumns = [
    {
      title: "序号",
      key: "index",
      width: 70,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "文件ID",
      dataIndex: "id",
      key: "id",
      width: 90,
      align: "center",
    },
    {
      title: "文件名",
      dataIndex: "fileName",
      key: "fileName",
      width: 200,
      ellipsis: {
        showTitle: true,
      },
      render: (text) => (
        <Space size="small">
          <FileOutlined style={{ color: "#1890ff" }} />
          <span style={{ maxWidth: 180, display: "inline-block" }} title={text}>
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: "文件",
      key: "file",
      width: 120,
      render: (_, record) => (
        <a
          href={record.currentPath}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "#1890ff",
          }}
        >
          <LinkOutlined />
          <span>查看/下载</span>
        </a>
      ),
    },
    {
      title: "状态",
      key: "isActive",
      width: 90,
      align: "center",
      render: (_, record) =>
        record?.isActive === 0 ? (
          <Tag color="default">已失效</Tag>
        ) : (
          <Tag color="green">生效</Tag>
        ),
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 100,
      align: "center",
      render: (text) => text || "未知",
    },
    {
      title: "创建时间",
      key: "createdTime",
      width: 160,
      render: (_, record) => formatDate(record.createdTime),
    },
    {
      title: "更新时间",
      key: "updatedTime",
      width: 160,
      render: (_, record) => formatDate(record.updatedTime),
    },
    {
      title: "操作",
      key: "action",
      width: 380,
      fixed: "right",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
            style={{ padding: "0 4px" }}
          >
            历史
          </Button>
          {isApprover && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                disabled={record?.isActive === 0}
                onClick={() => handleOpenOverwrite(record)}
                style={{ padding: "0 4px" }}
              >
                覆盖
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                disabled={record?.isActive === 0}
                onClick={() => handleInvalidateFile(record)}
                style={{ padding: "0 4px" }}
              >
                失效
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFile(record)}
                style={{ padding: "0 4px" }}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const columns = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "科室名称",
      dataIndex: "keshi",
      key: "keshi",
      ellipsis: true,
    },
  ];

  const groupColumns = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "专业组",
      key: "groupPath",
      render: (record) => {
        const { level1, level2 } = parseGroupPath(record.groupPath);
        if (level2) {
          // 两级结构：用缩进显示
          return (
            <div>
              <div>{level1}</div>
              <div style={{ paddingLeft: 24, color: "#666", fontSize: 13 }}>
                └ {level2}
              </div>
            </div>
          );
        }
        return <div>{level1}</div>;
      },
    },
  ];

  // 判断当前页面类型：科室列表、科室详情、专业组详情
  const isDetailPage = !!selectedId;
  const isGroupDetailPage = !!selectedGroupId;

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {isGroupDetailPage
          ? `${selectedGroup?.groupPath || "专业组详情"}`
          : isDetailPage
          ? `${selectedKeshi?.keshi || "科室详情"}`
          : "科室管理"}
      </Title>

      {isGroupDetailPage ? (
        // 专业组详情页：使用 Tabs 组织多个模块
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Space size="large">
              <div>
                <Text type="secondary">科室：</Text>
                <Text strong>{selectedKeshi?.keshi}</Text>
              </div>
              <div>
                <Text type="secondary">专业组：</Text>
                <Text strong>{selectedGroup?.groupPath}</Text>
              </div>
            </Space>
          </div>
          <Tabs
            defaultActiveKey="team"
            items={[
              {
                key: "basic",
                label: "基本条件",
                children: (
                  <div style={{ color: "#999", fontSize: 14, textAlign: "center", padding: 40 }}>
                    基本条件模块，后续开发
                  </div>
                ),
              },
              {
                key: "team",
                label: "研究团队",
                children: (
                  <div>
                    <div style={{ marginBottom: 16, textAlign: "right" }}>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openMemberModal}>
                        新增成员
                      </Button>
                    </div>
                    <Table
                      dataSource={teamMembers}
                      columns={[
                        {
                          title: "序号",
                          key: "index",
                          width: 80,
                          render: (_, __, index) => index + 1,
                        },
                        {
                          title: "姓名",
                          dataIndex: "name",
                          key: "name",
                        },
                        {
                          title: "人员类型",
                          dataIndex: "personType",
                          key: "personType",
                        },
                        {
                          title: "专业组任职",
                          dataIndex: "rolesList",
                          key: "roles",
                          render: (rolesList) => {
                            if (!rolesList || !Array.isArray(rolesList)) return "-";
                            return (
                              <Space size={[0, 8]} wrap>
                                {rolesList.map((role, idx) => (
                                  <Tag key={idx}>{role}</Tag>
                                ))}
                              </Space>
                            );
                          },
                        },
                        {
                          title: "简历",
                          key: "resume",
                          render: (record) => {
                            const parts = [];
                            if (record.resumeText) {
                              parts.push(
                                <div key="text" style={{ marginBottom: 4 }}>
                                  <Text ellipsis style={{ maxWidth: 300, display: "block" }}>
                                    {record.resumeText}
                                  </Text>
                                </div>
                              );
                            }
                            if (record.resumeFileUrl) {
                              parts.push(
                                <div key="file">
                                  <a
                                    href={record.resumeFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#1890ff" }}
                                  >
                                    查看简历文件
                                  </a>
                                </div>
                              );
                            }
                            return parts.length > 0 ? <div>{parts}</div> : "-";
                          },
                        },
                        {
                          title: "证书",
                          key: "certificates",
                          render: (record) => {
                            const certs = [];
                            if (record.gcpCertUrl) {
                              certs.push(
                                <a
                                  key="gcp"
                                  href={record.gcpCertUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    display: "block", 
                                    marginBottom: 4,
                                    color: "#1890ff",
                                    textDecoration: "underline"
                                  }}
                                >
                                  GCP证书
                                </a>
                              );
                            }
                            if (record.practiceCertUrl) {
                              certs.push(
                                <a
                                  key="practice"
                                  href={record.practiceCertUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    display: "block",
                                    color: "#1890ff",
                                    textDecoration: "underline"
                                  }}
                                >
                                  执业证书
                                </a>
                              );
                            }
                            return certs.length > 0 ? <div>{certs}</div> : "-";
                          },
                        },
                      ]}
                      rowKey="id"
                      loading={memberLoading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 个成员`,
                      }}
                    />
                  </div>
                ),
              },
              {
                key: "facility",
                label: "场地设施",
                children: (
                  <div style={{ color: "#999", fontSize: 14, textAlign: "center", padding: 40 }}>
                    场地设施模块，后续开发
                  </div>
                ),
              },
              {
                key: "files",
                label: "文件体系",
                children: (
                  <div>
                    {selectedFileSystem ? (
                      // 文件列表视图
                      <Card
                        title={
                          <Space>
                            <Button
                              type="text"
                              icon={<ArrowLeftOutlined />}
                              onClick={handleBackFromFiles}
                              style={{ padding: 0, marginRight: 8 }}
                            >
                              返回
                            </Button>
                            <span>{selectedFileSystem.systemName}</span>
                            {selectedFileSystem.systemCode && (
                              <Tag color="blue">{selectedFileSystem.systemCode}</Tag>
                            )}
                          </Space>
                        }
                        extra={
                          isApprover ? (
                            <Button
                              type="primary"
                              icon={<UploadOutlined />}
                              onClick={() => setUploadModalVisible(true)}
                            >
                              上传文件
                            </Button>
                          ) : null
                        }
                      >
                        <Table
                          dataSource={files}
                          columns={fileColumns}
                          rowKey="id"
                          loading={filesLoading}
                          scroll={{ x: 1200 }}
                          rowClassName={(record) => (record?.isActive === 0 ? "row-inactive" : "")}
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 个文件`,
                          }}
                          locale={{
                            emptyText: "该文件体系下暂无文件",
                          }}
                        />
                      </Card>
                    ) : (
                      // 文件体系列表视图
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <Title level={4} style={{ margin: 0 }}>
                            文件体系
                          </Title>
                          <Space>
                            {isApprover && (
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setCreateFileSystemModalVisible(true)}
                              >
                                新建文件体系
                              </Button>
                            )}
                            <Button
                              icon={<ReloadOutlined />}
                              onClick={fetchFileSystems}
                              loading={fileSystemsLoading}
                            >
                              刷新
                            </Button>
                          </Space>
                        </div>
                        <Table
                          dataSource={fileSystems}
                          columns={fileSystemColumns}
                          rowKey="id"
                          loading={fileSystemsLoading}
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条记录`,
                          }}
                          locale={{
                            emptyText: "暂无文件体系",
                          }}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ) : isDetailPage ? (
        // 科室详情页：显示该科室的专业组列表
        <Card
          title="专业组管理"
          extra={
            canCreateGroup && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openGroupModal}>
                新建专业组
              </Button>
            )
          }
        >
          <div style={{ marginBottom: 24 }}>
            <Space size="large">
              <div>
                <Text type="secondary">科室ID：</Text>
                <Text strong>{selectedKeshi?.id}</Text>
              </div>
              <div>
                <Text type="secondary">科室名称：</Text>
                <Text strong>{selectedKeshi?.keshi}</Text>
              </div>
            </Space>
          </div>
          <Divider />
          <Table
            dataSource={professionalGroups}
            columns={groupColumns}
            rowKey="id"
            loading={groupLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个专业组`,
            }}
          />
        </Card>
      ) : (
        // 科室列表页：显示所有科室
        <Card
          title="科室列表"
          extra={
            isApprover && (
              <Form
                form={form}
                layout="inline"
                onFinish={handleCreate}
                initialValues={{ keshi: "" }}
              >
                <Form.Item
                  name="keshi"
                  rules={[{ required: true, message: "请输入科室名称" }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="新建科室名称" style={{ width: 220 }} />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    新建科室
                  </Button>
                </Form.Item>
              </Form>
            )
          }
        >
          <div style={{ color: "#999", fontSize: 12, marginBottom: 12 }}>
            说明：点击侧边栏中的具体科室进入该科室的专业组管理页面。
          </div>
          <Table
            dataSource={departments}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个科室`,
            }}
          />
        </Card>
      )}

      {/* 新建专业组弹窗 */}
      <Modal
        title="新建专业组"
        open={groupModalVisible}
        onCancel={closeGroupModal}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleCreateGroup}
          initialValues={{ groupPath: "" }}
        >
          <Form.Item label="当前科室">
            <Input value={selectedKeshi?.keshi || ""} disabled />
          </Form.Item>

          <Form.Item
            label="专业组名称"
            name="groupPath"
            rules={[{ required: true, message: "请输入专业组名称" }]}
            extra={
              <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
                支持两级结构，用斜杠（/）分隔，例如：<br />
                一级：心血管专业组1号<br />
                两级：心血管专业组2号/肾病移植项目
              </div>
            }
          >
            <Input placeholder="请输入专业组名称，支持用 / 分隔两级结构" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={groupSubmitting}>
                创建
              </Button>
              <Button onClick={closeGroupModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建研究团队成员弹窗 */}
      <Modal
        title="新增研究团队成员"
        open={memberModalVisible}
        onCancel={closeMemberModal}
        footer={null}
        width={680}
        destroyOnClose
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleCreateMember}
          initialValues={{
            personType: undefined,
            name: "",
            roles: [],
            resumeText: "",
          }}
        >
          <Form.Item label="当前科室">
            <Input value={selectedKeshi?.keshi || ""} disabled />
          </Form.Item>

          <Form.Item label="当前专业组">
            <Input value={selectedGroup?.groupPath || ""} disabled />
          </Form.Item>

          <Form.Item
            label="人员类型"
            name="personType"
            rules={[{ required: true, message: "请选择人员类型" }]}
          >
            <Select placeholder="请选择人员类型">
              <Select.Option value="研究医生">研究医生</Select.Option>
              <Select.Option value="研究护士">研究护士</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="专业组任职"
            name="roles"
            extra="可多选，至少选择一项"
          >
            <Select
              mode="multiple"
              placeholder="请选择专业组任职"
              allowClear
            >
              <Select.Option value="专业组组长">专业组组长</Select.Option>
              <Select.Option value="主要研究者">主要研究者</Select.Option>
              <Select.Option value="专业组质控员">专业组质控员</Select.Option>
              <Select.Option value="专业组药品管理员">专业组药品管理员</Select.Option>
              <Select.Option value="专业组器械管理员">专业组器械管理员</Select.Option>
              <Select.Option value="专业组样本管理员">专业组样本管理员</Select.Option>
              <Select.Option value="专业组设备管理员">专业组设备管理员</Select.Option>
              <Select.Option value="无">无</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="简历文本"
            name="resumeText"
          >
            <TextArea
              rows={4}
              placeholder="请输入简历文本（可选）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="简历文件"
            name="resumeFile"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList || [];
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
              支持 PDF、Word 格式
            </div>
          </Form.Item>

          <Form.Item
            label="GCP证书"
            name="gcpCertFile"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList || [];
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
              支持 PDF、图片格式
            </div>
          </Form.Item>

          <Form.Item
            label="执业证书"
            name="practiceCertFile"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList || [];
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
              支持 PDF、图片格式
            </div>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={memberSubmitting}>
                提交
              </Button>
              <Button onClick={closeMemberModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 文件体系相关 Modal */}
      {/* 创建文件体系 Modal */}
      <Modal
        title="新建文件体系"
        open={createFileSystemModalVisible}
        onCancel={() => {
          setCreateFileSystemModalVisible(false);
          fileSystemForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={fileSystemForm}
          layout="vertical"
          onFinish={handleCreateFileSystem}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="体系编码"
            name="systemCode"
            rules={[
              {
                max: 100,
                message: "体系编码不能超过100个字符",
              },
            ]}
          >
            <Input placeholder="请输入体系编码（可选）" />
          </Form.Item>

          <Form.Item
            label="体系名称"
            name="systemName"
            rules={[
              {
                required: true,
                message: "请输入体系名称",
              },
              {
                max: 200,
                message: "体系名称不能超过200个字符",
              },
            ]}
          >
            <Input placeholder="请输入体系名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[
              {
                max: 500,
                message: "描述不能超过500个字符",
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请输入描述（可选）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button
                onClick={() => {
                  setCreateFileSystemModalVisible(false);
                  fileSystemForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传文件 Modal */}
      <Modal
        title="上传文件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="选择文件"
            name="fileList"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
            rules={[
              {
                required: true,
                message: "请选择要上传的文件",
              },
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    return Promise.reject(new Error("请至少选择一个文件"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Dragger
              multiple
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                点击或拖拽文件到此区域上传
              </p>
              <p className="ant-upload-hint">
                支持多文件上传，支持 PDF、Word、Excel、图片、压缩包等格式
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                icon={<UploadOutlined />}
              >
                上传
              </Button>
              <Button
                onClick={() => {
                  setUploadModalVisible(false);
                  uploadForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 覆盖上传 Modal */}
      <Modal
        title={`覆盖上传 - ${selectedFile?.fileName || ""}`}
        open={overwriteModalVisible}
        onCancel={() => {
          setOverwriteModalVisible(false);
          overwriteForm.resetFields();
          setSelectedFile(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={overwriteForm}
          layout="vertical"
          onFinish={handleOverwrite}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="选择新文件"
            name="file"
            rules={[
              {
                required: true,
                message: "请选择要上传的文件",
              },
              {
                validator: (_, value) => {
                  if (!value || !Array.isArray(value) || value.length === 0) {
                    return Promise.reject(new Error("请选择要上传的文件"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList || [];
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip,.rar"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="备注（可选）"
            name="remark"
            rules={[
              {
                max: 200,
                message: "备注不能超过200个字符",
              },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入备注信息（可选）"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={overwriting}
                icon={<EditOutlined />}
              >
                覆盖上传
              </Button>
              <Button
                onClick={() => {
                  setOverwriteModalVisible(false);
                  overwriteForm.resetFields();
                  setSelectedFile(null);
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史记录 Modal */}
      <Modal
        title={`文件历史记录 - ${selectedFile?.fileName || ""}`}
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedFile(null);
          setFileHistory([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setHistoryModalVisible(false);
              setSelectedFile(null);
              setFileHistory([]);
            }}
          >
            关闭
          </Button>,
        ]}
        width={800}
      >
        <Table
          dataSource={fileHistory}
          columns={[
            {
              title: "文件名",
              dataIndex: "fileName",
              key: "fileName",
              ellipsis: true,
              render: (text, record) => (
                <Space>
                  <FileOutlined />
                  <span>{text}</span>
                </Space>
              ),
            },
            {
              title: "文件",
              key: "file",
              width: 200,
              render: (_, record) => (
                <a
                  href={record.currentPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#1890ff",
                  }}
                >
                  <LinkOutlined />
                  <span>查看/下载</span>
                </a>
              ),
            },
            {
              title: "操作人",
              dataIndex: "operatedBy",
              key: "operatedBy",
              width: 120,
              render: (text) => text || "未知",
            },
            {
              title: "备注",
              dataIndex: "remark",
              key: "remark",
              ellipsis: true,
              render: (text) => text || "-",
            },
            {
              title: "操作时间",
              key: "createdTime",
              width: 180,
              render: (_, record) => formatDate(record.createdTime),
            },
          ]}
          rowKey="id"
          loading={historyLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条历史记录`,
          }}
          locale={{
            emptyText: "暂无历史记录",
          }}
        />
      </Modal>

      <style>{`
        .row-inactive {
          background-color: #fafafa;
          color: #999;
        }
        .row-inactive a {
          color: #999 !important;
        }
      `}</style>
    </div>
  );
}

export default KeshiManagement;




