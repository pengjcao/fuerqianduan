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
  Spin,
  Radio,
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
  basicConditionApi,
  siteFacilityApi,
} from "../api";
import { AuthContext } from "../context/AuthContext";
import { formatBackendDateTime } from "../utils/formatBackendDateTime";

const { TextArea } = Input;

const { Title, Text } = Typography;
const { Dragger } = Upload;

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

  // 审批者（可以创建科室）：管理员 + 机构办秘书/主任 + 机构主任
  const isApprover = hasRole(["admin", "secretary", "director", "chief"]);
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
    if (selectedGroupId && selectedGroup) {
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
      if (values.academicPosition) {
        formData.append("academicPosition", values.academicPosition);
      }
      if (values.talentTitle) {
        formData.append("talentTitle", values.talentTitle);
      }
      
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
        await fetchTeamMembers();
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

  const handleMemberUploadPreview = (file) => {
    const rawFile = file?.originFileObj || file;
    const src =
      file?.url ||
      file?.thumbUrl ||
      (rawFile && typeof Blob !== "undefined" && rawFile instanceof Blob
        ? URL.createObjectURL(rawFile)
        : "");

    if (!src) {
      message.info("当前文件暂不支持预览");
      return;
    }

    window.open(src, "_blank", "noopener,noreferrer");

    if (!file?.url && !file?.thumbUrl) {
      window.setTimeout(() => URL.revokeObjectURL(src), 60000);
    }
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

  const isTeamFileImage = (url) => {
    if (!url || typeof url !== "string") return false;
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  };

  const renderTeamFileList = (files) => {
    const visibleFiles = files.filter((file) => file.url);
    if (visibleFiles.length === 0) return "-";

    return (
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        {visibleFiles.map((file) => (
          <a
            key={file.key}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#1890ff",
            }}
          >
            {isTeamFileImage(file.url) ? (
              <img
                src={file.url}
                alt={file.label}
                style={{
                  width: 72,
                  height: 48,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                  flex: "0 0 auto",
                }}
              />
            ) : (
              <FileOutlined style={{ fontSize: 18, flex: "0 0 auto" }} />
            )}
            <span>{file.label}</span>
          </a>
        ))}
      </Space>
    );
  };

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
                  // 基本条件接口的 keshi 必须为「科室管理」里该科室的名称（如心血管），与当前点进哪个专业组无关
                  <BasicConditionTab
                    keshi={selectedKeshi?.keshi}
                    groupPath={selectedGroup?.groupPath}
                    currentUser={currentUser}
                  />
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
                          width: 120,
                        },
                        {
                          title: "学术任职（国家级/省级）",
                          dataIndex: "academicPosition",
                          key: "academicPosition",
                          width: 180,
                          render: (text) => text || "-",
                        },
                        {
                          title: "人才称号",
                          dataIndex: "talentTitle",
                          key: "talentTitle",
                          width: 140,
                          render: (text) => text || "-",
                        },
                        {
                          title: "人员类型",
                          dataIndex: "personType",
                          key: "personType",
                          width: 120,
                        },
                        {
                          title: "专业组任职",
                          dataIndex: "rolesList",
                          key: "roles",
                          width: 220,
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
                          width: 260,
                          render: (_, record) => {
                            if (!record.resumeText && !record.resumeFileUrl) {
                              return "-";
                            }

                            return (
                              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                {record.resumeText ? (
                                  <Text ellipsis style={{ maxWidth: 240, display: "block" }}>
                                    {record.resumeText}
                                  </Text>
                                ) : null}
                                {record.resumeFileUrl
                                  ? renderTeamFileList([
                                      {
                                        key: "resume",
                                        label: "简历文件",
                                        url: record.resumeFileUrl,
                                      },
                                    ])
                                  : null}
                              </Space>
                            );
                          },
                        },
                        {
                          title: "证书",
                          key: "certificates",
                          width: 260,
                          render: (_, record) =>
                            renderTeamFileList([
                              {
                                key: "gcp",
                                label: "GCP证书",
                                url: record.gcpCertUrl,
                              },
                              {
                                key: "practice",
                                label: "执业证书",
                                url: record.practiceCertUrl,
                              },
                            ]),
                        },
                      ]}
                      rowKey="id"
                      loading={memberLoading}
                      scroll={{ x: 1260 }}
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
                  <SiteFacilityTab
                    keshi={selectedKeshi?.keshi}
                    groupPath={selectedGroup?.groupPath}
                  />
                ),
              },
              {
                key: "files",
                label: "文件体系",
                children: (
                  <FileSystemTab
                    keshi={selectedKeshi?.keshi}
                    groupPath={selectedGroup?.groupPath}
                    isApprover={isApprover}
                  />
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
            academicPosition: "",
            talentTitle: "",
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
            label="学术任职（国家级/省级）"
            name="academicPosition"
          >
            <Input placeholder="请输入学术任职（国家级/省级）" />
          </Form.Item>

          <Form.Item
            label="人才称号"
            name="talentTitle"
          >
            <Input placeholder="请输入人才称号" />
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
              onPreview={handleMemberUploadPreview}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
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
              onPreview={handleMemberUploadPreview}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
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
              onPreview={handleMemberUploadPreview}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
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
    </div>
  );
}

