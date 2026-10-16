import React, { useState } from 'react';
import { 
  X, 
  Thermometer, 
  MapPin, 
  AlertTriangle, 
  QrCode, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  Cpu, 
  WifiOff
} from 'lucide-react';
import QRCodeLabel from './QRCodeLabel';

export default function AnimalDetailModal({ 
  animal, 
  onClose, 
  tempUnit = 'C',
  onOpenPublicView,
  onOpenEditModal
}) {
  const [activeSubTab, setActiveSubTab] = useState('dossier'); // 'dossier' or 'qr'

  if (!animal) return null;

  const formatTemp = (celsius) => {
    if (tempUnit === 'F') {
      return ((celsius * 9) / 5 + 32).toFixed(1);
    }
    return celsius.toFixed(1);
  };

  const hasRealReading = animal.latestSensorReading && animal.latestSensorReading.temperature !== undefined;
  const isFever = hasRealReading && animal.latestSensorReading.temperature > (animal.species === 'Goat' ? 40.0 : 39.3);
  const sensorState = animal.assignedDevice ? animal.assignedDevice.status : "No Hardware";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="animal-avatar-box">
              <span className="avatar-species-emoji">
                {animal.species === 'Cattle' ? '🐄' :
                 animal.species === 'Sheep' ? '🐑' :
                 animal.species === 'Goat' ? '🐐' :
                 animal.species === 'Horse' ? '🐎' :
                 animal.species === 'Swine' ? '🐖' : '🐕'}
              </span>
            </div>
            <div>
              <div className="modal-headline-row">
                <h2 className="modal-animal-name">{animal.name}</h2>
                <span className="animal-id-badge">{animal.id}</span>
                <span className={`status-badge ${sensorState === 'Connected' ? 'status-healthy' : 'status-monitoring'}`}>
                  {sensorState}
                </span>
              </div>
              <p className="modal-animal-sub">
                {animal.species} • {animal.breed} • {animal.gender} • {animal.age}
              </p>
            </div>
          </div>

          <button className="modal-close-icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Sub-Tab Navigation inside Modal */}
        <div className="modal-tabs-bar">
          <button 
            className={`modal-tab-pill ${activeSubTab === 'dossier' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dossier')}
          >
            <FileText size={14} />
            <span>Veterinary Dossier</span>
          </button>
          <button 
            className={`modal-tab-pill ${activeSubTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('qr')}
          >
            <QrCode size={14} />
            <span>Permanent QR Badge & Tag</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scrollable">
          {activeSubTab === 'qr' ? (
            <div className="qr-tab-content">
              <QRCodeLabel 
                animal={animal} 
                onOpenPublicView={onOpenPublicView} 
              />
            </div>
          ) : (
            <>
              {/* Clinical Flag if Elevated */}
              {isFever && (
                <div className="clinical-flag-banner critical">
                  <AlertTriangle size={18} />
                  <div>
                    <strong>Veterinary Warning:</strong> Core temperature of {formatTemp(animal.latestSensorReading.temperature)}°{tempUnit} recorded by physical probe exceeds the safe threshold. Immediate triage advised.
                  </div>
                </div>
              )}

              {/* Physical Sensor Telemetry Box */}
              <div className="section-label">PHYSICAL HARDWARE TELEMETRY</div>
              <div className="dossier-sensor-box">
                {hasRealReading ? (
                  <div className="dossier-reading-row">
                    <div className="dossier-temp-display">
                      <Thermometer size={26} className={isFever ? 'text-red' : 'text-green'} />
                      <div className="dossier-temp-text">
                        <span className="dossier-temp-val">
                          {formatTemp(animal.latestSensorReading.temperature)}°{tempUnit}
                        </span>
                        <span className="dossier-temp-lbl">Actual ESP32 DS18B20 Reading</span>
                      </div>
                    </div>

                    <div className="dossier-hw-details">
                      <div>Node ID: <strong>{animal.latestSensorReading.deviceId}</strong></div>
                      <div>Timestamp: {new Date(animal.latestSensorReading.serverTimestamp).toLocaleTimeString()}</div>
                      <div>Status: <span className="text-green">● Transmitting</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="dossier-waiting-sensor">
                    <WifiOff size={24} className="text-muted" />
                    <div>
                      <strong>Waiting for real sensor data</strong>
                      <p>
                        No physical readings have arrived from the assigned ESP32 collar yet.
                        {animal.assignedDevice 
                          ? ` (Paired to ${animal.assignedDevice.deviceId} - Sensor: ${animal.assignedDevice.sensorModel})`
                          : ' (No hardware device has been paired with this animal yet).'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Animal Bio & Housing Specs */}
              <div className="section-label">IDENTIFICATION & HOUSING SPECIFICATIONS</div>
              <div className="bio-specs-grid">
                <div className="spec-item">
                  <span className="spec-lbl">Permanent Animal ID:</span>
                  <span className="spec-val"><strong>{animal.id}</strong></span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">Pen Location:</span>
                  <span className="spec-val">
                    <MapPin size={13} /> {animal.penLocation || animal.location || 'Stall 01'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">Date of Birth:</span>
                  <span className="spec-val">
                    <Calendar size={13} /> {animal.dob || 'Unknown'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">Weight:</span>
                  <span className="spec-val">{animal.weight || 'N/A'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">Registration Date:</span>
                  <span className="spec-val">{new Date(animal.registeredAt).toLocaleDateString()}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-lbl">Paired ESP32 Device:</span>
                  <span className="spec-val">
                    <Cpu size={13} /> {animal.assignedDevice ? animal.assignedDevice.deviceId : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Authorized Owner Details */}
              {animal.owner && (
                <>
                  <div className="section-label">AUTHORIZED FARM & VETERINARY OWNERSHIP</div>
                  <div className="owner-dossier-box">
                    <div className="owner-row">
                      <span className="owner-lbl"><User size={13} /> Facility / Farm:</span>
                      <span className="owner-val">{animal.owner.name}</span>
                    </div>
                    <div className="owner-row">
                      <span className="owner-lbl"><Phone size={13} /> Attending Clinician:</span>
                      <span className="owner-val">{animal.owner.contactPerson} ({animal.owner.phone})</span>
                    </div>
                  </div>
                </>
              )}

              {/* Medical History */}
              <div className="section-label">CLINICAL AUDIT & VACCINATION TIMELINE</div>
              <div className="history-timeline-list">
                {animal.privateMedicalHistory && animal.privateMedicalHistory.length > 0 ? (
                  animal.privateMedicalHistory.map((log, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-point"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-event">{log.event}</span>
                          <span className="timeline-date">{log.date}</span>
                        </div>
                        <div className="timeline-footer">
                          <span className="timeline-vet">Clinician: {log.clinician || log.vet}</span>
                          <span className="timeline-status-pill">{log.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-history-text">Initial registration completed. No subsequent medical interventions.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-footer">
          <button 
            className="btn-outline-action"
            onClick={() => onOpenEditModal(animal)}
          >
            Edit Profile
          </button>

          <button 
            className="btn-outline-action green-highlight"
            onClick={() => onOpenPublicView(animal.id)}
          >
            <QrCode size={14} /> Open Public Scanned View
          </button>

          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
