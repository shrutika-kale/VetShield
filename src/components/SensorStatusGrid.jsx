import React from 'react';
import { BatteryCharging, Radio } from 'lucide-react';

export default function SensorStatusGrid({ gateways }) {
  return (
    <div className="sensor-mesh-card">
      <div className="mesh-header">
        <div>
          <h3 className="mesh-title">IoT Telemetry Nodes & Gateways</h3>
          <p className="mesh-subtitle">Simulated mesh infrastructure (Demo Data • Virtual Nodes)</p>
        </div>
        <div className="mesh-badge">
          <Radio size={14} className="pulse-icon" />
          <span>All Gateways Connected (Simulated)</span>
        </div>
      </div>

      <div className="gateway-cards-grid">
        {gateways.map((gw) => (
          <div key={gw.id} className="gateway-item-card">
            <div className="gw-card-top">
              <div className="gw-identity">
                <span className="gw-id-badge">{gw.id}</span>
                <h4 className="gw-name">{gw.name}</h4>
              </div>
              <span className="gw-online-pill">
                <span className="mini-beacon"></span>
                {gw.status}
              </span>
            </div>

            <div className="gw-location-row">
              <span className="location-label">Location:</span>
              <span className="location-val">{gw.location}</span>
            </div>

            <div className="gw-metrics-row">
              <div className="gw-metric-box">
                <span className="metric-lbl">Active Tags</span>
                <span className="metric-val">{gw.connectedTags} nodes</span>
              </div>
              <div className="gw-metric-box">
                <span className="metric-lbl">Signal RSSI</span>
                <span className="metric-val">{gw.signalStrength}</span>
              </div>
              <div className="gw-metric-box">
                <span className="metric-lbl">Battery / Power</span>
                <span className="metric-val battery-val">
                  <BatteryCharging size={13} />
                  {gw.battery}%
                </span>
              </div>
            </div>

            <div className="gw-footer-row">
              <span className="firmware-tag">Simulated FW: {gw.firmware}</span>
              <span className="uptime-tag">Uptime: {gw.uptime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