/** keshi：科室名称，与 GET /user/basicCondition/detail?keshi= 及 report 请求体一致；groupPath 仅用于页面展示上下文 */
function BasicConditionTab({ keshi, groupPath, currentUser }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailList, setDetailList] = useState([]);

  const campusOptions = useMemo(
    () => [
      { label: "江南院区", value: "江南院区" },
      { label: "渝中院区", value: "渝中院区" },
    ],
    []
  );

  const normUploadFileList = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };

  const appendIfPresent = (formData, key, value) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    formData.append(key, value);
  };

  const appendUploadFile = (formData, key, fileList) => {
    const uploadFile = Array.isArray(fileList) ? fileList[0] : null;
    const rawFile = uploadFile?.originFileObj || uploadFile;
    if (rawFile && typeof Blob !== "undefined" && rawFile instanceof Blob) {
      formData.append(key, rawFile);
    }
  };

  const isLikelyImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  };

  const renderFileCell = (url, label) => {
    if (!url) return "-";
    return (
      <Space direction="vertical" size={4}>
        {isLikelyImageUrl(url) ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              alt=""
              src={url}
              style={{
                maxWidth: 120,
                maxHeight: 72,
                objectFit: "cover",
                display: "block",
              }}
            />
          </a>
        ) : null}
        <a href={url} target="_blank" rel="noopener noreferrer">
          <FileOutlined /> {label}
        </a>
      </Space>
    );
  };

  const fetchDetail = async () => {
    if (!keshi) {
      setDetailList([]);
      return;
    }
    setLoadingDetail(true);
    try {
      // 始终传科室名 keshi（来自 listkeshi 的 keshi 字段），不传 groupPath
      const res = await basicConditionApi.detail(keshi);
      if (res?.success) {
        setDetailList(res.data || []);
      } else {
        setDetailList([]);
        message.error(res?.message || "获取基础条件详情失败");
      }
    } catch (e) {
      console.error("获取基础条件详情失败:", e);
      setDetailList([]);
      message.error(e?.message || "获取基础条件详情失败，请重试");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    // 切换专业组时重置表单（避免串数据）
    form.resetFields();
    form.setFieldsValue({
      campusList: [],
      bedYear: undefined,
      bedCount: undefined,
      inpatientYear: undefined,
      inpatientCount: undefined,
      avgDailyOutpatientYear: undefined,
      avgDailyOutpatientCount: undefined,
      diseaseSource: "",
      departmentPhoto: [],
      departmentIntroduction: [],
    });
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keshi, groupPath]);

  const handleSubmit = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法填报");
      return;
    }
    setSubmitting(true);
    try {
      const campusListStr = Array.isArray(values.campusList)
        ? values.campusList.filter(Boolean).join(",")
        : "";

      const formData = new FormData();
      appendIfPresent(formData, "keshi", keshi);
      appendIfPresent(formData, "createBy", currentUser?.id || currentUser?.username || "");
      appendIfPresent(formData, "campusList", campusListStr);
      appendIfPresent(formData, "bedYear", values.bedYear);
      appendIfPresent(formData, "bedCount", values.bedCount);
      appendIfPresent(formData, "inpatientYear", values.inpatientYear);
      appendIfPresent(formData, "inpatientCount", values.inpatientCount);
      appendIfPresent(
        formData,
        "avgDailyOutpatientYear",
        values.avgDailyOutpatientYear
      );
      appendIfPresent(
        formData,
        "avgDailyOutpatientCount",
        values.avgDailyOutpatientCount
      );
      appendIfPresent(formData, "diseaseSource", values.diseaseSource?.trim());
      appendUploadFile(formData, "departmentPhoto", values.departmentPhoto);
      appendUploadFile(
        formData,
        "departmentIntroduction",
        values.departmentIntroduction
      );

      const res = await basicConditionApi.report(formData);
      if (res?.success) {
        message.success("基础条件填报成功");
        form.setFieldsValue({
          departmentPhoto: [],
          departmentIntroduction: [],
        });
        fetchDetail();
      } else {
        message.error(res?.message || "基础条件填报失败");
      }
    } catch (e) {
      console.error("基础条件填报失败:", e);
      message.error(e?.message || "基础条件填报失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  /** 按 id 倒序，便于“最新一条”与列表阅读一致 */
  const sortedDetailList = useMemo(() => {
    const list = Array.isArray(detailList) ? [...detailList] : [];
    return list.sort((a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0));
  }, [detailList]);

  const latestRecord = sortedDetailList[0] ?? null;

  const fillFromRecord = (record) => {
    if (!record) {
      message.info("暂无可回填的数据");
      return;
    }
    const campuses = (record.campusList || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    form.setFieldsValue({
      campusList: campuses,
      bedYear: record.bedYear ?? undefined,
      bedCount: record.bedCount ?? undefined,
      inpatientYear: record.inpatientYear ?? undefined,
      inpatientCount: record.inpatientCount ?? undefined,
      avgDailyOutpatientYear: record.avgDailyOutpatientYear ?? undefined,
      avgDailyOutpatientCount: record.avgDailyOutpatientCount ?? undefined,
      diseaseSource: record.diseaseSource || "",
      departmentPhoto: [],
      departmentIntroduction: [],
    });
    message.success("已回填到表单，可直接修改后再次提交");
  };

  const setNumberField = (fieldName, rawValue) => {
    const n = rawValue === "" ? undefined : Number(rawValue);
    if (rawValue === "" || Number.isFinite(n)) {
      form.setFieldValue(fieldName, rawValue === "" ? undefined : n);
    }
  };

  const handleDeleteBasicCondition = (record) => {
    if (!record?.id) return;
    Modal.confirm({
      title: "删除基础条件记录",
      content: `确认删除记录 ${record.id} 吗？删除后不可恢复。`,
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: async () => {
        try {
          const res = await basicConditionApi.deleteRecord(record.id);
          if (res?.success) {
            message.success("基础条件记录删除成功");
            await fetchDetail();
          } else {
            message.error(res?.message || "基础条件记录删除失败");
          }
        } catch (e) {
          console.error("基础条件记录删除失败:", e);
          message.error(e?.message || "基础条件记录删除失败，请重试");
        }
      },
    });
  };

  const detailColumns = [
    {
      title: "序号",
      key: "index",
      width: 64,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "记录ID",
      dataIndex: "id",
      key: "id",
      width: 88,
      align: "center",
    },
    {
      title: "创建人工号",
      dataIndex: "createBy",
      key: "createBy",
      width: 110,
      ellipsis: true,
      render: (v) => v || "-",
    },
    {
      title: "科室",
      dataIndex: "keshi",
      key: "keshi",
      width: 120,
      ellipsis: true,
      render: (v) => v || "-",
    },
    {
      title: "备案院区",
      dataIndex: "campusList",
      key: "campusList",
      width: 200,
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "床位年份",
      dataIndex: "bedYear",
      key: "bedYear",
      width: 96,
      align: "center",
      render: (v) => (v === 0 || v ? `${v}年` : "-"),
    },
    {
      title: "床位数",
      dataIndex: "bedCount",
      key: "bedCount",
      width: 88,
      align: "center",
      render: (v) => (v === 0 || v ? v : "-"),
    },
    {
      title: "住院年份",
      dataIndex: "inpatientYear",
      key: "inpatientYear",
      width: 96,
      align: "center",
      render: (v) => (v === 0 || v ? `${v}年` : "-"),
    },
    {
      title: "住院人数（人次/年）",
      dataIndex: "inpatientCount",
      key: "inpatientCount",
      width: 140,
      align: "center",
      render: (v) => (v === 0 || v ? v : "-"),
    },
    {
      title: "门急诊年份",
      dataIndex: "avgDailyOutpatientYear",
      key: "avgDailyOutpatientYear",
      width: 108,
      align: "center",
      render: (v) => (v === 0 || v ? `${v}年` : "-"),
    },
    {
      title: "平均日门急诊量（人次/日）",
      dataIndex: "avgDailyOutpatientCount",
      key: "avgDailyOutpatientCount",
      width: 160,
      align: "center",
      render: (v) => (v === 0 || v ? v : "-"),
    },
    {
      title: "病源病种",
      dataIndex: "diseaseSource",
      key: "diseaseSource",
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "科室合照",
      dataIndex: "departmentPhotoPath",
      key: "departmentPhotoPath",
      width: 180,
      render: (url) => renderFileCell(url, "查看合照"),
    },
    {
      title: "科室介绍",
      dataIndex: "departmentIntroductionPath",
      key: "departmentIntroductionPath",
      width: 180,
      render: (url) => renderFileCell(url, "查看介绍"),
    },
    {
      title: "操作",
      key: "action",
      width: 140,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => fillFromRecord(record)}>
            回填
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBasicCondition(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card bordered={false}>
      <div style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary">科室：</Text>
            <Text strong>{keshi || "-"}</Text>
          </div>
          <div>
            <Text type="secondary">专业组：</Text>
            <Text strong>{groupPath || "-"}</Text>
          </div>
        </Space>
      </div>

      <Card
        size="small"
        style={{ marginBottom: 24, background: "#fafafa" }}
        title="已填报记录（展示）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {sortedDetailList.length} 条
            </Text>
            <Button onClick={fetchDetail} loading={loadingDetail}>
              刷新
            </Button>
            <Button
              disabled={!latestRecord}
              onClick={() => fillFromRecord(latestRecord)}
            >
              用最新一条回填
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingDetail}>
          <Table
            size="small"
            rowKey={(r) => r?.id ?? `${r?.createBy}-${r?.keshi}`}
            dataSource={sortedDetailList}
            columns={detailColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 1760 }}
            locale={{
              emptyText: "暂无基础条件数据，请在下方「填报」区域提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="填报（提交后可在上方列表查看）">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            campusList: [],
            bedYear: undefined,
            bedCount: undefined,
            inpatientYear: undefined,
            inpatientCount: undefined,
            avgDailyOutpatientYear: undefined,
            avgDailyOutpatientCount: undefined,
            diseaseSource: "",
            departmentPhoto: [],
            departmentIntroduction: [],
          }}
        >
          <div style={{ marginBottom: 12, color: "#666" }}>
            提交会调用 <Text code>/user/basicCondition/report</Text>。
            <Text code>keshi</Text> 固定为当前科室名称（如{" "}
            <Text strong>{keshi || "—"}</Text>
            ），与所选专业组无关。
          </div>
          <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="备案院区（可多选）"
              name="campusList"
              rules={[
                {
                  validator: (_, v) => {
                    if (!v || (Array.isArray(v) && v.length === 0)) {
                      return Promise.resolve();
                    }
                    if (!Array.isArray(v)) {
                      return Promise.reject(new Error("备案院区格式不正确"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="请选择备案院区"
                options={campusOptions}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="床位数">
              <Row gutter={8}>
                <Col span={10}>
                  <Form.Item
                    name="bedYear"
                    rules={[
                      { type: "number", min: 1900, max: 2100, message: "请输入正确年份" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="年份"
                      onChange={(e) => setNumberField("bedYear", e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={14}>
                  <Form.Item
                    name="bedCount"
                    rules={[
                      { type: "number", min: 0, message: "床位数不能小于 0" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="请输入床位数"
                      onChange={(e) => setNumberField("bedCount", e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="住院人数">
              <Row gutter={8}>
                <Col span={10}>
                  <Form.Item
                    name="inpatientYear"
                    rules={[
                      { type: "number", min: 1900, max: 2100, message: "请输入正确年份" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="年份"
                      onChange={(e) => setNumberField("inpatientYear", e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={14}>
                  <Form.Item
                    name="inpatientCount"
                    rules={[
                      { type: "number", min: 0, message: "住院人数不能小于 0" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="请输入住院人数"
                      onChange={(e) => setNumberField("inpatientCount", e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="均日门急诊量">
              <Row gutter={8}>
                <Col span={10}>
                  <Form.Item
                    name="avgDailyOutpatientYear"
                    rules={[
                      { type: "number", min: 1900, max: 2100, message: "请输入正确年份" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="年份"
                      onChange={(e) =>
                        setNumberField("avgDailyOutpatientYear", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={14}>
                  <Form.Item
                    name="avgDailyOutpatientCount"
                    rules={[
                      { type: "number", min: 0, message: "均日门急诊量不能小于 0" },
                    ]}
                  >
                    <Input
                      inputMode="numeric"
                      placeholder="请输入均日门急诊量"
                      onChange={(e) =>
                        setNumberField("avgDailyOutpatientCount", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="病源病种" name="diseaseSource">
              <TextArea
                rows={4}
                placeholder="请输入病源病种"
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="科室合照上传"
              name="departmentPhoto"
              valuePropName="fileList"
              getValueFromEvent={normUploadFileList}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".jpg,.jpeg,.png,.webp,.pdf"
              >
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="科室介绍上传"
              name="departmentIntroduction"
              valuePropName="fileList"
              getValueFromEvent={normUploadFileList}
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交填报
            </Button>
            <Button
              onClick={() => {
                form.resetFields();
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
        </Form>
      </Card>
    </Card>
  );
}

function createStorageRoomColumns(involvesTitle, formatYesNo, renderPhotoCell) {
  return [
    {
      title: involvesTitle,
      dataIndex: "hasStorageRoom",
      key: "hasStorageRoom",
      width: 120,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "院区",
      dataIndex: "campus",
      key: "campus",
      width: 140,
      ellipsis: true,
      render: (v) => (v != null ? String(v).trim() : "-"),
    },
    {
      title: "地点",
      dataIndex: "location",
      key: "location",
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "照片",
      dataIndex: "photo",
      key: "photo",
      width: 200,
      render: renderPhotoCell,
    },
    {
      title: "冰箱、温湿度计",
      dataIndex: "hasFridge",
      key: "hasFridge",
      width: 120,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "人员出入记录",
      dataIndex: "hasAccessRecord",
      key: "hasAccessRecord",
      width: 110,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "温湿度记录",
      dataIndex: "hasTempHumidityRecord",
      key: "hasTempHumidityRecord",
      width: 100,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "冰箱台账",
      dataIndex: "hasFridgeAccount",
      key: "hasFridgeAccount",
      width: 90,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "保养/校正/维修记录",
      dataIndex: "hasMaintenanceRecord",
      key: "hasMaintenanceRecord",
      width: 140,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "填报时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 170,
      render: (v) => formatBackendDateTime(v),
    },
  ];
}

/** 场地设施：受试者接待室、资料管理室等 */
function SiteFacilityTab({ keshi, groupPath }) {
  const [receptionForm] = Form.useForm();
  const [managementForm] = Form.useForm();
  const [drugStorageForm] = Form.useForm();
  const [equipmentStorageForm] = Form.useForm();
  const [sampleStorageForm] = Form.useForm();
  const [emergencyEquipmentForm] = Form.useForm();
  const [receptionSubmitting, setReceptionSubmitting] = useState(false);
  const [managementSubmitting, setManagementSubmitting] = useState(false);
  const [drugStorageSubmitting, setDrugStorageSubmitting] = useState(false);
  const [equipmentStorageSubmitting, setEquipmentStorageSubmitting] = useState(false);
  const [sampleStorageSubmitting, setSampleStorageSubmitting] = useState(false);
  const [emergencyEquipmentSubmitting, setEmergencyEquipmentSubmitting] = useState(false);
  const [receptionDetailList, setReceptionDetailList] = useState([]);
  const [managementDetailList, setManagementDetailList] = useState([]);
  const [drugStorageDetailList, setDrugStorageDetailList] = useState([]);
  const [equipmentStorageDetailList, setEquipmentStorageDetailList] = useState([]);
  const [sampleStorageDetailList, setSampleStorageDetailList] = useState([]);
  const [emergencyEquipmentDetailList, setEmergencyEquipmentDetailList] = useState([]);
  const [loadingReceptionDetail, setLoadingReceptionDetail] = useState(false);
  const [loadingManagementDetail, setLoadingManagementDetail] = useState(false);
  const [loadingDrugStorageDetail, setLoadingDrugStorageDetail] = useState(false);
  const [loadingEquipmentStorageDetail, setLoadingEquipmentStorageDetail] = useState(false);
  const [loadingSampleStorageDetail, setLoadingSampleStorageDetail] = useState(false);
  const [loadingEmergencyEquipmentDetail, setLoadingEmergencyEquipmentDetail] =
    useState(false);
  const involvesDrugStorage = Form.useWatch("hasStorageRoom", drugStorageForm);
  const involvesEquipmentStorage = Form.useWatch("hasStorageRoom", equipmentStorageForm);

  const campusOptions = useMemo(
    () => [
      { label: "江南", value: "江南" },
      { label: "渝中", value: "渝中" },
    ],
    []
  );

  const fetchReceptionRoomDetail = async () => {
    if (!keshi) {
      setReceptionDetailList([]);
      return;
    }
    setLoadingReceptionDetail(true);
    try {
      const res = await siteFacilityApi.getReceptionRoomDetail(keshi);
      if (res?.success) {
        setReceptionDetailList(res.data || []);
      } else {
        setReceptionDetailList([]);
        message.error(res?.message || "获取受试者接待室详情失败");
      }
    } catch (e) {
      console.error("获取受试者接待室详情失败:", e);
      setReceptionDetailList([]);
      message.error(e?.message || "获取受试者接待室详情失败");
    } finally {
      setLoadingReceptionDetail(false);
    }
  };

  const fetchManagementRoomDetail = async () => {
    if (!keshi) {
      setManagementDetailList([]);
      return;
    }
    setLoadingManagementDetail(true);
    try {
      const res = await siteFacilityApi.getManagementRoomDetail(keshi);
      if (res?.success) {
        setManagementDetailList(res.data || []);
      } else {
        setManagementDetailList([]);
        message.error(res?.message || "获取资料管理室详情失败");
      }
    } catch (e) {
      console.error("获取资料管理室详情失败:", e);
      setManagementDetailList([]);
      message.error(e?.message || "获取资料管理室详情失败");
    } finally {
      setLoadingManagementDetail(false);
    }
  };

  const fetchDrugStorageRoomDetail = async () => {
    if (!keshi) {
      setDrugStorageDetailList([]);
      return;
    }
    setLoadingDrugStorageDetail(true);
    try {
      const res = await siteFacilityApi.getDrugStorageRoomDetail(keshi);
      if (res?.success) {
        setDrugStorageDetailList(res.data || []);
      } else {
        setDrugStorageDetailList([]);
        message.error(res?.message || "获取药品保管室详情失败");
      }
    } catch (e) {
      console.error("获取药品保管室详情失败:", e);
      setDrugStorageDetailList([]);
      message.error(e?.message || "获取药品保管室详情失败");
    } finally {
      setLoadingDrugStorageDetail(false);
    }
  };

  const fetchEquipmentStorageRoomDetail = async () => {
    if (!keshi) {
      setEquipmentStorageDetailList([]);
      return;
    }
    setLoadingEquipmentStorageDetail(true);
    try {
      const res = await siteFacilityApi.getEquipmentStorageRoomDetail(keshi);
      if (res?.success) {
        setEquipmentStorageDetailList(res.data || []);
      } else {
        setEquipmentStorageDetailList([]);
        message.error(res?.message || "获取器械保管室详情失败");
      }
    } catch (e) {
      console.error("获取器械保管室详情失败:", e);
      setEquipmentStorageDetailList([]);
      message.error(e?.message || "获取器械保管室详情失败");
    } finally {
      setLoadingEquipmentStorageDetail(false);
    }
  };

  const fetchSampleStorageRoomDetail = async () => {
    if (!keshi) {
      setSampleStorageDetailList([]);
      return;
    }
    setLoadingSampleStorageDetail(true);
    try {
      const res = await siteFacilityApi.getSampleStorageRoomDetail(keshi);
      if (res?.success) {
        setSampleStorageDetailList(res.data || []);
      } else {
        setSampleStorageDetailList([]);
        message.error(res?.message || "获取样本处理及储存区详情失败");
      }
    } catch (e) {
      console.error("获取样本处理及储存区详情失败:", e);
      setSampleStorageDetailList([]);
      message.error(e?.message || "获取样本处理及储存区详情失败");
    } finally {
      setLoadingSampleStorageDetail(false);
    }
  };

  const fetchEmergencyEquipmentDetail = async () => {
    if (!keshi) {
      setEmergencyEquipmentDetailList([]);
      return;
    }
    setLoadingEmergencyEquipmentDetail(true);
    try {
      const res = await siteFacilityApi.getEmergencyEquipmentDetail(keshi);
      if (res?.success) {
        setEmergencyEquipmentDetailList(res.data || []);
      } else {
        setEmergencyEquipmentDetailList([]);
        message.error(res?.message || "获取抢救设施设备详情失败");
      }
    } catch (e) {
      console.error("获取抢救设施设备详情失败:", e);
      setEmergencyEquipmentDetailList([]);
      message.error(e?.message || "获取抢救设施设备详情失败");
    } finally {
      setLoadingEmergencyEquipmentDetail(false);
    }
  };

  useEffect(() => {
    receptionForm.resetFields();
    managementForm.resetFields();
    drugStorageForm.resetFields();
    equipmentStorageForm.resetFields();
    sampleStorageForm.resetFields();
    emergencyEquipmentForm.resetFields();
    fetchReceptionRoomDetail();
    fetchManagementRoomDetail();
    fetchDrugStorageRoomDetail();
    fetchEquipmentStorageRoomDetail();
    fetchSampleStorageRoomDetail();
    fetchEmergencyEquipmentDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keshi, groupPath]);

  const formatYesNo = (v) => {
    if (v === "1" || v === 1) return "是";
    if (v === "0" || v === 0) return "否";
    return v === undefined || v === null || v === "" ? "-" : String(v);
  };

  const formatCanMeetNeed = formatYesNo;

  const isLikelyImageUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  };

  const renderPhotoCell = (url) => {
    if (!url) return "-";
    return (
      <Space direction="vertical" size={4}>
        {isLikelyImageUrl(url) ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <img
              alt=""
              src={url}
              style={{ maxWidth: 120, maxHeight: 72, objectFit: "cover", display: "block" }}
            />
          </a>
        ) : null}
        <a href={url} target="_blank" rel="noopener noreferrer">
          查看/下载
        </a>
      </Space>
    );
  };

  const receptionRoomColumns = [
    {
      title: "院区",
      dataIndex: "campus",
      key: "campus",
      width: 160,
      ellipsis: true,
      render: (v) => (v != null ? String(v).trim() : "-"),
    },
    {
      title: "地点",
      dataIndex: "location",
      key: "location",
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "照片",
      dataIndex: "photo",
      key: "photo",
      width: 200,
      render: renderPhotoCell,
    },
    {
      title: "是否能够满足知情同意及随访等需要",
      dataIndex: "canMeetNeed",
      key: "canMeetNeed",
      width: 220,
      align: "center",
      render: (v) => formatCanMeetNeed(v),
    },
  ];

  const managementRoomColumns = [
    {
      title: "院区",
      dataIndex: "campus",
      key: "campus",
      width: 140,
      ellipsis: true,
      render: (v) => (v != null ? String(v).trim() : "-"),
    },
    {
      title: "地点",
      dataIndex: "location",
      key: "location",
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "照片",
      dataIndex: "photo",
      key: "photo",
      width: 200,
      render: renderPhotoCell,
    },
    {
      title: "温湿度记录",
      dataIndex: "hasTempHumidityRecord",
      key: "hasTempHumidityRecord",
      width: 100,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "人员出入记录",
      dataIndex: "hasAccessRecord",
      key: "hasAccessRecord",
      width: 110,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "文件借阅记录",
      dataIndex: "hasFileBorrowRecord",
      key: "hasFileBorrowRecord",
      width: 110,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "防火/防虫/防盗/防潮",
      dataIndex: "hasProtectionCondition",
      key: "hasProtectionCondition",
      width: 140,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "填报时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 170,
      render: (v) => formatBackendDateTime(v),
    },
  ];

  const sampleStorageRoomColumns = [
    {
      title: "院区",
      dataIndex: "campus",
      key: "campus",
      width: 140,
      ellipsis: true,
      render: (v) => (v != null ? String(v).trim() : "-"),
    },
    {
      title: "地点",
      dataIndex: "location",
      key: "location",
      ellipsis: { showTitle: true },
      render: (v) => v || "-",
    },
    {
      title: "照片",
      dataIndex: "photo",
      key: "photo",
      width: 200,
      render: renderPhotoCell,
    },
    {
      title: "样本冰箱及温湿度计",
      dataIndex: "hasSampleFridge",
      key: "hasSampleFridge",
      width: 150,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "人员出入记录",
      dataIndex: "hasAccessRecord",
      key: "hasAccessRecord",
      width: 110,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "温湿度记录",
      dataIndex: "hasTempHumidityRecord",
      key: "hasTempHumidityRecord",
      width: 100,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "保养/校正/维修记录",
      dataIndex: "hasMaintenanceRecord",
      key: "hasMaintenanceRecord",
      width: 140,
      align: "center",
      render: formatYesNo,
    },
    {
      title: "填报时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 170,
      render: (v) => formatBackendDateTime(v),
    },
  ];

  const emergencyEquipmentColumns = [
    {
      title: "是否具有必要的抢救设施设备和急救药品",
      dataIndex: "hasEmergencyEquipment",
      key: "hasEmergencyEquipment",
      align: "center",
      render: formatYesNo,
    },
    {
      title: "填报时间",
      dataIndex: "createTime",
      key: "createTime",
      width: 170,
      render: (v) => formatBackendDateTime(v),
    },
  ];

  const onReceptionFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    const fileList = values.photo;
    const fileItem = fileList?.[0];
    const file = fileItem?.originFileObj ?? fileItem;
    if (!(file instanceof File)) {
      message.error("请上传照片");
      return;
    }
    const campuses = Array.isArray(values.campus)
      ? values.campus.filter(Boolean)
      : [];
    if (campuses.length === 0) {
      message.error("请至少选择一个院区");
      return;
    }
    const campusStr = campuses.join(",");
    setReceptionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("campus", campusStr);
      formData.append("location", (values.location || "").trim());
      formData.append("photo", file);
      formData.append("canMeetNeed", String(values.canMeetNeed));

      const res = await siteFacilityApi.reportReceptionRoom(formData);
      if (res?.success) {
        message.success("受试者接待室填报成功");
        receptionForm.resetFields();
        fetchReceptionRoomDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("受试者接待室填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setReceptionSubmitting(false);
    }
  };

  const onManagementFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    const fileList = values.photo;
    const fileItem = fileList?.[0];
    const file = fileItem?.originFileObj ?? fileItem;
    if (!(file instanceof File)) {
      message.error("请上传照片");
      return;
    }
    const campuses = Array.isArray(values.campus)
      ? values.campus.filter(Boolean)
      : [];
    if (campuses.length === 0) {
      message.error("请至少选择一个院区");
      return;
    }
    const campusStr = campuses.join(",");
    setManagementSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("campus", campusStr);
      formData.append("location", (values.location || "").trim());
      formData.append("photo", file);
      formData.append("hasTempHumidityRecord", String(values.hasTempHumidityRecord));
      formData.append("hasAccessRecord", String(values.hasAccessRecord));
      formData.append("hasFileBorrowRecord", String(values.hasFileBorrowRecord));
      formData.append("hasProtectionCondition", String(values.hasProtectionCondition));

      const res = await siteFacilityApi.reportManagementRoom(formData);
      if (res?.success) {
        message.success("资料管理室填报成功");
        managementForm.resetFields();
        fetchManagementRoomDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("资料管理室填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setManagementSubmitting(false);
    }
  };

  const drugStorageRoomColumns = createStorageRoomColumns(
    "涉及药品保管室",
    formatYesNo,
    renderPhotoCell
  );
  const equipmentStorageRoomColumns = createStorageRoomColumns(
    "涉及器械保管室",
    formatYesNo,
    renderPhotoCell
  );

  const clearStorageRoomDetailFields = (form) => {
    form.setFieldsValue({
      campus: undefined,
      location: undefined,
      photo: undefined,
      hasFridge: undefined,
      hasAccessRecord: undefined,
      hasTempHumidityRecord: undefined,
      hasFridgeAccount: undefined,
      hasMaintenanceRecord: undefined,
    });
  };

  const clearDrugStorageDetailFields = () => clearStorageRoomDetailFields(drugStorageForm);
  const clearEquipmentStorageDetailFields = () =>
    clearStorageRoomDetailFields(equipmentStorageForm);

  const appendStorageRoomDetailToFormData = (formData, values) => {
    const fileList = values.photo;
    const fileItem = fileList?.[0];
    const file = fileItem?.originFileObj ?? fileItem;
    if (!(file instanceof File)) {
      return { ok: false, message: "请上传照片" };
    }
    const campuses = Array.isArray(values.campus) ? values.campus.filter(Boolean) : [];
    if (campuses.length === 0) {
      return { ok: false, message: "请至少选择一个院区" };
    }
    formData.append("campus", campuses.join(","));
    formData.append("location", (values.location || "").trim());
    formData.append("photo", file);
    formData.append("hasFridge", String(values.hasFridge));
    formData.append("hasAccessRecord", String(values.hasAccessRecord));
    formData.append("hasTempHumidityRecord", String(values.hasTempHumidityRecord));
    formData.append("hasFridgeAccount", String(values.hasFridgeAccount));
    formData.append("hasMaintenanceRecord", String(values.hasMaintenanceRecord));
    return { ok: true };
  };

  const onDrugStorageFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    if (values.hasStorageRoom !== 0 && values.hasStorageRoom !== 1) {
      message.error("请选择是否涉及药品保管室");
      return;
    }

    setDrugStorageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("hasStorageRoom", String(values.hasStorageRoom));

      if (values.hasStorageRoom === 1) {
        const appendResult = appendStorageRoomDetailToFormData(formData, values);
        if (!appendResult.ok) {
          message.error(appendResult.message);
          setDrugStorageSubmitting(false);
          return;
        }
      }

      const res = await siteFacilityApi.reportDrugStorageRoom(formData);
      if (res?.success) {
        message.success("药品保管室填报成功");
        drugStorageForm.resetFields();
        fetchDrugStorageRoomDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("药品保管室填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setDrugStorageSubmitting(false);
    }
  };

  const onEquipmentStorageFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    if (values.hasStorageRoom !== 0 && values.hasStorageRoom !== 1) {
      message.error("请选择是否涉及器械保管室");
      return;
    }

    setEquipmentStorageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("hasStorageRoom", String(values.hasStorageRoom));

      if (values.hasStorageRoom === 1) {
        const appendResult = appendStorageRoomDetailToFormData(formData, values);
        if (!appendResult.ok) {
          message.error(appendResult.message);
          setEquipmentStorageSubmitting(false);
          return;
        }
      }

      const res = await siteFacilityApi.reportEquipmentStorageRoom(formData);
      if (res?.success) {
        message.success("器械保管室填报成功");
        equipmentStorageForm.resetFields();
        fetchEquipmentStorageRoomDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("器械保管室填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setEquipmentStorageSubmitting(false);
    }
  };

  const onSampleStorageFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    const fileList = values.photo;
    const fileItem = fileList?.[0];
    const file = fileItem?.originFileObj ?? fileItem;
    if (!(file instanceof File)) {
      message.error("请上传照片");
      return;
    }
    const campuses = Array.isArray(values.campus)
      ? values.campus.filter(Boolean)
      : [];
    if (campuses.length === 0) {
      message.error("请至少选择一个院区");
      return;
    }
    const campusStr = campuses.join(",");
    setSampleStorageSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("campus", campusStr);
      formData.append("location", (values.location || "").trim());
      formData.append("photo", file);
      formData.append("hasSampleFridge", String(values.hasSampleFridge));
      formData.append("hasAccessRecord", String(values.hasAccessRecord));
      formData.append("hasTempHumidityRecord", String(values.hasTempHumidityRecord));
      formData.append("hasMaintenanceRecord", String(values.hasMaintenanceRecord));

      const res = await siteFacilityApi.reportSampleStorageRoom(formData);
      if (res?.success) {
        message.success("样本处理及储存区填报成功");
        sampleStorageForm.resetFields();
        fetchSampleStorageRoomDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("样本处理及储存区填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setSampleStorageSubmitting(false);
    }
  };

  const onEmergencyEquipmentFinish = async (values) => {
    if (!keshi) {
      message.error("未获取到科室信息，无法提交");
      return;
    }
    if (values.hasEmergencyEquipment !== 0 && values.hasEmergencyEquipment !== 1) {
      message.error("请选择是否具有必要的抢救设施设备和急救药品");
      return;
    }
    setEmergencyEquipmentSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("keshi", keshi);
      formData.append("hasEmergencyEquipment", String(values.hasEmergencyEquipment));

      const res = await siteFacilityApi.reportEmergencyEquipment(formData);
      if (res?.success) {
        message.success("抢救设施设备填报成功");
        emergencyEquipmentForm.resetFields();
        fetchEmergencyEquipmentDetail();
      } else {
        message.error(res?.message || "提交失败");
      }
    } catch (e) {
      console.error("抢救设施设备填报失败:", e);
      message.error(e?.message || "提交失败，请重试");
    } finally {
      setEmergencyEquipmentSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <div>
            <Text type="secondary">科室：</Text>
            <Text strong>{keshi || "-"}</Text>
          </div>
          <div>
            <Text type="secondary">专业组：</Text>
            <Text strong>{groupPath || "-"}</Text>
          </div>
        </Space>
      </div>

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="受试者接待室（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {receptionDetailList.length} 条
            </Text>
            <Button onClick={fetchReceptionRoomDetail} loading={loadingReceptionDetail}>
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingReceptionDetail}>
          <Table
            size="small"
            rowKey={(_, index) => `rr-${index}`}
            dataSource={receptionDetailList}
            columns={receptionRoomColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 900 }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="受试者接待室（填报）">
        <Form form={receptionForm} layout="vertical" onFinish={onReceptionFinish}>
          <Form.Item
            label="院区"
            name="campus"
            rules={[{ required: true, message: "请选择院区" }]}
            extra="可多选，提交时合并为「江南」或「江南,渝中」等形式传给后端"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择院区（可多选）"
              options={campusOptions}
            />
          </Form.Item>

          <Form.Item
            label="地点"
            name="location"
            rules={[{ required: true, message: "请输入地点" }]}
          >
            <Input placeholder="请输入地点" />
          </Form.Item>

          <Form.Item
            label="照片"
            name="photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e?.fileList ?? [];
            }}
            rules={[
              {
                validator: (_, fileList) => {
                  if (!fileList || fileList.length === 0) {
                    return Promise.reject(new Error("请上传照片"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              listType="picture-card"
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="是否能够满足知情同意及随访等需要"
            name="canMeetNeed"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={receptionSubmitting}>
                提交
              </Button>
              <Button onClick={() => receptionForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="资料管理室（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {managementDetailList.length} 条
            </Text>
            <Button onClick={fetchManagementRoomDetail} loading={loadingManagementDetail}>
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingManagementDetail}>
          <Table
            size="small"
            rowKey={(record) => record.id ?? `mr-${record.campus}-${record.location}`}
            dataSource={managementDetailList}
            columns={managementRoomColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="资料管理室（填报）">
        <Form form={managementForm} layout="vertical" onFinish={onManagementFinish}>
          <Form.Item
            label="院区"
            name="campus"
            rules={[{ required: true, message: "请选择院区" }]}
            extra="可多选，提交时合并为「江南」或「江南,渝中」等形式传给后端"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择院区（可多选）"
              options={campusOptions}
            />
          </Form.Item>

          <Form.Item
            label="地点"
            name="location"
            rules={[{ required: true, message: "请输入地点" }]}
          >
            <Input placeholder="请输入地点" />
          </Form.Item>

          <Form.Item
            label="照片"
            name="photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e?.fileList ?? [];
            }}
            rules={[
              {
                validator: (_, fileList) => {
                  if (!fileList || fileList.length === 0) {
                    return Promise.reject(new Error("请上传照片"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              listType="picture-card"
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="是否有温湿度记录"
            name="hasTempHumidityRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否有人员出入记录"
            name="hasAccessRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否有文件借阅记录"
            name="hasFileBorrowRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否具备防火/防虫/防盗/防潮条件"
            name="hasProtectionCondition"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={managementSubmitting}>
                提交
              </Button>
              <Button onClick={() => managementForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="药品保管室（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {drugStorageDetailList.length} 条
            </Text>
            <Button onClick={fetchDrugStorageRoomDetail} loading={loadingDrugStorageDetail}>
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingDrugStorageDetail}>
          <Table
            size="small"
            rowKey={(record) => record.id ?? `ds-${record.campus}-${record.location}`}
            dataSource={drugStorageDetailList}
            columns={drugStorageRoomColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="药品保管室（填报）">
        <Form form={drugStorageForm} layout="vertical" onFinish={onDrugStorageFinish}>
          <Form.Item
            label="是否涉及药品保管室"
            name="hasStorageRoom"
            rules={[{ required: true, message: "请选择是否涉及药品保管室" }]}
            extra="若选择「否」，下方院区、地点等字段无需填写"
          >
            <Radio.Group
              onChange={(e) => {
                if (e.target.value === 0) {
                  clearDrugStorageDetailFields();
                }
              }}
            >
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          {involvesDrugStorage === 1 && (
            <>
              <Form.Item
                label="院区"
                name="campus"
                rules={[{ required: true, message: "请选择院区" }]}
                extra="可多选，提交时合并为「江南」或「江南,渝中」等形式传给后端"
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="请选择院区（可多选）"
                  options={campusOptions}
                />
              </Form.Item>

              <Form.Item
                label="地点"
                name="location"
                rules={[{ required: true, message: "请输入地点" }]}
              >
                <Input placeholder="请输入地点" />
              </Form.Item>

              <Form.Item
                label="照片"
                name="photo"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList ?? [];
                }}
                rules={[
                  {
                    validator: (_, fileList) => {
                      if (!fileList || fileList.length === 0) {
                        return Promise.reject(new Error("请上传照片"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  listType="picture-card"
                  accept="image/*"
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                label="是否具有冰箱、温湿度计"
                name="hasFridge"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有人员出入记录"
                name="hasAccessRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有温湿度记录"
                name="hasTempHumidityRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有冰箱台账"
                name="hasFridgeAccount"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否具有冰箱等仪器设备保养、校正、维修记录"
                name="hasMaintenanceRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={drugStorageSubmitting}>
                提交
              </Button>
              <Button
                onClick={() => {
                  drugStorageForm.resetFields();
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="器械保管室（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {equipmentStorageDetailList.length} 条
            </Text>
            <Button
              onClick={fetchEquipmentStorageRoomDetail}
              loading={loadingEquipmentStorageDetail}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingEquipmentStorageDetail}>
          <Table
            size="small"
            rowKey={(record) => record.id ?? `es-${record.campus}-${record.location}`}
            dataSource={equipmentStorageDetailList}
            columns={equipmentStorageRoomColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="器械保管室（填报）">
        <Form
          form={equipmentStorageForm}
          layout="vertical"
          onFinish={onEquipmentStorageFinish}
        >
          <Form.Item
            label="是否涉及器械保管室"
            name="hasStorageRoom"
            rules={[{ required: true, message: "请选择是否涉及器械保管室" }]}
            extra="若选择「否」，下方院区、地点等字段无需填写"
          >
            <Radio.Group
              onChange={(e) => {
                if (e.target.value === 0) {
                  clearEquipmentStorageDetailFields();
                }
              }}
            >
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          {involvesEquipmentStorage === 1 && (
            <>
              <Form.Item
                label="院区"
                name="campus"
                rules={[{ required: true, message: "请选择院区" }]}
                extra="可多选，提交时合并为「江南」或「江南,渝中」等形式传给后端"
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="请选择院区（可多选）"
                  options={campusOptions}
                />
              </Form.Item>

              <Form.Item
                label="地点"
                name="location"
                rules={[{ required: true, message: "请输入地点" }]}
              >
                <Input placeholder="请输入地点" />
              </Form.Item>

              <Form.Item
                label="照片"
                name="photo"
                valuePropName="fileList"
                getValueFromEvent={(e) => {
                  if (Array.isArray(e)) return e;
                  return e?.fileList ?? [];
                }}
                rules={[
                  {
                    validator: (_, fileList) => {
                      if (!fileList || fileList.length === 0) {
                        return Promise.reject(new Error("请上传照片"));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  listType="picture-card"
                  accept="image/*"
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                label="是否具有冰箱、温湿度计"
                name="hasFridge"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有人员出入记录"
                name="hasAccessRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有温湿度记录"
                name="hasTempHumidityRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否有冰箱台账"
                name="hasFridgeAccount"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="是否具有冰箱等仪器设备保养、校正、维修记录"
                name="hasMaintenanceRecord"
                rules={[{ required: true, message: "请选择是或否" }]}
              >
                <Radio.Group>
                  <Radio value={1}>是</Radio>
                  <Radio value={0}>否</Radio>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={equipmentStorageSubmitting}
              >
                提交
              </Button>
              <Button onClick={() => equipmentStorageForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="样本处理及储存区（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {sampleStorageDetailList.length} 条
            </Text>
            <Button
              onClick={fetchSampleStorageRoomDetail}
              loading={loadingSampleStorageDetail}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingSampleStorageDetail}>
          <Table
            size="small"
            rowKey={(record) => record.id ?? `ss-${record.campus}-${record.location}`}
            dataSource={sampleStorageDetailList}
            columns={sampleStorageRoomColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="样本处理及储存区（填报）">
        <Form form={sampleStorageForm} layout="vertical" onFinish={onSampleStorageFinish}>
          <Form.Item
            label="院区"
            name="campus"
            rules={[{ required: true, message: "请选择院区" }]}
            extra="可多选，提交时合并为「江南」或「江南,渝中」等形式传给后端"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择院区（可多选）"
              options={campusOptions}
            />
          </Form.Item>

          <Form.Item
            label="地点"
            name="location"
            rules={[{ required: true, message: "请输入地点" }]}
          >
            <Input placeholder="请输入地点" />
          </Form.Item>

          <Form.Item
            label="照片"
            name="photo"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e?.fileList ?? [];
            }}
            rules={[
              {
                validator: (_, fileList) => {
                  if (!fileList || fileList.length === 0) {
                    return Promise.reject(new Error("请上传照片"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              listType="picture-card"
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            label="是否具有样本冰箱及温湿度计"
            name="hasSampleFridge"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否有人员出入记录"
            name="hasAccessRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否有温湿度记录"
            name="hasTempHumidityRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="是否具有冰箱等仪器设备保养、校正、维修记录"
            name="hasMaintenanceRecord"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={sampleStorageSubmitting}>
                提交
              </Button>
              <Button onClick={() => sampleStorageForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Card
        size="small"
        style={{ marginBottom: 16, background: "#fafafa" }}
        title="抢救设施设备（已填报记录）"
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              共 {emergencyEquipmentDetailList.length} 条
            </Text>
            <Button
              onClick={fetchEmergencyEquipmentDetail}
              loading={loadingEmergencyEquipmentDetail}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loadingEmergencyEquipmentDetail}>
          <Table
            size="small"
            rowKey={(record) => record.id ?? `ee-${record.createTime}`}
            dataSource={emergencyEquipmentDetailList}
            columns={emergencyEquipmentColumns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
            locale={{
              emptyText: "暂无记录，请在下方填报提交",
            }}
          />
        </Spin>
      </Card>

      <Card size="small" title="抢救设施设备（填报）">
        <Form
          form={emergencyEquipmentForm}
          layout="vertical"
          onFinish={onEmergencyEquipmentFinish}
        >
          <Form.Item
            label="是否具有必要的抢救设施设备和急救药品保证受试者可迅速得到救治或转诊"
            name="hasEmergencyEquipment"
            rules={[{ required: true, message: "请选择是或否" }]}
          >
            <Radio.Group>
              <Radio value={1}>是</Radio>
              <Radio value={0}>否</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={emergencyEquipmentSubmitting}
              >
                提交
              </Button>
              <Button onClick={() => emergencyEquipmentForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

// 文件体系Tab组件（用于科室管理页面）
function FileSystemTab({ keshi, groupPath, isApprover }) {
  const { currentUser } = useContext(AuthContext);
  const [fileSystems, setFileSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // 文件详情相关状态
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  
  // 覆盖上传相关状态
  const [overwriteModalVisible, setOverwriteModalVisible] = useState(false);
  const [overwriting, setOverwriting] = useState(false);
  const [overwriteForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  
  // 历史记录相关状态
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fileHistory, setFileHistory] = useState([]);
  const currentUserId = currentUser?.id || currentUser?.username;
  const normalizeText = (value) => (value == null ? "" : String(value).trim());
  const currentKeshi = normalizeText(keshi);
  const currentGroupPath = normalizeText(groupPath);
  const isProfessionalGroupContext = !!currentKeshi && !!currentGroupPath;
  const isOwner = (record) => !!record?.createdBy && record.createdBy === currentUserId;
  const isCurrentProfessionalGroupRecord = (record) =>
    isProfessionalGroupContext &&
    normalizeText(record?.keshi) === currentKeshi &&
    normalizeText(record?.groupPath) === currentGroupPath;
  const canUseSystemInCurrentGroup = (record) => {
    if (!currentUserId || !isProfessionalGroupContext) return false;
    const recordKeshi = normalizeText(record?.keshi);
    const recordGroupPath = normalizeText(record?.groupPath);
    if (!recordKeshi) return true;
    if (recordKeshi !== currentKeshi) return false;
    return !recordGroupPath || recordGroupPath === currentGroupPath;
  };
  const canCreateSystem = !!currentUserId;
  const canManageSystem = (record) =>
    isApprover || isOwner(record) || isCurrentProfessionalGroupRecord(record);
  const canManageFile = (record) =>
    isApprover || isOwner(record) || isCurrentProfessionalGroupRecord(record);
  const canUploadToSelectedSystem =
    selectedSystem &&
    (isApprover || isOwner(selectedSystem) || canUseSystemInCurrentGroup(selectedSystem));

  // 获取文件体系列表
  const fetchFileSystems = async () => {
    setLoading(true);
    try {
      const response = await institutionFileSystemApi.getList(keshi, groupPath);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileSystems();
  }, [keshi, groupPath]);

  // 处理创建文件体系
  const handleCreate = async (values) => {
    try {
      const response = await institutionFileSystemApi.create(
        {
          systemCode: values.systemCode || undefined,
          systemName: values.systemName,
          description: values.description || undefined,
        },
        keshi,
        groupPath
      );
      if (response.success) {
        message.success("创建文件体系成功");
        setCreateModalVisible(false);
        form.resetFields();
        await fetchFileSystems();
      } else {
        message.error(response.message || "创建文件体系失败");
      }
    } catch (error) {
      console.error("Failed to create file system:", error);
      message.error(error.message || "创建文件体系失败，请重试");
    }
  };

  // 格式化时间
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

  // 获取文件系统下的文件列表
  const fetchFiles = async (systemId) => {
    setFilesLoading(true);
    try {
      const response = await institutionFileSystemApi.getFilesBySystem(systemId, keshi, groupPath);
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
    setSelectedSystem(system);
    fetchFiles(system.id);
  };

  // 返回文件体系列表
  const handleBack = () => {
    setSelectedSystem(null);
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
      formData.append("systemId", selectedSystem.id);
      
      fileList.forEach((file) => {
        const actualFile = file.originFileObj || file;
        if (actualFile instanceof File) {
          formData.append("files", actualFile);
        }
      });

      const response = await institutionFileSystemApi.uploadFiles(formData, keshi, groupPath);
      if (response.success) {
        message.success("文件上传成功");
        setUploadModalVisible(false);
        uploadForm.resetFields();
        await fetchFiles(selectedSystem.id);
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
        await fetchFiles(selectedSystem.id);
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
            if (selectedSystem && selectedSystem.id === system.id) {
              setSelectedSystem(null);
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
            if (selectedSystem) {
              await fetchFiles(selectedSystem.id);
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

  // 使文件失效
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
            if (selectedSystem) {
              await fetchFiles(selectedSystem.id);
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

  // 表格列定义
  const columns = [
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
          {canManageSystem(record) && record?.isFixed !== true && (
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
          {canManageFile(record) && (
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

  // 如果选择了文件系统，显示文件列表
  if (selectedSystem) {
    return (
      <div>
        <Card
          title={
            <Space>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ padding: 0, marginRight: 8 }}
              >
                返回
              </Button>
              <span>{selectedSystem.systemName}</span>
              {selectedSystem.systemCode && (
                <Tag color="blue">{selectedSystem.systemCode}</Tag>
              )}
            </Space>
          }
          extra={
            canUploadToSelectedSystem ? (
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

        <style>{`
          .row-inactive {
            background-color: #fafafa;
            color: #999;
          }
          .row-inactive a {
            color: #999 !important;
          }
        `}</style>

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
                title: "版本",
                dataIndex: "versionType",
                key: "versionType",
                width: 100,
                render: (text) =>
                  text === "当前版本" ? (
                    <Tag color="green">当前版本</Tag>
                  ) : (
                    <Tag color="blue">历史版本</Tag>
                  ),
              },
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
            rowKey={(record, index) =>
              record.id ? `${record.versionType || "history"}-${record.id}` : `current-${selectedFile?.id || index}`
            }
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
      </div>
    );
  }

  // 文件体系列表视图
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          文件体系
        </Text>
        <Space>
          {canCreateSystem && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建文件体系
            </Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchFileSystems}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table
        dataSource={fileSystems}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        locale={{
          emptyText: "暂无文件体系",
        }}
      />

      {/* 创建文件体系 Modal */}
      <Modal
        title="新建文件体系"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
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
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default KeshiManagement;
