import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sendExpiryReminderEmail } from '../services/emailService.js';
import Notification from '../models/Notification.js';

describe('Reminders & Notification System', () => {
  test('sendExpiryReminderEmail simulates email delivery in test environment without sending real emails', async () => {
    process.env.NODE_ENV = 'test';

    const result = await sendExpiryReminderEmail({
      toEmail: 'customer@example.com',
      userName: 'John Doe',
      productName: 'MacBook Pro M3',
      brand: 'Apple',
      expiryDate: 'Dec 15, 2026',
      daysRemaining: 7,
      warrantyId: 'mock_warranty_id_123'
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.simulated, true);
    assert.ok(result.id.startsWith('sim-'));
  });

  test('Notification schema indexes enforce uniqueness on user, warranty, reminderInterval', () => {
    // Inspect compound indexes on Notification model
    const indexes = Notification.schema.indexes();
    const uniqueIndex = indexes.find(
      ([fields, options]) =>
        fields.user === 1 &&
        fields.warranty === 1 &&
        fields.reminderInterval === 1 &&
        options?.unique === true
    );

    assert.ok(uniqueIndex, 'Compound unique index { user: 1, warranty: 1, reminderInterval: 1 } must be registered');
  });

  test('Notification intervals calculation matches user configured schedule', () => {
    const reminderDays = [30, 7, 1];
    const candidateIntervals = [...new Set([...reminderDays, 0])].sort((a, b) => b - a);

    assert.deepStrictEqual(candidateIntervals, [30, 7, 1, 0]);

    // Test interval triggering:
    // When daysRemaining = 5, it triggers for 7, 14, 30 if not already triggered
    const daysRemaining = 5;
    const triggeredIntervals = candidateIntervals.filter((i) => daysRemaining <= i);
    assert.deepStrictEqual(triggeredIntervals, [30, 7]);
  });
});
