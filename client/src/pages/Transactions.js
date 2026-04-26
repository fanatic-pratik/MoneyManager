import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import TransactionModal from '../components/ui/TransactionModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useAccount } from '../context/AccountContext';

const SearchIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M11 2l3 3-9 9H2v-3L11 2z" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M3 4h10M6 4V2h4v2M5 4l1 9h4l1-9" />
  </svg>
);

export default function Transactions() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [accountId, setAccountId] = useState(null);
  const [account, setAccount] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '', type: '', category: '', startDate: '', endDate: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { currentAccount } = useAccount();

  useEffect(() => {
  setFilters({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  setPage(1);
}, [accountId]);

  // 🔥 Load account context
  // 🔥 Sync with account context (FIXED)
    useEffect(() => {
      const id = currentAccount?._id;

      setAccountId(id);

      if (!id) {
        setAccount(null);
        return;
      }

      api.get('/accounts').then(res => {
        const accs = res.data.map(a => a.account_id);
        const current = accs.find(a => a._id === id);
        setAccount(current);
      });

    }, [currentAccount]); // ✅ IMPORTANT CHANGE

  // Load categories
  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  // 🔥 Fetch transactions (ACCOUNT BASED)
  const fetchTransactions = useCallback(async () => {
    if (!accountId) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        account_id: accountId,
        ...filters
      };

      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

      const res = await api.get('/transactions', { params });

      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);

    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filters, accountId]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/transactions/${deleteTx._id}`);
      toast.success('Transaction deleted');
      setDeleteTx(null);
      fetchTransactions();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const PAYMENT_LABELS = {
    cash: 'Cash',
    card: 'Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    other: 'Other'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-subtitle">{total} total records</div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => { setEditTx(null); setShowModal(true); }}
        >
          + Add Transaction
        </button>
      </div>

      {/* 🔥 FILTER BAR */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            className="form-input"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* 🔥 TYPE FILTER */}
        <select
          className="form-select"
          style={{ width: 150 }}
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>

          {account?.type === "personal" && (
            <>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </>
          )}

          {account?.type === "shared" && (
            <>
              <option value="contribution">Contribution</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="repayment">Repayment</option>
            </>
          )}
        </select>

        {/* 🔥 CATEGORY ONLY FOR PERSONAL */}
        {account?.type === "personal" && (
          <select
            className="form-select"
            style={{ width: 160 }}
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          className="form-input"
          style={{ width: 150 }}
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
        />

        <input
          type="date"
          className="form-input"
          style={{ width: 150 }}
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <div>No transactions</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((tx) => {
                const isPositive = ["income", "contribution", "repayment"].includes(tx.type);

                return (
                  <tr key={tx._id}>
                    <td>{formatDate(tx.date, 'dd MMM yyyy')}</td>

                    <td>{tx.description || '—'}</td>

                    <td>
                      <span className={`badge ${isPositive ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span className={isPositive ? 'amount-income' : 'amount-expense'}>
                        {isPositive ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </span>
                    </td>

                    <td>
                      <button onClick={() => { setEditTx(tx); setShowModal(true); }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <TransactionModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditTx(null); }}
        onSaved={fetchTransactions}
        transaction={editTx}
      />

      <ConfirmDialog
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        loading={deleteLoading}
        message="Are you sure?"
      />
    </div>
  );
}