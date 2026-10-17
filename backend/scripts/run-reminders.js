/**
 * ==============================================================================
 * WARRANTY WALLET — STANDALONE REMINDER RUNNER SCRIPT
 * ==============================================================================
 *
 * Purpose:
 *   Executes the warranty expiry reminder process from the command line or
 *   a scheduled hosted cron job (e.g. Render Cron Job, GitHub Actions, AWS EventBridge).
 *
 * Safety Guarantees:
 *   - Idempotent: uses Notification unique compound index.
 *   - Will NOT send duplicate emails or notifications on repeated runs.
 *   - Safe error handling without logging credentials.
 *
 * Usage:
 *   node backend/scripts/run-reminders.js
 * ==============================================================================
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { processWarrantyReminders } from '../services/reminderService.js';

dotenv.config();

const runReminders = async () => {
  console.log('\n======================================================');
  console.log('  🔔 WARRANTY WALLET: SCHEDULED EXPIRY REMINDERS RUNNER');
  console.log('======================================================');
  console.log(` Timestamp: ${new Date().toISOString()}`);
  console.log('------------------------------------------------------\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully.\n');

    console.log('Scanning upcoming expirations and processing reminders...');
    const report = await processWarrantyReminders({
      simulateEmail: process.env.NODE_ENV === 'test'
    });

    console.log('\n--- Reminders Processing Report ---');
    console.log(`Eligible Warranties Checked: ${report.processedCount}`);
    console.log(`New Notifications Created:   ${report.notificationsCreated}`);
    console.log(`Reminder Emails Dispatched:  ${report.emailsSent}`);
    console.log(`Skipped Duplicates:         ${report.skippedDuplicate}`);

    if (report.errors.length > 0) {
      console.warn(`\n⚠️ Encountered ${report.errors.length} non-fatal item error(s):`);
      report.errors.forEach((e) => console.warn(`   - [Warranty ${e.warrantyId}]: ${e.error}`));
    }

    console.log('\n✅ Reminders job finished successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error in reminders runner:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

runReminders();
