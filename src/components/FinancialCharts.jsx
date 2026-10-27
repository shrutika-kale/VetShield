import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export default function FinancialCharts({ 
  dailyTrend = [], 
  expensesByCategory = [] 
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const validDays = dailyTrend && dailyTrend.length > 0 ? dailyTrend : [];

  // Chart dimensions for dual bar chart
  const width = 640;
  const height = 240;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max value among income and expenses
  const maxAmount = Math.max(
    1000,
    ...validDays.map(d => Math.max(d.income || 0, d.expenses || 0))
  );

  const barSlotWidth = chartWidth / Math.max(1, validDays.length);
  const singleBarWidth = Math.max(4, Math.min(16, barSlotWidth * 0.35));

  // Category Total for distribution percentage
  const totalCategoryExpenses = expensesByCategory.reduce((s, c) => s + c.amount, 0) || 1;

  return (
    <div className="financial-charts-container">
      <div className="charts-split-row">
        {/* Income vs Expenses Comparative Bar Chart */}
        <div className="chart-card flex-2">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Daily Operating Income vs. Expenses (₹)</h3>
              <p className="chart-subtitle">Verified daily financial transactions in INR</p>
            </div>
            <div className="chart-header-badge-group">
              <span className="legend-item">
                <span className="legend-indicator" style={{ backgroundColor: '#10b981' }}></span>
                <span>Income</span>
              </span>
              <span className="legend-item">
                <span className="legend-indicator" style={{ backgroundColor: '#ef4444' }}></span>
                <span>Operating Expense</span>
              </span>
            </div>
          </div>

          <div className="chart-svg-container">
            {validDays.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="responsive-svg-chart">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = height - paddingY - pct * chartHeight;
                  const val = Math.round(pct * maxAmount);
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
                        ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for each day */}
                {validDays.map((d, idx) => {
                  const slotCenter = paddingX + idx * barSlotWidth + barSlotWidth / 2;
                  
                  const incomeH = (d.income / maxAmount) * chartHeight;
                  const expenseH = (d.expenses / maxAmount) * chartHeight;

                  const incomeX = slotCenter - singleBarWidth - 1;
                  const expenseX = slotCenter + 1;

                  const incomeY = height - paddingY - incomeH;
                  const expenseY = height - paddingY - expenseH;

                  const isHovered = hoveredIdx === idx;

                  return (
                    <g 
                      key={idx}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Invisible hover trigger area */}
                      <rect 
                        x={slotCenter - barSlotWidth / 2} 
                        y={paddingY} 
                        width={barSlotWidth} 
                        height={chartHeight} 
                        fill={isHovered ? "rgba(15, 23, 42, 0.04)" : "transparent"} 
                      />

                      {/* Income Bar (Green) */}
                      <rect 
                        x={incomeX} 
                        y={incomeY} 
                        width={singleBarWidth} 
                        height={Math.max(2, incomeH)} 
                        rx="3" 
                        fill="#10b981" 
                        opacity={isHovered ? 1 : 0.85}
                      />

                      {/* Expense Bar (Red) */}
                      <rect 
                        x={expenseX} 
                        y={expenseY} 
                        width={singleBarWidth} 
                        height={Math.max(2, expenseH)} 
                        rx="3" 
                        fill="#ef4444" 
                        opacity={isHovered ? 1 : 0.85}
                      />

                      {/* Day Label */}
                      {idx % 2 === 0 && (
                        <text 
                          x={slotCenter} 
                          y={height - 8} 
                          fontSize="9" 
                          fill="#64748b" 
                          textAnchor="middle"
                          fontFamily="inherit"
                        >
                          {d.displayDate || d.date}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Tooltip */}
                {hoveredIdx !== null && validDays[hoveredIdx] && (
                  (() => {
                    const d = validDays[hoveredIdx];
                    const slotCenter = paddingX + hoveredIdx * barSlotWidth + barSlotWidth / 2;
                    const tooltipX = Math.min(width - 75, Math.max(75, slotCenter));
                    const isProfit = d.netProfit >= 0;

                    return (
                      <g transform={`translate(${tooltipX}, 40)`}>
                        <rect 
                          x="-70" 
                          y="-25" 
                          width="140" 
                          height="56" 
                          rx="8" 
                          fill="#0a192f" 
                          filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
                        />
                        <text x="0" y="-10" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="inherit">
                          {d.date}
                        </text>
                        <text x="0" y="5" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="inherit">
                          Income: ₹{d.income.toLocaleString('en-IN')}
                        </text>
                        <text x="0" y="17" fill="#ef4444" fontSize="10" textAnchor="middle" fontFamily="inherit">
                          Expenses: ₹{d.expenses.toLocaleString('en-IN')}
                        </text>
                        <text 
                          x="0" 
                          y="27" 
                          fill={isProfit ? "#34d399" : "#f87171"} 
                          fontSize="9.5" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                          fontFamily="inherit"
                        >
                          Net: {isProfit ? '+' : ''}₹{d.netProfit.toLocaleString('en-IN')}
                        </text>
                      </g>
                    );
                  })()
                )}
              </svg>
            ) : (
              <div className="chart-empty-placeholder">
                <DollarSign size={32} className="text-muted" />
                <p>No financial transactions recorded yet.</p>
              </div>
            )}
          </div>

          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-indicator" style={{ backgroundColor: '#10b981' }}></span>
              <span>Total Recorded Daily Income</span>
            </span>
            <span className="legend-item">
              <span className="legend-indicator" style={{ backgroundColor: '#ef4444' }}></span>
              <span>Recorded Operating Expenses</span>
            </span>
            <span className="legend-note">
              Capital assets documented separately
            </span>
          </div>
        </div>

        {/* Expenses by Category Breakdown Card */}
        <div className="chart-card flex-1">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Expense Categories</h3>
              <p className="chart-subtitle">Cost center distribution</p>
            </div>
            <PieChart size={16} className="text-muted" />
          </div>

          <div className="category-breakdown-list">
            {expensesByCategory.length > 0 ? (
              expensesByCategory.map((cat, idx) => {
                const pct = Math.round((cat.amount / totalCategoryExpenses) * 100);
                return (
                  <div key={idx} className="category-cost-row">
                    <div className="cat-name-row">
                      <span className="cat-name">{cat.category}</span>
                      <span className="cat-amt">
                        ₹ {cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="cat-progress-track">
                      <div 
                        className={`cat-progress-fill ${cat.isCapital ? 'capital' : 'operating'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    <div className="cat-meta-row">
                      <span className="cat-pct">{pct}% of recorded expenses</span>
                      {cat.isCapital && (
                        <span className="cat-capital-badge">Capital Asset</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="chart-empty-placeholder">
                <p>No operating expenses recorded yet.</p>
              </div>
            )}
          </div>

          <div className="expense-disclaimer-footnote">
            <strong>Accounting Clarification:</strong> Only directly attributable livestock costs are charged to individual animals. Enterprise-level overheads are maintained at the farm account level.
          </div>
        </div>
      </div>
    </div>
  );
}