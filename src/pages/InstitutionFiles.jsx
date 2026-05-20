import { useState, useEffect, useContext } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Tag,
  Space,
  Divider,
  Typography,
} from "antd";
import { PlusOutlined, UploadOutlined, HistoryOutlined, DeleteOutlined } from "@ant-design/icons";
import { institutionFileSystemApi } from "../api";
import { AuthContext } from "../context/AuthContext";

const { TextArea } = Input;
const { Text } = Typography;

function InstitutionFiles() {
  const { currentUser } = useContext(AuthContext);
  const [fileSystems, setFileSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [overwriteModalVisible, setOverwriteModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedFileSystem, setSelectedFileSystem] = useState(null);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileHistory, setFileHistory] = useState([]);
  const [createForm] = Form.useForm();
  const [uploadForm] = Form.useForm();
  const [overwriteForm] = Form.useForm();

  // 判断是否为审批者（包括 pi）
  const isApprover = currentUser && (currentUser.role === "admin" || currentUser.role === "secretary" || currentUser.role === "director" || currentUser.role === "chief" || currentUser.role === "pi");

  useEffect(() => {
    fetchFileSystems();
  }, []);

  // 获取文件体系列表
  const fetchFileSystems = async () => {
    setLoading(true);
    try {
      const response = await institutionFileSystemApi.getList();
      if (response.success) {
        setFileSystems(response.data || []);
      }
    } catch (error) {
      message.error("获取文件体系列表失败：" + (error.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  // 处理创建文件体系
  const handleCreate = async (values) => {
    try {
      const response = await institutionFileSystemApi.create({
        systemCode: values.systemCode || undefined,
        systemName: values.systemName,
        description: values.description || undefined,
      });
      if (response.success) {
        message.success("创建文件体系成功");
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchFileSystems();
      }
    } catch (error) {
      message.error("创建文件体系失败：" + (error.message || "未知错误"));
    }
  };

  // 获取文件系统下的文件列表
  const fetchFiles = async (systemId) => {
    setFilesLoading(true);
    try {
      const response = await institutionFileSystemApi.getFilesBySystem(systemId);
      if (response.success) {
        setFiles(response.data || []);
      }
    } catch (error) {
      message.error("获取文件列表失败：" + (error.message || "未知错误"));
    } finally {
      setFilesLoading(false);
    }
  };

  // 处理文件上传
  const handleUpload = async (values) => {
    if (!selectedFileSystem) {
      message.error("请先选择文件体系");
      return;
    }

    const fileList = uploadForm.getFieldValue("files");
    if (!fileList || fileList.length === 0) {
      message.error("请选择要上传的文件");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("systemId", selectedFileSystem.id);
      
      fileList.forEach((file) => {
        const actualFile = file.originFileObj || file;
        if (actualFile instanceof File) {
          formData.append("files", actualFile);
        }
      });

      const response = await institutionFileSystemApi.uploadFiles(formData);
      if (response.success) {
        message.success("文件上传成功");
        setUploadModalVisible(false);
        uploadForm.resetFields();
        fetchFiles(selectedFileSystem.id);
      }
    } catch (error) {
      message.error("文件上传失败：" + (error.message || "未知错误"));
    }
  };

  // 处理覆盖上传
  const handleOverwrite = async (values) => {
    const fileList = overwriteForm.getFieldValue("file");
    if (!fileList || fileList.length === 0) {
      message.error("请选择要上传的文件");
      return;
    }

    const file = fileList[0];
    const actualFile = file.originFileObj || file;
    if (!(actualFile instanceof File)) {
      message.error("文件格式错误");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("fileId", values.fileId);
      formData.append("file", actualFile);

      const response = await institutionFileSystemApi.overwriteFile(formData);
      if (response.success) {
        message.success("文件覆盖上传成功");
        setOverwriteModalVisible(false);
        overwriteForm.resetFields();
        if (selectedFileSystem) {
          fetchFiles(selectedFileSystem.id);
        }
      }
    } catch (error) {
      message.error("文件覆盖上传失败：" + (error.message || "未知错误"));
    }
  };

  // 获取文件历史记录
  const handleViewHistory = async (fileId) => {
    try {
      const response = await institutionFileSystemApi.getFileHistory(fileId);
      if (response.success) {
        setFileHistory(response.data || []);
        setHistoryModalVisible(true);
      }
    } catch (error) {
      message.error("获取文件历史记录失败：" + (error.message || "未知错误"));
    }
  };

  // 删除文件体系
  const handleDeleteSystem = async (systemId) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个文件体系吗？删除后无法恢复。",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.deleteSystem(systemId);
          if (response.success) {
            message.success("删除文件体系成功");
            fetchFileSystems();
            if (selectedFileSystem?.id === systemId) {
              setSelectedFileSystem(null);
              setFiles([]);
            }
          }
        } catch (error) {
          message.error("删除文件体系失败：" + (error.message || "未知错误"));
        }
      },
    });
  };

  // 删除文件
  const handleDeleteFile = async (fileId) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个文件吗？删除后无法恢复。",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.deleteFile(fileId);
          if (response.success) {
            message.success("删除文件成功");
            if (selectedFileSystem) {
              fetchFiles(selectedFileSystem.id);
            }
          }
        } catch (error) {
          message.error("删除文件失败：" + (error.message || "未知错误"));
        }
      },
    });
  };

  // 失效文件
  const handleInvalidateFile = async (fileId) => {
    Modal.confirm({
      title: "确认失效",
      content: "确定要将此文件标记为失效吗？失效后无法覆盖上传，但仍可删除。",
      onOk: async () => {
        try {
          const response = await institutionFileSystemApi.invalidateFile(fileId);
          if (response.success) {
            message.success("文件已失效");
            if (selectedFileSystem) {
              fetchFiles(selectedFileSystem.id);
            }
          }
        } catch (error) {
          message.error("失效文件失败：" + (error.message || "未知错误"));
        }
      },
    });
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      const date = new Date(timeStr);
      return date.toLocaleString("zh-CN");
    } catch {
      return timeStr;
    }
  };

  // 文件体系列表列定义
  const systemColumns = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "体系编码",
      dataIndex: "systemCode",
      key: "systemCode",
      width: 150,
    },
    {
      title: "体系名称",
      dataIndex: "systemName",
      key: "systemName",
      ellipsis: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
    },
    {
      title: "创建时间",
      dataIndex: "createdTime",
      key: "createdTime",
      width: 180,
      render: formatTime,
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedFileSystem(record);
              fetchFiles(record.id);
            }}
          >
            查看文件
          </Button>
          {isApprover && !record.isFixed && (
            <Button
              type="link"
              danger
              size="small"
              onClick={() => handleDeleteSystem(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 文件列表列定义
  const fileColumns = [
    {
      title: "序号",
      key: "index",
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: "文件名",
      dataIndex: "fileName",
      key: "fileName",
      ellipsis: true,
      width: 200,
    },
    {
      title: "文件路径",
      dataIndex: "currentPath",
      key: "currentPath",
      ellipsis: true,
    },
    {
      title: "状态",
      key: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={record.isActive === 1 ? "green" : "red"}>
          {record.isActive === 1 ? "有效" : "失效"}
        </Tag>
      ),
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
    },
    {
      title: "创建时间",
      dataIndex: "createdTime",
      key: "createdTime",
      width: 180,
      render: formatTime,
    },
    {
      title: "更新时间",
      dataIndex: "updatedTime",
      key: "updatedTime",
      width: 180,
      render: formatTime,
    },
    {
      title: "操作",
      key: "action",
      width: 300,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {record.isActive === 1 && (
            <Button
              type="link"
              size="small"
              onClick={() => {
                overwriteForm.setFieldsValue({ fileId: record.id });
                setOverwriteModalVisible(true);
              }}
            >
              覆盖上传
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record.id)}
          >
            历史记录
          </Button>
          {record.isActive === 1 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleInvalidateFile(record.id)}
            >
              失效
            </Button>
          )}
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFile(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <h1 className="page-heading">机构文件体系</h1>
        {isApprover && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建文件体系
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={systemColumns}
          dataSource={fileSystems}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {selectedFileSystem && (
        <Card
          title={`文件列表 - ${selectedFileSystem.systemName}`}
          style={{ marginTop: 16 }}
          extra={
            isApprover && (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => {
                  setUploadModalVisible(true);
                }}
              >
                上传文件
              </Button>
            )
          }
        >
          <Table
            columns={fileColumns}
            dataSource={files}
            rowKey="id"
            loading={filesLoading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            rowClassName={(record) => (record.isActive === 0 ? "disabled-row" : "")}
          />
        </Card>
      )}

      {/* 创建文件体系 Modal */}
      <Modal
        title="新建文件体系"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
      >
        <Form form={createForm} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="systemCode"
            label="体系编码"
            rules={[{ max: 50, message: "体系编码最长50个字符" }]}
          >
            <Input placeholder="可选，体系编码" />
          </Form.Item>
          <Form.Item
            name="systemName"
            label="体系名称"
            rules={[{ required: true, message: "请输入体系名称" }]}
          >
            <Input placeholder="请输入体系名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ max: 500, message: "描述最长500个字符" }]}
          >
            <TextArea rows={4} placeholder="可选，描述信息" />
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
        onOk={() => uploadForm.submit()}
      >
        <Form form={uploadForm} onFinish={handleUpload} layout="vertical">
          <Form.Item
            name="files"
            label="选择文件"
            rules={[{ required: true, message: "请选择要上传的文件" }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              maxCount={10}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 覆盖上传 Modal */}
      <Modal
        title="覆盖上传"
        open={overwriteModalVisible}
        onCancel={() => {
          setOverwriteModalVisible(false);
          overwriteForm.resetFields();
        }}
        onOk={() => overwriteForm.submit()}
      >
        <Form form={overwriteForm} onFinish={handleOverwrite} layout="vertical">
          <Form.Item name="fileId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="file"
            label="选择文件"
            rules={[{ required: true, message: "请选择要上传的文件" }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史记录 Modal */}
      <Modal
        title="文件历史记录"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setFileHistory([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setHistoryModalVisible(false);
            setFileHistory([]);
          }}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        <Table
          columns={[
            {
              title: "序号",
              key: "index",
              width: 80,
              render: (_, __, index) => index + 1,
            },
            {
              title: "文件路径",
              dataIndex: "filePath",
              key: "filePath",
              ellipsis: true,
            },
            {
              title: "上传时间",
              dataIndex: "uploadTime",
              key: "uploadTime",
              width: 180,
              render: formatTime,
            },
            {
              title: "上传人",
              dataIndex: "uploadBy",
              key: "uploadBy",
              width: 120,
            },
          ]}
          dataSource={fileHistory}
          rowKey={(record, index) => index}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
}

export default InstitutionFiles;

