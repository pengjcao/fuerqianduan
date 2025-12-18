import './MetricCard.css';

function MetricCard({ label, value, extra }) {
  return (
    <div className="metric-card">
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {extra ? <div className="metric-card__extra">{extra}</div> : null}
    </div>
  );
}

export default MetricCard;

