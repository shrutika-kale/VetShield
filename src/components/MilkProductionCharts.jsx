import React, { useState } from 'react';
import { Droplets, TrendingUp, BarChart3 } from 'lucide-react';

export default function MilkProductionCharts({ 
  dailyTrend = [], 
  todayCowMilk = 0, 
  todayBuffaloMilk = 0 
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // SVG Chart Dimensions
  const width = 640;
  const height = 220;
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const validDays = dailyTrend && dailyTrend.length > 0 ? dailyTrend : [];

  // Find max yield for scale
  const maxVal = Math.max(
    20,
    ...validDays.map(d => d.totalLiters || 0)
  );

  const points = validDays.map((d, index) => {
    const x = paddingX + (index / Math.max(1, validDays.length - 1)) * chartWidth;
    const yVal = d.totalLiters || 0;
    const normalizedY = yVal / maxVal;
    const y = height - paddingY - normalizedY * chartHeight;
    return {
      x,
      y,
      val: yVal,
      cow: d.cowLiters || 0,
      buffalo: d.buffaloLiters || 0,
      income: d.income || 0,
      date: d.displayDate || d.date,
      fullDate: d.date
    };
  });

  const pathTotal = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaTotal = points.length > 0 
    ? `${pathTotal} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` 
    : '';

  // Cow vs Buffalo proportion calculations
  const totalBoth = (todayCowMilk + todayBuffaloMilk) || 1;
  const cowPct = Math.round((todayCowMilk / totalBoth) * 100);
  const buffaloPct = 100 - cowPct;

  return (
    <div className="charts-split-row">
      {/* 14-Day Production Trend Chart */}
      <div className="chart-card flex-2">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">14-Day Daily Milk Production Trend (Litres)</h3>
            <p className="chart-subtitle">Chronological herd yield from verified daily logs</p>
          </div>
          <div className="chart-header-badge-group">
            <span className="legend-indicator" style={{ backgroundColor: '#0284c7' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Total Milk (L)</span>
          </div>
        </div>

        <div className="chart-svg-container">
          {validDays.length > 0 ? (
            <svg viewBox={`0 0 ${width} ${height}`} className="responsive-svg-chart">
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                const y = height - paddingY - pct * chartHeight;
                const gridVal = (pct * maxVal).toFixed(0);
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
                      {gridVal} L
                    </text>
                  </g>
                );
              })}

              {/* Area gradient fill */}
              <path d={areaTotal} fill="rgba(2, 132, 199, 0.12)" />

              {/* Total Trend Line */}
              <path 
                d={pathTotal} 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, idx) => (
                <g 
                  key={idx} 
                  onMouseEnter={() => setHoveredDay(idx)} 
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" style={{ cursor: 'pointer' }} />
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={hoveredDay === idx ? 6 : 4} 
                    fill="#ffffff" 
                    stroke="#0284c7" 
                    strokeWidth={hoveredDay === idx ? 3 : 2} 
                  />
                  {idx % 2 === 0 && (
                    <text 
                      x={pt.x} 
                      y={height - 6} 
                      fontSize="9" 
                      fill="#64748b" 
                      textAnchor="middle"
                      fontFamily="inherit"
                    >
                      {pt.date}
                    </text>
                  )}
                </g>
              ))}

              {/* Tooltip */}
              {hoveredDay !== null && points[hoveredDay] && (
                <g transform={`translate(${points[hoveredDay].x}, ${Math.max(30, points[hoveredDay].y - 45)})`}>
                  <rect 
                    x="-65" 
                    y="-28" 
                    width="130" 
                    height="48" 
                    rx="8" 
                    fill="#0a192f" 
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                  />
                  <text 
                    x="0" 
                    y="-10" 
                    fill="#38bdf8" 
                    fontSize="11" 
                    fontWeight="bold" 
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    {points[hoveredDay].val} Litres
                  </text>
                  <text 
                    x="0" 
                    y="4" 
                    fill="#ffffff" 
                    fontSize="9" 
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    Cow: {points[hoveredDay].cow}L • Buff: {points[hoveredDay].buffalo}L
                  </text>
                  <text 
                    x="0" 
                    y="15" 
                    fill="#10b981" 
                    fontSize="8.5" 
                    textAnchor="middle"
                    fontFamily="inherit"
                  >
                    ₹{points[hoveredDay].income.toLocaleString('en-IN')} Sales
                  </text>
                </g>
              )}
            </svg>
          ) : (
            <div className="chart-empty-placeholder">
              <Droplets size={32} className="text-muted" />
              <p>No milk production records available to plot trend.</p>
            </div>
          )}
        </div>

        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-indicator" style={{ backgroundColor: '#0284c7' }}></span>
            <span>Total Daily Herd Yield</span>
          </span>
          <span className="legend-note">
            Calculated as Morning + Afternoon + Evening milking logs
          </span>
        </div>
      </div>

      {/* Cow vs Buffalo Comparison Donut / Ratio Card */}
      <div className="chart-card flex-1">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Cow vs Buffalo Yield</h3>
            <p className="chart-subtitle">Category production distribution</p>
          </div>
          <BarChart3 size={16} className="text-muted" />
        </div>

        <div className="cow-buffalo-ratio-container">
          <div className="ratio-bar-wrapper">
            <div 
              className="ratio-bar-segment cow" 
              style={{ width: `${todayCowMilk === 0 && todayBuffaloMilk === 0 ? 50 : cowPct}%` }}
              title={`Cow Milk: ${todayCowMilk} L (${cowPct}%)`}
            >
              <span>{cowPct}%</span>
            </div>
            <div 
              className="ratio-bar-segment buffalo" 
              style={{ width: `${todayCowMilk === 0 && todayBuffaloMilk === 0 ? 50 : buffaloPct}%` }}
              title={`Buffalo Milk: ${todayBuffaloMilk} L (${buffaloPct}%)`}
            >
              <span>{buffaloPct}%</span>
            </div>
          </div>

          <div className="species-stat-tiles-grid">
            <div className="species-stat-tile cow">
              <div className="tile-icon">🐄</div>
              <div className="tile-info">
                <span className="tile-lbl">Cow Production</span>
                <span className="tile-val">{todayCowMilk} L</span>
                <span className="tile-sub">Standard Fat Milk</span>
              </div>
            </div>

            <div className="species-stat-tile buffalo">
              <div className="tile-icon">🐃</div>
              <div className="tile-info">
                <span className="tile-lbl">Buffalo Production</span>
                <span className="tile-val">{todayBuffaloMilk} L</span>
                <span className="tile-sub">High Fat Premium</span>
              </div>
            </div>
          </div>

          <div className="dairy-economics-hint">
            <strong>Economics Note:</strong> Buffalo milk delivers higher SNF (Solid-Not-Fat) and fat percentage (typically 6.5–8.0%), commanding an average ₹15–20/L market premium over Cow milk.
          </div>
        </div>
      </div>
    </div>
  );
}