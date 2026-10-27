import React, { useState } from 'react';
import { X, DollarSign, Check, Info } from 'lucide-react';

export const INCOME_CATEGORIES = [
  'Cow milk sales',
  'Buffalo milk sales',
  'Sale of other dairy products',
  'Animal sales',
  'Other income'
];

export const EXPENSE_CATEGORIES = [
  'Animal feed',
  'Veterinary treatment',
  'Medicines',
  'Labour costs',
  'Electricity',
  'Water',
  'Equipment and maintenance',
  'Transportation',
  'Animal purchase costs',
  'Other expenses'
];

export const PAYMENT_METHODS = [
  'UPI / QR',
  'Cash',
  'Bank Transfer',
  'Cheque',
  'Other'
];

export default function AddTransactionModal({ 
  animals = [], 
  onClose, 
  onSave,
  defaultType = 'expense'
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState(defaultType); // 'income' | 'expense'
  const [formData, setFormData] = useState({
    date: todayStr,
    category: defaultType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
    animalId: '',
    paymentMethod: 'UPI / QR',
    isCapitalExpense: false,
    notes: ''
  });

  const handleTypeChange = (newType) => {
    setType(newType);
    setFormData(prev => ({
      ...prev,
      category: newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
      isCapitalExpense: false
    }));
  };

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
      type,
      category: formData.category,
      description: formData.description || `${formData.category} on ${formData.date}`,
      amount: amountVal,
      animalId: formData.animalId || null,
      paymentMethod: formData.paymentMethod,
      isCapitalExpense: formData.isCapitalExpense || formData.category === 'Animal purchase costs',
      notes: formData.notes
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div 
              className="form-icon-box" 
              style={{ background: type === 'income' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}
            >
              <DollarSign size={22} color="#ffffff" />
            </div>
            <div>
              <h2 className="modal-animal-name">
                {type === 'income' ? 'Record Farm Income' : 'Record Farm Operating Expense'}
              </h2>
              <p className="modal-animal-sub">Documents verified transaction in INR (₹) ledger</p>
            </div>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body-scrollable">
            {/* Type Switcher Tabs */}
            <div className="transaction-type-pill-row">
              <button
                type="button"
                className={`type-toggle-btn ${type === 'income' ? 'active-income' : ''}`}
                onClick={() => handleTypeChange('income')}
              >
                + Income Entry
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => handleTypeChange('expense')}
              >
                − Expense Entry
              </button>
            </div>

            <div className="form-grid" style={{ marginTop: '16px' }}>
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
                  {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
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
                    placeholder="0.00"
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
                  placeholder={type === 'income' ? "e.g. Bulk dairy delivery, surplus compost sale" : "e.g. 50kg dry cattle concentrate, veterinary prescription dip"}
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Directly Attributed Animal (Optional)</label>
                <select 
                  className="form-select"
                  value={formData.animalId}
                  onChange={(e) => setFormData({ ...formData, animalId: e.target.value })}
                >
                  <option value="">General Farm / Shared Overhead</option>
                  {animals.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name} ({a.species})
                    </option>
                  ))}
                </select>
                <span className="form-hint">Enables animal-wise profitability contribution analytics</span>
              </div>

              {type === 'expense' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                  <label className="checkbox-label-container">
                    <input 
                      type="checkbox"
                      checked={formData.isCapitalExpense || formData.category === 'Animal purchase costs'}
                      onChange={(e) => setFormData({ ...formData, isCapitalExpense: e.target.checked })}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-text">Capital Asset Acquisition (Exclude from daily operating profit)</span>
                  </label>
                </div>
              )}

              <div className="form-group full-width">
                <label className="form-label">Accounting Notes & Receipt / Voucher Ref</label>
                <textarea 
                  rows="2"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Voucher #104, Paid to vendor Agrico Mart, Batch invoice #B-20"
                />
              </div>
            </div>

            <div className="accounting-safeguard-notice">
              <Info size={14} />
              <span>
                <strong>Accounting Standards:</strong> All entries are strictly logged into the farm financial ledger. Capital purchases are accounted for separately under Capital Assets so daily net operating profit reflects true operational performance.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-close-modal" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-action">
              <Check size={16} />
              Record Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}