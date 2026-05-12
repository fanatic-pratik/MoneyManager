import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatShortDate, MONTHS, CHART_COLORS } from '../utils/helpers';
import TransactionModal from '../components/ui/TransactionModal';
import SelectAccount from './SelectAccount';
import { useAccount } from '../context/AccountContext';
import toast from 'react-hot-toast';

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ label, value, change, type, currency }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${type}`}>{formatCurrency(value, currency)}</div>
    {change !== undefined && (
      <span className={`stat-change ${change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'}`}>
        {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change).toFixed(1)}% vs last month
      </span>
    )}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const accountId = currentAccount?._id;
  useEffect(() => {
    if (!accountId) return;
    fetchAll();
  }, [accountId]);

  useEffect(() => {
  if (!accountId) {
    navigate('/select-account');
  }
}, [accountId, navigate]);

  const currency = user?.currency || '₹';
  const currentYear = new Date().getFullYear();

  const isShared = currentAccount?.type === 'shared';

  const isOwner = currentAccount?.created_by?.toString() === user?._id;

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  

  // const fetchAll = async () => {
  //   setLoading(true);
  //   try {
  //     const [s, t, b, bu] = await Promise.all([
  //       api.get(`/dashboard/summary?account_id=${accountId}`),
  //       api.get(`/dashboard/monthly-trend?year=${currentYear}&account_id=${accountId}`),
  //       api.get(`/dashboard/category-breakdown?account_id=${accountId}`),
  //       api.get(`/dashboard/budget-overview?account_id=${accountId}`)
  //     ]);
  //     setSummary(s.data);
  //     setTrend(t.data.map((d) => ({ ...d, name: MONTH_ABBR[d.month - 1] })));
  //     setBreakdown(b.data.slice(0, 6));
  //     setBudgets(bu.data.slice(0, 4));
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchAll = async () => {
    if (!accountId) return;

    setLoading(true);

    try {

      const requests = [
        api.get(`/dashboard/summary?account_id=${accountId}`),

        api.get(
          `/dashboard/monthly-trend?year=${currentYear}&account_id=${accountId}`
        ),

        api.get(
          `/dashboard/category-breakdown?account_id=${accountId}`
        )
      ];

      // ✅ Only fetch budgets for personal accounts
      if (!isShared) {
        requests.push(
          api.get(`/dashboard/budget-overview?account_id=${accountId}`)
        );
      }

      const responses = await Promise.all(requests);

      const summaryRes = responses[0];
      const trendRes = responses[1];
      const breakdownRes = responses[2];
      const budgetRes = responses[3];

      setSummary(summaryRes.data);

      setTrend(
        trendRes.data.map((d) => ({
          ...d,
          name: MONTH_ABBR[d.month - 1]
        }))
      );

      setBreakdown(breakdownRes.data.slice(0, 6));

      // ✅ Personal only
      if (!isShared && budgetRes) {
        setBudgets(budgetRes.data.slice(0, 4));
      } else {
        setBudgets([]);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accountId) return;
    fetchAll();
  }, [accountId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card card-sm" style={{ minWidth: 140 }}>
        <div className="text-sm font-medium mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.name} className="text-sm" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value, currency)}
          </div>
        ))}
      </div>
    );
  };

  

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            {MONTHS[new Date().getMonth()]} {currentYear} — Here's your financial overview
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      {isShared && isOwner && (
      <div
        className="card"
        style={{
          marginBottom: 20,
          border: '1px dashed var(--primary)',
          background: 'rgba(99,102,241,0.04)'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >

          <div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 6
              }}
            >
              Invite Members
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 2
              }}
            >
              {currentAccount?.invite_code}
            </div>
          </div>

          <button
            className="btn btn-outline"
            onClick={() => {
              navigator.clipboard.writeText(
                currentAccount?.invite_code
              );

              toast.success('Invite code copied');
            }}
          >
            Copy Code
          </button>

        </div>

      </div>
    )}

      {/* Stats */}
      <div className="stats-grid">
        
        <StatCard
          label={isShared ? "Contributions" : "Income"}
          value={summary?.income || 0}
          change={summary?.incomeChange}
          type="income"
          currency={currency}
        />

        <StatCard
          label={isShared ? "Withdrawals" : "Expenses"}
          value={summary?.expense || 0}
          change={summary?.expenseChange}
          type="expense"
          currency={currency}
        />
        {/* <StatCard label="Income" value={summary?.income || 0} change={summary?.incomeChange} type="income" currency={currency} />
        <StatCard label="Expenses" value={summary?.expense || 0} change={summary?.expenseChange} type="expense" currency={currency} /> */}
        <StatCard label="Balance" value={summary?.balance || 0} type="balance" currency={currency} />
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value balance">{(summary?.savings || 0).toFixed(1)}%</div>
          <span className="stat-change neutral">of income saved</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Monthly trend */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: 14 }}>Monthly Trend {currentYear}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} fill="url(#incomeGrad)" />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={2} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: '#16a34a' }} />Income</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: '#dc2626' }} />Expense</div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: 14 }}>This Month's Expenses</span>
          </div>
          {breakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No data yet</div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                    dataKey="total" nameKey="category" paddingAngle={2}>
                    {breakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {breakdown.map((item, i) => (
                  <div key={item.category} className="flex items-center justify-between" style={{ fontSize: 12.5 }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span className="text-muted">{item.category}</span>
                    </div>
                    <span className="font-mono">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Recent transactions */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: 14 }}>Recent Transactions</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/transactions')}>View all</button>
          </div>
          {!summary?.recentTransactions?.length ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">No transactions yet</div>
              <div className="empty-state-text">Add your first transaction above</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {summary.recentTransactions.map((tx) => {
                const isPositive = ['income', 'contribution', 'repayment'].includes(tx.type);
                return(<div key={tx._id} className="flex items-center justify-between"
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="cat-icon" style={{ width: 32, height: 32, fontSize: 15 }}>
                      {isPositive ? '↑' : '↓'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{tx.category}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {tx.description || formatShortDate(tx.date)}
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono ${isPositive  ? 'amount-income' : 'amount-expense'}`}
                    style={{ fontSize: 13.5, fontWeight: 500, color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                    {isPositive  ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              );
})}
            </div>
          )}
        </div>

        
        {/* Budget overview */}
        {!isShared && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold" style={{ fontSize: 14 }}>Budget Overview</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/budgets')}>Manage</button>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">No budgets set</div>
              <div className="empty-state-text">Set monthly limits to stay on track</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {budgets.map((b) => (
                <div key={b.category}>
                  <div className="flex justify-between items-center" style={{ fontSize: 13 }}>
                    <span className="font-medium">{b.category}</span>
                    <span className="font-mono text-muted" style={{ fontSize: 12 }}>
                      {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                    </span>
                  </div>
                  <div className="budget-bar-track">
                    <div
                      className={`budget-bar-fill ${b.percentage >= 100 ? 'danger' : b.percentage >= 80 ? 'warning' : 'safe'}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 11.5, color: b.isOverBudget ? 'var(--red)' : 'var(--text-muted)' }}>
                    {b.isOverBudget ? `Over by ${formatCurrency(b.spent - b.limit, currency)}` : `${b.percentage}% used`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      <TransactionModal isOpen={showModal} onClose={() => setShowModal(false)} onSaved={fetchAll} />
    </div>
  );
}
