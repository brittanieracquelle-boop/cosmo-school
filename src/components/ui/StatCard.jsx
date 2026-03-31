export default function StatCard({ color, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-accent" style={{ background: color }}></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
