import React, { useState, useEffect } from 'react';
import api from '../utils/api';
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
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M11 2l3 3-9 9H2v-3L11 2z" strokeLinejoin="round" />
  </svg>
);

const EMOJI_SUGGESTIONS = ['🍔','🚗','🛍️','🎬','🏥','⚡','📚','✈️','💼','💻','📈','🎁','💰','🏠','💊','🎮','☕','🧾','📦','🐾'];
const COLOR_PALETTE = ['#18181b','#ef4444','#f97316','#f59e0b','#22c55e','#10b981','#3b82f6','#6366f1','#8b5cf6','#ec4899','#06b6d4','#14b8a6'];

const defaultForm = { name: '', type: 'expense', icon: '📦', color: '#18181b' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteCat, setDeleteCat] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('expense');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditCat(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (cat) => { setEditCat(cat); setForm({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color }); setShowForm(true); };

  const handleSave = async (evt) => {
    evt.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editCat) {
        await api.put(`/categories/${editCat._id}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/categories/${deleteCat._id}`);
      toast.success('Category deleted');
      setDeleteCat(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete default category');
    } finally { setDeleteLoading(false); }
  };

  const filtered = categories.filter((c) => c.type === activeTab || c.type === 'both');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Categories</div>
          <div className="page-subtitle">{categories.length} categories total</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New Category</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-subtle)', padding: 4, borderRadius: 'var(--radius)', width: 'fit-content' }}>
        {['expense', 'income'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: '7px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13.5, fontWeight: 500,
              background: activeTab === t ? 'var(--bg-white)' : 'transparent',
              color: activeTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
              boxShadow: activeTab === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.12s',
            }}>
            {t === 'expense' ? '↓ Expense' : '↑ Income'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map((cat) => (
            <div key={cat._id} className="card" style={{ padding: '14px 16px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="cat-icon" style={{ background: cat.color + '18', fontSize: 18 }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{cat.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {cat.type}{cat.isDefault ? ' · default' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-icon" onClick={() => openEdit(cat)}><EditIcon /></button>
                  {!cat.isDefault && (
                    <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDeleteCat(cat)}><TrashIcon /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">🏷️</div>
                  <div className="empty-state-title">No {activeTab} categories</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editCat ? 'Edit Category' : 'New Category'}</span>
              <button className="btn-icon" onClick={() => setShowForm(false)}><XIcon /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Preview */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <div className="cat-icon" style={{ width: 56, height: 56, fontSize: 28, background: form.color + '18', borderRadius: 'var(--radius-lg)' }}>
                    {form.icon}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" autoFocus />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="type-toggle">
                    <button type="button" className={`type-toggle-btn ${form.type === 'income' ? 'active-income' : ''}`}
                      onClick={() => setForm({ ...form, type: 'income' })}>↑ Income</button>
                    <button type="button" className={`type-toggle-btn ${form.type === 'expense' ? 'active-expense' : ''}`}
                      onClick={() => setForm({ ...form, type: 'expense' })}>↓ Expense</button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {EMOJI_SUGGESTIONS.map((e) => (
                      <button key={e} type="button" onClick={() => setForm({ ...form, icon: e })}
                        style={{ width: 36, height: 36, fontSize: 18, border: `2px solid ${form.icon === e ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: 'var(--bg-white)', cursor: 'pointer', transition: 'border-color 0.12s' }}>
                        {e}
                      </button>
                    ))}
                    <input className="form-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      style={{ width: 80 }} placeholder="or type" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {COLOR_PALETTE.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? 'var(--text-primary)' : 'transparent'}`, cursor: 'pointer', outline: `2px solid ${form.color === c ? 'white' : 'transparent'}`, outlineOffset: -3 }} />
                    ))}
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                      style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 6, padding: 0 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary w-full" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-full" disabled={saving}>
                    {saving ? <span className="spinner" /> : editCat ? 'Save' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteCat} onClose={() => setDeleteCat(null)} onConfirm={handleDelete}
        title="Delete Category" loading={deleteLoading}
        message={`Delete "${deleteCat?.name}"? Existing transactions with this category won't be deleted.`} />
    </div>
  );
}
