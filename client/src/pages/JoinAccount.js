import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function JoinAccount() {

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const join = async () => {

    if (!code.trim()) {
      return toast.error("Enter invite code");
    }

    setLoading(true);

    try {

      await api.post('/accounts/join', {
        invite_code: code.toUpperCase()
      });

      toast.success("Joined successfully");

      navigate('/select-account');

    } catch (err) {

      toast.error(
        err.response?.data?.msg || "Failed to join"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div
        className="auth-card"
        style={{ maxWidth: 420 }}
      >

        <div className="auth-title">
          Join Shared Account
        </div>

        <div className="auth-subtitle">
          Enter invite code shared by owner
        </div>

        <div className="form-group">
          <label className="form-label">
            Invite Code
          </label>

          <input
            className="form-input"
            placeholder="e.g. A1B2C3"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary w-full"
          style={{ marginTop: 12 }}
          disabled={loading}
          onClick={join}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            "Join Account"
          )}
        </button>

      </div>

    </div>
  );
}