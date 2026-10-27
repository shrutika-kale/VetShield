import React, { useState } from 'react';
import { X, Check, ShieldCheck, Lock } from 'lucide-react';

export default function EditAnimalModal({ animal, onClose, onSave }) {
  const isDairy = animal.species === 'Cow' || animal.species === 'Buffalo' || animal.species === 'Cattle';

  const [formData, setFormData] = useState({
    name: animal.name || '',
    breed: animal.breed || '',
    age: animal.age || '',
    weight: animal.weight || '',
    penLocation: animal.penLocation || animal.location || '',
    healthStatus: animal.healthStatus || 'Healthy',
    milkProductionStatus: animal.milkProductionStatus || (isDairy ? 'In Milk' : 'Not Applicable'),
    purchaseDate: animal.purchaseDate || '',
    purchaseCost: animal.purchaseCost !== undefined && animal.purchaseCost !== null ? animal.purchaseCost.toString() : '',
    publicNotes: animal.publicNotes || animal.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null
    };
    onSave(animal.id, payload);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="modal-animal-name">Edit Animal Dossier</h2>
              <p className="modal-animal-sub">Permanent ID: <strong>{animal.id}</strong> ({animal.species})</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            <div className="qr-permanent-notice">
              <Lock size={14} className="text-muted" />
              <span>
                <strong>Permanent Identification:</strong> The unique ID <code>{animal.id}</code> and its generated QR code URL remain permanent and unchanged.
              </span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Animal Name / Tag Nickname *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Breed</label>
                <input 
                  type="text" 
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age / Description</label>
                <input 
                  type="text" 
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight</label>
                <input 
                  type="text" 
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Health Status</label>
                <select 
                  value={formData.healthStatus}
                  onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                  className="form-select"
                >
                  <option value="Healthy">Healthy (Optimal)</option>
                  <option value="Monitoring">Monitoring (Flagged)</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Critical">Critical Triage</option>
                </select>
              </div>

              {isDairy && (
                <div className="form-group">
                  <label className="form-label">Milk / Lactation Status</label>
                  <select 
                    value={formData.milkProductionStatus}
                    onChange={(e) => setFormData({ ...formData, milkProductionStatus: e.target.value })}
                    className="form-select"
                  >
                    <option value="In Milk">In Milk (Active)</option>
                    <option value="Dry">Dry Period</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Heifer">Heifer (Pre-calving)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input 
                  type="date" 
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Purchase Cost (₹)</label>
                <div className="input-with-adornment">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number" 
                    step="500"
                    min="0"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="form-input with-prefix"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Pen / Barn Housing Location</label>
                <input 
                  type="text" 
                  value={formData.penLocation}
                  onChange={(e) => setFormData({ ...formData, penLocation: e.target.value })}
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
              <Check size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}