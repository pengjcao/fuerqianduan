import { useState, useEffect, useContext } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Modal,
  message,
  Space,
  Typography,
  Tag,
  Select,
  Divider,
} from "antd";
import { PlusOutlined, UserAddOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { noticeGroupApi, departmentApi, authApi } from "../api";
import { AuthContext } from "../context/AuthContext";

const { Title } = Typography;
const { Option } = Select;

function NoticeGroupManagement() {
  const { currentUser } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [addUsersForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [addUsersModalVisible, setAddUsersModalVisible] = useState(false);
  const [viewUsersModalVisible, setViewUsersModalVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [groupUsers, setGroupUsers] = useState([]);
  const [loadingGroupUsers, setLoadingGroupUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 部门相关状态
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 所有可选用户列表（用于创建分组时选择）
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // 分组列表（暂时用空数组，后续可以添加获取分组列表的接口）
  const [groups, setGroups] = useState([]);

  // 获取部门列表
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await departmentApi.getList();
      if (response.success) {
        setDepartments(response.data || []);
      }
    } catch (error) {
      console.error("获取部门列表失败:", error);
      message.error("获取部门列表失败");
    } finally {
      setLoadingDepartments(false);
    }
  };

  // 获取部门用户列表
  const fetchDepartmentUsers = async (keshi) => {
    if (!keshi) return;
    setLoadingUsers(true);
    try {
      const response = await departmentApi.getUsers(keshi);
      if (response.success) {
        const users = response.data || [];
        setDepartmentUsers(users);
        // 合并到所有用户列表中（去重）
        setAllUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.id));
          const newUsers = users.filter((u) => !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
      }
    } catch (error) {
      console.error("获取部门用户列表失败:", error);
      message.error("获取部门用户列表失败");
    } finally {
      setLoadingUsers(false);
    }
  };

  // 组件挂载时获取部门列表
  useEffect(() => {
    fetchDepartments();
  }, []);

  // 当选择部门时，获取该部门的用户列表
  useEffect(() => {
    if (selectedDepartment) {
      fetchDepartmentUsers(selectedDepartment);
    }
  }, [selectedDepartment]);

  // 获取分组列表
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await noticeGroupApi.getList();
      if (response.success) {
        const groupsData = response.data || [];
        // 先设置分组列表（userIds 可能为 null）
        setGroups(groupsData);
        
        // 为每个分组异步获取用户数量
        const groupsWithUserCount = await Promise.all(
          groupsData.map(async (group) => {
            try {
              const usersResponse = await noticeGroupApi.getUsersByGroup(group.groupId);
              if (usersResponse.success) {
                return {
                  ...group,
                  userIds: usersResponse.data || [],
                };
              }
              return {
                ...group,
                userIds: [],
              };
            } catch (error) {
              console.error(`获取分组 ${group.groupId} 的用户列表失败:`, error);
              return {
                ...group,
                userIds: [],
              };
            }
          })
        );
        
        // 更新分组列表，包含实际的用户数量
        setGroups(groupsWithUserCount);
      } else {
        message.error(response.message || "获取分组列表失败");
        setGroups([]);
      }
    } catch (error) {
      console.error("获取分组列表失败:", error);
      message.error("获取分组列表失败，请重试");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取分组列表
  useEffect(() => {
    fetchGroups();
  }, []);

  // 打开创建分组模态框
  const openCreateModal = () => {
    setCreateModalVisible(true);
    form.resetFields();
  };

  // 关闭创建分组模态框
  const closeCreateModal = () => {
    setCreateModalVisible(false);
    form.resetFields();
  };

  // 创建分组
  const handleCreateGroup = async (values) => {
    if (!currentUser) {
      message.error("请先登录");
      return;
    }

    setSubmitting(true);
    try {
      const response = await noticeGroupApi.createGroup({
        groupName: values.groupName,
        creatorId: currentUser.id,
      });

      if (response.success) {
        message.success("分组创建成功");
        const groupId = response.data;
        // 创建成功后，刷新分组列表
        await fetchGroups();
        closeCreateModal();
      } else {
        message.error(response.message || "创建分组失败");
      }
    } catch (error) {
      console.error("创建分组失败:", error);
      message.error(error.message || "创建分组失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 打开添加用户模态框
  const openAddUsersModal = (groupId) => {
    setSelectedGroupId(groupId);
    setAddUsersModalVisible(true);
    setSelectedUserIds([]);
    setSelectedDepartment(null);
    addUsersForm.resetFields();
  };

  // 关闭添加用户模态框
  const closeAddUsersModal = () => {
    setAddUsersModalVisible(false);
    setSelectedGroupId(null);
    addUsersForm.resetFields();
    setSelectedUserIds([]);
    setSelectedDepartment(null);
  };

  // 给分组添加用户
  const handleAddUsers = async () => {
    if (!selectedGroupId) {
      message.error("分组ID不存在");
      return;
    }

    if (selectedUserIds.length === 0) {
      message.warning("请至少选择一个用户");
      return;
    }

    setAddingUsers(true);
    try {
      const response = await noticeGroupApi.addUsersToGroup(
        selectedGroupId,
        selectedUserIds
      );

      if (response.success) {
        message.success("用户添加成功");
        closeAddUsersModal();
        // 刷新分组列表
        await fetchGroups();
      } else {
        message.error(response.message || "添加用户失败");
      }
    } catch (error) {
      console.error("添加用户失败:", error);
      message.error(error.message || "添加用户失败，请重试");
    } finally {
      setAddingUsers(false);
    }
  };

  // 打开查看用户模态框
  const openViewUsersModal = async (groupId, groupName) => {
    setSelectedGroupId(groupId);
    setSelectedGroupName(groupName);
    setViewUsersModalVisible(true);
    setGroupUsers([]);
    setLoadingGroupUsers(true);

    try {
      const response = await noticeGroupApi.getUsersByGroup(groupId);
      if (response.success) {
        setGroupUsers(response.data || []);
      } else {
        message.error(response.message || "获取用户列表失败");
        setGroupUsers([]);
      }
    } catch (error) {
      console.error("获取用户列表失败:", error);
      message.error("获取用户列表失败，请重试");
      setGroupUsers([]);
    } finally {
      setLoadingGroupUsers(false);
    }
  };

  // 关闭查看用户模态框
  const closeViewUsersModal = () => {
    setViewUsersModalVisible(false);
    setSelectedGroupId(null);
    setSelectedGroupName(null);
    setGroupUsers([]);
  };

  // 删除分组
  const handleDeleteGroup = async (groupId, groupName) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定要删除分组"${groupName}"吗？删除后该分组下的所有用户关系将被清除。`,
      okText: "确定",
      cancelText: "取消",
      okType: "danger",
      onOk: async () => {
        setDeleting(true);
        try {
          const response = await noticeGroupApi.deleteGroup(groupId);
          if (response.success) {
            message.success("分组删除成功");
            // 刷新分组列表
            await fetchGroups();
          } else {
            message.error(response.message || "删除分组失败");
          }
        } catch (error) {
          console.error("删除分组失败:", error);
          message.error(error.message || "删除分组失败，请重试");
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: "分组ID",
      dataIndex: "groupId",
      key: "groupId",
      width: 100,
    },
    {
      title: "分组名称",
      dataIndex: "groupName",
      key: "groupName",
      width: 200,
    },
    {
      title: "创建人",
      dataIndex: "creatorId",
      key: "creatorId",
      width: 120,
    },
    {
      title: "用户数量",
      key: "userCount",
      width: 100,
      render: (_, record) => {
        const userIds = record.userIds || [];
        return <Tag color="blue">{userIds.length} 人</Tag>;
      },
    },
    {
      title: "操作",
      key: "action",
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openViewUsersModal(record.groupId, record.groupName)}
          >
            查看用户
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserAddOutlined />}
            onClick={() => openAddUsersModal(record.groupId)}
          >
            添加用户
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteGroup(record.groupId, record.groupName)}
            loading={deleting}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        通知分组管理
      </Title>

      <Card
        title="分组列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            新建分组
          </Button>
        }
      >
        {groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            暂无分组，请点击"新建分组"创建
          </div>
        ) : (
          <Table
            dataSource={groups}
            columns={columns}
            rowKey="groupId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      {/* 创建分组模态框 */}
      <Modal
        title="新建通知分组"
        open={createModalVisible}
        onCancel={closeCreateModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
          initialValues={{
            groupName: "",
          }}
        >
          <Form.Item
            label="分组名称"
            name="groupName"
            rules={[{ required: true, message: "请输入分组名称" }]}
          >
            <Input placeholder="请输入分组名称" />
          </Form.Item>

          <div style={{ color: "#999", fontSize: 12, marginTop: -8, marginBottom: 16 }}>
            提示：创建分组后，可以通过"添加用户"按钮为该分组添加用户
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                创建分组
              </Button>
              <Button onClick={closeCreateModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加用户模态框 */}
      <Modal
        title={`给分组 ${selectedGroupId} 添加用户`}
        open={addUsersModalVisible}
        onCancel={closeAddUsersModal}
        footer={null}
        width={600}
      >
        <Form form={addUsersForm} layout="vertical">
          <Form.Item label="选择用户">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Select
                placeholder="选择部门（可选，用于筛选用户）"
                style={{ width: "100%" }}
                loading={loadingDepartments}
                allowClear
                value={selectedDepartment}
                onChange={(value) => {
                  setSelectedDepartment(value);
                  if (!value) {
                    setDepartmentUsers([]);
                  }
                }}
              >
                {departments.map((dept) => (
                  <Option key={dept} value={dept}>
                    {dept}
                  </Option>
                ))}
              </Select>

              {selectedDepartment && (
                <div style={{ marginTop: 8 }}>
                  <Select
                    mode="multiple"
                    placeholder="从该部门选择用户"
                    style={{ width: "100%" }}
                    loading={loadingUsers}
                    value={selectedUserIds}
                    onChange={setSelectedUserIds}
                  >
                    {departmentUsers.map((user) => (
                      <Option key={user.id} value={user.id} label={user.id}>
                        {user.id} {user.name ? `(${user.name})` : ""}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}

              <Divider>或</Divider>

              <Select
                mode="tags"
                placeholder="直接输入用户ID（可多选，支持手动输入）"
                style={{ width: "100%" }}
                value={selectedUserIds}
                onChange={setSelectedUserIds}
                filterOption={false}
                allowClear
                tokenSeparators={[","]}
                showSearch
              >
                {allUsers.map((user) => (
                  <Option key={user.id} value={user.id} label={user.id}>
                    {user.id} {user.name ? `(${user.name})` : ""}
                  </Option>
                ))}
              </Select>

              {selectedUserIds.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Tag color="blue">已选择 {selectedUserIds.length} 个用户</Tag>
                </div>
              )}
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={handleAddUsers}
                loading={addingUsers}
              >
                添加用户
              </Button>
              <Button onClick={closeAddUsersModal}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看用户列表模态框 */}
      <Modal
        title={`分组"${selectedGroupName}"的用户列表`}
        open={viewUsersModalVisible}
        onCancel={closeViewUsersModal}
        footer={[
          <Button key="close" onClick={closeViewUsersModal}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {loadingGroupUsers ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Typography.Text type="secondary">加载中...</Typography.Text>
          </div>
        ) : groupUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Typography.Text type="secondary">该分组暂无用户</Typography.Text>
          </div>
        ) : (
          <div>
            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
              共 {groupUsers.length} 个用户
            </Typography.Text>
            <Space wrap>
              {groupUsers.map((userId, index) => (
                <Tag key={index} color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
                  {userId}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default NoticeGroupManagement;

