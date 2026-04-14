import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';

const CURRENCIES = [
  { symbol: '₹', label: 'INR — Indian Rupee' },
  { symbol: '$', label: 'USD — US Dollar' },
  { symbol: '€', label: 'EUR — Euro' },
  { symbol: '£', label: 'GBP — British Pound' },
  { symbol: '¥', label: 'JPY — Japanese Yen' },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', currency: user?.currency || '₹' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const saveProfile = async (evt) => {
    evt.preventDefault();
    if (!profileForm.name.trim()) { toast.error('Name is required'); return; }
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setProfileLoading(false); }
  };

  const savePassword = async (evt) => {
    evt.preventDefault();
    const e = {};
    if (!pwForm.currentPassword) e.current = 'Required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) e.new = 'Min 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    if (Object.keys(e).length) return;

    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Manage your account preferences</div>
        </div>
      </div>

      {/* Profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          Profile
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 600,
          }}>{getInitials(user?.name)}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>

        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={profileForm.currency}
              onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              {profileLoading ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          Change Password
        </div>
        <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            {pwErrors.current && <span className="form-error">{pwErrors.current}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
            {pwErrors.new && <span className="form-error">{pwErrors.new}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
            {pwErrors.confirm && <span className="form-error">{pwErrors.confirm}</span>}
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? <span className="spinner" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: '#fca5a5' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #fca5a5', color: 'var(--red)' }}>
          Sign Out
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
          You'll be signed out of your account on this device.
        </p>
        <button className="btn btn-danger" onClick={() => { logout(); }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
