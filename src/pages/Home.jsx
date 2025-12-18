import { useContext, useState } from "react";
import { Card, Col, Empty, List, Row, Radio, Tag, Typography, Table } from "antd";
import { AppDataContext } from "../context/AppDataContext";

const { Title, Text } = Typography;

const mockNotices = [
  {
    id: "n-1",
    title: "关于开展 2025 年度专业组自评工作的通知",
    date: "2025-01-05",
    content:
      "请各专业组于 1 月 20 日前完成自评报告上传，并在系统内提交整改计划。",
  },
  {
    id: "n-2",
    title: "关于更新 I 期临床试验研究室备案信息的提醒",
    date: "2025-01-02",
    content: "I 期研究室需核对场地、设备、人员信息，确保与实际情况一致。",
  },
];

function Home() {
  const { piRecords } = useContext(AppDataContext);
  const approvedPis = piRecords.filter((r) => r.status === "completed");
  const [viewMode, setViewMode] = useState("card"); // 'card' 或 'table'

  const tableColumns = [
    {
      title: "姓名",
      dataIndex: "applicant",
      key: "applicant",
      width: 120,
    },
    {
      title: "科室",
      dataIndex: "department",
      key: "department",
      width: 150,
    },
    {
      title: "备案时间",
      dataIndex: "submitDate",
      key: "submitDate",
      width: 120,
    },
    {
      title: "项目名称",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "状态",
      key: "status",
      width: 100,
      render: () => <Tag color="green">已备案</Tag>,
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
              <Radio.Group
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                size="small"
              >
                <Radio.Button value="card">卡片</Radio.Button>
                <Radio.Button value="table">表格</Radio.Button>
              </Radio.Group>
            }
          >
            {approvedPis.length === 0 ? (
              <Empty description="暂无已完成备案的 PI，可在“专业组及 PI 备案申请”模块中发起申请。" />
            ) : viewMode === "card" ? (
              <Row gutter={[12, 12]}>
                {approvedPis.map((pi) => (
                  <Col span={12} key={pi.id}>
                    <Card size="small" hoverable>
                      <Title level={5} style={{ marginBottom: 4 }}>
                        {pi.applicant}
                      </Title>
                      <Text type="secondary">科室：{pi.department}</Text>
                      <br />
                      <Text type="secondary">备案时间：{pi.submitDate}</Text>
                      <br />
                      <Text>项目：{pi.title}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Table
                dataSource={approvedPis}
                columns={tableColumns}
                rowKey="id"
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
          <Card title="机构通知" bordered={false}>
            <List
              size="small"
              dataSource={mockNotices}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={
                      <span>
                        <Tag color="blue" style={{ marginRight: 8 }}>
                          通知
                        </Tag>
                        {item.title}
                      </span>
                    }
                    description={
                      <>
                        <Text type="secondary" style={{ display: "block" }}>
                          {item.date}
                        </Text>
                        <Text>{item.content}</Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Home;
