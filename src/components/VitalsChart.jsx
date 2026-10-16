import React, { useState } from 'react';
import { Thermometer, Clock, WifiOff, Cpu } from 'lucide-react';

export default function VitalsChart({ realRecords = [], tempUnit = 'C' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  const width = 640;
  const height = 220;
  const paddingX = 45;
  const paddingY = 25;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Empty State: Strictly adhere to rule - never display fake data
  if (!realRecords || realRecords.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Real ESP32 Telemetry Trend (°{tempUnit})</h3>
            <p className="chart-subtitle">Verified physical DS18B20 records</p>
          </div>
          <span className="hw-state-tag waiting">Waiting for Real Data</span>
        </div>

        <div className="chart-waiting-container">
          <div className="waiting-icon-circle">
            <WifiOff size={32} className="text-muted" />
          </div>
          <h4 className="waiting-main-title">No Physical Telemetry Recorded Yet</h4>
          <p className="waiting-main-desc">
            VetShield does not fabricate sensor readings. Once your physical ESP32 powers up and 
            transmits its first validated temperature packet over Wi-Fi, the chronological trend will appear here.
          </p>
          <div className="waiting-steps-hint">
            <span><Cpu size={14} /> Flash firmware to ESP32</span>
            <span><Clock size={14} /> Auto-refreshes on incoming packet</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate min and max from actual physical readings
  const temps = realRecords.map(r => parseFloat(formatTemp(r.temperature)));
  const minTemp = Math.floor(Math.min(...temps) - 1.0);
  const maxTemp = Math.ceil(Math.max(...temps) + 1.0);
  const range = maxTemp - minTemp || 1;

  // Calculate SVG points
  const points = realRecords.map((d, index) => {
    const x = paddingX + (index / Math.max(1, realRecords.length - 1)) * chartWidth;
    const val = parseFloat(formatTemp(d.temperature));
    const normalizedY = (val - minTemp) / range;
    const clampedY = Math.max(0, Math.min(1, normalizedY));
    const y = height - paddingY - clampedY * chartHeight;
    const timeLabel = new Date(d.serverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return { x, y, val, time: timeLabel, deviceId: d.deviceId, raw: d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Physical ESP32 Temperature Trend (°{tempUnit})</h3>
          <p className="chart-subtitle">Showing {realRecords.length} validated real sensor readings</p>
        </div>

        <div className="real-readings-counter">
          <Thermometer size={14} className="text-green" />
          <span>{realRecords.length} Real Record{realRecords.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="chart-svg-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="responsive-svg-chart">
          {/* Horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const y = height - paddingY - pct * chartHeight;
            const gridVal = (minTemp + pct * range).toFixed(1);
            return (
              <g key={idx}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={width - paddingX} 
                  y2={y} 
                  stroke="#e2e8f0" 
                  strokeDasharray="4 4" 
                  strokeWidth="1"
                />
                <text 
                  x={paddingX - 8} 
                  y={y + 4} 
                  fontSize="10" 
                  fill="#94a3b8" 
                  textAnchor="end"
                  fontFamily="inherit"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="rgba(16, 185, 129, 0.12)" />

          {/* Real Trend Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" style={{ cursor: 'pointer' }} />
              <circle 
                cx={pt.x} 
                cy={pt.y} 
                r={hoveredIndex === idx ? 6 : 4} 
                fill="#ffffff" 
                stroke="#10b981" 
                strokeWidth={hoveredIndex === idx ? 3 : 2} 
              />
              <text 
                x={pt.x} 
                y={height - 6} 
                fontSize="9" 
                fill="#64748b" 
                textAnchor="middle"
                fontFamily="inherit"
              >
                {pt.time}
              </text>
            </g>
          ))}

          {/* Tooltip on Hover */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <g transform={`translate(${points[hoveredIndex].x}, ${points[hoveredIndex].y - 35})`}>
              <rect 
                x="-55" 
                y="-20" 
                width="110" 
                height="32" 
                rx="6" 
                fill="#0a192f" 
              />
              <text 
                x="0" 
                y="-5" 
                fill="#10b981" 
                fontSize="11" 
                fontWeight="bold" 
                textAnchor="middle"
                fontFamily="inherit"
              >
                {points[hoveredIndex].val}°{tempUnit}
              </text>
              <text 
                x="0" 
                y="8" 
                fill="#94a3b8" 
                fontSize="8" 
                textAnchor="middle"
                fontFamily="inherit"
              >
                {points[hoveredIndex].deviceId} • {points[hoveredIndex].time}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-indicator" style={{ backgroundColor: '#10b981' }}></span>
          <span>Validated Real ESP32 Physical Probe Stream</span>
        </span>
        <span className="legend-note">
          Normal target range: <strong>38.0 - 39.3°C</strong>
        </span>
      </div>
    </div>
  );
}
