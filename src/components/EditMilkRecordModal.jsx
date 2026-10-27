import React, { useState } from 'react';
import { X, Droplets, Check, Info } from 'lucide-react';

export default function EditMilkRecordModal({ 
  record, 
  onClose, 
  onSave 
}) {
  if (!record) return null;

  const [formData, setFormData] = useState({
    date: record.date || '',
    morningLiters: (record.morningLiters ?? 0).toString(),
    afternoonLiters: (record.afternoonLiters ?? 0).toString(),
    eveningLiters: (record.eveningLiters ?? 0).toString(),
    soldLiters: (record.soldLiters ?? record.totalLiters ?? 0).toString(),
    pricePerLiter: (record.pricePerLiter ?? 55).toString(),
    notes: record.notes || ''
  });

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
    if (totalLiters <= 0) {
      alert("Total daily milk production must be greater than zero.");
      return;
    }

    const payload = {
      date: formData.date,
      morningLiters: m,
      afternoonLiters: a,
      eveningLiters: e,
      soldLiters: clampedSold,
      pricePerLiter: price,
      notes: formData.notes
    };

    onSave(record.id, payload);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="form-icon-box" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
              <Droplets size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-animal-name">Edit Milk Production Entry</h2>
              <p className="modal-animal-sub">
                Animal: <strong>{record.animalName}</strong> ({record.animalId} • {record.species})
              </p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Animal ID & Name</label>
                <input 
                  type="text" 
                  disabled 
                  className="form-input disabled" 
                  value={`${record.animalId} — ${record.animalName} (${record.species})`} 
                />
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
                  />
                  <span className="session-unit">Litres</span>
                </div>
              </div>
            </div>

            <div className="auto-calc-summary-card">
              <div className="calc-row-header">
                <span>RECALCULATED TOTALS</span>
                <span className="badge-live-calc">Live Updated</span>
              </div>

              <div className="calc-metrics-grid">
                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Total Daily Yield</span>
                  <span className="calc-metric-val">{totalLiters} L</span>
                </div>

                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Sold for Revenue</span>
                  <span className="calc-metric-val text-green">{clampedSold} L</span>
                </div>

                <div className="calc-metric-item">
                  <span className="calc-metric-lbl">Unsold / Retained</span>
                  <span className="calc-metric-val text-muted">{unsoldLiters} L</span>
                </div>

                <div className="calc-metric-item highlight">
                  <span className="calc-metric-lbl">Calculated Income</span>
                  <span className="calc-metric-val revenue">₹ {totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

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
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sold Quantity (Litres)</label>
                <input 
                  type="number"
                  step="0.1"
                  min="0"
                  max={totalLiters}
                  className="form-input"
                  value={formData.soldLiters}
                  onChange={(e) => setFormData({ ...formData, soldLiters: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Milking & Health Notes</label>
                <textarea 
                  rows="2"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="accounting-safeguard-notice">
              <Info size={14} />
              <span>
                <strong>Linked Transaction Update:</strong> Saving this change will automatically synchronize the linked sales transaction in the financial ledger, preventing ledger divergence.
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
              disabled={totalLiters <= 0}
            >
              <Check size={16} />
              Save Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}