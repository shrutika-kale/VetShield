import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Thermometer, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  ArrowLeft,
  Lock,
  WifiOff,
  Droplets,
  ClipboardList,
  PhoneCall
} from 'lucide-react';
import { apiService } from '../services/apiService';

export default function PublicAnimalProfile({ animalId, onBackToDashboard }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getPublicAnimalProfile(animalId);
        if (isMounted) setProfile(data);
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to retrieve animal record.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [animalId]);

  if (loading) {
    return (
      <div className="public-profile-screen">
        <div className="public-loading-card">
          <div className="public-loading-spinner"></div>
          <p className="loading-text">Verifying Electronic Animal Identification...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="public-profile-screen">
        <div className="public-error-card">
          <AlertCircle size={48} className="text-red" />
          <h2 className="error-title">Animal Record Not Found</h2>
          <p className="error-sub">
            The scanned permanent ID (<strong>{animalId}</strong>) is invalid, decommissioned, or unauthorized.
          </p>
          <button className="btn-primary-action" onClick={onBackToDashboard}>
            <ArrowLeft size={16} /> Return to VetShield Portal
          </button>
        </div>
      </div>
    );
  }

  const hasRealSensorData = profile.sensorData && profile.sensorData.temperature !== undefined;
  const isSensorConnected = profile.sensorData && profile.sensorData.sensorStatus === 'Connected';
  const isDairyAnimal = profile.species === 'Cow' || profile.species === 'Buffalo' || profile.species === 'Cattle';

  return (
    <div className="public-profile-screen">
      <div className="public-container">
        {/* Top Navbar */}
        <div className="public-header-bar">
          <button className="public-back-btn" onClick={onBackToDashboard}>
            <ArrowLeft size={18} />
            <span>Portal Home</span>
          </button>
          <div className="public-logo-wrap">
            <ShieldCheck size={20} className="text-green" />
            <span className="public-brand">VetShield Verified Tag</span>
          </div>
        </div>

        {/* Animal Badge Card */}
        <div className="public-main-card">
          <div className="public-top-strip">
            <span className="public-id-pill">{profile.id}</span>
            <span className="public-org-pill">{profile.organization}</span>
          </div>

          <div className="public-identity-section">
            <div className="public-species-avatar">
              {profile.species === 'Cow' || profile.species === 'Cattle' ? '🐄' :
               profile.species === 'Buffalo' ? '🐃' :
               profile.species === 'Sheep' ? '🐑' :
               profile.species === 'Goat' ? '🐐' :
               profile.species === 'Horse' ? '🐎' :
               profile.species === 'Swine' ? '🐖' : '🐕'}
            </div>
            <div>
              <h1 className="public-animal-name">{profile.name}</h1>
              <p className="public-breed-text">
                {profile.species} • {profile.breed} • {profile.gender}
              </p>
            </div>
          </div>

          {/* Real Physical Sensor Status Box */}
          <div className="public-sensor-telemetry-box">
            <div className="telemetry-box-top">
              <span className="telemetry-box-title">
                <Cpu size={16} /> PHYSICAL SENSOR TELEMETRY (DS18B20)
              </span>
              <span className={`sensor-status-tag ${isSensorConnected ? 'connected' : 'disconnected'}`}>
                {isSensorConnected ? '● Sensor Online' : '○ ' + (profile.sensorData.sensorStatus || 'Disconnected')}
              </span>
            </div>

            {hasRealSensorData ? (
              <div className="real-sensor-reading-display">
                <div className="real-temp-huge">
                  <Thermometer size={32} className="text-green" />
                  <span className="temp-huge-num">{profile.sensorData.temperature}</span>
                  <span className="temp-huge-unit">°{profile.sensorData.unit}</span>
                </div>
                <div className="real-reading-meta">
                  <div className="meta-time">
                    <Clock size={13} />
                    <span>Last ESP32 Transmission: {new Date(profile.sensorData.recordedAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="meta-device">
                    <span>Hardware Node ID: <strong>{profile.sensorData.deviceId}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="waiting-sensor-notice">
                <WifiOff size={28} className="text-muted" />
                <div className="notice-text-wrap">
                  <span className="notice-bold">Waiting for real sensor data</span>
                  <span className="notice-sub">
                    No physical ESP32 telemetry packet has been recorded for this animal yet. Readings are never simulated.
                  </span>
                </div>
              </div>
            )}

            <div className="safe-range-footnote">
              Normal Safe Body Temperature: <strong>{profile.normalReferenceRange.min} - {profile.normalReferenceRange.max} {profile.normalReferenceRange.unit}</strong>
            </div>
          </div>

          {/* Verified Milk Production Box (For Dairy Cattle & Buffaloes) */}
          {isDairyAnimal && (
            <div className="public-milk-box">
              <div className="milk-box-header">
                <Droplets size={16} className="text-blue" />
                <span className="milk-box-title">VERIFIED MILK PRODUCTION</span>
                <span className="status-badge-inline in-milk" style={{ marginLeft: 'auto' }}>
                  {profile.milkProductionStatus || 'In Milk'}
                </span>
              </div>

              {profile.todayMilkYield ? (
                <div className="today-milk-highlight">
                  <div className="highlight-metric">
                    <span className="metric-label">Today's Recorded Yield</span>
                    <span className="metric-value">{profile.todayMilkYield.totalLiters} Litres</span>
                  </div>
                  <div className="highlight-sub">
                    <span>Morning: {profile.todayMilkYield.morningLiters} L</span>
                    <span>•</span>
                    <span>Evening: {profile.todayMilkYield.eveningLiters} L</span>
                  </div>
                </div>
              ) : (
                <p className="no-milk-today-notice">
                  No milk production entry recorded today yet.
                </p>
              )}

              {profile.recentMilkHistory && profile.recentMilkHistory.length > 0 && (
                <div className="recent-milk-mini-table">
                  <span className="mini-table-title">Recent 7-Day Production Log</span>
                  <div className="mini-history-list">
                    {profile.recentMilkHistory.map((m, idx) => (
                      <div key={idx} className="mini-history-row">
                        <span className="history-date">{m.date}</span>
                        <span className="history-breakdown">M: {m.morningLiters}L | E: {m.eveningLiters}L</span>
                        <span className="history-total">{m.totalLiters} L</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Biological & Housing Information */}
          <div className="public-info-grid">
            <div className="info-cell">
              <span className="cell-lbl">Age / DOB</span>
              <span className="cell-val">{profile.age} ({profile.dob})</span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">Pen Location</span>
              <span className="cell-val">
                <MapPin size={13} /> {profile.penLocation}
              </span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">Registration Date</span>
              <span className="cell-val">
                <Calendar size={13} /> {new Date(profile.registeredAt).toLocaleDateString()}
              </span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">Health Status</span>
              <span className="cell-val text-green">
                <CheckCircle2 size={13} /> {profile.healthStatus}
              </span>
            </div>
          </div>

          {/* Relevant Health Procedures History */}
          {profile.clinicalProcedures && profile.clinicalProcedures.length > 0 && (
            <div className="public-health-history-box">
              <div className="section-title-row">
                <ClipboardList size={16} className="text-green" />
                <span>Verified Veterinary & Vaccination Procedures</span>
              </div>
              <div className="public-procedures-list">
                {profile.clinicalProcedures.map((proc, idx) => (
                  <div key={idx} className="procedure-row">
                    <span className="proc-date">{proc.date}</span>
                    <span className="proc-event">{proc.event}</span>
                    <span className="proc-clinician">{proc.clinician}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.publicNotes && (
            <div className="public-notes-box">
              <span className="notes-lbl">Surveillance Notes:</span>
              <p className="notes-body">{profile.publicNotes}</p>
            </div>
          )}

          {/* Campus Veterinary Emergency Contact */}
          <div className="public-emergency-contact-box">
            <PhoneCall size={16} className="text-muted" />
            <div>
              <strong>Emergency Veterinary Line:</strong> Campus Animal Care Unit (+91 98765 43210)
            </div>
          </div>

          {/* Privacy & Authorization Shield Banner */}
          <div className="privacy-protected-banner">
            <Lock size={15} className="lock-icon" />
            <p>
              <strong>Data Privacy Protected:</strong> Private owner contracts, commercial sales receipts, purchase acquisition costs, and full prescription billing records are restricted to authenticated farm administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}