import './StatusBadge.css';

const statusStyle = {
  active: { text: '运行中', tone: 'green' },
  ongoing: { text: '进行中', tone: 'green' },
  pending: { text: '待启动', tone: 'blue' },
  paused: { text: '暂停', tone: 'amber' },
  completed: { text: '已完成', tone: 'gray' },
  inactive: { text: '未启用', tone: 'gray' },
};

function StatusBadge({ value }) {
  const { text, tone } = statusStyle[value] || { text: value, tone: 'gray' };
  return <span className={`status-badge status-${tone}`}>{text}</span>;
}

export default StatusBadge;

