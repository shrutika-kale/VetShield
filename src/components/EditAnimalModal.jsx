import React, { useState } from 'react';
import { X, Check, ShieldCheck, Lock } from 'lucide-react';

export default function EditAnimalModal({ animal, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: animal.name || '',
    breed: animal.breed || '',
    age: animal.age || '',
    weight: animal.weight || '',
    penLocation: animal.penLocation || animal.location || '',
    publicNotes: animal.publicNotes || animal.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(animal.id, formData);
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
              <p className="modal-animal-sub">Permanent ID: <strong>{animal.id}</strong> (QR Code Preserved)</p>
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
                <label className="form-label">Age</label>
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
