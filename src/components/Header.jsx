import React from 'react';
import { 
  Menu, 
  Search, 
  Plus, 
  Info, 
  Bell, 
  Thermometer,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  searchQuery, 
  setSearchQuery, 
  setSidebarOpen, 
  connectedSensorsCount = 0,
  noRecentSensorsCount = 0,
  onOpenAddModal,
  onOpenInfoModal,
  tempUnit,
  setTempUnit,
  activeAlertCount
}) {
  const getTabInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Livestock Health Dashboard', subtitle: 'Overview of herd physiological status & telemetry' };
      case 'animals':
        return { title: 'Animal Records & Profiles', subtitle: 'Electronic identification (RFID) and clinical records' };
      case 'devices':
        return { title: 'ESP32 Hardware Management', subtitle: 'Physical device provisioning, API keys, and animal assignment' };
      case 'monitoring':
        return { title: 'Live Telemetry & Sensor Mesh', subtitle: 'Physical sensor data stream from ESP32 digital probes' };
      case 'alerts':
        return { title: 'Clinical Alerts & Actions', subtitle: 'Threshold breaches, hyperthermia alarms and triage' };
      case 'history':
        return { title: 'Health & Vaccine History', subtitle: 'Longitudinal veterinary records and treatment audit' };
      case 'settings':
        return { title: 'System Configuration & About', subtitle: 'Demo parameters, project credits and presentation guide' };
      default:
        return { title: 'VetShield Health Monitor', subtitle: 'Livestock Telemetry Platform' };
    }
  };

  const { title, subtitle } = getTabInfo();

  return (
    <header className="app-header">
      {/* Real Hardware Status Strip */}
      <div className="demo-disclaimer-strip">
        <div className="disclaimer-content">
          <span className={`demo-pill ${connectedSensorsCount > 0 ? 'connected' : 'waiting'}`}>
            {connectedSensorsCount > 0 ? 'ESP32 CONNECTED' : 'WAITING FOR HARDWARE'}
          </span>
          <span className="disclaimer-text">
            <strong>Physical IoT Mode:</strong> {connectedSensorsCount > 0 
              ? `Receiving authenticated telemetry from ${connectedSensorsCount} active ESP32 node(s).` 
              : 'Microcontroller is currently not connected. Waiting for physical ESP32 reading over Wi-Fi.'}
          </span>
        </div>
        <div className="strip-actions">
          <button 
            className="temp-unit-toggle" 
            onClick={() => setTempUnit(tempUnit === 'C' ? 'F' : 'C')}
            title="Toggle Temperature Unit"
          >
            <Thermometer size={14} />
            <span>°{tempUnit}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="header-main-bar">
        <div className="header-left">
          <button 
            className="mobile-hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          
          <div className="header-titles">
            <h1 className="header-view-title">{title}</h1>
            <p className="header-view-subtitle">{subtitle}</p>
          </div>
        </div>

        <div className="header-right">
          {/* Universal Search */}
          <div className="header-search-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search ID (e.g. VS0001), name, pen..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="header-search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Real Hardware Connection Indicator Pill */}
          <div className={`hardware-live-badge ${connectedSensorsCount > 0 ? 'active' : noRecentSensorsCount > 0 ? 'stale' : 'idle'}`}>
            {connectedSensorsCount > 0 ? (
              <>
                <Wifi size={15} className="hw-icon-pulse text-green" />
                <span>ESP32: Online ({connectedSensorsCount})</span>
              </>
            ) : noRecentSensorsCount > 0 ? (
              <>
                <AlertCircle size={15} className="text-amber" />
                <span>No Recent Data</span>
              </>
            ) : (
              <>
                <WifiOff size={15} className="text-muted" />
                <span>Waiting for Sensor</span>
              </>
            )}
          </div>

          {/* Quick Add Animal Button */}
          <button 
            className="btn-primary-action"
            onClick={onOpenAddModal}
            title="Register new animal and generate permanent QR code"
          >
            <Plus size={16} />
            <span className="hide-on-mobile">Enroll Animal</span>
          </button>

          {/* Alert Notification Icon Button */}
          <button 
            className="header-icon-btn"
            style={{ position: 'relative' }}
            title={`${activeAlertCount} active clinical alerts`}
          >
            <Bell size={18} />
            {activeAlertCount > 0 && (
              <span className="bell-alert-badge">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Project Info Button */}
          <button 
            className="header-icon-btn"
            onClick={onOpenInfoModal}
            title="Hardware Architecture & Presentation Guide"
          >
            <Info size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}
