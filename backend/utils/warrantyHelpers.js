/**
 * Helper utilities for calculating warranty expiry, status, and remaining days.
 */

/**
 * Calculates warranty expiry date based on purchase date, duration, and unit.
 * @param {Date|string} purchaseDate
 * @param {number} duration
 * @param {string} unit - 'Months' or 'Years'
 * @returns {Date}
 */
export const calculateExpiryDate = (purchaseDate, duration, unit) => {
  const date = new Date(purchaseDate);
  const numDuration = Number(duration) || 0;

  if (unit === 'Days') {
    // Preserve UTC to avoid timezone off-by-one errors.
    date.setUTCDate(date.getUTCDate() + numDuration);
    return date;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();

  let totalMonths = year * 12 + month;
  if (unit === 'Years') {
    totalMonths += numDuration * 12;
  } else {
    // Default to Months (calendar-aware, clamps month-end dates safely).
    totalMonths += numDuration;
  }

  const newYear = Math.floor(totalMonths / 12);
  const newMonth = ((totalMonths % 12) + 12) % 12;

  // Clamp the day to the last valid day of the target month (handles
  // month-end dates and February in leap/non-leap years).
  const lastDayOfTargetMonth = new Date(
    Date.UTC(newYear, newMonth + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(
    Date.UTC(newYear, newMonth, clampedDay, hours, minutes, seconds, milliseconds)
  );
};

/**
 * Calculates days remaining until warranty expiry date.
 * Uses normalized midnight dates to ensure precise day count calculation.
 * @param {Date|string} expiryDate
 * @returns {number} Integer representing remaining days (negative if expired)
 */
export const calculateDaysRemaining = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Determines status based on remaining days.
 * Rules:
 * - ACTIVE: > 30 days remaining
 * - EXPIRING_SOON: 0 to 30 days remaining
 * - EXPIRED: < 0 days remaining
 * @param {number} daysRemaining
 * @returns {'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'}
 */
export const getWarrantyStatus = (daysRemaining) => {
  if (daysRemaining < 0) {
    return 'EXPIRED';
  } else if (daysRemaining <= 30) {
    return 'EXPIRING_SOON';
  } else {
    return 'ACTIVE';
  }
};

/**
 * Formats days remaining into human-readable text.
 * Examples:
 * - "245 days left"
 * - "12 days left"
 * - "Expires today"
 * - "Expired 18 days ago"
 * @param {number} daysRemaining
 * @returns {string}
 */
export const formatDaysRemainingText = (daysRemaining) => {
  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining);
    return absDays === 1 ? 'Expired 1 day ago' : `Expired ${absDays} days ago`;
  } else if (daysRemaining === 0) {
    return 'Expires today';
  } else if (daysRemaining === 1) {
    return '1 day left';
  } else {
    return `${daysRemaining} days left`;
  }
};

/**
 * Decorates a raw warranty database object with computed runtime fields:
 * daysRemaining, status, formattedDaysLeft
 * @param {Object} warrantyDoc
 * @returns {Object}
 */
export const decorateWarranty = (warrantyDoc) => {
  const warrantyObj = warrantyDoc.toObject ? warrantyDoc.toObject() : { ...warrantyDoc };
  const daysRemaining = calculateDaysRemaining(warrantyObj.warrantyExpiryDate);
  const status = getWarrantyStatus(daysRemaining);
  const formattedDaysLeft = formatDaysRemainingText(daysRemaining);

  return {
    ...warrantyObj,
    daysRemaining,
    status,
    formattedDaysLeft
  };
};
