import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Alert, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";

const { Title, Text } = Typography;

function Login() {
  const { login } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      const res = await login(values.username.trim(), values.password);
      if (!res.ok) {
        setError(res.message || "登录失败");
        return;
      }
      // 无论从哪个页面跳转到登录，登录成功后统一进入首页
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "登录失败，请检查网络连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card style={{ width: 420, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            临床试验专业组管理系统
          </Title>
          <Text type="secondary">重医附二院</Text>
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

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "请输入账号" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <Alert
          message="体验账号（密码均为 123456）"
          description={
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div>
                <strong>机构端：</strong>
                admin（管理员）、secretary（机构办秘书）、
                director（机构办主任）、chief（机构主任）
              </div>
              <div>
                <strong>研究者：</strong>pi（研究者/PI）
              </div>
              <div>
                <strong>其他：</strong>viewer（只读访客）
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ fontSize: 12 }}
        />
      </Card>
    </div>
  );
}

export default Login;
