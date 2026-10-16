import React from 'react';
import { X, Award, ShieldAlert, Cpu, HeartPulse, CheckCircle2, BookOpen } from 'lucide-react';

export default function ProjectInfoModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="info-icon-box">
              <Award size={24} />
            </div>
            <div>
              <h2 className="modal-animal-name">VetShield • College Project Dossier</h2>
              <p className="modal-animal-sub">Smart Animal Health & Livestock Early-Warning System</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scrollable">
          {/* Executive Summary */}
          <div className="info-callout">
            <h4 className="callout-title">
              <BookOpen size={16} /> Project Abstract & Competition Goals
            </h4>
            <p>
              <strong>VetShield</strong> is an IoT-enabled veterinary health surveillance platform designed 
              to safeguard commercial livestock and farm animals. In large-scale husbandry, infectious diseases 
              (such as Bovine Respiratory Disease, Mastitis, and Foot-and-Mouth Disease) cause immense economic loss. 
              Subclinical physiological anomalies (elevated core body temperature and decreased rumination) manifest 
              <strong> 24 to 48 hours</strong> before visible physical symptoms appear.
            </p>
          </div>

          <div className="info-grid">
            <div className="info-feature-card">
              <div className="feature-icon-circle green">
                <HeartPulse size={20} />
              </div>
              <h5 className="feature-title">Real-time Biometrics</h5>
              <p className="feature-desc">
                Continuous surveillance of body temperature, cardiac rhythm, respiration rate, and rumination activity cycles.
              </p>
            </div>

            <div className="info-feature-card">
              <div className="feature-icon-circle blue">
                <Cpu size={20} />
              </div>
              <h5 className="feature-title">Virtual IoT Sensor Mesh</h5>
              <p className="feature-desc">
                LoRaWAN & Zigbee telemetry gateways aggregating data from simulated smart RFID ear-tags, rumen boluses, and collars.
              </p>
            </div>

            <div className="info-feature-card">
              <div className="feature-icon-circle amber">
                <ShieldAlert size={20} />
              </div>
              <h5 className="feature-title">Early Triage & Alarms</h5>
              <p className="feature-desc">
                Automated multi-level severity alerts (Critical, Warning, Info) enabling prompt isolation and targeted veterinary action.
              </p>
            </div>
          </div>

          {/* Prototype Technical Details */}
          <div className="section-label">PROTOTYPE ARCHITECTURE & SIMULATION NOTICE</div>
          <div className="info-specs-box">
            <ul>
              <li>
                <CheckCircle2 size={15} className="check-bullet" />
                <span><strong>Frontend Stack:</strong> React (Vite-powered SPA), Modern CSS variables, Lucide Vector Icons.</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="check-bullet" />
                <span><strong>Telemetry Engine:</strong> Live state simulator creating realistic Brownian fluctuations in vitals without external backend dependencies.</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="check-bullet" />
                <span><strong>Presentation Ready:</strong> Fully responsive across laptops, tablets, and mobile displays for on-stage judging.</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="check-bullet" />
                <span><strong>Sensor Disclaimer:</strong> All telemetry is labeled as simulated demo data, perfectly adhering to project competition ethics.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary-action" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Got it, Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
