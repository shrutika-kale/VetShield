import React, { useState, useEffect } from 'react';
import { X, Droplets, AlertCircle, Check, Info } from 'lucide-react';

export default function AddMilkRecordModal({ 
  animals = [], 
  existingRecords = [],
  initialAnimalId = null,
  onClose, 
  onSave 
}) {
  // Only Cows and Buffaloes (and Cattle) produce milk in dairy operations
  const dairyAnimals = animals.filter(
    a => a.species === 'Cow' || a.species === 'Buffalo' || a.species === 'Cattle'
  );

  const defaultAnimal = initialAnimalId 
    ? dairyAnimals.find(a => a.id === initialAnimalId) || dairyAnimals[0]
    : dairyAnimals[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    animalId: defaultAnimal ? defaultAnimal.id : '',
    date: todayStr,
    morningLiters: '8.0',
    afternoonLiters: '0.0',
    eveningLiters: '7.0',
    soldLiters: '',
    pricePerLiter: defaultAnimal && defaultAnimal.species === 'Buffalo' ? '70' : '55',
    notes: ''
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Update default price per litre when animal changes
  const handleAnimalChange = (newAnimalId) => {
    const selected = dairyAnimals.find(a => a.id === newAnimalId);
    const defaultPrice = selected && selected.species === 'Buffalo' ? '70' : '55';
    setFormData(prev => ({
      ...prev,
      animalId: newAnimalId,
      pricePerLiter: defaultPrice
    }));
  };

  // Check for duplicate entry on selected animal and date
  useEffect(() => {
    if (!formData.animalId || !formData.date) {
      setDuplicateWarning(null);
      return;
    }
    const dup = existingRecords.find(
      r => r.animalId === formData.animalId && r.date === formData.date
    );
    if (dup) {
      setDuplicateWarning(`A milk record for ${dup.animalName} (${dup.animalId}) on ${formData.date} already exists (${dup.totalLiters} L). Creating a duplicate entry is blocked.`);
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.animalId, formData.date, existingRecords]);

  // Calculations
  const m = Math.max(0, parseFloat(formData.morningLiters) || 0);
  const a = Math.max(0, parseFloat(formData.afternoonLiters) || 0);
  const e = Math.max(0, parseFloat(formData.eveningLiters) || 0);
  const totalLiters = parseFloat((m + a + e).toFixed(2));

  const price = Math.max(0, parseFloat(formData.pricePerLiter) || 0);
  const soldLiters = formData.soldLiters !== '' ? Math.max(0, parseFloat(formData.soldLiters) || 0) : totalLiters;
  const clampedSold = Math.min(totalLiters, soldLiters);
  const unsoldLiters = parseFloat(Math.max(0, totalLiters - clampedSold).toFixed(2));
  const totalIncome = parseFloat((clampedSold * price).toFixed(2));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.animalId) {
      alert("Please select a dairy animal.");
      return;
    }
    if (totalLiters <= 0) {
      alert("Total daily milk production must be greater than zero.");
      return;
    }
    if (duplicateWarning) {
      alert(duplicateWarning);
      return;
    }

    const payload = {
      animalId: formData.animalId,
      date: formData.date,
      morningLiters: m,
      afternoonLiters: a,
      eveningLiters: e,
      soldLiters: clampedSold,
      pricePerLiter: price,
      notes: formData.notes
    };

    onSave(payload);
    onClose();
  };

  const selectedAnimal = dairyAnimals.find(a => a.id === formData.animalId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
              <Droplets size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-animal-name">Record Daily Milk Production</h2>
              <p className="modal-animal-sub">Logs milking sessions and links verified sales revenue</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            {duplicateWarning && (
              <div className="warning-callout-box">
                <AlertCircle size={18} className="text-amber" />
                <div>
                  <strong>Duplicate Entry Notice:</strong> {duplicateWarning}
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Select Animal (Cow / Buffalo) *</label>
                <select 
                  className="form-select"
                  value={formData.animalId}
                  onChange={(e) => handleAnimalChange(e.target.value)}
                  required
                >
                  {dairyAnimals.length === 0 && <option value="">No dairy animals available</option>}
                  {dairyAnimals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.id} — {animal.name} ({animal.species} • {animal.breed})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Production Date *</label>
                <input 
                  type="date"
                  className="form-input"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            {/* Milking Sessions Grid */}
            <div className="section-label" style={{ marginTop: '14px' }}>MILKING SESSIONS (LITRES)</div>
            <div className="milk-sessions-input-grid">
              <div className="session-input-card">
                <span className="session-time-label">🌅 Morning Session</span>
                <div className="session-field-row">
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    className="session-num-input"
                    value={formData.morningLiters}
                    onChange={(e) => setFormData({ ...formData, morningLiters: e.target.value })}
                    placeholder="0.0"
                    required
                  />
                  <span className="session-unit">Litres</span>
                </div>
              </div>

              <div className="session-input-card">
                <span className="session-time-label">☀️ Afternoon Session</span>
                <div className="session-field-row">
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    className="session-num-input"
                    value={formData.afternoonLiters}
                    onChange={(e) => setFormData({ ...formData, afternoonLiters: e.target.value })}
                    placeholder="0.0"
                  />
                  <span className="session-unit">Litres</span>
                </div>
              </div>

              <div className="session-input-card">
                <span className="session-time-label">🌙 Evening Session</span>
                <div className="session-field-row">
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    className="session-num-input"
                    value={formData.eveningLiters}
                    onChange={(e) => setFormData({ ...formData, eveningLiters: e.target.value })}
                    placeholder="0.0"
                  />
                  <span className="session-unit">Litres</span>
                </div>
              </div>
            </div>

            {/* Real-time Calculation Summary Card */}
            <div className="auto-calc-summary-card">
              <div className="calc-row-header">
                <span>AUTOMATIC CALCULATIONS</span>
                <span className="badge-live-calc">Live Computed</span>
              </div>

              <div className="calc-metrics-grid">
                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Total Daily Yield</span>
                  <span className="calc-metric-val">{totalLiters} L</span>
                </div>

                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Sold for Commercial Revenue</span>
                  <span className="calc-metric-val text-green">{clampedSold} L</span>
                </div>

                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Unsold / Retained for Calves</span>
                  <span className="calc-metric-val text-muted">{unsoldLiters} L</span>
                </div>

                <div className="calc-metric-item highlight">
                  <span className="calc-metric-lbl">Calculated Daily Milk Income</span>
                  <span className="calc-metric-val revenue">₹ {totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Commercial Pricing & Retained Milk Options */}
            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Selling Price per Litre (₹) *</label>
                <div className="input-with-adornment">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    className="form-input with-prefix"
                    value={formData.pricePerLiter}
                    onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                    placeholder="55.00"
                  />
                </div>
                <span className="form-hint">Standard rate: ₹50–60/L for Cow milk, ₹65–80/L for Buffalo milk</span>
              </div>

              <div className="form-group">
                <label className="form-label">Sold Quantity (Litres) [Optional]</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  max={totalLiters}
                  className="form-input"
                  value={formData.soldLiters}
                  onChange={(e) => setFormData({ ...formData, soldLiters: e.target.value })}
                  placeholder={`All (${totalLiters} L)`}
                />
                <span className="form-hint">Leave blank if all milk produced was sold</span>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Milking & Health Notes</label>
                <textarea 
                  rows="2"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. 1.5L fed to newborn calf, normal milk letdown, good fat content"
                />
              </div>
            </div>

            <div className="accounting-safeguard-notice">
              <Info size={14} />
              <span>
                <strong>Accounting Rule:</strong> Recording this milk sale will automatically link to the financial income ledger under "{selectedAnimal?.species === 'Buffalo' ? 'Buffalo milk sales' : 'Cow milk sales'}", preventing duplicate transaction entries.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-close-modal" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary-action"
              disabled={!!duplicateWarning || totalLiters <= 0}
            >
              <Check size={16} />
              Save Milk Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}