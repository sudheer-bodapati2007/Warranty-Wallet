/**
 * ==============================================================================
 * WARRANTY WALLET — SAFE LEGACY RECORD MIGRATION SCRIPT
 * ==============================================================================
 *
 * Purpose:
 *   Safely, idempotently associates legacy unowned warranties (created before
 *   authentication was implemented) with an explicitly designated, verified
 *   owner account.
 *
 * Safety Guarantees:
 *   - NEVER drops collections or deletes records.
 *   - Runs in `--dry-run` mode by default.
 *   - Verifies owner account exists and is valid before altering anything.
 *   - Safe to rerun multiple times (idempotent).
 *   - Emits a comprehensive audit report and backup instructions.
 *
 * Usage:
 *   # 1. Audit / Dry-Run (No database changes made)
 *   node backend/scripts/migrate-legacy-warranties.js --dry-run
 *
 *   # 2. Execute migration targeting designated owner email
 *   node backend/scripts/migrate-legacy-warranties.js --owner-email=admin@example.com --execute
 *
 * ==============================================================================
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import Warranty from '../models/Warranty.js';
import User from '../models/User.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute') || args.includes('--dry-run');
const ownerEmailArg = args.find((a) => a.startsWith('--owner-email='))?.split('=')[1]?.trim();

const printBanner = () => {
  console.log('\n======================================================');
  console.log('  🛡 WARRANTY WALLET: LEGACY RECORDS MIGRATION TOOL');
  console.log('======================================================');
  console.log(` Mode:        ${isDryRun ? '🔍 DRY RUN (Audit only - No writes)' : '⚡ LIVE EXECUTION'}`);
  console.log(` Target User: ${ownerEmailArg || '(Not specified)'}`);
  console.log('------------------------------------------------------\n');
};

const runMigration = async () => {
  printBanner();

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully.\n');

    // 1. Current State Assessment
    const totalWarranties = await Warranty.countDocuments();
    const unownedQuery = {
      $or: [
        { user: { $exists: false } },
        { user: null }
      ]
    };
    const unownedCount = await Warranty.countDocuments(unownedQuery);
    const ownedCount = totalWarranties - unownedCount;

    console.log('--- Database Record Inventory ---');
    console.log(`Total Warranties in DB:    ${totalWarranties}`);
    console.log(`Already Owned Warranties:  ${ownedCount}`);
    console.log(`Legacy Unowned Warranties: ${unownedCount}\n`);

    if (unownedCount === 0) {
      console.log('🎉 No legacy unowned warranties found. All records are properly associated.');
      await mongoose.disconnect();
      return;
    }

    // Inspect representative sample of unowned records
    const sample = await Warranty.find(unownedQuery).limit(5);
    console.log('--- Sample Unowned Records ---');
    sample.forEach((w, idx) => {
      console.log(`  ${idx + 1}. [ID: ${w._id}] "${w.productName}" (Category: ${w.category}, Expiry: ${w.warrantyExpiryDate?.toISOString()?.split('T')[0]})`);
    });
    console.log('');

    // If dry run, print plan and exit safely
    if (isDryRun) {
      console.log('🔍 DRY RUN SUMMARY:');
      console.log(`- ${unownedCount} legacy records are currently isolated from regular users.`);
      console.log('- To assign these records to a specific verified owner account, run:');
      console.log(`  node backend/scripts/migrate-legacy-warranties.js --owner-email=your-email@example.com --execute\n`);
      console.log('Backup recommendation:');
      console.log('  mongodump --uri="<MONGODB_URI>" --collection=warranties --out=./backup-pre-migration\n');
      await mongoose.disconnect();
      return;
    }

    // 2. Live Execution Validation
    if (!ownerEmailArg) {
      console.error('❌ An explicit owner email is REQUIRED for live migration.');
      console.error('   Please run with: --owner-email=<target_user_email>');
      await mongoose.disconnect();
      process.exit(1);
    }

    const ownerUser = await User.findOne({ email: ownerEmailArg.toLowerCase() });
    if (!ownerUser) {
      console.error(`❌ Designated owner account "${ownerEmailArg}" not found in database.`);
      console.error('   Please register the account first in the application, then run this migration.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`Target owner found: "${ownerUser.name}" <${ownerUser.email}> (ID: ${ownerUser._id})\n`);
    console.log('Applying batch update to assign legacy records...');

    const result = await Warranty.updateMany(unownedQuery, {
      $set: { user: ownerUser._id }
    });

    console.log(`\n✅ Migration Complete!`);
    console.log(`   Matched:  ${result.matchedCount}`);
    console.log(`   Modified: ${result.modifiedCount}`);

    // Verification check
    const remainingUnowned = await Warranty.countDocuments(unownedQuery);
    const updatedOwnerCount = await Warranty.countDocuments({ user: ownerUser._id });

    console.log('\n--- Post-Migration Verification ---');
    console.log(`Remaining Unowned Warranties: ${remainingUnowned} (expected: 0)`);
    console.log(`Total Warranties for Owner:   ${updatedOwnerCount}`);

    await mongoose.disconnect();
    console.log('\nDatabase connection closed. Migration finished successfully.');
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

runMigration();
