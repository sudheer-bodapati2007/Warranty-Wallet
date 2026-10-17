import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpiryDate,
  calculateDaysRemaining,
  getWarrantyStatus,
  formatDaysRemainingText,
  decorateWarranty
} from '../utils/warrantyHelpers.js';

describe('Warranty Helpers - Date & Expiry Calculations', () => {
  test('calculateExpiryDate correctly calculates duration in Months', () => {
    const purchaseDate = new Date('2025-01-15T00:00:00.000Z');
    const expiry = calculateExpiryDate(purchaseDate, 6, 'Months');
    assert.strictEqual(expiry.getMonth(), 6); // January (0) + 6 = July (6)
    assert.strictEqual(expiry.getFullYear(), 2025);
  });

  test('calculateExpiryDate correctly calculates duration in Years', () => {
    const purchaseDate = new Date('2024-05-10T00:00:00.000Z');
    const expiry = calculateExpiryDate(purchaseDate, 2, 'Years');
    assert.strictEqual(expiry.getFullYear(), 2026);
    assert.strictEqual(expiry.getMonth(), 4); // May
  });

  test('getWarrantyStatus returns ACTIVE when remaining days > 30', () => {
    assert.strictEqual(getWarrantyStatus(31), 'ACTIVE');
    assert.strictEqual(getWarrantyStatus(100), 'ACTIVE');
    assert.strictEqual(getWarrantyStatus(365), 'ACTIVE');
  });

  test('getWarrantyStatus returns EXPIRING_SOON when remaining days between 0 and 30', () => {
    assert.strictEqual(getWarrantyStatus(30), 'EXPIRING_SOON');
    assert.strictEqual(getWarrantyStatus(15), 'EXPIRING_SOON');
    assert.strictEqual(getWarrantyStatus(1), 'EXPIRING_SOON');
    assert.strictEqual(getWarrantyStatus(0), 'EXPIRING_SOON');
  });

  test('getWarrantyStatus returns EXPIRED when remaining days < 0', () => {
    assert.strictEqual(getWarrantyStatus(-1), 'EXPIRED');
    assert.strictEqual(getWarrantyStatus(-45), 'EXPIRED');
  });

  test('formatDaysRemainingText formats counts accurately', () => {
    assert.strictEqual(formatDaysRemainingText(0), 'Expires today');
    assert.strictEqual(formatDaysRemainingText(1), '1 day left');
    assert.strictEqual(formatDaysRemainingText(14), '14 days left');
    assert.strictEqual(formatDaysRemainingText(-1), 'Expired 1 day ago');
    assert.strictEqual(formatDaysRemainingText(-10), 'Expired 10 days ago');
  });

  test('decorateWarranty augments object with computed status and formatted text', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 45);

    const raw = {
      productName: 'Smart TV',
      warrantyExpiryDate: futureDate
    };

    const decorated = decorateWarranty(raw);
    assert.strictEqual(decorated.status, 'ACTIVE');
    assert.ok(decorated.daysRemaining >= 44 && decorated.daysRemaining <= 46);
    assert.ok(decorated.formattedDaysLeft.includes('days left'));
  });
});
