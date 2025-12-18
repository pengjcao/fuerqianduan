import { useContext, useMemo, useState } from "react";
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
} from "antd";
import {
  InboxOutlined,
  DeleteOutlined,
  PaperClipOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { AppDataContext } from "../context/AppDataContext";
import { AuthContext } from "../context/AuthContext";

const { TextArea } = Input;
const { Dragger } = Upload;

const statusDisplay = {
  draft: "草稿",
  under_secretary: "机构办秘书待审核",
  under_director: "机构办主任待审核",
  under_chief: "机构主任待审核",
  completed: "待填写PI备案时间",
  rejected: "已驳回（需重新提交）",
};

function Application() {
  const { specialties, addPiRecord, piRecords, progressPiRecord } =
    useContext(AppDataContext);
  const { currentUser, hasRole, roleLabels } = useContext(AuthContext);

  const [types, setTypes] = useState({ group: true, pi: true });

  // 新增专业组表单
  const [groupForm, setGroupForm] = useState({
    trialTypes: [],
    specialty: "",
    campus: [],
    selfReport: null,
    comment: "",
  });

  // 新增 PI 表单
  const [piForm, setPiForm] = useState(() => {
    // 使用初始化函数生成 ID，避免在 render 中调用不纯函数
    const generateId = () =>
      `proof-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      trialTypes: [],
      name: "",
      dept: "",
      specialty: "",
      gcp: null,
      titleCert: null,
      resume: null,
      qualification: null,
      practice: null,
      expertise: "",
      // 参与临床试验证明材料（动态添加）
      trialProofs: [
        {
          id: generateId(), // 唯一标识
          projectName: "", // 项目名称
          approvalDoc: [], // 国家药监局批件
          authorizationTable: [], // 授权分工表
          trainingRecord: [], // 培训记录表
          processFiles: [], // 参与试验的过程性文件
          centerSummary: [], // 分中心小结表
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
    setter((prev) => ({
      ...prev,
      [key]: { name: file.name, size: `${file.size}B` },
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
        const fileInfo = { name: file.name, size: `${file.size}B` };
        newProofs[proofIndex] = {
          ...newProofs[proofIndex],
          [fieldName]: [...newProofs[proofIndex][fieldName], fileInfo],
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

  const submitPi = async (e) => {
    e.preventDefault();
    if (!hasRole(["pi", "admin"])) {
      setToast("仅 PI 或管理员可发起 PI 备案申请");
      return;
    }
    if (!piForm.name || !piForm.specialty) {
      setToast("请完整填写 PI 基本信息及所属专业");
      return;
    }
    try {
      await addPiRecord({
        title: `${piForm.name} 的 PI 备案`,
        applicant: piForm.name,
        department: piForm.dept,
      });
      setToast("已生成 PI 备案申请草稿，可在 PI 备案列表中查看");
      message.success("已生成 PI 备案申请草稿");
    } catch (error) {
      setToast(error.message || "创建失败，请重试");
      message.error(error.message || "创建失败，请重试");
    }
  };

  const isPi = currentUser?.role === "pi";

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

  const handleAction = (record, action) => {
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

    (async () => {
      try {
        await progressPiRecord({
          id: record.id,
          action,
          comment,
        });
        setComment("");
        message.success("操作成功");
      } catch (error) {
        message.error(error.message || "操作失败，请重试");
      }
    })();
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
        defaultActiveKey="group"
        items={[
          types.group && {
            key: "group",
            label: "新增专业组",
            children: (
              <Card>
                <Form layout="vertical">
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
                          onChange={(val) =>
                            setGroupForm((prev) => ({
                              ...prev,
                              specialty: val,
                            }))
                          }
                        >
                          {specialties.flatMap((dept) =>
                            dept.groups.map((g) => (
                              <Select.Option
                                key={`${dept.id}-${g.name}`}
                                value={`${dept.department}/${g.name}`}
                              >
                                {dept.department} - {g.name}
                              </Select.Option>
                            ))
                          )}
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
                  <Form.Item label="其他补充（整改说明 / 以往检查情况等）">
                    <TextArea
                      rows={3}
                      value={groupForm.comment}
                      onChange={(e) =>
                        setGroupForm((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                    />
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          types.pi && {
            key: "pi",
            label: "新增 PI",
            children: (
              <Card>
                <Form layout="vertical" onFinish={submitPi}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="PI 备案类型（多选）">
                        <Checkbox.Group
                          options={[
                            { label: "药物临床试验", value: "drug" },
                            { label: "医疗器械临床试验", value: "device" },
                          ]}
                          value={piForm.trialTypes}
                          onChange={(val) =>
                            setPiForm((prev) => ({ ...prev, trialTypes: val }))
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="PI 姓名" required>
                        <Input
                          value={piForm.name}
                          onChange={(e) =>
                            setPiForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="所属科室">
                        <Input
                          value={piForm.dept}
                          onChange={(e) =>
                            setPiForm((prev) => ({
                              ...prev,
                              dept: e.target.value,
                            }))
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="所属专业（下拉，来源于备案专业名称）"
                        required
                      >
                        <Select
                          placeholder="请选择所属专业"
                          value={piForm.specialty}
                          onChange={(val) =>
                            setPiForm((prev) => ({ ...prev, specialty: val }))
                          }
                        >
                          {specialties.map((dept) =>
                            dept.groups.map((g) => (
                              <Select.Option
                                key={`${dept.id}-${g.name}`}
                                value={`${dept.department}/${g.name}`}
                              >
                                {dept.department} - {g.name}
                              </Select.Option>
                            ))
                          )}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="GCP 证书">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "gcp")}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传 GCP 证书
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="签字版简历">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "resume")}
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
                          beforeUpload={handleFile(setPiForm, "qualification")}
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
                      <Form.Item label="高级职称证书">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "titleCert")}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传高级职称证书
                          </Button>
                        </Upload>
                      </Form.Item>
                      <Form.Item label="执业证书">
                        <Upload
                          beforeUpload={handleFile(setPiForm, "practice")}
                          maxCount={1}
                          listType="text"
                          onPreview={handlePreview}
                        >
                          <Button type="dashed" icon={<PaperClipOutlined />}>
                            上传执业证书
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
                              <Form.Item label="国家药监局批件（可上传多个）">
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

                              <Form.Item label="授权分工表（可上传多个）">
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

                              <Form.Item label="培训记录表（可上传多个）">
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
                              <Form.Item label="参与试验的过程性文件（可上传多个）">
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
                                    上传病例报告表、随访记录等
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

                              <Form.Item label="分中心小结表（可上传多个）">
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
                                    上传分中心总结文件
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
                      <Form.Item
                        label="说明原因（若不上传参与临床试验证明材料需填写）"
                        required
                      >
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
                      生成 PI 备案申请草稿
                    </Button>
                  </Form.Item>
                  {toast && <p className="small">{toast}</p>}
                </Form>
              </Card>
            ),
          },
        ].filter(Boolean)}
      />
    </div>
  );
}

export default Application;
