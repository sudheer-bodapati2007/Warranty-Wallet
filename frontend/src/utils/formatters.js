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
 * Includes harmonious light and dark mode classes.
 */
export const getStatusBadgeConfig = (status) => {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active',
        bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
        dotClass: 'bg-emerald-500 dark:bg-emerald-400',
      };
    case 'EXPIRING_SOON':
      return {
        label: 'Expiring Soon',
        bgClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
        dotClass: 'bg-amber-500 dark:bg-amber-400 animate-pulse',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        bgClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
        dotClass: 'bg-rose-500 dark:bg-rose-400',
      };
    default:
      return {
        label: 'Unknown',
        bgClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-dark-800 dark:text-slate-300 dark:border-dark-700',
        dotClass: 'bg-slate-400',
      };
  }
};
