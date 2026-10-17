import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Migration Safety & Idempotency Rules', () => {
  test('migrate-legacy-warranties script enforces dry-run by default', () => {
    const scriptPath = path.join(__dirname, '../scripts/migrate-legacy-warranties.js');
    const content = fs.readFileSync(scriptPath, 'utf8');

    // Asserts default dry run
    assert.ok(content.includes("!args.includes('--execute') || args.includes('--dry-run')"));
    // Asserts strict owner email requirement
    assert.ok(content.includes("ownerEmailArg"));
    // Asserts it never calls dropCollection or deleteMany
    assert.ok(!content.includes("dropCollection"));
    assert.ok(!content.includes("Warranty.deleteMany"));
    assert.ok(!content.includes("User.deleteMany"));
  });

  test('migrate-files-to-cloud script enforces dry-run and keeps original local files', () => {
    const scriptPath = path.join(__dirname, '../scripts/migrate-files-to-cloud.js');
    const content = fs.readFileSync(scriptPath, 'utf8');

    // Asserts default dry run
    assert.ok(content.includes("!args.includes('--execute') || args.includes('--dry-run')"));
    // Asserts it creates rollback map
    assert.ok(content.includes("file-migration-map.json"));
    // Asserts it does NOT delete original local files
    assert.ok(!content.includes("fs.unlinkSync(item.localPath)"));
    assert.ok(!content.includes("fs.unlink(item.localPath"));
  });

  test('Warranty Schema requires user field for newly created documents', async () => {
    const warrantyModelPath = path.join(__dirname, '../models/Warranty.js');
    const content = fs.readFileSync(warrantyModelPath, 'utf8');

    assert.ok(content.includes("ref: 'User'"));
    assert.ok(content.includes("required: [true, 'Warranty must belong to a user']"));
  });
});
