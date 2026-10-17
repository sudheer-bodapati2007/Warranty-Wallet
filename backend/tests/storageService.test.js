import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUniqueKey,
  isCloudStorageConfigured,
  storeFile
} from '../services/storageService.js';

describe('Persistent Storage Service', () => {
  test('generateUniqueKey generates clean paths scoped by folder and user ID', () => {
    const userId = 'user_abc123';
    const key = generateUniqueKey('invoices', 'receipt_march.pdf', userId);

    assert.ok(key.startsWith('invoices/user_abc123/'));
    assert.ok(key.endsWith('.pdf'));
    // Ensure random bytes included for collision prevention
    assert.ok(key.length > 30);
  });

  test('generateUniqueKey falls back safely when user ID is null or empty', () => {
    const key = generateUniqueKey('images', 'laptop.png', null);
    assert.ok(key.startsWith('images/general/'));
    assert.ok(key.endsWith('.png'));
  });

  test('storeFile rejects dangerous or disallowed file extensions', async () => {
    const maliciousFile = {
      originalname: 'exploit.exe',
      buffer: Buffer.from('fake data'),
      mimetype: 'application/octet-stream'
    };

    await assert.rejects(
      async () => {
        await storeFile(maliciousFile, 'invoices', '123');
      },
      {
        message: /File type .exe is not supported/
      }
    );
  });

  test('storeFile safely accepts supported files (jpg, png, pdf, webp)', async () => {
    const validFile = {
      originalname: 'invoice.pdf',
      buffer: Buffer.from('%PDF-1.4 test data'),
      mimetype: 'application/pdf',
      fieldname: 'invoiceFile'
    };

    const stored = await storeFile(validFile, 'invoices', 'user_test_99');
    assert.ok(stored);
    assert.ok(typeof stored.url === 'string');
    assert.ok(typeof stored.key === 'string');
  });
});
