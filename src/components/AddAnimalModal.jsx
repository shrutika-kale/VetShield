import React, { useState } from 'react';
import { X, Plus, QrCode, Cpu } from 'lucide-react';

export default function AddAnimalModal({ onClose, onAddAnimal }) {
  const [formData, setFormData] = useState({
    name: '',
    species: 'Cattle',
    breed: '',
    gender: 'Female',
    age: '2.0 yrs',
    dob: '2024-05-10',
    weight: '550 kg',
    penLocation: 'Barn A - Stall 06',
    publicNotes: 'Enrolled into VetShield permanent surveillance registry.',
    ownerName: 'Campus Research Dairy Farm',
    contactPerson: 'Attending Veterinarian',
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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="modal-animal-name">Enroll New Animal & Generate QR Tag</h2>
              <p className="modal-animal-sub">Assigns permanent VSxxxx ID for mobile camera scanning</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            {/* Real Hardware Architecture Notice */}
            <div className="modal-hardware-notice">
              <Cpu size={16} className="text-green" />
              <span>
                <strong>Hardware Sensor Policy:</strong> Temperature and vitals are not manually entered. They will stream live once an authorized ESP32 node is paired.
              </span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Animal Name / Tag Nickname *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Clover, Bella, Bruno"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Species *</label>
                <select 
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  className="form-select"
                >
                  <option value="Cattle">Cattle (Bovine)</option>
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
                  placeholder="e.g., Holstein, Merino, Boer"
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
                <label className="form-label">Age</label>
                <input 
                  type="text" 
                  placeholder="e.g., 2.5 yrs"
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
                  placeholder="e.g., 550 kg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pen / Housing Location</label>
                <input 
                  type="text" 
                  placeholder="e.g., Barn A - Stall 06"
                  value={formData.penLocation}
                  onChange={(e) => setFormData({ ...formData, penLocation: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="section-label" style={{ marginTop: '10px' }}>OWNERSHIP & VETERINARY CLINICIAN</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Farm / Facility Name</label>
                <input 
                  type="text" 
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attending Veterinarian / Contact</label>
                <input 
                  type="text" 
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Emergency Phone (Restricted to Staff)</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Public Surveillance Notes</label>
              <textarea 
                rows="2"
                value={formData.publicNotes}
                onChange={(e) => setFormData({ ...formData, publicNotes: e.target.value })}
                className="form-textarea"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-close-modal" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <QrCode size={16} />
              Generate Permanent QR Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
