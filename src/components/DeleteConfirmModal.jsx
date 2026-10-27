import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ 
  isOpen, 
  title = "Confirm Deletion", 
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  itemName,
  itemId,
  onConfirm, 
  onClose,
  confirmButtonText = "Delete Permanently"
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card delete-modal" onClick={e => e.stopPropagation()}>
        <div className="delete-modal-icon-wrap">
          <AlertTriangle size={32} className="text-red" />
        </div>

        <h3 className="delete-modal-title">{title}</h3>
        
        <p className="delete-modal-message">
          {message}
        </p>

        {(itemName || itemId) && (
          <div className="delete-target-pill">
            <span className="target-id">{itemId}</span>
            {itemName && <span className="target-name">{itemName}</span>}
          </div>
        )}

        <div className="delete-modal-actions">
          <button 
            type="button" 
            className="btn-close-modal"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-danger-action"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} />
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}