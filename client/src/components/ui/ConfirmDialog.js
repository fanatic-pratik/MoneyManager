import React from 'react';

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Are you sure?', message, loading }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
            <button className="btn btn-danger w-full" onClick={onConfirm} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
