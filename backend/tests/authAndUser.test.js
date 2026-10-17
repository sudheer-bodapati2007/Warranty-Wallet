import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/authMiddleware.js';

describe('Auth & User Model Security', () => {
  test('Bcrypt generates unique salts and safely hashes passwords', async () => {
    const rawPassword = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash(rawPassword, salt);
    const hash2 = await bcrypt.hash(rawPassword, await bcrypt.genSalt(10));

    // Two hashes of the same password must differ due to unique salts
    assert.notStrictEqual(hash1, hash2);

    // Both hashes should successfully match the raw password
    assert.strictEqual(await bcrypt.compare(rawPassword, hash1), true);
    assert.strictEqual(await bcrypt.compare(rawPassword, hash2), true);

    // Invalid password must fail comparison
    assert.strictEqual(await bcrypt.compare('WrongPassword999', hash1), false);
  });

  test('Password reset token generation produces valid unhashed hex and matching sha256 hash', () => {
    // Simulate user getResetPasswordToken logic
    const resetToken = crypto.randomBytes(32).toString('hex');
    assert.strictEqual(resetToken.length, 64);

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    assert.strictEqual(hashedToken.length, 64);

    // Verify hashing the same raw token produces exact match
    const testHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    assert.strictEqual(testHash, hashedToken);

    // An invalid raw token produces a different hash
    const fakeToken = crypto.randomBytes(32).toString('hex');
    const fakeHash = crypto.createHash('sha256').update(fakeToken).digest('hex');
    assert.notStrictEqual(fakeHash, hashedToken);
  });

  test('JWT token generation and verification', () => {
    const dummyUserId = '507f1f77bcf86cd799439011';
    const token = generateToken(dummyUserId);

    assert.ok(typeof token === 'string' && token.length > 20);

    // Verify token decodes correctly
    const secret = process.env.JWT_SECRET || 'dev_fallback_secret_warranty_wallet_key_2026';
    const decoded = jwt.verify(token, secret);

    assert.strictEqual(decoded.id, dummyUserId);
    assert.ok(decoded.exp > decoded.iat);
  });

  test('JWT verification fails on tampered token', () => {
    const dummyUserId = '507f1f77bcf86cd799439011';
    const token = generateToken(dummyUserId);
    const tamperedToken = token.slice(0, -5) + 'abcde';

    const secret = process.env.JWT_SECRET || 'dev_fallback_secret_warranty_wallet_key_2026';
    assert.throws(() => {
      jwt.verify(tamperedToken, secret);
    });
  });
});
