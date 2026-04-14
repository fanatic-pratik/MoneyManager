import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, MONTHS } from '../utils/helpers';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3l10 10M13 3L3 13" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 4h10M6 4V2h4v2M5 4l1 9h4l1-9" />
  </svg>
);

export default function Budgets() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', limit: '', alertThreshold: 80 });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteBudget, setDeleteBudget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${month}&year=${year}`);
      setBudgets(res.data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/categories?type=expense').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => { fetchBudgets(); }, [month, year]);

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Select a category';
    if (!form.limit || Number(form.limit) <= 0) e.limit = 'Enter a valid amount';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/budgets', { ...form, limit: Number(form.limit), month, year });
      toast.success('Budget saved');
      setShowForm(false);
      setForm({ category: '', limit: '', alertThreshold: 80 });
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/budgets/${deleteBudget._id}`);
      toast.success('Budget removed');
      setDeleteBudget(null);
      fetchBudgets();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Budgets</div>
          <div className="page-subtitle">Set monthly spending limits per category</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-select" style={{ width: 130 }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Budget</button>
        </div>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Total Budget</div>
            <div className="stat-value balance">{formatCurrency(totalBudget, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value expense">{formatCurrency(totalSpent, currency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className="stat-value income">{formatCurrency(Math.max(totalBudget - totalSpent, 0), currency)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overall Usage</div>
            <div className="stat-value balance">
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Budget list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No budgets for {MONTHS[month - 1]} {year}</div>
            <div className="empty-state-text">Click "Add Budget" to set spending limits</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map((b) => {
            const pct = Math.min(b.percentage, 100);
            const status = pct >= 100 ? 'danger' : pct >= b.alertThreshold ? 'warning' : 'safe';
            const statusColor = status === 'danger' ? 'var(--red)' : status === 'warning' ? 'var(--amber)' : 'var(--green)';
            return (
              <div key={b._id || b.category} className="card">
                <div className="flex justify-between items-center">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{b.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono" style={{ fontSize: 13.5, color: statusColor }}>
                          {formatCurrency(b.spent, currency)}
                          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / {formatCurrency(b.limit, currency)}</span>
                        </span>
                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDeleteBudget(b)}><TrashIcon /></button>
                      </div>
                    </div>
                    <div className="budget-bar-track" style={{ height: 8 }}>
                      <div className={`budget-bar-fill ${status}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span style={{ fontSize: 12, color: statusColor, fontWeight: 500 }}>
                        {b.isOverBudget
                          ? `⚠️ Over budget by ${formatCurrency(b.spent - b.limit, currency)}`
                          : pct >= b.alertThreshold
                          ? `⚡ ${pct}% used — approaching limit`
                          : `${pct}% used`}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatCurrency(Math.max(b.limit - b.spent, 0), currency)} left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add Budget</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><XIcon /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Setting budget for <strong>{MONTHS[month - 1]} {year}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select expense category...</option>
                    {categories.filter((c) => !budgets.find((b) => b.category === c.name)).map((c) => (
                      <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  {formErrors.category && <span className="form-error">{formErrors.category}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Limit ({currency})</label>
                  <input type="number" className="form-input" min="0" step="0.01" placeholder="5000"
                    value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} />
                  {formErrors.limit && <span className="form-error">{formErrors.limit}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Alert Threshold: {form.alertThreshold}%</label>
                  <input type="range" min="50" max="95" step="5" value={form.alertThreshold}
                    onChange={(e) => setForm({ ...form, alertThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <span className="form-hint">Get warned when spending reaches {form.alertThreshold}% of budget</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary w-full" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                    {saving ? <span className="spinner" /> : 'Save Budget'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteBudget} onClose={() => setDeleteBudget(null)} onConfirm={handleDelete}
        title="Remove Budget" loading={deleteLoading}
        message={`Remove the budget for "${deleteBudget?.category}"? Existing transactions won't be affected.`} />
    </div>
  );
}
