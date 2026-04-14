import './Card.css';

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardTitle({ children }) {
  return <h3 className="card-title">{children}</h3>;
}

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-info">
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className="stat-icon" style={{ background: `${color}20`, color }}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
