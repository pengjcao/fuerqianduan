import { useContext, useMemo, useState } from 'react';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { AppDataContext } from '../context/AppDataContext';
import { AuthContext } from '../context/AuthContext';

const statusText = {
  draft: '草稿',
  under_secretary: '机构办秘书审核',
  under_director: '机构办主任审核',
  under_chief: '机构主任审核',
  completed: '备案完成',
  rejected: '已驳回（需重新提交）',
};

function PiRecords() {
  const { piRecords, addPiRecord, progressPiRecord } = useContext(AppDataContext);
  const { currentUser, roleLabels, hasRole } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({ title: '', applicant: '', department: '' });
  const [comment, setComment] = useState('');

  const detail = useMemo(() => piRecords.find((r) => r.id === detailId), [detailId, piRecords]);

  const canAct = (record) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (record.status === 'draft' && role === 'pi') return true;
    if (record.status === 'under_secretary' && role === 'secretary') return true;
    if (record.status === 'under_director' && role === 'director') return true;
    if (record.status === 'under_chief' && role === 'chief') return true;
    if (record.status === 'rejected' && role === 'pi') return true;
    return false;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.applicant) return;
    try {
      await addPiRecord(form);
      setForm({ title: '', applicant: '', department: '' });
      setOpen(false);
    } catch (error) {
      console.error("Failed to create PI record:", error);
    }
  };

  const handleAction = (record, action) => {
    const role = currentUser?.role;
    if (!role) return;
    const mapAction = {
      submit: { allow: record.status === 'draft' && role === 'pi' },
      approve_secretary: { allow: record.status === 'under_secretary' && role === 'secretary' },
      approve_director: { allow: record.status === 'under_director' && role === 'director' },
      approve_chief: { allow: record.status === 'under_chief' && role === 'chief' },
      reject: {
        allow:
          (record.status === 'under_secretary' && role === 'secretary') ||
          (record.status === 'under_director' && role === 'director') ||
          (record.status === 'under_chief' && role === 'chief'),
      },
      resubmit: { allow: record.status === 'rejected' && role === 'pi' },
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
        setComment('');
      } catch (error) {
        console.error("Failed to update PI record:", error);
      }
    })();
  };

  const renderActions = (record) => {
    if (!canAct(record)) return null;
    const role = currentUser?.role;
    const actions = [];
    if (record.status === 'draft' && role === 'pi') {
      actions.push({ key: 'submit', label: '提交备案' });
    }
    if (record.status === 'under_secretary' && role === 'secretary') {
      actions.push({ key: 'approve_secretary', label: '秘书同意' });
      actions.push({ key: 'reject', label: '驳回' });
    }
    if (record.status === 'under_director' && role === 'director') {
      actions.push({ key: 'approve_director', label: '主任同意' });
      actions.push({ key: 'reject', label: '驳回' });
    }
    if (record.status === 'under_chief' && role === 'chief') {
      actions.push({ key: 'approve_chief', label: '机构主任同意' });
      actions.push({ key: 'reject', label: '驳回' });
    }
    if (record.status === 'rejected' && role === 'pi') {
      actions.push({ key: 'resubmit', label: '重新提交' });
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
            className={`btn ${a.key.includes('reject') ? '' : 'primary'}`}
            onClick={() => handleAction(record, a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1 className="page-heading">PI备案审批</h1>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        {hasRole(['pi', 'admin']) && (
          <button className="btn primary" onClick={() => setOpen(true)}>
            新建备案
          </button>
        )}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>备案项目</th>
              <th>申请人</th>
              <th>科室/专业</th>
              <th>状态</th>
              <th>当前节点</th>
              <th>提交日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {piRecords.map((record) => (
              <tr key={record.id} onClick={() => setDetailId(record.id)} style={{ cursor: 'pointer' }}>
                <td>{record.title}</td>
                <td>{record.applicant}</td>
                <td>{record.department}</td>
                <td>
                  <StatusBadge value={record.status === 'completed' ? 'completed' : record.status} />
                  <span className="muted small" style={{ marginLeft: 6 }}>
                    {statusText[record.status]}
                  </span>
                </td>
                <td>{record.step}</td>
                <td>{record.submitDate}</td>
                <td>{renderActions(record)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="section-title">流转记录：{detail.title}</div>
          <div className="small muted" style={{ marginBottom: 8 }}>
            当前节点：{detail.step} · 状态：{statusText[detail.status]}
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
                    <td className="muted">{h.comment || '-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {detail.attachments?.length ? (
            <div style={{ marginTop: 10 }}>
              <div className="section-title">附件</div>
              <ul className="small">
                {detail.attachments.map((f) => (
                  <li key={f.name}>
                    {f.name} <span className="muted">({f.size || '-'})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <Modal open={open} title="新建 PI 备案" onClose={() => setOpen(false)}>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="form-field">
              <label>项目名称</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>申请人（PI）</label>
              <input
                required
                value={form.applicant}
                onChange={(e) => setForm({ ...form, applicant: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>科室/专业组</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
              取消
            </button>
            <button type="submit" className="btn primary">
              保存草稿
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PiRecords;

