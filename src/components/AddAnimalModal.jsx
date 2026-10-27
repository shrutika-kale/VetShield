import React, { useState } from 'react';
import { X, Plus, QrCode, Cpu, ShieldCheck } from 'lucide-react';

export default function AddAnimalModal({ onClose, onAddAnimal }) {
  const [formData, setFormData] = useState({
    name: '',
    species: 'Cow',
    breed: 'Gir Indigenous',
    gender: 'Female',
    age: '2.5 yrs',
    dob: '2024-04-10',
    weight: '550 kg',
    penLocation: 'Barn A - Stall 02',
    healthStatus: 'Healthy',
    milkProductionStatus: 'In Milk',
    purchaseDate: '2024-05-15',
    purchaseCost: '55000',
    publicNotes: 'Enrolled into VetShield permanent surveillance registry.',
    ownerName: 'Campus Research Dairy Farm',
    contactPerson: 'Dr. A. Sharma (Lead Vet)',
    phone: '+91 98765 43210'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      species: formData.species,
      breed: formData.breed || 'Standard',
      gender: formData.gender,
      age: formData.age,
      dob: formData.dob,
      weight: formData.weight,
      penLocation: formData.penLocation,
      healthStatus: formData.healthStatus,
      milkProductionStatus: formData.milkProductionStatus,
      purchaseDate: formData.purchaseDate || null,
      purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
      publicNotes: formData.publicNotes,
      owner: {
        name: formData.ownerName,
        contactPerson: formData.contactPerson,
        phone: formData.phone
      }
    };

    onAddAnimal(payload);
    onClose();
  };

  const isDairy = formData.species === 'Cow' || formData.species === 'Buffalo' || formData.species === 'Cattle';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="modal-animal-name">Enroll Animal & Generate Permanent QR Tag</h2>
              <p className="modal-animal-sub">Assigns unique permanent VSxxxx ID for camera verification</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            <div className="modal-hardware-notice">
              <Cpu size={16} className="text-green" />
              <span>
                <strong>Hardware Sensor Policy:</strong> Body temperatures and biometric signals are never manually typed. They will stream live once an authorized ESP32 DS18B20 node is paired.
              </span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Animal Name / Tag Nickname *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bella, Lakshmi, Daisy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Species Category *</label>
                <select 
                  value={formData.species}
                  onChange={(e) => {
                    const sp = e.target.value;
                    const defaultStatus = (sp === 'Cow' || sp === 'Buffalo' || sp === 'Cattle') ? 'In Milk' : 'Not Applicable';
                    const defaultBreed = sp === 'Buffalo' ? 'Murrah' : sp === 'Cow' ? 'Gir Indigenous' : 'Standard';
                    setFormData({ 
                      ...formData, 
                      species: sp, 
                      milkProductionStatus: defaultStatus,
                      breed: defaultBreed
                    });
                  }}
                  className="form-select"
                >
                  <option value="Cow">🐄 Cow (Bovine Dairy)</option>
                  <option value="Buffalo">🐃 Buffalo (Murrah/Jaffarabadi)</option>
                  <option value="Cattle">Cattle (General)</option>
                  <option value="Sheep">Sheep (Ovine)</option>
                  <option value="Goat">Goat (Caprine)</option>
                  <option value="Horse">Horse (Equine)</option>
                  <option value="Swine">Swine (Porcine)</option>
                  <option value="Working Dog">Working Dog (Canine)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Breed</label>
                <input 
                  type="text" 
                  placeholder="e.g. Holstein Friesian, Murrah, Sahiwal"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="form-select"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Age / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. 3.2 yrs"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Weight</label>
                <input 
                  type="text" 
                  placeholder="e.g. 580 kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Housing / Stall Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. Barn A - Stall 04"
                  value={formData.penLocation}
                  onChange={(e) => setFormData({ ...formData, penLocation: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Health Status</label>
                <select 
                  value={formData.healthStatus}
                  onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                  className="form-select"
                >
                  <option value="Healthy">Healthy (Optimal Condition)</option>
                  <option value="Monitoring">Monitoring (Observation Required)</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Critical">Critical Triage</option>
                </select>
              </div>

              {isDairy && (
                <div className="form-group">
                  <label className="form-label">Lactation / Milk Status</label>
                  <select 
                    value={formData.milkProductionStatus}
                    onChange={(e) => setFormData({ ...formData, milkProductionStatus: e.target.value })}
                    className="form-select"
                  >
                    <option value="In Milk">In Milk (Active Lactation)</option>
                    <option value="Dry">Dry Period</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Heifer">Heifer (Pre-calving)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Purchase Date (if bought)</label>
                <input 
                  type="date" 
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Cost in INR (₹)</label>
                <div className="input-with-adornment">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number" 
                    step="1000"
                    min="0"
                    placeholder="e.g. 60000"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="form-input with-prefix"
                  />
                </div>
                <span className="form-hint">Tracked as capital asset acquisition in financial ledger</span>
              </div>
            </div>

            <div className="section-label" style={{ marginTop: '14px' }}>OWNERSHIP & VETERINARY ATTENDANT</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Farm / Research Unit Name</label>
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lead Attending Veterinarian</label>
                <input 
                  type="text" 
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Emergency Phone (Restricted to Authorized Staff)</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Public / Surveillance Notes</label>
                <textarea 
                  rows="2"
                  value={formData.publicNotes}
                  onChange={(e) => setFormData({ ...formData, publicNotes: e.target.value })}
                  className="form-textarea"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-close-modal" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <QrCode size={16} />
              Enroll & Generate Permanent QR Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}