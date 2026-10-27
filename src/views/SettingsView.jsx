import React, { useState } from 'react';
import { 
  RotateCcw, 
  Sliders, 
  Award, 
  Info, 
  CheckCircle2, 
  FlaskConical, 
  AlertTriangle, 
  Send,
  Database
} from 'lucide-react';
import { apiService } from '../services/apiService';

export default function SettingsView({ 
  tempUnit, 
  setTempUnit, 
  onResetDemoData, 
  animals = []
}) {
  // Isolated Test Utility States (Disabled by default)
  const [testUtilityEnabled, setTestUtilityEnabled] = useState(false);
  const [testTemp, setTestTemp] = useState('38.8');
  const [testAnimalId, setTestAnimalId] = useState(animals[0]?.id || 'VS0001');
  const [testResponse, setTestResponse] = useState(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingTest(true);
    setTestResponse(null);
    try {
      const res = await apiService.submitTestTelemetry({
        deviceId: "TEST-BENCH-01",
        animalId: testAnimalId,
        temperature: parseFloat(testTemp),
        unit: tempUnit
      });
      setTestResponse({ success: true, message: res.warning || "Test packet recorded in isolated test table." });
    } catch (err) {
      setTestResponse({ success: false, message: err.message || "Failed to submit test packet." });
    } finally {
      setIsSubmittingTest(false);
    }
  };

  return (
    <div className="view-content settings-view">
      <div className="settings-grid">
        {/* Left Column: Preferences & Hardware Configuration */}
        <div className="settings-column">
          {/* Temperature Preferences */}
          <div className="card-box settings-box">
            <h3 className="settings-section-title">
              <Sliders size={18} /> Display & Heartbeat Preferences
            </h3>

            {/* Temperature Unit */}
            <div className="setting-row">
              <div className="setting-meta">
                <span className="setting-label">Temperature Unit</span>
                <span className="setting-desc">Choose Celsius or Fahrenheit for all telemetry displays</span>
              </div>
              <div className="unit-switch-buttons">
                <button 
                  className={`btn-unit-opt ${tempUnit === 'C' ? 'active' : ''}`}
                  onClick={() => setTempUnit('C')}
                >
                  Celsius (°C)
                </button>
                <button 
                  className={`btn-unit-opt ${tempUnit === 'F' ? 'active' : ''}`}
                  onClick={() => setTempUnit('F')}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            {/* Configurable Stale Timeout Note */}
            <div className="setting-row">
              <div className="setting-meta">
                <span className="setting-label">Sensor Heartbeat Thresholds</span>
                <span className="setting-desc">Active: &lt;45s • Stale: 45s–90s • Disconnected: &gt;90s</span>
              </div>
              <span className="badge-navy" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem' }}>
                45s / 90s Auto-Timeout
              </span>
            </div>

            {/* Reset Data */}
            <div className="setting-row danger-zone">
              <div className="setting-meta">
                <span className="setting-label">Reset Local Database</span>
                <span className="setting-desc">Clear local records and restore factory test animals</span>
              </div>
              <button 
                className="btn-danger-outline"
                onClick={onResetDemoData}
              >
                <RotateCcw size={15} />
                <span>Reset Data</span>
              </button>
            </div>
          </div>

          {/* ISOLATED TEST UTILITY (Strictly Disabled by Default) */}
          <div className="card-box settings-box isolated-test-card">
            <div className="test-utility-header">
              <div className="test-title-wrap">
                <FlaskConical size={20} className="text-amber" />
                <div>
                  <h3 className="settings-section-title" style={{ border: 'none', padding: 0 }}>
                    Isolated Test Bench Utility
                  </h3>
                  <span className="test-sub-note">Disabled by default • Strictly separated from real records</span>
                </div>
              </div>

              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={testUtilityEnabled}
                  onChange={e => setTestUtilityEnabled(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {testUtilityEnabled ? (
              <form onSubmit={handleTestSubmit} className="test-utility-form">
                <div className="test-warning-banner">
                  <AlertTriangle size={16} className="text-amber" />
                  <span>
                    <strong>Caution:</strong> Submissions from this utility are explicitly flagged as <code>isTestUtilityData: true</code> and will not contaminate real hardware sensor telemetry.
                  </span>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Target Animal ID</label>
                    <select 
                      value={testAnimalId}
                      onChange={e => setTestAnimalId(e.target.value)}
                      className="form-select"
                    >
                      {animals.map(a => (
                        <option key={a.id} value={a.id}>{a.id} • {a.name} ({a.species})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Simulate Test Temp (°C)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={testTemp}
                      onChange={e => setTestTemp(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="test-actions-row">
                  <button 
                    type="submit" 
                    className="btn-primary-action"
                    disabled={isSubmittingTest}
                  >
                    <Send size={14} />
                    <span>{isSubmittingTest ? 'Transmitting...' : 'Send Isolated Test Packet'}</span>
                  </button>
                </div>

                {testResponse && (
                  <div className={`test-feedback-pill ${testResponse.success ? 'success' : 'error'}`}>
                    {testResponse.message}
                  </div>
                )}
              </form>
            ) : (
              <p className="test-disabled-explanation">
                Enable this toggle only if you need to verify API ingestion without physical ESP32 hardware present. 
                Keep disabled during competition presentation to ensure only genuine physical sensor readings are processed.
              </p>
            )}
          </div>

          {/* Cloud Firestore & Security Specs */}
          <div className="card-box settings-box">
            <h3 className="settings-section-title">
              <Database size={18} /> Cloud Firestore & Device Security
            </h3>
            <div className="specs-list-simple">
              <div className="spec-simple-item">
                <span className="s-name">Ingestion Security:</span>
                <span className="s-val">X-API-KEY Per-Device Token</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">Sensor Fault Filter:</span>
                <span className="s-val">-127°C (wire fault) &amp; 85°C (boot glitch)</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">Public QR Privacy:</span>
                <span className="s-val">Owner phone &amp; private medical history protected</span>
              </div>
              <div className="spec-simple-item">
                <span className="s-name">Dual Mode:</span>
                <span className="s-val">Local Wi-Fi Gateway + Cloud Firestore Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: College Competition & Presentation Guide */}
        <div className="settings-column">
          <div className="card-box settings-box project-credits-box">
            <div className="project-badge-top">
              <Award size={20} className="award-icon" />
              <span>COLLEGE COMPETITION SUBMISSION</span>
            </div>

            <h2 className="project-headline">VetShield Animal Health System</h2>
            <p className="project-tagline">
              Physical IoT Telemetry with ESP32 &amp; DS18B20 Digital Probe • Permanent QR Identification
            </p>

            <div className="project-bullet-points">
              <div className="bullet-point">
                <CheckCircle2 size={16} className="bullet-icon" />
                <div>
                  <strong>No Fabricated Data:</strong> Strictly separates genuine physical microcontroller transmissions from test data, displaying "Waiting for real sensor data" until a physical reading arrives.
                </div>
              </div>

              <div className="bullet-point">
                <CheckCircle2 size={16} className="bullet-icon" />
                <div>
                  <strong>Unique Animal QR Identification:</strong> Permanent format (e.g. <code>VS0001</code>) encodes a secure mobile URL, allowing judges to scan any animal's tag with their smartphone.
                </div>
              </div>

              <div className="bullet-point">
                <CheckCircle2 size={16} className="bullet-icon" />
                <div>
                  <strong>Device Pairing &amp; Triage:</strong> Physical ESP32 microcontrollers are paired with enrolled animals, continuously verifying physiological thresholds.
                </div>
              </div>

              <div className="bullet-point">
                <CheckCircle2 size={16} className="bullet-icon" />
                <div>
                  <strong>Veterinary Ethics Disclaimer:</strong> Adheres to diagnostic transparency by presenting observational alerts rather than automated disease diagnoses.
                </div>
              </div>
            </div>

            <div className="disclaimer-callout-card">
              <Info size={16} className="disc-icon" />
              <p>
                <strong>Evaluation Compliance:</strong> This project is fully configured for real hardware evaluation. 
                Connect your ESP32 with DS18B20 sensor to the local Wi-Fi to demonstrate real-time telemetry streaming in front of judges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
