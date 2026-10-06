/**
 * Utility functions for formatting values in the UI
 */

/**
 * Format date string into readable format e.g. "Oct 12, 2025"
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Format currency e.g. "$1,299.00" or "—"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
};

/**
 * Get status badge properties (label, bg color, text color, dot color)
 */
export const getStatusBadgeConfig = (status) => {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active',
        bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        dotClass: 'bg-emerald-500',
      };
    case 'EXPIRING_SOON':
      return {
        label: 'Expiring Soon',
        bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
        dotClass: 'bg-amber-500 animate-pulse',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        bgClass: 'bg-rose-50 border-rose-200 text-rose-700',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: 'Unknown',
        bgClass: 'bg-slate-50 border-slate-200 text-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
};
