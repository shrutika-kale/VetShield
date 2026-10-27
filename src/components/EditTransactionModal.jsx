import React, { useState } from 'react';
import { X, DollarSign, Check, Info } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from './AddTransactionModal';

export default function EditTransactionModal({ 
  transaction, 
  animals = [], 
  onClose, 
  onSave 
}) {
  if (!transaction) return null;

  const [formData, setFormData] = useState({
    date: transaction.date || '',
    type: transaction.type || 'expense',
    category: transaction.category || '',
    description: transaction.description || '',
    amount: (transaction.amount ?? 0).toString(),
    animalId: transaction.animalId || '',
    paymentMethod: transaction.paymentMethod || 'UPI / QR',
    isCapitalExpense: !!transaction.isCapitalExpense,
    notes: transaction.notes || ''
  });

  const handleCategoryChange = (newCat) => {
    const isCapital = newCat === 'Animal purchase costs';
    setFormData(prev => ({
      ...prev,
      category: newCat,
      isCapitalExpense: isCapital
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }

    const payload = {
      date: formData.date,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      amount: amountVal,
      animalId: formData.animalId || null,
      paymentMethod: formData.paymentMethod,
      isCapitalExpense: formData.isCapitalExpense || formData.category === 'Animal purchase costs',
      notes: formData.notes
    };

    onSave(transaction.id, payload);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div 
              className="form-icon-box" 
              style={{ background: formData.type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
            >
              <DollarSign size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-animal-name">Edit Transaction #{transaction.id.slice(-6)}</h2>
              <p className="modal-animal-sub">Update recorded financial ledger entry</p>
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
                <label className="form-label">Transaction Date *</label>
                <input 
                  type="date"
                  className="form-input"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  {(formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount in INR (₹) *</label>
                <div className="input-with-adornment">
                  <span className="input-prefix">₹</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    className="form-input with-prefix"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-select"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Description / Purpose *</label>
                <input 
                  type="text"
                  required
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attributed Animal (Optional)</label>
                <select 
                  className="form-select"
                  value={formData.animalId}
                  onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
                >
                  <option value="">General Farm Overhead</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name} ({a.species})
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === 'expense' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                  <label className="checkbox-label-container">
                    <input 
                      type="checkbox"
                      checked={formData.isCapitalExpense || formData.category === 'Animal purchase costs'}
                      onChange={(e) => setFormData({ ...formData, isCapitalExpense: e.target.checked })}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">Capital Asset Acquisition</span>
                  </label>
                </div>
              )}

              <div className="form-group full-width">
                <label className="form-label">Accounting Notes & Ref</label>
                <textarea 
                  rows="2"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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