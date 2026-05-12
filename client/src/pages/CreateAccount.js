import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function CreateAccount() {
  const [form, setForm] = useState({
    account_name: '',
    type: 'personal',
    mode: 'strict'
  });

  const [hasPersonal, setHasPersonal] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔍 Check if user already has personal account
  useEffect(() => {
    api.get('/accounts').then(res => {
      const accounts = res.data.map(a => a.account_id);
      const personalExists = accounts.some(a => a.type === 'personal');
      setHasPersonal(personalExists);

      if (personalExists) {
        setForm(prev => ({ ...prev, type: 'shared' }));
      }
    });
  }, []);

  const create = async () => {
    if (!form.account_name.trim()) {
      return toast.error("Account name required");
    }

    if (form.type === "personal" && hasPersonal) {
      return toast.error("Personal account already exists");
    }

    setLoading(true);
    try {
      const res = await api.post('/accounts', {
        account_name: form.account_name,
        type: form.type,
        mode: form.type === "shared" ? form.mode : "strict"
      });

      localStorage.setItem("account_id", res.data._id);

      //toast.success("Account created!");
      if (type === 'shared') {
        toast.success(`Invite Code: ${res.data.invite_code}`);
      } else {
        toast.success("Account created!");
      }
      navigate('/');

    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420 }}>
        
        <div className="auth-title">Create Account</div>
        <div className="auth-subtitle">
          Create personal or shared account
        </div>

        {/* Account Name */}
        <div className="form-group">
          <label className="form-label">Account Name</label>
          <input
            className="form-input"
            placeholder="e.g. Personal, Goa Trip"
            value={form.account_name}
            onChange={(e) =>
              setForm({ ...form, account_name: e.target.value })
            }
          />
        </div>

        {/* Account Type */}
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <select
            className="form-input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
          >
            <option value="personal" disabled={hasPersonal}>
              Personal {hasPersonal ? "(Already exists)" : ""}
            </option>
            <option value="shared">Shared</option>
          </select>
        </div>

        {/* Mode (ONLY for shared) */}
        {form.type === "shared" && (
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select
              className="form-input"
              value={form.mode}
              onChange={(e) =>
                setForm({ ...form, mode: e.target.value })
              }
            >
              <option value="strict">Strict (No borrowing)</option>
              <option value="loan">Loan allowed</option>
            </select>
          </div>
        )}

        {/* Button */}
        <button
          className="btn btn-primary w-full btn-lg"
          onClick={create}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? <span className="spinner" /> : "Create Account"}
        </button>

        <button
          className="btn btn-secondary w-full"
          onClick={() => navigate('/join-account')}
        >
          Join Shared Account
        </button>

      </div>
    </div>
  );
}