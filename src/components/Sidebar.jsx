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
  Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen, 
  alertCount,
  connectedSensorsCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'animals', label: 'Animals Registry', icon: Activity },
    { id: 'devices', label: 'ESP32 Hardware', icon: Cpu, badge: connectedSensorsCount > 0 ? `${connectedSensorsCount} live` : null },
    { id: 'monitoring', label: 'Live Telemetry', icon: Radio, pulse: connectedSensorsCount > 0 },
    { id: 'alerts', label: 'Alerts & Actions', icon: AlertTriangle, badge: alertCount },
    { id: 'history', label: 'Health History', icon: ClipboardList },
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

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

        {/* Prototype Pill */}
        <div className="demo-project-badge">
          <Sparkles size={14} className="badge-sparkle" />
          <span>College Project Prototype</span>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">SYSTEM NAVIGATION</div>
          {navItems.map((item) => {
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
                    <Icon size={19} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                </div>
                
                <div className="nav-item-right">
                  {item.badge > 0 && (
                    <span className="alert-nav-badge">{item.badge}</span>
                  )}
                  {item.pulse && (
                    <span className="live-dot-mini" title="Live stream simulation active"></span>
                  )}
                  {isActive && <ChevronRight size={15} className="active-chevron" />}
                </div>
              </button>
            );
          })}
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
