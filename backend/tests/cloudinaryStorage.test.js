import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  isCloudinaryConfigured,
  cloudinaryClient,
  getCloudinaryPublicId,
  storeFile,
  deleteStoredFile
} from '../services/storageService.js';

describe('Cloudinary storage', () => {
  before(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    process.env.CLOUDINARY_UPLOAD_FOLDER = 'warranty-wallet';

    cloudinaryClient.configured = () => true;
    cloudinaryClient.configure = () => true;
    cloudinaryClient.upload = async (_file, options) => ({
      public_id: options.public_id,
      secure_url: `https://res.cloudinary.com/test-cloud/image/upload/${options.public_id}.png`
    });
    cloudinaryClient.destroy = async (publicId) => {
      destroyedIds.push(publicId);
      return { result: 'ok' };
    };
  });

  const destroyedIds = [];

  after(() => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_UPLOAD_FOLDER;
  });

  test('Cloudinary is reported as configured when all server variables exist', () => {
    assert.strictEqual(isCloudinaryConfigured(), true);
  });

  test('storeFile uploads image buffers to Cloudinary and returns asset identifier', async () => {
    const file = {
      originalname: 'profile.png',
      buffer: Buffer.from('fake image data'),
      mimetype: 'image/png',
      fieldname: 'avatar'
    };

    const stored = await storeFile(file, 'avatars', 'user_123');

    assert.ok(stored);
    assert.strictEqual(stored.provider, 'cloudinary');
    assert.strictEqual(typeof stored.key, 'string');
    assert.ok(stored.key.length > 0);
    assert.match(stored.url, /res\.cloudinary\.com/);
  });

  test('deleteStoredFile calls Cloudinary destroy using the URL-derived public ID', async () => {
    const publicId = 'abc123-profile';
    const url = `https://res.cloudinary.com/test-cloud/image/upload/v123/${publicId}.png`;

    await deleteStoredFile(url);

    assert.ok(destroyedIds.includes(publicId));
  });

  test('getCloudinaryPublicId parses a versioned secure URL', () => {
    assert.strictEqual(
      getCloudinaryPublicId('https://res.cloudinary.com/test-cloud/image/upload/v123/folder/file.png'),
      'folder/file'
    );
  });

  test('getCloudinaryPublicId parses the cloudinary scheme', () => {
    assert.strictEqual(getCloudinaryPublicId('cloudinary://folder/file'), 'folder/file');
  });
});
