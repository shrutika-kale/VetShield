import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function TemperatureChart({ benchmarks, tempUnit = 'C' }) {
  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Species Temperature Benchmarks</h3>
          <p className="chart-subtitle">Real-time core temp vs Safe Veterinary Thresholds (°{tempUnit})</p>
        </div>
        <div className="species-badge-count">
          <span>{benchmarks.length} Species Monitored</span>
        </div>
      </div>

      <div className="species-temp-list">
        {benchmarks.map((item) => {
          const isElevated = item.currentAvg > item.maxNormal;
          const isLow = item.currentAvg < item.minNormal;
          const isNormal = !isElevated && !isLow;

          // Compute percentage position in bar
          // Baseline: 36°C (or 96.8°F), Max: 42°C (107.6°F)
          const base = 36.5;
          const max = 41.5;
          const currentPct = Math.min(100, Math.max(0, ((item.currentAvg - base) / (max - base)) * 100));
          const safeMinPct = ((item.minNormal - base) / (max - base)) * 100;
          const safeMaxPct = ((item.maxNormal - base) / (max - base)) * 100;

          return (
            <div key={item.species} className="species-temp-row">
              <div className="species-row-header">
                <div className="species-name-box">
                  <span className="species-name">{item.species}</span>
                  <span className="species-safe-range">
                    Safe Range: {formatTemp(item.minNormal)} - {formatTemp(item.maxNormal)}°{tempUnit}
                  </span>
                </div>

                <div className="species-reading-box">
                  <span className={`temp-value-pill ${isElevated ? 'danger' : isNormal ? 'normal' : 'warning'}`}>
                    {isElevated ? (
                      <AlertCircle size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    <strong>{formatTemp(item.currentAvg)}°{tempUnit}</strong>
                    <span className="temp-state-label">
                      {isElevated ? 'Elevated' : isLow ? 'Low' : 'Normal'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Graphical Visual Range Bar */}
              <div className="temp-range-track-container">
                <div className="temp-range-track">
                  {/* Safe Zone Highlight */}
                  <div 
                    className="safe-zone-highlight" 
                    style={{
                      left: `${safeMinPct}%`,
                      width: `${safeMaxPct - safeMinPct}%`
                    }}
                    title="Normal Safe Veterinary Range"
                  />
                  {/* Current Reading Marker */}
                  <div 
                    className={`current-temp-pin ${isElevated ? 'elevated' : ''}`}
                    style={{ left: `${currentPct}%` }}
                    title={`Current: ${formatTemp(item.currentAvg)}°${tempUnit}`}
                  >
                    <div className="pin-head"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="temp-legend-footer">
        <div className="legend-chip">
          <span className="legend-chip-box safe-box"></span>
          <span>Normal Healthy Zone</span>
        </div>
        <div className="legend-chip">
          <span className="legend-chip-box pin-box"></span>
          <span>Live Herd Average Marker</span>
        </div>
      </div>
    </div>
  );
}
