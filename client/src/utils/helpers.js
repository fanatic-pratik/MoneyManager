import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const formatCurrency = (amount, currency = '₹') =>
  `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (date, fmt = 'dd MMM yyyy') =>
  format(new Date(date), fmt);

export const formatShortDate = (date) => format(new Date(date), 'dd MMM');

export const getMonthRange = (month, year) => ({
  startDate: startOfMonth(new Date(year, month - 1)),
  endDate: endOfMonth(new Date(year, month - 1)),
});

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const getInitials = (name) =>
  name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'other', label: 'Other' },
];

export const CHART_COLORS = [
  '#18181b','#6b7280','#a1a1aa','#3b82f6','#10b981',
  '#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4',
  '#84cc16','#f97316','#14b8a6','#a855f7',
];

export const percentChange = (current, previous) => {
  if (!previous) return 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};
