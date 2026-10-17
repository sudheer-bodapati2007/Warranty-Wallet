import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateExpiryDate, calculateDaysRemaining } from '../utils/warrantyHelpers.js';
import {
  isSafePublicHostname,
  isApprovedImageHost
} from '../services/productImageSearchService.js';

describe('Edge cases', () => {
  test('Days calculation adds exact days', () => {
    const expiry = calculateExpiryDate(new Date('2026-10-01T00:00:00.000Z'), 15, 'Days');
    assert.strictEqual(expiry.toISOString(), '2026-10-16T00:00:00.000Z');
  });

  test('Month-end date clamps to last day of target month', () => {
    const expiry = calculateExpiryDate(new Date('2024-01-31T00:00:00.000Z'), 1, 'Months');
    assert.strictEqual(expiry.toISOString(), '2024-02-29T00:00:00.000Z');
  });

  test('Leap-year date is clamped when moving to non-leap year', () => {
    const expiry = calculateExpiryDate(new Date('2024-02-29T00:00:00.000Z'), 1, 'Years');
    assert.strictEqual(expiry.toISOString(), '2025-02-28T00:00:00.000Z');
  });

  test('October 1 plus 15 days equals October 16', () => {
    const expiry = calculateExpiryDate(new Date('2026-10-01T00:00:00.000Z'), 15, 'Days');
    assert.strictEqual(expiry.getUTCDate(), 16);
  });

  test('SSRF hostname protection blocks localhost and private ranges', () => {
    assert.strictEqual(isSafePublicHostname('localhost'), false);
    assert.strictEqual(isSafePublicHostname('127.0.0.1'), false);
    assert.strictEqual(isSafePublicHostname('10.0.0.5'), false);
    assert.strictEqual(isSafePublicHostname('169.254.169.254'), false);
    assert.strictEqual(isSafePublicHostname('192.168.1.10'), false);
  });

  test('Approved image host policy restricts download hosts', () => {
    assert.strictEqual(isApprovedImageHost('upload.wikimedia.org'), true);
    assert.strictEqual(isApprovedImageHost('images.unsplash.com'), true);
    assert.strictEqual(isApprovedImageHost('evil.example.com'), false);
    assert.strictEqual(isApprovedImageHost('127.0.0.1'), false);
  });
});
