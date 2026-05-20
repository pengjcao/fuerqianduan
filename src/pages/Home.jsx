import { useContext, useState, useEffect } from "react";
import {
  Card,
  Col,
  Empty,
  List,
  Row,
  Radio,
  Tag,
  Typography,
  Table,
  Avatar,
  Modal,
  Descriptions,
  Button,
  Space,
  message,
  Divider,
  Collapse,
  Spin,
} from "antd";
import { EyeOutlined, LinkOutlined, PaperClipOutlined } from "@ant-design/icons";
import { AppDataContext } from "../context/AppDataContext";
import { systemNoticeApi, piRecordApi } from "../api";

const { Title, Text } = Typography;

function Home() {
  const context = useContext(AppDataContext);
  // 使用 approvedPis（来自 approvedPiList 接口）来显示已备案的PI
  const approvedPis = context?.approvedPis || [];
  const [viewMode, setViewMode] = useState("card"); // 'card' 或 'table'
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPi, setSelectedPi] = useState(null);
  const [notices, setNotices] = useState([]);
  const [groupNotices, setGroupNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [loadingGroupNotices, setLoadingGroupNotices] = useState(false);
  const [noticeViewMode, setNoticeViewMode] = useState("all"); // 'all' 或 'group'
  const [noticeDetailModalVisible, setNoticeDetailModalVisible] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loadingNoticeDetail, setLoadingNoticeDetail] = useState(false);
  const [groupViewMode, setGroupViewMode] = useState("all"); // 'all' 或 'group'
  const [groupedPis, setGroupedPis] = useState({}); // Map<String, List<PiInfoVO>>
  const [loadingGroupedPis, setLoadingGroupedPis] = useState(false);

  // 获取按专业组分组的 PI 列表
  const fetchGroupedPis = async () => {
    setLoadingGroupedPis(true);
    try {
      const response = await piRecordApi.getApprovedListGroup();
      if (response && response.success) {
        setGroupedPis(response.data || {});
      } else {
        console.error("获取分组PI列表失败:", response?.message);
        setGroupedPis({});
      }
    } catch (error) {
      console.error("获取分组PI列表异常:", error);
      setGroupedPis({});
    } finally {
      setLoadingGroupedPis(false);
    }
  };

  // 组件挂载时刷新已备案PI列表和通知列表
  useEffect(() => {
    if (context?.fetchApprovedPis) {
      context.fetchApprovedPis();
    }
    fetchNotices();
    fetchGroupNotices();
    fetchGroupedPis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次，避免无限循环

  // 当切换通知视图模式时，刷新对应的通知列表
  useEffect(() => {
    if (noticeViewMode === "group") {
      fetchGroupNotices();
    } else {
      fetchNotices();
    }
  }, [noticeViewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 当切换到分组视图时，重新获取分组数据
  useEffect(() => {
    if (groupViewMode === "group" && Object.keys(groupedPis).length === 0) {
      fetchGroupedPis();
    }
  }, [groupViewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 获取通知列表（所有用户可见）
  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const response = await systemNoticeApi.getList();
      if (response && response.success) {
        setNotices(response.data || []);
      } else {
        console.error("获取通知列表失败:", response?.message);
        setNotices([]);
      }
    } catch (error) {
      console.error("获取通知列表异常:", error);
      setNotices([]);
    } finally {
      setLoadingNotices(false);
    }
  };

  // 获取分组通知列表
  const fetchGroupNotices = async () => {
    setLoadingGroupNotices(true);
    try {
      const response = await systemNoticeApi.getListByGroup();
      if (response && response.success) {
        setGroupNotices(response.data || []);
      } else {
        console.error("获取分组通知列表失败:", response?.message);
        setGroupNotices([]);
      }
    } catch (error) {
      console.error("获取分组通知列表异常:", error);
      setGroupNotices([]);
    } finally {
      setLoadingGroupNotices(false);
    }
  };

  // 格式化时间戳为日期字符串
  const formatDate = (timestamp) => {
    if (!timestamp) return "未知";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("zh-CN", {
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

  // 格式化时间数组为日期字符串（后端返回的格式：[2026, 1, 4, 17, 1, 56]）
  const formatTimeArray = (timeArray) => {
    if (!timeArray || !Array.isArray(timeArray) || timeArray.length < 6) {
      return "未知";
    }
    try {
      const [year, month, day, hour, minute, second] = timeArray;
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

  // 打开详情模态框
  const showDetail = (pi) => {
    setSelectedPi(pi);
    setDetailModalVisible(true);
  };

  // 打开通知详情模态框
  const showNoticeDetail = async (noticeId) => {
    if (!noticeId) return;
    setLoadingNoticeDetail(true);
    setNoticeDetailModalVisible(true);
    try {
      const response = await systemNoticeApi.getDetail(noticeId);
      if (response && response.success) {
        setSelectedNotice(response.data);
      } else {
        message.error(response?.message || "获取通知详情失败");
        setNoticeDetailModalVisible(false);
      }
    } catch (error) {
      console.error("获取通知详情异常:", error);
      message.error(error?.message || "获取通知详情失败");
      setNoticeDetailModalVisible(false);
    } finally {
      setLoadingNoticeDetail(false);
    }
  };

  // 文件链接组件
  const FileLink = ({ url, label }) => {
    if (!url) return <Text type="secondary">未上传</Text>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        <LinkOutlined />
        <span>{label}</span>
      </a>
    );
  };

  const tableColumns = [
    {
      title: "头像",
      key: "avatar",
      width: 80,
      render: (_, record) => (
        <Avatar
          src={record.piPhotoPath}
          size={40}
          style={{ backgroundColor: "#87d068" }}
        >
          {record.id?.charAt(0) || "P"}
        </Avatar>
      ),
    },
    {
      title: "工号",
      key: "id",
      width: 120,
      render: (_, record) => record.id || "未知",
    },
    {
      title: "专业组",
      dataIndex: "professional",
      key: "professional",
      width: 150,
      render: (text) => text || "未填写",
    },
    {
      title: "擅长领域",
      dataIndex: "shanchang",
      key: "shanchang",
      ellipsis: true,
      width: 200,
      render: (text) => text || "未填写",
    },
    {
      title: "药监局备案时间",
      key: "drugAdminRecordTime",
      width: 180,
      render: (_, record) => 
        record.drugAdminRecordTime ? (
          formatDate(record.drugAdminRecordTime)
        ) : (
          <Text type="secondary">未填写</Text>
        ),
    },
  ];

  return (
    <div>
      <h1 className="page-heading">首页</h1>
      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="已备案 PI 信息"
            bordered={false}
            extra={
              <Space>
                <Radio.Group
                  value={groupViewMode}
                  onChange={(e) => setGroupViewMode(e.target.value)}
                  size="small"
                  style={{ marginRight: 8 }}
                >
                  <Radio.Button value="all">全部</Radio.Button>
                  <Radio.Button value="group">按专业组分类</Radio.Button>
                </Radio.Group>
                {groupViewMode === "all" && (
                  <Radio.Group
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    size="small"
                  >
                    <Radio.Button value="card">卡片</Radio.Button>
                    <Radio.Button value="table">表格</Radio.Button>
                  </Radio.Group>
                )}
              </Space>
            }
          >
            {groupViewMode === "group" ? (
              // 按专业组分类视图
              loadingGroupedPis ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Spin size="large" />
                </div>
              ) : Object.keys(groupedPis).length === 0 ? (
                <Empty description='暂无已完成备案的 PI，可在"专业组及 PI 备案申请"模块中发起申请。' />
              ) : (
                <Collapse
                  items={Object.entries(groupedPis).map(([groupName, piList]) => ({
                    key: groupName,
                    label: (
                      <Space>
                        <span style={{ fontWeight: 600 }}>{groupName}</span>
                        <Tag color="blue">{piList.length} 人</Tag>
                      </Space>
                    ),
                    children: (
                      <Row gutter={[12, 12]}>
                        {piList.map((pi) => (
                          <Col span={12} key={pi.piInfoId || pi.id}>
                            <Card size="small" hoverable>
                              <div style={{ display: "flex", gap: 12 }}>
                                <Avatar
                                  src={pi.piPhotoPath}
                                  size={64}
                                  style={{ backgroundColor: "#87d068", flexShrink: 0 }}
                                >
                                  {pi.id?.charAt(0) || "P"}
                                </Avatar>
                                <div style={{ flex: 1 }}>
                                  <Title level={5} style={{ marginBottom: 4 }}>
                                    工号：{pi.id || "未知"}
                                  </Title>
                                  {pi.professional && (
                                    <>
                                      <Text type="secondary" style={{ fontSize: 14, fontWeight: 500 }}>
                                        专业组：{pi.professional}
                                      </Text>
                                      <br />
                                    </>
                                  )}
                                  {pi.shanchang && (
                                    <>
                                      <Text style={{ fontSize: 13 }}>擅长领域：{pi.shanchang}</Text>
                                      <br />
                                    </>
                                  )}
                                  {pi.drugAdminRecordTime ? (
                                    <>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        药监局备案时间：{formatDate(pi.drugAdminRecordTime)}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text type="secondary" style={{ color: '#999', fontSize: 12 }}>
                                      药监局备案时间：未填写
                                    </Text>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ),
                  }))}
                />
              )
            ) : approvedPis.length === 0 ? (
              <Empty description='暂无已完成备案的 PI，可在"专业组及 PI 备案申请"模块中发起申请。' />
            ) : viewMode === "card" ? (
              <Row gutter={[12, 12]}>
                {approvedPis.map((pi) => (
                  <Col span={12} key={pi.piInfoId || pi.id}>
                    <Card
                      size="small"
                      hoverable
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <Avatar
                          src={pi.piPhotoPath}
                          size={64}
                          style={{ backgroundColor: "#87d068", flexShrink: 0 }}
                        >
                          {pi.id?.charAt(0) || "P"}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Title level={5} style={{ marginBottom: 4 }}>
                            工号：{pi.id || "未知"}
                          </Title>
                          {pi.professional && (
                            <>
                              <Text type="secondary">专业组：{pi.professional}</Text>
                              <br />
                            </>
                          )}
                          {pi.shanchang && (
                            <>
                              <Text>擅长领域：{pi.shanchang}</Text>
                              <br />
                            </>
                          )}
                          {pi.drugAdminRecordTime ? (
                            <>
                              <Text type="secondary">
                                药监局备案时间：{formatDate(pi.drugAdminRecordTime)}
                              </Text>
                              <br />
                            </>
                          ) : (
                            <>
                              <Text type="secondary" style={{ color: '#999' }}>
                                药监局备案时间：未填写
                              </Text>
                              <br />
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Table
                dataSource={approvedPis}
                columns={tableColumns}
                rowKey={(record) => record.piInfoId || record.id}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
                size="small"
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
            <Card 
            title="机构通知" 
            bordered={false}
            extra={
              <Space>
                <Radio.Group
                  value={noticeViewMode}
                  onChange={(e) => setNoticeViewMode(e.target.value)}
                  size="small"
                  style={{ marginRight: 8 }}
                >
                  <Radio.Button value="all">全部通知</Radio.Button>
                  <Radio.Button value="group">分组通知</Radio.Button>
                </Radio.Group>
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => {
                    if (noticeViewMode === "group") {
                      fetchGroupNotices();
                    } else {
                      fetchNotices();
                    }
                  }}
                  loading={noticeViewMode === "group" ? loadingGroupNotices : loadingNotices}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            {(noticeViewMode === "group" ? loadingGroupNotices : loadingNotices) ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Text type="secondary">加载中...</Text>
              </div>
            ) : (noticeViewMode === "group" ? groupNotices : notices).length === 0 ? (
              <Empty description={noticeViewMode === "group" ? "暂无分组通知" : "暂无通知"} />
            ) : (
              <List
                size="small"
                dataSource={noticeViewMode === "group" ? groupNotices : notices}
                renderItem={(item) => (
                  <List.Item 
                    key={item.noticeId}
                    style={{ cursor: "pointer" }}
                    onClick={() => showNoticeDetail(item.noticeId)}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          <Tag color="blue" style={{ marginRight: 8 }}>
                            通知
                          </Tag>
                          <span 
                            dangerouslySetInnerHTML={{ __html: item.title || "无标题" }}
                            style={{ fontSize: 14, fontWeight: 500 }}
                          />
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                            {formatTimeArray(item.createTime)}
                            {item.publisherId && (
                              <span style={{ marginLeft: 8 }}>
                                发布人：{item.publisherId}
                              </span>
                            )}
                          </Text>
                          <div 
                            dangerouslySetInnerHTML={{ __html: item.content || "无内容" }}
                            style={{ 
                              fontSize: 13,
                              lineHeight: 1.6,
                              maxHeight: 60,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          />
                          {item.attachmentUrls && item.attachmentUrls.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Space size="small" wrap>
                                {item.attachmentUrls.map((url, index) => {
                                  const fileName = url.split("/").pop() || `附件${index + 1}`;
                                  return (
                                    <a
                                      key={index}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        gap: 4,
                                        fontSize: 12,
                                      }}
                                    >
                                      <PaperClipOutlined />
                                      <span>{fileName}</span>
                                    </a>
                                  );
                                })}
                              </Space>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* PI详情模态框 */}
      <Modal
        title={`PI 详细信息 - ${selectedPi?.id || ""}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedPi && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="用户ID" span={1}>
              {selectedPi.id || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="PI信息ID" span={1}>
              {selectedPi.piInfoId || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="职称" span={1}>
              {selectedPi.professional || "未填写"}
            </Descriptions.Item>
            <Descriptions.Item label="擅长领域" span={1}>
              {selectedPi.shanchang || "未填写"}
            </Descriptions.Item>
            <Descriptions.Item label="备案时间" span={1}>
              {formatDate(selectedPi.submitTime)}
            </Descriptions.Item>
            <Descriptions.Item label="药监局备案时间" span={1}>
              {selectedPi.drugAdminRecordTime ? (
                formatDate(selectedPi.drugAdminRecordTime)
              ) : (
                <Text type="secondary">未填写</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="申请状态" span={1}>
              {(() => {
                const statusMap = {
                  PENDING_APPROVAL: { color: "orange", text: "待审核" },
                  APPROVED: { color: "green", text: "已通过" },
                  REJECTED: { color: "red", text: "已驳回" },
                };
                const status = statusMap[selectedPi.applyStatus] || {
                  color: "default",
                  text: selectedPi.applyStatus || "未知",
                };
                return <Tag color={status.color}>{status.text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="当前步骤" span={1}>
              {selectedPi.currentStep || "未知"}
            </Descriptions.Item>
            <Descriptions.Item label="参与临床试验" span={1}>
              {selectedPi.clinicalParticipation ? "是" : "否"}
            </Descriptions.Item>
            {selectedPi.clinicalReason && (
              <Descriptions.Item label="临床原因" span={2}>
                {selectedPi.clinicalReason}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="PI形象照" span={2}>
              <FileLink url={selectedPi.piPhotoPath} label="查看照片" />
            </Descriptions.Item>
            <Descriptions.Item label="高级职称证书" span={2}>
              <FileLink
                url={selectedPi.seniorTitleCertificatePath}
                label="查看证书"
              />
            </Descriptions.Item>
            <Descriptions.Item label="高级职称受聘证明" span={2}>
              <FileLink
                url={selectedPi.seniorTitleAppointmentPath}
                label="查看证明"
              />
            </Descriptions.Item>
            <Descriptions.Item label="签字版简历" span={2}>
              <FileLink url={selectedPi.signedResumePath} label="查看简历" />
            </Descriptions.Item>
            <Descriptions.Item label="资格证书" span={2}>
              <FileLink
                url={selectedPi.qualificationCertificatePath}
                label="查看证书"
              />
            </Descriptions.Item>
            <Descriptions.Item label="执业证书" span={2}>
              <FileLink
                url={selectedPi.practiceCertificatePath}
                label="查看证书"
              />
            </Descriptions.Item>
            <Descriptions.Item label="GCP证书" span={2}>
              <FileLink url={selectedPi.gcpCertificatePath} label="查看证书" />
            </Descriptions.Item>
            {selectedPi.clinicalMaterials &&
              selectedPi.clinicalMaterials.length > 0 && (
                <Descriptions.Item label="临床试验材料" span={2}>
                  <Space direction="vertical" size="small">
                    {selectedPi.clinicalMaterials.map((material, index) => (
                      <div key={index}>
                        <Text strong>项目 {index + 1}:</Text>{" "}
                        {material.projectName || "未命名项目"}
                        {material.nmpaApproval && (
                          <div style={{ marginLeft: 16, marginTop: 4 }}>
                            <FileLink
                              url={material.nmpaApproval}
                              label="NMPA批准文件"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
          </Descriptions>
        )}
      </Modal>

      {/* 通知详情模态框 */}
      <Modal
        title="通知详情"
        open={noticeDetailModalVisible}
        onCancel={() => {
          setNoticeDetailModalVisible(false);
          setSelectedNotice(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setNoticeDetailModalVisible(false);
            setSelectedNotice(null);
          }}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {loadingNoticeDetail ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Text type="secondary">加载中...</Text>
          </div>
        ) : selectedNotice ? (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="通知ID">
                {selectedNotice.noticeId}
              </Descriptions.Item>
              <Descriptions.Item label="通知标题">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedNotice.title || "无标题" }}
                  style={{ fontSize: 16, fontWeight: 500 }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {formatTimeArray(selectedNotice.createTime)}
              </Descriptions.Item>
              <Descriptions.Item label="发布人">
                {selectedNotice.publisherId || "未知"}
                {selectedNotice.publisherRole && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    {selectedNotice.publisherRole === 2 ? "机构办秘书" :
                     selectedNotice.publisherRole === 3 ? "机构办主任" :
                     selectedNotice.publisherRole === 4 ? "机构主任" : "未知"}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="通知正文">
                <div 
                  dangerouslySetInnerHTML={{ __html: selectedNotice.content || "无内容" }}
                  style={{ 
                    fontSize: 14,
                    lineHeight: 1.8,
                    minHeight: 100,
                  }}
                />
              </Descriptions.Item>
              {selectedNotice.attachmentUrls && selectedNotice.attachmentUrls.length > 0 && (
                <Descriptions.Item label="附件">
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    {selectedNotice.attachmentUrls.map((url, index) => {
                      const fileName = url.split("/").pop() || `附件${index + 1}`;
                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: 8,
                            fontSize: 14,
                          }}
                        >
                          <PaperClipOutlined />
                          <span>{fileName}</span>
                        </a>
                      );
                    })}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        ) : (
          <Empty description="未找到通知详情" />
        )}
      </Modal>
    </div>
  );
}

export default Home;
