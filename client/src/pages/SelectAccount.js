import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAccount } from '../context/AccountContext';

export default function SelectAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const { switchAccount } = useAccount();

  useEffect(() => {
    api.get('/accounts')
      .then(res => {
        const accs = res.data.map(a => a.account_id);
        setAccounts(accs);
      })
      .catch(() => toast.error("Failed to load accounts"))
      .finally(() => setLoading(false));
  }, []);

  const selectAccount = (id) => {
    switchAccount(id);
    toast.success("Account selected");
    navigate('/');
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        
        <div className="auth-title">Select Account</div>
        <div className="auth-subtitle">
          Choose an account to continue
        </div>

        {/* Empty State */}
        {accounts.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">🏦</div>
            <div className="empty-state-title">No accounts found</div>
            <div className="empty-state-text">
              Create one to get started
            </div>

            <button
              className="btn btn-primary w-full"
              style={{ marginTop: 16 }}
              onClick={() => navigate('/create-account')}
            >
              Create Account
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {accounts.map(acc => (
              <div
                key={acc._id}
                className="card"
                style={{
                  padding: 14,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: '0.2s'
                }}
                onClick={() => selectAccount(acc._id)}
              >
                {/* Account Name */}
                <div style={{ fontWeight: 600 }}>
                  {acc.account_name}
                </div>

                {/* Type + Mode */}
                <div style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 4
                }}>
                  {acc.type} • {acc.mode}
                </div>
              </div>
            ))}

            {/* Create New Button */}
            <button
              className="btn btn-outline w-full"
              style={{ marginTop: 8 }}
              onClick={() => navigate('/create-account')}
            >
              + Create New Account
            </button>

            <button
              className="btn btn-secondary w-full"
              onClick={() => navigate('/join-account')}
            >
              Join Shared Account
            </button>

          </div>
        )}

      </div>
    </div>
  );
}