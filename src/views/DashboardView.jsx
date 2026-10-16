import React from 'react';
import { 
  Users, 
  Cpu, 
  WifiOff, 
  AlertTriangle, 
  ChevronRight, 
  Thermometer, 
  CheckCircle2, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import VitalsChart from '../components/VitalsChart';
import TemperatureChart from '../components/TemperatureChart';

export default function DashboardView({ 
  animals = [], 
  devices = [], 
  alerts = [], 
  realRecords = [],
  benchmarks = [], 
  tempUnit = 'C',
  onNavigateToTab,
  onAcknowledgeAlert
}) {
  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  const totalAnimals = animals.length;
  const connectedSensors = devices.filter(d => d.status === 'Connected').length;
  const staleSensors = devices.filter(d => d.status === 'No recent data').length;
  const disconnectedSensors = devices.filter(d => d.status === 'Disconnected').length;
  const activeAlerts = alerts.filter(a => a.status === 'Active').length;

  // Find latest real physical reading across all devices
  const latestRealReading = realRecords.length > 0 ? realRecords[realRecords.length - 1] : null;

  return (
    <div className="view-content dashboard-view">
      {/* 4 Top Metric Cards (Reflecting Real Hardware States) */}
      <div className="dashboard-stats-grid">
        <StatCard 
          title="Enrolled Livestock Animals"
          value={totalAnimals}
          subtext="Unique permanent QR tags assigned"
          icon={Users}
          variant="navy"
          trend="Permanent Registry"
          badgeText={`${totalAnimals} Enrolled`}
          onClick={() => onNavigateToTab('animals')}
        />

        <StatCard 
          title="Connected ESP32 Sensors"
          value={connectedSensors}
          subtext={connectedSensors > 0 ? "Actively streaming live packets" : "No devices currently transmitting"}
          icon={Cpu}
          variant={connectedSensors > 0 ? "success" : "default"}
          trend={connectedSensors > 0 ? "Hardware Online" : "Awaiting Transmissions"}
          badgeText={connectedSensors > 0 ? `${connectedSensors} Online` : "0 Online"}
          onClick={() => onNavigateToTab('devices')}
        />

        <StatCard 
          title="Sensors Stale / Offline"
          value={staleSensors + disconnectedSensors}
          subtext={`${staleSensors} stale, ${disconnectedSensors} offline`}
          icon={WifiOff}
          variant={staleSensors + disconnectedSensors > 0 ? "warning" : "success"}
          trend="Heartbeat Monitor"
          badgeText={`${staleSensors + disconnectedSensors} Attention`}
          onClick={() => onNavigateToTab('devices')}
        />

        <StatCard 
          title="Clinical Temperature Alerts"
          value={activeAlerts}
          subtext="Threshold alerts from real sensors"
          icon={AlertTriangle}
          variant={activeAlerts > 0 ? "danger" : "success"}
          trend={activeAlerts > 0 ? "Veterinary Triage Required" : "All Normal"}
          badgeText={activeAlerts > 0 ? `${activeAlerts} Active` : "Clear"}
          onClick={() => onNavigateToTab('alerts')}
        />
      </div>

      {/* Primary Hardware Status & Latest Reading Hero Banner */}
      <div className="real-hardware-hero-card">
        <div className="hero-top-row">
          <div className="hero-hardware-info">
            <span className={`hardware-live-dot ${connectedSensors > 0 ? 'connected' : 'offline'}`}></span>
            <div>
              <h3 className="hero-heading">
                {connectedSensors > 0 ? 'ESP32 Physical Hardware: Connected & Live' : 'Physical Hardware Status: Disconnected'}
              </h3>
              <p className="hero-subtext">
                Protocol: Secure HTTP/HTTPS REST Ingestion with Device Key Authentication • Sensor: DS18B20 1-Wire Digital Probe
              </p>
            </div>
          </div>

          <div className="hero-action-buttons">
            <button 
              className="btn-outline-action small"
              onClick={() => onNavigateToTab('devices')}
            >
              <Cpu size={14} />
              <span>Device Pairing</span>
            </button>
          </div>
        </div>

        {/* Latest Actual Reading Display or Waiting Notice */}
        {latestRealReading ? (
          <div className="latest-telemetry-strip">
            <div className="latest-reading-box">
              <div className="reading-big-wrap">
                <Thermometer size={34} className="text-green" />
                <span className="reading-big-num">{formatTemp(latestRealReading.temperature)}</span>
                <span className="reading-big-unit">°{tempUnit}</span>
              </div>
              <div className="reading-sub-details">
                <span className="reading-subject">
                  Animal: <strong>{latestRealReading.animalName}</strong> ({latestRealReading.animalId || 'Unlinked'})
                </span>
                <span className="reading-hw-tag">
                  Node: <strong>{latestRealReading.deviceId}</strong> • Signal: {latestRealReading.rssi ? `${latestRealReading.rssi} dBm` : 'Wi-Fi OK'}
                </span>
              </div>
            </div>

            <div className="reading-timing-box">
              <div className="time-row">
                <Clock size={13} />
                <span>Recorded: {new Date(latestRealReading.serverTimestamp).toLocaleTimeString()}</span>
              </div>
              <span className="verified-badge">
                <CheckCircle2 size={13} /> Validated Hardware Data
              </span>
            </div>
          </div>
        ) : (
          <div className="waiting-real-hardware-banner">
            <WifiOff size={28} className="text-muted" />
            <div className="banner-text-content">
              <h4>Waiting for Real Sensor Data</h4>
              <p>
                The ESP32 microcontroller has not transmitted a reading yet. 
                Power on your board with the DS18B20 sensor connected to GPIO 4. As soon as the first reading is accepted by the backend, 
                it will update this card automatically.
              </p>
            </div>
          </div>
        )}

        {/* Veterinary Review Advisory Notice */}
        <div className="veterinary-disclaimer-box">
          <AlertCircle size={15} className="disc-icon-sm" />
          <span>
            <strong>VETERINARY ADVISORY:</strong> VetShield provides observational sensor telemetry for early illness detection. Automated flags indicate physiological variance and do not constitute a definitive disease diagnosis.
          </span>
        </div>
      </div>

      {/* Primary Visualizations: Real Telemetry Chart & Species Benchmarks */}
      <div className="dashboard-charts-grid">
        <div className="chart-grid-col-left">
          <VitalsChart realRecords={realRecords} tempUnit={tempUnit} />
        </div>
        <div className="chart-grid-col-right">
          <TemperatureChart benchmarks={benchmarks} tempUnit={tempUnit} />
        </div>
      </div>

      {/* Bottom Section: Recent Alerts Table (Filtered to verified records) */}
      <div className="card-box recent-alerts-section">
        <div className="card-box-header">
          <div>
            <h3 className="card-box-title">Recent Clinical Anomaly Notifications</h3>
            <p className="card-box-sub">Threshold events triggered by physical hardware</p>
          </div>
          <button 
            className="btn-outline-action small"
            onClick={() => onNavigateToTab('alerts')}
          >
            <span>Alerts Center</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Animal ID & Name</th>
                <th>Anomaly Type</th>
                <th>Observed Reading</th>
                <th>Threshold</th>
                <th>Time Logged</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => {
                  const isResolved = alert.status === 'Resolved';
                  return (
                    <tr key={alert.id} className={isResolved ? 'row-resolved' : ''}>
                      <td>
                        <span className={`severity-tag tag-${(alert.severity || 'Warning').toLowerCase()}`}>
                          {alert.severity || 'Warning'}
                        </span>
                      </td>
                      <td>
                        <div className="animal-cell">
                          <span className="cell-name">{alert.animalName}</span>
                          <span className="cell-id">{alert.animalId}</span>
                        </div>
                      </td>
                      <td>
                        <span className="anomaly-type-text">{alert.type}</span>
                      </td>
                      <td>
                        <span className="metric-trigger-code">{alert.reading || alert.metric}</span>
                      </td>
                      <td>
                        <span className="table-loc-text">{alert.threshold}</span>
                      </td>
                      <td>
                        <span className="table-time-text">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Recent'}
                        </span>
                      </td>
                      <td>
                        {isResolved ? (
                          <span className="badge-resolved">
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                        ) : (
                          <button 
                            className="btn-table-ack"
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            title="Acknowledge alert"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No active threshold alerts. All connected livestock parameters are normal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
