import { useContext, useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Modal, Descriptions, Alert, Avatar, Space, message, DatePicker } from 'antd';
import { AppDataContext } from '../context/AppDataContext';
import { AuthContext } from '../context/AuthContext';
import { piRecordApi } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;

// 角色映射
const roleNameMap = {
  1: "研究者",
  2: "机构办秘书",
  3: "机构办主任",
  4: "机构主任",
};

// 状态映射
const statusMap = {
  PENDING_APPROVAL: { color: "orange", text: "待审核" },
  APPROVED: { color: "green", text: "已通过" },
  REJECTED: { color: "red", text: "已驳回" },
  REJECT: { color: "red", text: "已驳回" },
};

function PiRecords() {
  const { piRecords, refreshPiRecords, loading, progressPiRecord } = useContext(AppDataContext);
  const { currentUser, hasRole } = useContext(AuthContext);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  // 填写药监局备案时间相关状态
  const [recordTimeModalVisible, setRecordTimeModalVisible] = useState(false);
  const [recordTime, setRecordTime] = useState(null);
  const [fillingRecordTime, setFillingRecordTime] = useState(false);

  // 页面加载时刷新待审核列表（仅审批者可见）
  useEffect(() => {
    // 只在组件挂载时加载一次，避免无限循环
    if (currentUser && hasRole(['secretary', 'director', 'chief'])) {
      setLocalLoading(true);
      refreshPiRecords()
        .then(() => {
          setLocalLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load PI records:", error);
          setLocalLoading(false);
          message.error("加载待审批列表失败");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // 如果用户信息还未加载，显示加载中
  if (!currentUser) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-heading">PI备案审批</h1>
        <Alert
          message="加载中"
          description="正在加载用户信息..."
          type="info"
          showIcon
        />
      </div>
    );
  }

  // 如果不是审批者，显示提示信息
  if (!hasRole(['secretary', 'director', 'chief'])) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="page-heading">PI备案审批</h1>
        <Alert
          message="权限不足"
          description='此页面仅对审批者（机构办秘书、机构办主任、机构主任）开放。研究者请前往"专业组及 PI 备案申请"页面查看自己的申请进度。'
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // 格式化时间戳
  const formatDate = (timestamp) => {
    if (!timestamp) return "未知";
    try {
      const date = new Date(timestamp);
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

  // 判断当前审批者是否可以审批此记录
  // 后端逻辑：当前审批者角色必须等于数据库里的 current_step + 1
  // currentStep 0 -> 需要 role 1 (研究者，但研究者不能审批)
  // currentStep 1 -> 需要 role 2 (机构办秘书)
  // currentStep 2 -> 需要 role 3 (机构办主任)
  // currentStep 3 -> 需要 role 4 (机构主任)
  const canReview = (record) => {
    if (!currentUser || !record) return false;
    const roleNumber = currentUser.roleNumber || currentUser.role; // 使用数字角色
    const currentStep = record.currentStep || 0;
    
    // 角色映射：secretary=2, director=3, chief=4
    const roleMap = {
      'secretary': 2,
      'director': 3,
      'chief': 4,
    };
    
    // 如果 roleNumber 是数字，直接使用；否则从 roleMap 获取
    const currentRoleNumber = typeof roleNumber === 'number' 
      ? roleNumber 
      : roleMap[currentUser.role] || 0;
    
    // 后端逻辑：role 必须等于 currentStep + 1
    return currentRoleNumber === (currentStep + 1);
  };

  // 判断是否可以填写药监局备案时间
  // 条件：currentStep=4（机构主任已审核完成）且当前用户是机构办秘书（role=2）
  const canFillRecordTime = (record) => {
    if (!currentUser || !record) return false;
    const roleNumber = currentUser.roleNumber;
    const currentStep = record.currentStep || 0;
    
    // 必须是机构办秘书（role=2）且当前步骤是4
    return roleNumber === 2 && currentStep === 4;
  };

  // 处理审批
  const handleReview = async (approve) => {
    if (!selectedRecord) return;
    
    setReviewing(true);
    try {
      // 后端接口需要 userId (申请人的ID), pi_info_id, approve, comment
      await progressPiRecord({
        userId: selectedRecord.id, // userId: 申请人的ID
        pi_info_id: selectedRecord.piInfoId, // pi_info_id
        action: approve ? "approve" : "reject",
        comment,
      });
      message.success(approve ? "审批通过成功" : "审批驳回成功");
      setReviewModalVisible(false);
      setComment('');
      setSelectedRecord(null);
      await refreshPiRecords();
    } catch (error) {
      console.error("Failed to review:", error);
      message.error(error.message || "审批失败，请重试");
    } finally {
      setReviewing(false);
    }
  };

  // 打开审批模态框
  const openReviewModal = (record) => {
    setSelectedRecord(record);
    setReviewModalVisible(true);
    setComment('');
  };

  // 打开填写备案时间模态框
  const openRecordTimeModal = (record) => {
    setSelectedRecord(record);
    // 如果已有备案时间，设置为已有时间；否则设置为当前时间
    if (record.drugAdminRecordTime) {
      setRecordTime(dayjs(record.drugAdminRecordTime));
    } else {
      setRecordTime(dayjs());
    }
    setRecordTimeModalVisible(true);
  };

  // 处理填写备案时间
  const handleFillRecordTime = async () => {
    if (!selectedRecord || !recordTime) {
      message.warning("请选择备案时间");
      return;
    }

    setFillingRecordTime(true);
    try {
      // 格式化时间为 "yyyy-MM-dd HH:mm:ss"
      const formattedTime = recordTime.format("YYYY-MM-DD HH:mm:ss");
      const response = await piRecordApi.fillDrugAdminRecordTime(
        selectedRecord.piInfoId,
        formattedTime
      );
      
      if (response && response.success) {
        message.success("药监局备案时间填写成功");
        setRecordTimeModalVisible(false);
        setRecordTime(null);
        // 刷新列表
        await refreshPiRecords();
      } else {
        message.error(response?.message || "填写备案时间失败");
      }
    } catch (error) {
      console.error("Failed to fill record time:", error);
      message.error(error?.message || "填写备案时间失败，请重试");
    } finally {
      setFillingRecordTime(false);
    }
  };

  // 文件链接组件
  const FileLink = ({ url, label }) => {
    if (!url) return <span style={{ color: '#999' }}>未上传</span>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label || "查看文件"}
      </a>
    );
  };

  const clinicalMaterialFields = [
    { label: "国家药监局批件", arrayKey: "nmpaApprovalPaths", legacyKeys: ["nmpaApproval", "nmpaApprovalPath"] },
    { label: "授权分工表", arrayKey: "delegationTablePaths", legacyKeys: ["delegationTable", "delegationTablePath"] },
    { label: "培训记录表", arrayKey: "trainingRecordPaths", legacyKeys: ["trainingRecord", "trainingRecordPath"] },
    { label: "过程性文件", arrayKey: "processFilesPaths", legacyKeys: ["processFiles", "processFilesPath"] },
    { label: "分中心小结表", arrayKey: "completionFilesPaths", legacyKeys: ["completionFiles", "completionFilesPath"] },
    { label: "其他证明材料", arrayKey: "otherFilesPaths", legacyKeys: ["otherFiles", "otherFilesPath"] },
  ];

  const getMaterialUrls = (material, field) => {
    const value =
      material?.[field.arrayKey] ??
      field.legacyKeys.map((key) => material?.[key]).find(Boolean);
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const ClinicalMaterialsView = ({ materials }) => {
    if (!materials || materials.length === 0) {
      return <span style={{ color: '#999' }}>未上传</span>;
    }

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {materials.map((material, index) => (
          <div
            key={material.id || index}
            style={{ border: "1px solid #f0f0f0", padding: 12, borderRadius: 4 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              项目 {index + 1}：{material.projectName || "未填写项目名称"}
            </div>
            <Space direction="vertical" size={4}>
              {clinicalMaterialFields.map((field) => {
                const urls = getMaterialUrls(material, field);
                if (urls.length === 0) return null;
                return (
                  <div key={field.arrayKey}>
                    <span style={{ marginRight: 8 }}>{field.label}：</span>
                    <Space wrap>
                      {urls.map((url, fileIndex) => (
                        <FileLink
                          key={`${field.arrayKey}-${fileIndex}`}
                          url={url}
                          label={urls.length > 1 ? `${field.label}${fileIndex + 1}` : "查看文件"}
                        />
                      ))}
                    </Space>
                  </div>
                );
              })}
            </Space>
          </div>
        ))}
      </Space>
    );
  };

  const columns = [
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
      title: "用户ID",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "职称",
      dataIndex: "professional",
      key: "professional",
      width: 120,
      render: (text) => text || "未填写",
    },
    {
      title: "擅长领域",
      dataIndex: "shanchang",
      key: "shanchang",
      ellipsis: true,
      render: (text) => text || "未填写",
    },
    {
      title: "申请状态",
      key: "applyStatus",
      width: 120,
      render: (_, record) => {
        const status = statusMap[record.applyStatus] || {
          color: "default",
          text: record.applyStatus || "未知",
        };
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "当前步骤",
      dataIndex: "currentStep",
      key: "currentStep",
      width: 100,
      render: (step) => step || 0,
    },
    {
      title: "提交时间",
      key: "submitTime",
      width: 180,
      render: (_, record) => formatDate(record.submitTime),
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
              setSelectedRecord(record);
              setReviewModalVisible(true);
            }}
          >
            查看详情
          </Button>
          {canReview(record) && (
            <Button
              type="primary"
              size="small"
              onClick={() => openReviewModal(record)}
            >
              审批
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 className="page-heading">PI备案审批</h1>
      
      {localLoading ? (
        <Alert
          message="加载中"
          description="正在加载待审批列表..."
          type="info"
          showIcon
        />
      ) : (
        <Table
          dataSource={piRecords || []}
          columns={columns}
          rowKey={(record) => `${record.piInfoId || record.id}-${record.submitTime || Date.now()}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条待审批记录`,
          }}
          size="small"
          loading={localLoading}
          locale={{
            emptyText: "暂无待审批记录",
          }}
        />
      )}

      {/* 详情/审批模态框 */}
      <Modal
        title={selectedRecord ? `PI备案详情 - ${selectedRecord.id}` : "PI备案详情"}
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setSelectedRecord(null);
          setComment('');
        }}
        width={800}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setReviewModalVisible(false);
              setSelectedRecord(null);
              setComment('');
            }}
          >
            关闭
          </Button>,
          canReview(selectedRecord) && (
            <Button
              key="reject"
              danger
              onClick={() => handleReview(false)}
              loading={reviewing}
            >
              驳回
            </Button>
          ),
          canReview(selectedRecord) && (
            <Button
              key="approve"
              type="primary"
              onClick={() => handleReview(true)}
              loading={reviewing}
            >
              通过
            </Button>
          ),
          // 如果当前步骤是4且是机构办秘书，在模态框底部显示填写备案时间按钮
          canFillRecordTime(selectedRecord) && (
            <Button
              key="fillRecordTime"
              type="default"
              onClick={() => {
                setReviewModalVisible(false);
                openRecordTimeModal(selectedRecord);
              }}
            >
              填写备案时间
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedRecord && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="用户ID" span={1}>
                {selectedRecord.id || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="PI信息ID" span={1}>
                {selectedRecord.piInfoId || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="职称" span={1}>
                {selectedRecord.professional || "未填写"}
              </Descriptions.Item>
              <Descriptions.Item label="擅长领域" span={1}>
                {selectedRecord.shanchang || "未填写"}
              </Descriptions.Item>
              <Descriptions.Item label="申请状态" span={1}>
                {(() => {
                  const status = statusMap[selectedRecord.applyStatus] || {
                    color: "default",
                    text: selectedRecord.applyStatus || "未知",
                  };
                  return <Tag color={status.color}>{status.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="当前步骤" span={1}>
                {selectedRecord.currentStep || 0}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间" span={1}>
                {formatDate(selectedRecord.submitTime)}
              </Descriptions.Item>
              <Descriptions.Item label="药监局备案时间" span={1}>
                {selectedRecord.drugAdminRecordTime ? (
                  formatDate(selectedRecord.drugAdminRecordTime)
                ) : (
                  <span style={{ color: '#999' }}>未填写</span>
                )}
              </Descriptions.Item>
              
              {/* 专业组备案信息 */}
              {(selectedRecord.recordTypes || selectedRecord.hospitalAreas || selectedRecord.selfAssessmentReportPath || selectedRecord.selfAssessmentReport) && (
                <>
                  <Descriptions.Item label="专业组备案类型" span={2}>
                    {selectedRecord.recordTypes ? (
                      (() => {
                        // 处理数组或逗号分隔的字符串
                        let types = [];
                        if (Array.isArray(selectedRecord.recordTypes)) {
                          types = selectedRecord.recordTypes;
                        } else if (typeof selectedRecord.recordTypes === 'string') {
                          types = selectedRecord.recordTypes.split(',').filter(t => t.trim());
                        }
                        return types.length > 0 ? (
                          <Space>
                            {types.map((type, index) => (
                              <Tag key={index} color="blue">{type.trim()}</Tag>
                            ))}
                          </Space>
                        ) : (
                          <span style={{ color: '#999' }}>未填写</span>
                        );
                      })()
                    ) : (
                      <span style={{ color: '#999' }}>未填写</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="专业组备案院区" span={2}>
                    {selectedRecord.hospitalAreas ? (
                      (() => {
                        // 处理数组或逗号分隔的字符串
                        let areas = [];
                        if (Array.isArray(selectedRecord.hospitalAreas)) {
                          areas = selectedRecord.hospitalAreas;
                        } else if (typeof selectedRecord.hospitalAreas === 'string') {
                          areas = selectedRecord.hospitalAreas.split(',').filter(a => a.trim());
                        }
                        return areas.length > 0 ? (
                          <Space>
                            {areas.map((area, index) => (
                              <Tag key={index} color="green">{area.trim()}</Tag>
                            ))}
                          </Space>
                        ) : (
                          <span style={{ color: '#999' }}>未填写</span>
                        );
                      })()
                    ) : (
                      <span style={{ color: '#999' }}>未填写</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="专业组自评报告" span={2}>
                    <FileLink 
                      url={selectedRecord.selfAssessmentReportPath || selectedRecord.selfAssessmentReport || selectedRecord.reportFilePath} 
                      label="查看自评报告" 
                    />
                  </Descriptions.Item>
                </>
              )}
              
              {/* PI备案信息 */}
              <Descriptions.Item label="PI形象照" span={2}>
                <FileLink url={selectedRecord.piPhotoPath} label="查看照片" />
              </Descriptions.Item>
              <Descriptions.Item label="身份证复印件" span={2}>
                <FileLink url={selectedRecord.idCardCopyPath} label="查看身份证复印件" />
              </Descriptions.Item>
              <Descriptions.Item label="高级职称证书" span={2}>
                <FileLink
                  url={selectedRecord.seniorTitleCertificatePath}
                  label="查看证书"
                />
              </Descriptions.Item>
              <Descriptions.Item label="高级职称受聘证明" span={2}>
                <FileLink
                  url={selectedRecord.seniorTitleAppointmentPath}
                  label="查看证明"
                />
              </Descriptions.Item>
              <Descriptions.Item label="签字版简历" span={2}>
                <FileLink url={selectedRecord.signedResumePath} label="查看简历" />
              </Descriptions.Item>
              <Descriptions.Item label="资格证书" span={2}>
                <FileLink
                  url={selectedRecord.qualificationCertificatePath}
                  label="查看证书"
                />
              </Descriptions.Item>
              <Descriptions.Item label="执业证书" span={2}>
                <FileLink
                  url={selectedRecord.practiceCertificatePath}
                  label="查看证书"
                />
              </Descriptions.Item>
              <Descriptions.Item label="GCP证书" span={2}>
                <FileLink
                  url={selectedRecord.gcpCertificatePath}
                  label="查看证书"
                />
              </Descriptions.Item>
              <Descriptions.Item label="参与临床试验" span={1}>
                {selectedRecord.clinicalParticipation ? "是" : "否"}
              </Descriptions.Item>
              {selectedRecord.clinicalReason && (
                <Descriptions.Item label="未上传说明" span={1}>
                  {selectedRecord.clinicalReason}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="参与临床试验证明材料" span={2}>
                <ClinicalMaterialsView materials={selectedRecord.clinicalMaterials} />
              </Descriptions.Item>
            </Descriptions>

            {canReview(selectedRecord) && (
              <div style={{ marginTop: 16 }}>
                <TextArea
                  placeholder="请输入审批意见（可选）"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* 填写药监局备案时间（仅机构办秘书在 currentStep=4 时可见） */}
            {canFillRecordTime(selectedRecord) && (
              <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
                <Alert
                  message="机构主任已审核完成"
                  description="请填写药监局备案时间"
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                />
                <Button
                  type="primary"
                  onClick={() => openRecordTimeModal(selectedRecord)}
                  block
                >
                  {selectedRecord.drugAdminRecordTime ? "修改备案时间" : "填写备案时间"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 填写药监局备案时间模态框 */}
      <Modal
        title={`填写药监局备案时间 - ${selectedRecord?.id || ""}`}
        open={recordTimeModalVisible}
        onCancel={() => {
          setRecordTimeModalVisible(false);
          setRecordTime(null);
          setSelectedRecord(null);
        }}
        onOk={handleFillRecordTime}
        confirmLoading={fillingRecordTime}
        okText="确认填写"
        cancelText="取消"
        width={500}
      >
        {selectedRecord && (
          <div>
            <Alert
              message="提示"
              description="请选择药监局备案的日期和时间"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>PI信息ID：</div>
              <div style={{ marginBottom: 16 }}>{selectedRecord.piInfoId}</div>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>备案时间：</div>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                value={recordTime}
                onChange={(date) => setRecordTime(date)}
                style={{ width: '100%' }}
                placeholder="请选择备案时间"
              />
            </div>
            {selectedRecord.drugAdminRecordTime && (
              <div style={{ marginTop: 16, padding: 8, background: '#f0f0f0', borderRadius: 4 }}>
                <div style={{ fontSize: 12, color: '#666' }}>当前备案时间：</div>
                <div>{formatDate(selectedRecord.drugAdminRecordTime)}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PiRecords;
