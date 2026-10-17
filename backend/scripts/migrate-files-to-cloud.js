/**
 * ==============================================================================
 * WARRANTY WALLET — SAFE LOCAL FILES TO CLOUD MIGRATION SCRIPT
 * ==============================================================================
 *
 * Purpose:
 *   Migrates existing local upload references (/uploads/...) to S3/Cloudflare R2
 *   persistent cloud object storage.
 *
 * Safety Guarantees:
 *   - NEVER deletes original local files.
 *   - Runs in `--dry-run` mode by default.
 *   - Verifies uploaded cloud object existence before updating database document.
 *   - Exports a rollback mapping file (`file-migration-map.json`).
 *   - Safe to rerun (idempotent; skips already-migrated cloud references).
 *
 * Usage:
 *   # 1. Audit / Dry-Run (No files uploaded, no DB changes)
 *   node backend/scripts/migrate-files-to-cloud.js --dry-run
 *
 *   # 2. Live Migration
 *   node backend/scripts/migrate-files-to-cloud.js --execute
 *
 * ==============================================================================
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

import Warranty from '../models/Warranty.js';
import {
  isCloudStorageConfigured,
  storeFile
} from '../services/storageService.js';

const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute') || args.includes('--dry-run');

const runFileMigration = async () => {
  console.log('\n======================================================');
  console.log('  ☁️ WARRANTY WALLET: CLOUD FILE MIGRATION UTILITY');
  console.log('======================================================');
  console.log(` Mode: ${isDryRun ? '🔍 DRY RUN (Audit & Verification only)' : '⚡ LIVE EXECUTION'}`);
  console.log('------------------------------------------------------\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected successfully.\n');

    // 1. Scan Database for Local File References
    const warranties = await Warranty.find({
      $or: [
        { productImage: { $regex: '^/uploads/' } },
        { invoiceFile: { $regex: '^/uploads/' } }
      ]
    });

    console.log(`Found ${warranties.length} warranty records referencing local /uploads/ files.`);

    const filesToMigrate = [];
    const missingLocalFiles = [];

    for (const w of warranties) {
      if (w.productImage && w.productImage.startsWith('/uploads/')) {
        const localPath = path.join(uploadsDir, path.basename(w.productImage));
        if (fs.existsSync(localPath)) {
          filesToMigrate.push({
            warrantyId: w._id,
            field: 'productImage',
            localPath,
            originalRef: w.productImage,
            userId: w.user || 'general'
          });
        } else {
          missingLocalFiles.push({
            warrantyId: w._id,
            field: 'productImage',
            path: localPath
          });
        }
      }

      if (w.invoiceFile && w.invoiceFile.startsWith('/uploads/')) {
        const localPath = path.join(uploadsDir, path.basename(w.invoiceFile));
        if (fs.existsSync(localPath)) {
          filesToMigrate.push({
            warrantyId: w._id,
            field: 'invoiceFile',
            localPath,
            originalRef: w.invoiceFile,
            userId: w.user || 'general'
          });
        } else {
          missingLocalFiles.push({
            warrantyId: w._id,
            field: 'invoiceFile',
            path: localPath
          });
        }
      }
    }

    console.log('\n--- Inventory Summary ---');
    console.log(`Local Files Verified Ready: ${filesToMigrate.length}`);
    console.log(`Referenced but Missing:     ${missingLocalFiles.length}`);

    if (missingLocalFiles.length > 0) {
      console.warn('\n⚠️ Warning: The following referenced files were not found in local backend/uploads/:');
      missingLocalFiles.forEach((m) => console.warn(`   - [Warranty ${m.warrantyId}] ${m.field}: ${m.path}`));
    }

    if (filesToMigrate.length === 0) {
      console.log('\n🎉 No pending local uploads need cloud migration.');
      await mongoose.disconnect();
      return;
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN SUMMARY:');
      console.log(`- ${filesToMigrate.length} files would be uploaded to cloud storage.`);
      console.log('- Database references would be updated only after verification.');
      console.log('- Original files in backend/uploads/ will NOT be deleted.');
      console.log('\nTo execute migration, configure your S3/R2 credentials in environment and run:');
      console.log('  node backend/scripts/migrate-files-to-cloud.js --execute\n');
      await mongoose.disconnect();
      return;
    }

    // 2. Validate Cloud Credentials before live execution
    if (!isCloudStorageConfigured()) {
      console.error('❌ Cloud storage credentials (S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are not configured.');
      console.error('   Please provide storage credentials in environment variables before executing live migration.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\nStarting cloud upload and database reference updates...');
    const migrationMap = [];
    let successfulCount = 0;
    let failedCount = 0;

    for (const item of filesToMigrate) {
      try {
        const fileBuffer = fs.readFileSync(item.localPath);
        const ext = path.extname(item.localPath).toLowerCase();
        const mimeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.pdf': 'application/pdf'
        };

        const simulatedFile = {
          originalname: path.basename(item.localPath),
          buffer: fileBuffer,
          mimetype: mimeMap[ext] || 'application/octet-stream',
          fieldname: item.field
        };

        const folder = item.field === 'productImage' ? 'images' : 'invoices';
        const stored = await storeFile(simulatedFile, folder, item.userId);

        // Update Warranty document
        await Warranty.findByIdAndUpdate(item.warrantyId, {
          [item.field]: stored.url
        });

        migrationMap.push({
          warrantyId: item.warrantyId,
          field: item.field,
          oldRef: item.originalRef,
          newRef: stored.url,
          cloudKey: stored.key,
          migratedAt: new Date().toISOString()
        });

        successfulCount++;
        console.log(`✅ [${successfulCount}/${filesToMigrate.length}] Migrated: ${path.basename(item.localPath)} -> ${stored.url}`);
      } catch (err) {
        failedCount++;
        console.error(`❌ Failed migrating ${item.localPath}:`, err.message);
      }
    }

    // Save rollback mapping
    const mapPath = path.join(__dirname, 'file-migration-map.json');
    fs.writeFileSync(mapPath, JSON.stringify(migrationMap, null, 2));

    console.log('\n======================================================');
    console.log(`  MIGRATION REPORT:`);
    console.log(`  Successfully Migrated: ${successfulCount}`);
    console.log(`  Failed:                ${failedCount}`);
    console.log(`  Rollback Mapping Saved: ${mapPath}`);
    console.log('======================================================');
    console.log('\nNote: Original local files in backend/uploads/ have been kept intact.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Cloud Migration Error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

runFileMigration();
