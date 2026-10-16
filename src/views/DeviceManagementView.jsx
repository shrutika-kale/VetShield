import React, { useState } from 'react';
import { 
  Cpu, 
  Plus, 
  Link, 
  Key, 
  CheckCircle2, 
  WifiOff, 
  Clock, 
  Copy, 
  Check, 
  Thermometer
} from 'lucide-react';

export default function DeviceManagementView({ 
  devices, 
  animals, 
  onAssignDevice, 
  onRegisterDevice
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddDeviceSubmit = (e) => {
    e.preventDefault();
    if (!newDeviceId) return;
    onRegisterDevice({
      deviceId: newDeviceId,
      name: newDeviceName,
      sensorModel: "DS18B20 1-Wire Digital Probe"
    });
    setNewDeviceId('');
    setNewDeviceName('');
    setShowAddModal(false);
  };

  const handleAssignChange = (deviceId, animalId) => {
    onAssignDevice(deviceId, animalId === 'NONE' ? null : animalId);
  };

  return (
    <div className="view-content device-management-view">
      {/* Top Banner */}
      <div className="telemetry-banner-card">
        <div className="banner-left">
          <div className="beacon-status-large">
            <Cpu size={26} />
          </div>
          <div>
            <div className="banner-badge-row">
              <span className="live-demo-tag">ESP32 HARDWARE CONTROLLER</span>
              <span className="prototype-note">DS18B20 Sensor Ingestion</span>
            </div>
            <h2 className="banner-title">Authorized ESP32 Devices & Animal Pairing</h2>
            <p className="banner-desc">
              Manage physical microcontrollers, retrieve unique device API keys, and pair each hardware tag 
              with an enrolled animal record.
            </p>
          </div>
        </div>

        <div className="banner-right-controls">
          <button 
            className="btn-primary-action"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Register ESP32 Node</span>
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="devices-cards-grid">
        {devices.map((device) => {
          const assignedAnimal = animals.find(a => a.id === device.assignedAnimalId);
          const isConnected = device.status === 'Connected';
          const isNoRecent = device.status === 'No recent data';

          const statusClass = isConnected ? 'status-connected' :
                              isNoRecent ? 'status-stale' : 'status-disconnected';

          return (
            <div key={device.deviceId} className={`device-item-card ${statusClass}`}>
              {/* Card Header */}
              <div className="device-card-header">
                <div className="device-title-wrap">
                  <span className="device-id-badge">{device.deviceId}</span>
                  <h3 className="device-name">{device.name}</h3>
                  <span className="device-sensor-model">{device.sensorModel}</span>
                </div>

                <div className={`hardware-status-pill ${statusClass}`}>
                  <span className="status-mini-dot"></span>
                  <span>{device.status}</span>
                </div>
              </div>

              {/* Live Reading Box */}
              <div className="device-reading-container">
                {device.lastReading ? (
                  <div className="real-reading-active">
                    <div className="reading-val-col">
                      <span className="reading-label">Latest Real Reading</span>
                      <div className="reading-temp-row">
                        <Thermometer size={20} className="text-green" />
                        <span className="temp-number">{device.lastReading.temperature}</span>
                        <span className="temp-deg">°{device.lastReading.unit}</span>
                      </div>
                    </div>

                    <div className="reading-meta-col">
                      <span className="reading-time">
                        <Clock size={12} /> {new Date(device.lastReading.serverTimestamp).toLocaleTimeString()}
                      </span>
                      {device.lastReading.rssi && (
                        <span className="reading-rssi">RSSI: {device.lastReading.rssi} dBm</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="waiting-real-reading">
                    <WifiOff size={22} className="text-muted" />
                    <div className="waiting-text">
                      <strong>Waiting for real sensor data</strong>
                      <span>ESP32 has not transmitted a verified DS18B20 packet yet.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Selector */}
              <div className="device-assign-section">
                <label className="assign-label">
                  <Link size={13} /> Assigned Animal Patient:
                </label>
                <select 
                  className="assign-select"
                  value={device.assignedAnimalId || 'NONE'}
                  onChange={(e) => handleAssignChange(device.deviceId, e.target.value)}
                >
                  <option value="NONE">-- Unassigned (No Animal) --</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} • {a.name} ({a.species})
                    </option>
                  ))}
                </select>
                {assignedAnimal && (
                  <div className="assigned-hint">
                    Linked to: <strong>{assignedAnimal.name}</strong> ({assignedAnimal.penLocation})
                  </div>
                )}
              </div>

              {/* Device API Key for Firmware */}
              <div className="device-key-box">
                <div className="key-header">
                  <span className="key-label"><Key size={12} /> Device Firmware API Key</span>
                  <button 
                    className="btn-copy-key"
                    onClick={() => handleCopyKey(device.apiKey)}
                    title="Copy API key for ESP32 sketch"
                  >
                    {copiedKey === device.apiKey ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    <span>{copiedKey === device.apiKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <code className="key-code-display">{device.apiKey}</code>
              </div>

              <div className="device-card-footer">
                <span className="footer-date">Created: {new Date(device.createdAt).toLocaleDateString()}</span>
                {device.lastSeen && (
                  <span className="footer-last-seen">
                    Last Seen: {new Date(device.lastSeen).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register New Device */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="form-icon-box">
                  <Cpu size={22} />
                </div>
                <div>
                  <h2 className="modal-animal-name">Register New ESP32 Node</h2>
                  <p className="modal-animal-sub">Provision hardware credentials and pairing</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddDeviceSubmit}>
              <div className="modal-body-scrollable">
                <div className="form-group">
                  <label className="form-label">Hardware Device ID * (e.g. ESP32-VET-02)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ESP32-VET-02"
                    value={newDeviceId}
                    onChange={e => setNewDeviceId(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Friendly Collar / Tag Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Livestock Ear Tag Node #2"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sensor Model</label>
                  <input 
                    type="text" 
                    readOnly
                    value="DS18B20 1-Wire Digital Probe"
                    className="form-input disabled"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-close-modal" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <CheckCircle2 size={16} />
                  Authorize Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
