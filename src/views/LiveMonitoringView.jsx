import React from 'react';
import { 
  Radio, 
  Thermometer, 
  Terminal, 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw
} from 'lucide-react';

export default function LiveMonitoringView({ 
  devices = [], 
  animals = [], 
  realRecords = [], 
  tempUnit = 'C',
  onSelectAnimal,
  onRefresh
}) {
  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  const connectedCount = devices.filter(d => d.status === 'Connected').length;

  return (
    <div className="view-content live-monitoring-view">
      {/* Real Ingestion Banner */}
      <div className="telemetry-banner-card">
        <div className="banner-left">
          <div className={`beacon-status-large ${connectedCount > 0 ? 'pulsing' : 'paused'}`}>
            <Radio size={24} />
          </div>
          <div>
            <div className="banner-badge-row">
              <span className="live-demo-tag">AUTHENTICATED HARDWARE PIPELINE</span>
              <span className="prototype-note">Port 5000 Ingestion Gateway</span>
            </div>
            <h2 className="banner-title">
              {connectedCount > 0 
                ? `${connectedCount} ESP32 Physical Device(s) Actively Transmitting`
                : 'Waiting for Physical ESP32 Ingestion Packets'}
            </h2>
            <p className="banner-desc">
              Direct Wi-Fi telemetry stream over HTTP/HTTPS. Every packet is cryptographically verified against 
              device API keys, validated for sensor electrical faults (-127°C / 85°C), and timestamped server-side.
            </p>
          </div>
        </div>

        <div className="banner-right-controls">
          <button 
            className="btn-outline-action small"
            onClick={onRefresh}
            title="Poll gateway for latest packets"
          >
            <RefreshCw size={14} />
            <span>Poll Hardware</span>
          </button>
        </div>
      </div>

      {/* Grid: Live Devices Stream & Real Packet Console */}
      <div className="live-grid-layout">
        {/* Left Column: Live Hardware Endpoints */}
        <div className="live-column-left">
          <div className="section-title-row">
            <h3 className="section-heading">ESP32 Hardware Endpoints ({devices.length} Nodes)</h3>
            <span className="section-meta-note">Status calculated from live heartbeat</span>
          </div>

          <div className="live-tiles-grid">
            {devices.map((device) => {
              const assignedAnimal = animals.find(a => a.id === device.assignedAnimalId);
              const isConnected = device.status === 'Connected';
              const isStale = device.status === 'No recent data';
              const hasReading = device.lastReading && device.lastReading.temperature !== undefined;

              return (
                <div 
                  key={device.deviceId} 
                  className={`live-stream-tile ${isConnected ? 'tile-live' : isStale ? 'tile-warn' : 'tile-offline'}`}
                  onClick={() => assignedAnimal && onSelectAnimal(assignedAnimal)}
                  style={{ cursor: assignedAnimal ? 'pointer' : 'default' }}
                >
                  <div className="tile-top">
                    <div className="tile-species-id">
                      <span className="tile-tag-id">{device.deviceId}</span>
                      <span className="tile-name">
                        {assignedAnimal ? `${assignedAnimal.name} (${assignedAnimal.id})` : 'Unpaired Node'}
                      </span>
                    </div>
                    <span className={`status-badge ${isConnected ? 'status-healthy' : isStale ? 'status-monitoring' : 'status-critical'}`}>
                      {device.status}
                    </span>
                  </div>

                  {hasReading ? (
                    <div className="tile-metrics-stream">
                      <div className="stream-metric">
                        <Thermometer size={16} className="text-green" />
                        <div className="stream-metric-text">
                          <span className="stream-lbl">Actual Temp</span>
                          <span className="stream-val">{formatTemp(device.lastReading.temperature)}°{tempUnit}</span>
                        </div>
                      </div>

                      <div className="stream-metric">
                        <Wifi size={14} className="text-blue" />
                        <div className="stream-metric-text">
                          <span className="stream-lbl">Wi-Fi RSSI</span>
                          <span className="stream-val">{device.lastReading.rssi ? `${device.lastReading.rssi} dBm` : 'Connected'}</span>
                        </div>
                      </div>

                      <div className="stream-metric">
                        <Clock size={14} className="text-muted" />
                        <div className="stream-metric-text">
                          <span className="stream-lbl">Last Synced</span>
                          <span className="stream-val">
                            {new Date(device.lastReading.serverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="tile-waiting-state">
                      <WifiOff size={16} className="text-muted" />
                      <span>Waiting for real sensor data</span>
                    </div>
                  )}

                  <div className="tile-footer">
                    <span className="tile-sensor-type">{device.sensorModel}</span>
                    <span className="tile-ping-time">
                      {device.lastSeen ? `Heartbeat: ${new Date(device.lastSeen).toLocaleTimeString()}` : 'No heartbeat yet'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Verified Packet Log Terminal */}
        <div className="live-column-right">
          <div className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-title">
                <Terminal size={15} />
                <span>Real Ingestion Log Stream</span>
              </div>
              <span className="terminal-beacon">HTTP / REST Broker</span>
            </div>

            <div className="terminal-body">
              {realRecords.length > 0 ? (
                realRecords.map((log) => (
                  <div key={log.id} className="log-line">
                    <span className="log-timestamp">
                      {new Date(log.serverTimestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-tag">[{log.deviceId}]</span>
                    <span className="log-payload">
                      OK | Temp: {log.temperature}°{log.unit} | Animal: {log.animalId || 'None'} | RSSI: {log.rssi || '-65'}dBm
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-terminal-text">
                  <WifiOff size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <span>Waiting for real sensor packet from physical ESP32...</span>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                    POST to <code>/api/telemetry</code> with header <code>X-API-KEY</code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Hardware Checklist Card */}
          <div className="gateway-summary-card">
            <h4 className="gateway-summary-title">Hardware Validation Checklist</h4>
            <div className="specs-list-simple">
              <div className="spec-simple-item">
                <span className="s-name">DS18B20 Data Pin:</span>
                <span className="s-val">GPIO 4 (with 4.7kΩ pull-up)</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">VCC / Power:</span>
                <span className="s-val">3.3V or 5V (ESP32 Board)</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">Ground:</span>
                <span className="s-val">Common GND</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">Sensor Wire Check:</span>
                <span className="s-val">Auto-filters -127°C / 85°C faults</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
