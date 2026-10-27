import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Activity, 
  Cpu,
  Radio, 
  AlertTriangle, 
  ClipboardList, 
  Settings, 
  ChevronRight, 
  X,
  Sparkles,
  Droplets,
  DollarSign,
  BarChart2,
  QrCode,
  Users
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen, 
  alertCount,
  connectedSensorsCount = 0
}) {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'animals', label: 'Animal Registry', icon: Activity },
    { id: 'monitoring', label: 'Live Telemetry', icon: Radio, pulse: connectedSensorsCount > 0 },
    { id: 'history', label: 'Health History', icon: ClipboardList },
    { id: 'alerts', label: 'Alerts & Actions', icon: AlertTriangle, badge: alertCount },
    { id: 'devices', label: 'ESP32 Hardware', icon: Cpu, badge: connectedSensorsCount > 0 ? `${connectedSensorsCount} live` : null },
  ];

  const dairyNavItems = [
    { id: 'dairy', label: 'Dairy Management', icon: Users },
    { id: 'milk', label: 'Milk Production', icon: Droplets },
    { id: 'finances', label: 'Income & Expenses', icon: DollarSign },
    { id: 'reports', label: 'Profit/Loss Reports', icon: BarChart2 },
    { id: 'qr', label: 'QR Code Management', icon: QrCode },
  ];

  const systemNavItems = [
    { id: 'settings', label: 'Settings & Config', icon: Settings }
  ];

  const renderNavList = (items) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return (
        <button
          key={item.id}
          onClick={() => {
            setActiveTab(item.id);
            setSidebarOpen(false);
          }}
          className={`nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-item-left">
            <div className={`nav-icon-wrapper ${item.pulse ? 'simulating-pulse' : ''}`}>
              <Icon size={18} />
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
          
          <div className="nav-item-right">
            {item.badge > 0 && (
              <span className="alert-nav-badge">{item.badge}</span>
            )}
            {typeof item.badge === 'string' && (
              <span className="hw-nav-badge">{item.badge}</span>
            )}
            {item.pulse && (
              <span className="live-dot-mini" title="Live stream simulation active"></span>
            )}
            {isActive && <ChevronRight size={14} className="active-chevron" />}
          </div>
        </button>
      );
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <div className="brand-icon-box">
              <ShieldCheck className="brand-icon" size={26} />
            </div>
            <div className="brand-text">
              <div className="brand-title">VetShield</div>
              <div className="brand-subtitle">Smart Animal Health</div>
            </div>
          </div>
          <button 
            className="mobile-close-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Prototype Badge */}
        <div className="demo-project-badge">
          <Sparkles size={14} className="badge-sparkle" />
          <span>Dairy & IoT Enterprise</span>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">LIVESTOCK HEALTH & SENSORS</div>
          {renderNavList(primaryNavItems)}

          <div className="nav-section-label" style={{ marginTop: '16px' }}>DAIRY & FINANCIAL ANALYTICS</div>
          {renderNavList(dairyNavItems)}

          <div className="nav-section-label" style={{ marginTop: '16px' }}>CONFIGURATION</div>
          {renderNavList(systemNavItems)}
        </nav>

        {/* Physical Telemetry Status Footer */}
        <div className="sidebar-footer">
          <div className="telemetry-box">
            <div className="telemetry-box-header">
              <span className={`status-beacon ${connectedSensorsCount > 0 ? 'active' : 'idle'}`}></span>
              <span className="telemetry-title">
                {connectedSensorsCount > 0 
                  ? `${connectedSensorsCount} Sensor${connectedSensorsCount > 1 ? 's' : ''} Online`
                  : 'Hardware Disconnected'}
              </span>
            </div>
            <p className="telemetry-desc">
              {connectedSensorsCount > 0
                ? 'Streaming real DS18B20 biometrics from ESP32.'
                : 'Waiting for real physical sensor transmissions.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}