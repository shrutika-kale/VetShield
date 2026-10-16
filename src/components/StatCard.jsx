import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  variant = 'default', // 'success', 'warning', 'danger', 'navy'
  trend,
  badgeText,
  onClick
}) {
  return (
    <div 
      className={`stat-card stat-card-${variant} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        <div className={`stat-card-icon-box icon-${variant}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        {badgeText && (
          <span className={`stat-badge badge-${variant}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtext && (
        <div className="stat-card-footer">
          {trend && <span className="stat-trend">{trend}</span>}
          <span className="stat-subtext">{subtext}</span>
        </div>
      )}
    </div>
  );
}
