import { useState } from "react";
import {
  Card,
  Form,
  Button,
  Upload,
  message,
  Space,
  Typography,
  Alert,
  Input,
  Select,
  Popover,
} from "antd";
import { InboxOutlined, FontColorsOutlined, FontSizeOutlined } from "@ant-design/icons";
import { systemNoticeApi, noticeGroupApi } from "../api";
import { useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { marked } from "marked";
import { useEffect } from "react";

// 配置 marked 以支持 HTML 标签
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // 支持 GitHub Flavored Markdown
});

const { Title } = Typography;
const { Dragger } = Upload;

function PublishNotice() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [titleContent, setTitleContent] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // 快速样式输入状态
  const [titleQuickText, setTitleQuickText] = useState("");
  const [titleQuickColor, setTitleQuickColor] = useState(undefined);
  const [titleQuickSize, setTitleQuickSize] = useState(undefined);
  const [bodyQuickText, setBodyQuickText] = useState("");
  const [bodyQuickColor, setBodyQuickColor] = useState(undefined);
  const [bodyQuickSize, setBodyQuickSize] = useState(undefined);

  // 获取分组列表
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await noticeGroupApi.getList();
        if (response.success) {
          setGroups(response.data || []);
        }
      } catch (error) {
        console.error("获取分组列表失败:", error);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  // 插入带样式的文字到标题
  const insertStyledTextToTitle = () => {
    const text = titleQuickText.trim() || "文字";
    const style = [];
    if (titleQuickColor) style.push(`color:${titleQuickColor}`);
    if (titleQuickSize) style.push(`font-size:${titleQuickSize}px`);
    const styleStr = style.length > 0 ? ` style="${style.join(';')}"` : "";
    const htmlTag = `<span${styleStr}>${text}</span>`;
    setTitleContent((prev) => prev + htmlTag);
    // 清空输入
    setTitleQuickText("");
    setTitleQuickColor(undefined);
    setTitleQuickSize(undefined);
  };

  // 插入带样式的文字到正文
  const insertStyledTextToBody = () => {
    const text = bodyQuickText.trim() || "文字";
    const style = [];
    if (bodyQuickColor) style.push(`color:${bodyQuickColor}`);
    if (bodyQuickSize) style.push(`font-size:${bodyQuickSize}px`);
    const styleStr = style.length > 0 ? ` style="${style.join(';')}"` : "";
    const htmlTag = `<span${styleStr}>${text}</span>`;
    setBodyContent((prev) => prev + htmlTag);
    // 清空输入
    setBodyQuickText("");
    setBodyQuickColor(undefined);
    setBodyQuickSize(undefined);
  };

  // 处理表单提交
  const handleSubmit = async (values) => {
    // 检查标题（去除 Markdown 格式标记后是否为空）
    const titleText = titleContent.replace(/[#*_`\[\]()]/g, "").trim();
    if (!titleText) {
      message.warning("请输入通知标题");
      return;
    }

    // 检查正文（去除 Markdown 格式标记后是否为空）
    const bodyText = bodyContent.replace(/[#*_`\[\]()]/g, "").trim();
    if (!bodyText) {
      message.warning("请输入通知正文");
      return;
    }

    setSubmitting(true);
    try {
      // 构建 FormData
      const formData = new FormData();
      
      // 将 Markdown 转换为 HTML（后端期望接收 HTML）
      // 标题：如果包含 Markdown 格式，转换为 HTML；否则直接使用
      const titleHTML = titleContent.includes("#") || titleContent.includes("*") || titleContent.includes("_")
        ? marked.parse(titleContent.trim())
        : titleContent.trim();
      
      // 正文：将 Markdown 转换为 HTML
      const contentHTML = marked.parse(bodyContent.trim());
      
      formData.append("title", titleHTML);
      formData.append("content", contentHTML);

      // 添加分组ID列表（如果有选择）
      if (selectedGroupIds && selectedGroupIds.length > 0) {
        // FormData 需要将数组转换为 JSON 字符串，或者后端支持接收数组
        // 根据后端 @ModelAttribute，可能需要逐个添加
        selectedGroupIds.forEach((groupId) => {
          formData.append("groupIds", groupId);
        });
      }

      // 添加文件（如果有）
      const filesField = form.getFieldValue("files");
      if (filesField && filesField.fileList && filesField.fileList.length > 0) {
        filesField.fileList.forEach((file) => {
          // 从 Upload 组件获取原始文件对象
          const originFile = file.originFileObj || file;
          if (originFile instanceof File) {
            formData.append("files", originFile);
          }
        });
      }

      console.log("[PublishNotice] 提交数据:", {
        title: titleHTML,
        content: contentHTML,
        fileCount: filesField?.fileList?.length || 0,
      });

      // 提交到后端
      const response = await systemNoticeApi.publish(formData);

      if (response && response.success) {
        message.success("通知发布成功");
        // 重置表单
        form.resetFields();
        setTitleContent("");
        setBodyContent("");
        setSelectedGroupIds([]);
        // 可选：跳转到首页
        navigate("/");
      } else {
        message.error(response?.message || "发布失败，请重试");
      }
    } catch (error) {
      console.error("Failed to publish notice:", error);
      message.error(error?.message || "发布失败，请检查网络连接");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        发布通知
      </Title>

      <Alert
        title="提示"
        description="只有审批者（机构办秘书、机构办主任、机构主任）可以发布通知。通知支持富文本格式（Markdown），可以设置文字样式、插入链接等，并可以上传附件。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            files: { fileList: [] },
          }}
        >
          <Form.Item
            label={
              <Space>
                <span>通知标题</span>
                <Popover
                  title="快速插入样式文字"
                  content={
                    <Space direction="vertical" style={{ width: 200 }}>
                      <Input
                        placeholder="输入文字"
                        value={titleQuickText}
                        onChange={(e) => setTitleQuickText(e.target.value)}
                        size="small"
                        style={{ marginBottom: 8 }}
                      />
                      <Select
                        placeholder="选择颜色"
                        value={titleQuickColor}
                        onChange={setTitleQuickColor}
                        size="small"
                        style={{ width: "100%", marginBottom: 8 }}
                        allowClear
                        options={[
                          { label: "红色", value: "red" },
                          { label: "蓝色", value: "blue" },
                          { label: "绿色", value: "green" },
                          { label: "橙色", value: "orange" },
                          { label: "紫色", value: "purple" },
                        ]}
                      />
                      <Select
                        placeholder="选择字体大小"
                        value={titleQuickSize}
                        onChange={setTitleQuickSize}
                        size="small"
                        style={{ width: "100%" }}
                        allowClear
                        options={[
                          { label: "小号 (12px)", value: 12 },
                          { label: "正常 (14px)", value: 14 },
                          { label: "中号 (16px)", value: 16 },
                          { label: "大号 (18px)", value: 18 },
                          { label: "超大 (20px)", value: 20 },
                          { label: "特大 (24px)", value: 24 },
                        ]}
                      />
                      <Button
                        type="primary"
                        size="small"
                        block
                        onClick={insertStyledTextToTitle}
                      >
                        插入
                      </Button>
                    </Space>
                  }
                  trigger="click"
                >
                  <Button type="link" size="small" icon={<FontColorsOutlined />}>
                    快速样式
                  </Button>
                </Popover>
              </Space>
            }
            required
            tooltip="支持 Markdown 格式和 HTML 标签，可以设置文字颜色、大小等"
          >
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 4, overflow: "hidden" }}>
              <MDEditor
                value={titleContent}
                onChange={setTitleContent}
                preview="live"
                hideToolbar={false}
                visibleDragBar={false}
                height={120}
                data-color-mode="light"
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              <div>提示：支持 Markdown 格式和 HTML 标签。</div>
              <div style={{ marginTop: 4 }}>
                <strong>Markdown：</strong>**粗体**、*斜体*、# 标题
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>HTML 样式：</strong>&lt;span style='color:red;font-size:20px'&gt;文字&lt;/span&gt;
              </div>
            </div>
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>通知正文</span>
                <Popover
                  title="快速插入样式文字"
                  content={
                    <Space direction="vertical" style={{ width: 200 }}>
                      <Input
                        placeholder="输入文字"
                        value={bodyQuickText}
                        onChange={(e) => setBodyQuickText(e.target.value)}
                        size="small"
                        style={{ marginBottom: 8 }}
                      />
                      <Select
                        placeholder="选择颜色"
                        value={bodyQuickColor}
                        onChange={setBodyQuickColor}
                        size="small"
                        style={{ width: "100%", marginBottom: 8 }}
                        allowClear
                        options={[
                          { label: "红色", value: "red" },
                          { label: "蓝色", value: "blue" },
                          { label: "绿色", value: "green" },
                          { label: "橙色", value: "orange" },
                          { label: "紫色", value: "purple" },
                          { label: "黑色", value: "black" },
                        ]}
                      />
                      <Select
                        placeholder="选择字体大小"
                        value={bodyQuickSize}
                        onChange={setBodyQuickSize}
                        size="small"
                        style={{ width: "100%" }}
                        allowClear
                        options={[
                          { label: "小号 (12px)", value: 12 },
                          { label: "正常 (14px)", value: 14 },
                          { label: "中号 (16px)", value: 16 },
                          { label: "大号 (18px)", value: 18 },
                          { label: "超大 (20px)", value: 20 },
                          { label: "特大 (24px)", value: 24 },
                          { label: "巨大 (28px)", value: 28 },
                        ]}
                      />
                      <Button
                        type="primary"
                        size="small"
                        block
                        onClick={insertStyledTextToBody}
                      >
                        插入
                      </Button>
                    </Space>
                  }
                  trigger="click"
                >
                  <Button type="link" size="small" icon={<FontColorsOutlined />}>
                    快速样式
                  </Button>
                </Popover>
              </Space>
            }
            required
            tooltip="支持 Markdown 格式和 HTML 标签，可以设置文字样式、颜色、大小、插入链接、列表等"
          >
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 4, overflow: "hidden" }}>
              <MDEditor
                value={bodyContent}
                onChange={setBodyContent}
                preview="live"
                hideToolbar={false}
                visibleDragBar={false}
                height={400}
                data-color-mode="light"
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              <div>提示：支持 Markdown 格式和 HTML 标签。点击"快速样式"按钮可以快速插入带颜色和大小的文字。</div>
              <div style={{ marginTop: 4 }}>
                <strong>Markdown：</strong>**粗体**、*斜体*、# 标题、- 列表、[链接](URL)
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>HTML 样式：</strong>&lt;span style='color:red;font-size:20px'&gt;红色大号文字&lt;/span&gt;
              </div>
            </div>
          </Form.Item>

          <Form.Item
            label="附件"
            name="files"
            tooltip="可以上传多个附件文件"
          >
            <Dragger
              multiple
              beforeUpload={() => false} // 阻止自动上传
              fileList={form.getFieldValue("files")?.fileList || []}
              onChange={(info) => {
                form.setFieldsValue({
                  files: info,
                });
              }}
              onRemove={(file) => {
                const currentFileList = form.getFieldValue("files")?.fileList || [];
                const newFileList = currentFileList.filter(
                  (item) => item.uid !== file.uid
                );
                form.setFieldsValue({
                  files: { fileList: newFileList },
                });
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持上传多个文件，文件将在发布时一并提交
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            label="选择分组"
            tooltip="选择要接收此通知的分组（可选，不选择则所有用户可见）"
          >
            <Select
              mode="multiple"
              placeholder="选择分组（可选，不选择则所有用户可见）"
              value={selectedGroupIds}
              onChange={setSelectedGroupIds}
              loading={loadingGroups}
              allowClear
              style={{ width: "100%" }}
            >
              {groups.map((group) => (
                <Select.Option key={group.groupId} value={group.groupId}>
                  {group.groupName} (ID: {group.groupId})
                </Select.Option>
              ))}
            </Select>
            <div style={{ marginTop: 8, fontSize: 12, color: "#999" }}>
              提示：如果不选择分组，通知将对所有用户可见；如果选择了分组，只有这些分组内的用户才能看到此通知
            </div>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
              >
                发布通知
              </Button>
              <Button
                onClick={() => {
                  form.resetFields();
                  setTitleContent("");
                  setBodyContent("");
                }}
                size="large"
              >
                重置
              </Button>
              <Button
                onClick={() => navigate("/")}
                size="large"
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default PublishNotice;
