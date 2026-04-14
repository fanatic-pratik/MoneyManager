import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { PAYMENT_METHODS, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

export default function TransactionModal({ isOpen, onClose, onSaved, transaction = null }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: '', description: '',
    date: formatDate(new Date(), 'yyyy-MM-dd'), paymentMethod: 'cash',
    tags: '', notes: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    api.get('/categories').then((r) => setCategories(r.data));
    if (isEdit) {
      setForm({
        type: transaction.type,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        date: formatDate(transaction.date, 'yyyy-MM-dd'),
        paymentMethod: transaction.paymentMethod || 'cash',
        tags: (transaction.tags || []).join(', '),
        notes: transaction.notes || '',
      });
    } else {
      setForm(f => ({ ...f, type: 'expense', amount: '', category: '', description: '', tags: '', notes: '' }));
    }
  }, [isOpen, transaction]);

  const filteredCats = categories.filter(
    (c) => c.type === form.type || c.type === 'both'
  );

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.category) e.category = 'Select a category';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    try {
      if (isEdit) {
        await api.put(`/transactions/${transaction._id}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setErrors({}); };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Transaction' : 'New Transaction'}</span>
          <button className="btn-icon" onClick={onClose}><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type toggle */}
            <div className="type-toggle">
              <button type="button" className={`type-toggle-btn ${form.type === 'income' ? 'active-income' : ''}`}
                onClick={() => setForm({ ...form, type: 'income', category: '' })}>
                ↑ Income
              </button>
              <button type="button" className={`type-toggle-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
                onClick={() => setForm({ ...form, type: 'expense', category: '' })}>
                ↓ Expense
              </button>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" type="number" step="0.01" min="0"
                placeholder="0.00" value={form.amount} onChange={set('amount')} autoFocus />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={set('category')}>
                <option value="">Select category...</option>
                {filteredCats.map((c) => (
                  <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <input className="form-input" placeholder="e.g. Lunch at Café" value={form.description} onChange={set('description')} />
            </div>

            <div className="form-grid form-grid-2">
              {/* Date */}
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={set('date')} />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label className="form-label">Payment</label>
                <select className="form-select" value={form.paymentMethod} onChange={set('paymentMethod')}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags <span style={{ color: 'var(--text-muted)' }}>(comma separated)</span></label>
              <input className="form-input" placeholder="food, work, travel" value={form.tags} onChange={set('tags')} />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" rows={2} placeholder="Any additional notes..."
                value={form.notes} onChange={set('notes')} style={{ resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" className="btn btn-secondary w-full" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
