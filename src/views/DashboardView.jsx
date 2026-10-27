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
  AlertCircle,
  Droplets,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  QrCode,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';
import StatCard from '../components/StatCard';
import VitalsChart from '../components/VitalsChart';
import TemperatureChart from '../components/TemperatureChart';
import MilkProductionCharts from '../components/MilkProductionCharts';
import FinancialCharts from '../components/FinancialCharts';

export default function DashboardView({ 
  animals = [], 
  devices = [], 
  alerts = [], 
  realRecords = [],
  benchmarks = [], 
  tempUnit = 'C',
  milkStats = null,
  financialSummary = null,
  onNavigateToTab,
  onAcknowledgeAlert,
  onOpenAddAnimalModal,
  onOpenAddMilkModal,
  onOpenAddIncomeModal,
  onOpenAddExpenseModal,
  onOpenQRScannerModal
}) {
  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  const totalAnimals = animals.length;
  const totalCows = animals.filter(a => a.species === 'Cow' || a.species === 'Cattle').length;
  const totalBuffaloes = animals.filter(a => a.species === 'Buffalo').length;
  
  const connectedSensors = devices.filter(d => d.status === 'Connected').length;
  const staleSensors = devices.filter(d => d.status === 'No recent data').length;
  const disconnectedSensors = devices.filter(d => d.status === 'Disconnected').length;
  
  // Health attention: active alerts or animals marked Critical / Monitoring
  const healthAttentionAnimals = animals.filter(
    a => a.healthStatus === 'Critical' || a.healthStatus === 'Monitoring' || a.healthStatus === 'Under Treatment'
  ).length;
  const activeAlerts = alerts.filter(a => a.status === 'Active').length;
  const totalAttentionCount = Math.max(activeAlerts, healthAttentionAnimals);

  // Milk stats
  const todayMilkTotal = milkStats?.todayTotalMilk || 0;
  const todayCowMilk = milkStats?.todayCowMilk || 0;
  const todayBuffaloMilk = milkStats?.todayBuffaloMilk || 0;

  // Financial stats
  const todayIncome = financialSummary?.today?.income || 0;
  const todayExpenses = financialSummary?.today?.operatingExpenses || 0;
  const todayNetProfit = financialSummary?.today?.netOperatingProfit || 0;
  const isNetPositive = todayNetProfit > 0;
  const isNetNegative = todayNetProfit < 0;

  // Find latest real physical reading across all devices
  const latestRealReading = realRecords.length > 0 ? realRecords[realRecords.length - 1] : null;

  return (
    <div className="view-content dashboard-view">
      {/* 8 Primary Summary Cards (Requirement: Feature 6) */}
      <div className="dashboard-stats-grid eight-cards-grid">
        <StatCard 
          title="Total Registered Animals"
          value={totalAnimals}
          subtext="Permanent electronic QR tags"
          icon={Users}
          variant="navy"
          trend="Central Herd Registry"
          badgeText={`${totalAnimals} Enrolled`}
          onClick={() => onNavigateToTab('animals')}
        />

        <StatCard 
          title="Total Dairy Cows"
          value={totalCows}
          subtext="Indigenous & Crossbred"
          icon={Users}
          variant="default"
          trend="Cow Stock"
          badgeText={`${totalCows} Cows`}
          onClick={() => onNavigateToTab('dairy')}
        />

        <StatCard 
          title="Total Dairy Buffaloes"
          value={totalBuffaloes}
          subtext="Murrah & High-Fat Breeds"
          icon={Users}
          variant="default"
          trend="Buffalo Stock"
          badgeText={`${totalBuffaloes} Buffaloes`}
          onClick={() => onNavigateToTab('dairy')}
        />

        <StatCard 
          title="Milk Produced Today"
          value={todayMilkTotal > 0 ? `${todayMilkTotal} L` : "0.0 L"}
          subtext={todayMilkTotal > 0 ? `Cow: ${todayCowMilk}L • Buff: ${todayBuffaloMilk}L` : "No milk recorded today"}
          icon={Droplets}
          variant="navy"
          trend="Daily Yield"
          badgeText={todayMilkTotal > 0 ? `${todayMilkTotal} L Logged` : "Pending Log"}
          onClick={() => onNavigateToTab('milk')}
        />

        <StatCard 
          title="Today's Milk Sales"
          value={`₹ ${todayIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Verified commercial revenue"
          icon={CheckCircle2}
          variant="success"
          trend="Sales Ledger"
          badgeText="Verified Revenue"
          onClick={() => onNavigateToTab('finances')}
        />

        <StatCard 
          title="Today's Recorded Expenses"
          value={`₹ ${todayExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Operating costs (feed, labour, vet)"
          icon={TrendingDown}
          variant="warning"
          trend="Daily Operating"
          badgeText="Opex Ledger"
          onClick={() => onNavigateToTab('finances')}
        />

        <StatCard 
          title="Today's Net Operating Profit"
          value={`${isNetPositive ? '+' : ''}₹ ${todayNetProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext={isNetPositive ? "Operating profit logged" : isNetNegative ? "Operating deficit recorded" : "Break-even"}
          icon={TrendingUp}
          variant={isNetPositive ? "success" : isNetNegative ? "danger" : "default"}
          trend="Net Operating P&L"
          badgeText={isNetPositive ? "Profitable" : isNetNegative ? "Operating Loss" : "Zero"}
          onClick={() => onNavigateToTab('finances')}
        />

        <StatCard 
          title="Health Attention Required"
          value={totalAttentionCount}
          subtext={totalAttentionCount > 0 ? `${totalAttentionCount} animal(s) flagged` : "All herd parameters normal"}
          icon={AlertTriangle}
          variant={totalAttentionCount > 0 ? "danger" : "success"}
          trend="Clinical Triage"
          badgeText={totalAttentionCount > 0 ? `${totalAttentionCount} Attention` : "Clear"}
          onClick={() => onNavigateToTab('alerts')}
        />
      </div>

      {/* Quick Action Buttons (Feature 6 Requirement) */}
      <div className="dashboard-quick-actions-bar">
        <span className="quick-actions-label">QUICK ACTIONS:</span>
        <div className="quick-actions-btns-group">
          <button 
            type="button" 
            className="btn-quick-action primary"
            onClick={onOpenAddAnimalModal}
          >
            <Plus size={15} />
            <span>Add Animal</span>
          </button>

          <button 
            type="button" 
            className="btn-quick-action blue"
            onClick={onOpenAddMilkModal}
          >
            <Droplets size={15} />
            <span>Record Milk</span>
          </button>

          <button 
            type="button" 
            className="btn-quick-action green"
            onClick={onOpenAddIncomeModal}
          >
            <Plus size={15} />
            <span>Add Income</span>
          </button>

          <button 
            type="button" 
            className="btn-quick-action amber"
            onClick={onOpenAddExpenseModal}
          >
            <Plus size={15} />
            <span>Add Expense</span>
          </button>

          <button 
            type="button" 
            className="btn-quick-action purple"
            onClick={() => onNavigateToTab('reports')}
          >
            <FileText size={15} />
            <span>Financial Report</span>
          </button>

          <button 
            type="button" 
            className="btn-quick-action teal"
            onClick={() => onNavigateToTab('qr')}
          >
            <QrCode size={15} />
            <span>QR Tag System</span>
          </button>
        </div>
      </div>

      {/* Primary Hardware Status & Latest Reading Hero Banner (Preserved from existing) */}
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
              <span>Device Pairing ({connectedSensors} Online)</span>
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

        <div className="veterinary-disclaimer-box">
          <AlertCircle size={15} className="disc-icon-sm" />
          <span>
            <strong>VETERINARY ADVISORY:</strong> VetShield provides observational sensor telemetry for early illness detection. Automated flags indicate physiological variance and do not constitute a definitive disease diagnosis.
          </span>
        </div>
      </div>

      {/* Milk Production & Financial Analytics Charts */}
      <MilkProductionCharts 
        dailyTrend={milkStats?.dailyTrend || []}
        todayCowMilk={todayCowMilk}
        todayBuffaloMilk={todayBuffaloMilk}
      />

      <FinancialCharts 
        dailyTrend={financialSummary?.dailyTrend || []}
        expensesByCategory={financialSummary?.expensesByCategory || []}
      />

      {/* Hardware Telemetry Charts Grid (Preserved) */}
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