import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Check, 
  Filter
} from 'lucide-react';

export default function AlertsView({ 
  alerts, 
  onAcknowledgeAlert, 
  onResolveAlert, 
  onSelectAnimal,
  animals
}) {
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSev = severityFilter === 'All' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || alert.status === statusFilter;
    return matchesSev && matchesStatus;
  });

  const activeCount = alerts.filter(a => a.status === 'Active').length;
  const criticalCount = alerts.filter(a => a.severity === 'Critical' && a.status === 'Active').length;

  return (
    <div className="view-content alerts-view">
      {/* Top Summary Banner */}
      <div className="alerts-summary-banner">
        <div className="alerts-banner-metric">
          <span className="summary-num danger">{criticalCount}</span>
          <span className="summary-lbl">Critical Urgent</span>
        </div>
        <div className="alerts-banner-divider"></div>
        <div className="alerts-banner-metric">
          <span className="summary-num warning">{activeCount}</span>
          <span className="summary-lbl">Active Unresolved</span>
        </div>
        <div className="alerts-banner-divider"></div>
        <div className="alerts-banner-metric">
          <span className="summary-num success">{alerts.length - activeCount}</span>
          <span className="summary-lbl">Resolved Interventions</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="toolbar-container">
        <div className="filter-pills-row">
          <span className="filter-label">Severity:</span>
          {['All', 'Critical', 'Warning', 'Info'].map((sev) => (
            <button
              key={sev}
              className={`filter-pill ${severityFilter === sev ? 'active' : ''}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="toolbar-bottom-row">
          <div className="filter-select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Resolution States</option>
              <option value="Active">Active Only</option>
              <option value="Resolved">Resolved History</option>
            </select>
          </div>

          <div className="filter-results-counter">
            Showing <strong>{filteredAlerts.length}</strong> of {alerts.length} notifications
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="alerts-feed-list">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isCrit = alert.severity === 'Critical';
            const isWarn = alert.severity === 'Warning';
            const isResolved = alert.status === 'Resolved';

            // Find matching animal object
            const matchingAnimal = animals.find(a => a.id === alert.animalId);

            return (
              <div 
                key={alert.id} 
                className={`alert-card-detailed ${isCrit ? 'card-sev-crit' : isWarn ? 'card-sev-warn' : 'card-sev-info'} ${isResolved ? 'resolved-dimmed' : ''}`}
              >
                <div className="alert-card-header">
                  <div className="alert-badge-identity">
                    <span className={`severity-tag tag-${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                    <span className="alert-code-id">{alert.id}</span>
                    <span className="alert-time-tag">
                      <Clock size={12} /> {alert.timestamp}
                    </span>
                  </div>

                  <div className="alert-actions-top">
                    {isResolved ? (
                      <span className="badge-resolved-pill">
                        <CheckCircle2 size={14} /> Resolved
                      </span>
                    ) : (
                      <div className="action-buttons-wrap">
                        <button 
                          className="btn-ack-pill"
                          onClick={() => onAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </button>
                        <button 
                          className="btn-resolve-pill"
                          onClick={() => onResolveAlert(alert.id)}
                        >
                          <Check size={14} /> Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="alert-title-row">
                  <h3 className="alert-anomaly-title">{alert.type}</h3>
                  <div 
                    className="alert-subject-pill"
                    onClick={() => matchingAnimal && onSelectAnimal(matchingAnimal)}
                    title="View Animal Dossier"
                    style={{ cursor: matchingAnimal ? 'pointer' : 'default' }}
                  >
                    <strong>{alert.animalName}</strong>
                    <span>({alert.animalId})</span>
                  </div>
                </div>

                <div className="alert-metrics-banner">
                  <div className="metric-col">
                    <span className="m-label">Observed Biometric:</span>
                    <span className="m-val highlight">{alert.metric}</span>
                  </div>
                  <div className="metric-col">
                    <span className="m-label">Clinical Threshold:</span>
                    <span className="m-val">{alert.threshold}</span>
                  </div>
                  <div className="metric-col">
                    <span className="m-label">Location:</span>
                    <span className="m-val">
                      <MapPin size={12} /> {alert.location}
                    </span>
                  </div>
                </div>

                <div className="alert-recommendation-box">
                  <span className="rec-label">Recommended Veterinary Protocol:</span>
                  <p className="rec-text">{alert.recommendation}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-box">
            <CheckCircle2 size={40} className="check-success" />
            <p className="empty-state-title">No alerts match the selected filters</p>
            <p className="empty-state-sub">Try changing severity or status filters above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
