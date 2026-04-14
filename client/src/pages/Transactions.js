import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import TransactionModal from '../components/ui/TransactionModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

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

  const PAYMENT_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', netbanking: 'Net Banking', other: 'Other' };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Transactions</div>
          <div className="page-subtitle">{total} total records</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTx(null); setShowModal(true); }}>
          + Add Transaction
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <SearchIcon />
          <input className="form-input" placeholder="Search transactions..."
            value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
        </div>

        <select className="form-select" style={{ width: 130 }} value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select className="form-select" style={{ width: 160 }} value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>

        <input type="date" className="form-input" style={{ width: 150 }}
          value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
        <input type="date" className="form-input" style={{ width: 150 }}
          value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />

        {(filters.search || filters.type || filters.category || filters.startDate || filters.endDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setFilters({ search: '', type: '', category: '', startDate: '', endDate: '' });
            setPage(1);
          }}>Clear</button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <div className="empty-state-title">No transactions found</div>
            <div className="empty-state-text">Try adjusting your filters or add a new transaction</div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment</th>
                    <th>Tags</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                        {formatDate(tx.date, 'dd MMM yyyy')}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`} style={{ fontSize: 11 }}>
                            {tx.type === 'income' ? '↑' : '↓'}
                          </span>
                          <span style={{ fontSize: 13.5, fontWeight: 450 }}>{tx.category}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tx.description || '—'}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{PAYMENT_LABELS[tx.paymentMethod] || '—'}</td>
                      <td>
                        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                          {(tx.tags || []).slice(0, 2).map((tag) => (
                            <span key={tag} className="badge badge-neutral" style={{ fontSize: 11 }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`font-mono ${tx.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-icon" onClick={() => { setEditTx(tx); setShowModal(true); }}><EditIcon /></button>
                          <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => setDeleteTx(tx)}><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}</span>
              <div className="pagination-btns">
                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      <TransactionModal isOpen={showModal} onClose={() => { setShowModal(false); setEditTx(null); }}
        onSaved={fetchTransactions} transaction={editTx} />

      <ConfirmDialog isOpen={!!deleteTx} onClose={() => setDeleteTx(null)} onConfirm={handleDelete}
        title="Delete Transaction" loading={deleteLoading}
        message={`Delete this ${deleteTx?.type} of ${formatCurrency(deleteTx?.amount || 0, currency)} from ${deleteTx?.category}? This cannot be undone.`} />
    </div>
  );
}
