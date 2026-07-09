import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Select, Button, Alert, Card, Typography, Divider, message } from "antd";
import { UserOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
import { authApi } from "../api";

const { Title, Text } = Typography;
const { Option } = Select;

function Register() {
  const { roleLabels, rolePermissions } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("pi");
  const navigate = useNavigate();

  // 获取可注册的角色列表
  const registerableRoles = Object.keys(rolePermissions).filter(
    (role) => rolePermissions[role].canRegister
  );

  const handleSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      const response = await authApi.register(values);
      if (response.success) {
        message.success("注册成功，请使用新账号登录");
        setTimeout(() => navigate("/login"), 800);
      } else {
        setError(response.message || "注册失败");
      }
    } catch (err) {
      setError(err.message || "注册失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card style={{ width: 480, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            注册账号
          </Title>
          <Text type="secondary">
            机构端账号（管理员、机构办秘书、机构办主任、机构主任）由机构统一创建
          </Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 16 }}
          />
        )}

        <Alert
          message="可注册角色说明"
          description={
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              {registerableRoles.map((role) => {
                const perm = rolePermissions[role];
                return (
                  <div key={role} style={{ marginTop: 4 }}>
                    <strong>{perm.label}：</strong>
                    {perm.description}
                  </div>
                );
              })}
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16, fontSize: 12 }}
        />

        <Form
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入账号"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少6位" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码（至少6位）"
            />
          </Form.Item>
          <Form.Item name="displayName">
            <Input
              prefix={<UserOutlined />}
              placeholder="姓名（选填）"
            />
          </Form.Item>
          <Form.Item
            name="role"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select
              placeholder="请选择角色"
              onChange={(value) => setSelectedRole(value)}
            >
              {registerableRoles.map((role) => (
                <Option key={role} value={role}>
                  {roleLabels[role]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {selectedRole && rolePermissions[selectedRole] && (
            <Alert
              message={rolePermissions[selectedRole].description}
              type="info"
              showIcon
              style={{ marginBottom: 16, fontSize: 12 }}
            />
          )}
          <Form.Item name="dept">
            <Input
              prefix={<TeamOutlined />}
              placeholder="所属科室 / 专业组（选填）"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary">已有账号？</Text>{" "}
          <Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  );
}

export default Register;
