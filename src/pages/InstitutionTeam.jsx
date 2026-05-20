import { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Space,
  Tag,
  Avatar,
  Descriptions,
  Alert,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { institutionTeamMemberApi } from "../api";
import { AuthContext } from "../context/AuthContext";

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// 任职选项
const POSITION_OPTIONS = [
  "机构主任",
  "机构副主任",
  "机构办主任",
  "机构办副主任",
  "机构秘书",
  "质控员",
  "档案管理员",
  "药物管理员",
  "其他",
];

function InstitutionTeam() {
  const { currentUser, hasRole } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 判断是否是审批者（可以新增、编辑、删除）
  const isApprover = hasRole(["admin", "secretary", "director", "chief"]);

  // 获取列表
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await institutionTeamMemberApi.getList();
      if (response.success) {
        setMembers(response.data || []);
      } else {
        message.error(response.message || "获取列表失败");
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      message.error(error.message || "获取列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 格式化时间
  const formatDate = (dateArray) => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 6) {
      return "未知";
    }
    try {
      const [year, month, day, hour, minute, second] = dateArray;
      const date = new Date(year, month - 1, day, hour, minute, second);
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "未知";
    }
  };

  // 打开新增/编辑模态框
  const openModal = (member = null) => {
    setSelectedMember(member);
    if (member) {
      // 编辑模式：设置表单值
      form.setFieldsValue({
        institutionMemberId: member.institutionMemberId,
        name: member.name,
        positions: member.positions || [],
      });
    } else {
      // 新增模式：重置表单
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setSelectedMember(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 构建 FormData
      const formData = new FormData();
      
      // 文本字段：确保值不为空时才添加
      if (values.institutionMemberId && values.institutionMemberId.trim()) {
        formData.append("institutionMemberId", values.institutionMemberId.trim());
      }
      
      if (values.name && values.name.trim()) {
        formData.append("name", values.name.trim());
      }

      // positions: 多选数组 - 多次 append 同一个 key（与 Application.jsx 保持一致）
      if (values.positions && Array.isArray(values.positions) && values.positions.length > 0) {
        values.positions.forEach((position) => {
          if (position && position.trim()) {
            // 多次 append 同一个 key，Spring Boot 会自动转换为 List
            formData.append("positions", position.trim());
          }
        });
      }

      // 文件处理：从 Upload 组件获取文件对象
      // 当 Upload 在 Form.Item 中使用且 beforeUpload 返回 false 时，
      // 表单值可能是文件列表数组或单个文件对象
      const getFileFromUpload = (fileValue) => {
        if (!fileValue) return null;
        
        // 如果是数组（fileList），取第一个元素
        let fileObj = Array.isArray(fileValue) ? fileValue[0] : fileValue;
        
        if (!fileObj) return null;
        
        // 如果是 File 对象，直接返回
        if (fileObj instanceof File) {
          return fileObj;
        }
        
        // 如果有 originFileObj，使用它
        if (fileObj.originFileObj && fileObj.originFileObj instanceof File) {
          return fileObj.originFileObj;
        }
        
        // 如果对象本身有 File 的属性（name, size 等），可能是包装对象
        // 尝试从对象中提取 File
        if (fileObj.file && fileObj.file instanceof File) {
          return fileObj.file;
        }
        
        return null;
      };

      // 简历文件
      const resumeFile = getFileFromUpload(values.resumeFile);
      if (resumeFile) {
        formData.append("resumeFile", resumeFile);
      }

      // GCP证书文件
      const gcpFile = getFileFromUpload(values.gcpFile);
      if (gcpFile) {
        formData.append("gcpFile", gcpFile);
      }

      // 执业证书文件（可选）
      const licenseFile = getFileFromUpload(values.licenseFile);
      if (licenseFile) {
        formData.append("licenseFile", licenseFile);
      }

      // 调试：打印 FormData 内容（仅开发环境）
      if (import.meta.env.DEV) {
        console.log("提交的 FormData 内容:");
        console.log("表单原始值:", values);
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: [File] ${value.name} (${value.size} bytes, type: ${value.type})`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
      }

      // 提交
      const response = await institutionTeamMemberApi.save(formData);
      if (response.success) {
        message.success(selectedMember ? "更新成功" : "新增成功");
        closeModal();
        fetchMembers();
      } else {
        message.error(response.message || "提交失败");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 查看详情
  const viewDetail = (member) => {
    setSelectedMember(member);
    setViewModalVisible(true);
  };

  // 删除成员
  const handleDelete = async (ziziId) => {
    if (!ziziId) {
      message.error("删除失败：缺少成员ID");
      return;
    }
    setDeleting(true);
    try {
      const response = await institutionTeamMemberApi.delete(ziziId);
      if (response.success) {
        message.success("删除成功");
        fetchMembers();
      } else {
        message.error(response.message || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete member:", error);
      message.error(error.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // 文件链接组件
  const FileLink = ({ url, label }) => {
    if (!url) return <span style={{ color: "#999" }}>未上传</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <LinkOutlined />
        <span>{label || "查看文件"}</span>
      </a>
    );
  };

  const columns = [
    {
      title: "成员工号",
      dataIndex: "institutionMemberId",
      key: "institutionMemberId",
      width: 120,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "任职",
      key: "positions",
      width: 200,
      render: (_, record) => {
        if (!record.positions || record.positions.length === 0) {
          return <span style={{ color: "#999" }}>未设置</span>;
        }
        return (
          <Space>
            {record.positions.map((pos, index) => (
              <Tag key={index} color="blue">
                {pos}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "创建时间",
      key: "createTime",
      width: 180,
      render: (_, record) => formatDate(record.createTime),
    },
    {
      title: "操作",
      key: "action",
      width: isApprover ? 280 : 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewDetail(record)}
          >
            查看
          </Button>
          {isApprover && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openModal(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个成员吗？"
                description="删除后无法恢复，请谨慎操作。"
                onConfirm={() => handleDelete(record.ziziId)}
                okText="确定"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleting}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 className="page-heading">研究团队</h1>
        {isApprover && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal(null)}
          >
            新增成员
          </Button>
        )}
      </div>
      {!isApprover && (
        <Alert
          message="只读模式"
          description="您当前为研究者角色，只能查看研究团队信息，无法进行新增、编辑或删除操作。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={members}
        columns={columns}
        rowKey="ziziId"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        locale={{
          emptyText: "暂无数据",
        }}
      />

      {/* 新增/编辑模态框 */}
      <Modal
        title={selectedMember ? "编辑成员" : "新增成员"}
        open={modalVisible}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={700}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            positions: [],
          }}
        >
          <Form.Item
            label="成员工号"
            name="institutionMemberId"
            rules={[{ required: true, message: "请输入成员工号" }]}
          >
            <Input placeholder="请输入成员工号" />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="任职（多选）"
            name="positions"
            rules={[{ required: true, message: "请至少选择一个任职" }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择任职"
              allowClear
              maxTagCount="responsive"
            >
              {POSITION_OPTIONS.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="简历文件" name="resumeFile">
            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                点击或拖拽上传简历文件（PDF/Word/图片）
              </p>
              <p className="ant-upload-hint">
                {selectedMember
                  ? "重新上传将覆盖原有文件"
                  : "支持 PDF、Word、图片格式"}
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item label="GCP证书文件" name="gcpFile">
            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                点击或拖拽上传GCP证书文件（PDF/Word/图片）
              </p>
              <p className="ant-upload-hint">
                {selectedMember
                  ? "重新上传将覆盖原有文件"
                  : "支持 PDF、Word、图片格式"}
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item label="执业证书文件（可选）" name="licenseFile">
            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                点击或拖拽上传执业证书文件（PDF/Word/图片）
              </p>
              <p className="ant-upload-hint">
                {selectedMember
                  ? "重新上传将覆盖原有文件"
                  : "支持 PDF、Word、图片格式（可选）"}
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title={`成员详情 - ${selectedMember?.name || ""}`}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedMember(null);
        }}
        footer={[
          isApprover && (
            <Button
              key="edit"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                openModal(selectedMember);
              }}
            >
              编辑
            </Button>
          ),
          <Button
            key="close"
            onClick={() => {
              setViewModalVisible(false);
              setSelectedMember(null);
            }}
          >
            关闭
          </Button>,
        ].filter(Boolean)}
        width={700}
      >
        {selectedMember && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="成员工号" span={1}>
              {selectedMember.institutionMemberId || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="姓名" span={1}>
              {selectedMember.name || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="机构ID" span={1}>
              {selectedMember.institutionId || "未设置"}
            </Descriptions.Item>
            <Descriptions.Item label="任职" span={1}>
              {selectedMember.positions && selectedMember.positions.length > 0 ? (
                <Space>
                  {selectedMember.positions.map((pos, index) => (
                    <Tag key={index} color="blue">
                      {pos}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ color: "#999" }}>未设置</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="简历文件" span={2}>
              <FileLink url={selectedMember.resumePath} label="查看简历" />
            </Descriptions.Item>
            <Descriptions.Item label="GCP证书文件" span={2}>
              <FileLink url={selectedMember.gcpPath} label="查看GCP证书" />
            </Descriptions.Item>
            <Descriptions.Item label="执业证书文件" span={2}>
              <FileLink url={selectedMember.licensePath} label="查看执业证书" />
            </Descriptions.Item>
            <Descriptions.Item label="创建人" span={1}>
              {selectedMember.createById || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {formatDate(selectedMember.createTime)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default InstitutionTeam;

