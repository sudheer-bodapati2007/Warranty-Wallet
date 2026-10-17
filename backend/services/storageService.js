import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadsDir = path.join(__dirname, '../uploads');

// Ensure local uploads directory exists for fallback
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

/**
 * Check if cloud S3/R2 storage is fully configured via environment variables
 */
export const isCloudStorageConfigured = () => {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  return Boolean(bucket && accessKey && secretKey);
};

/**
 * Create S3 client instance
 */
let s3ClientInstance = null;
const getS3Client = () => {
  if (s3ClientInstance) return s3ClientInstance;

  const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || process.env.R2_REGION || 'auto';

  s3ClientInstance = new S3Client({
    region,
    ...(endpoint ? { endpoint } : {}),
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  return s3ClientInstance;
};

const getBucketName = () => process.env.S3_BUCKET || process.env.R2_BUCKET || '';

/**
 * Determine whether Cloudinary is configured from server-side environment variables.
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Encapsulated Cloudinary operations so tests can substitute mock implementations.
 */
export const cloudinaryClient = {
  configured: isCloudinaryConfigured,
  configure() {
    if (!isCloudinaryConfigured()) return false;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    return true;
  },
  async upload(file, options = {}) {
    this.configure();
    const uploadOptions = {
      resource_type: 'image',
      unique_filename: true,
      overwrite: false,
      invalidate: true,
      ...options
    };

    let source = file.path;
    if (!source && file.buffer) {
      const dataUri = `data:${file.mimetype || 'application/octet-stream'};base64,${file.buffer.toString('base64')}`;
      source = dataUri;
    }

    if (!source) {
      throw new Error('File source is required for Cloudinary upload');
    }

    return await cloudinary.uploader.upload(source, uploadOptions);
  },
  async destroy(publicId) {
    this.configure();
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });
  }
};

export const getCloudinaryPublicId = (fileRef) => {
  if (!fileRef) return null;

  if (fileRef.startsWith('cloudinary://')) {
    return fileRef.slice('cloudinary://'.length) || null;
  }

  if (!/^https?:\/\//i.test(fileRef)) {
    return null;
  }

  try {
    const url = new URL(fileRef);
    if (!url.hostname.includes('res.cloudinary.com')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const afterUpload = parts.slice(uploadIndex + 1);
    const withoutVersion =
      afterUpload.length && /^v\d+$/.test(afterUpload[0])
        ? afterUpload.slice(1)
        : afterUpload;
    const withExtension = withoutVersion.join('/');
    return withExtension.replace(/\.[^/.]+$/, '') || null;
  } catch {
    return null;
  }
};

export const isImageFolder = (folder) => {
  const value = String(folder || '').toLowerCase();
  return value !== 'invoices' && value !== 'invoice' && value !== 'documents';
};

/**
 * Generate a safe, sanitized, unique storage key
 */
export const generateUniqueKey = (folder, originalname, userId) => {
  const ext = path.extname(originalname).toLowerCase();
  const safeRandom = crypto.randomBytes(8).toString('hex');
  const userPrefix = userId ? String(userId) : 'general';
  return `${folder}/${userPrefix}/${Date.now()}-${safeRandom}${ext}`;
};

/**
 * Upload a file to cloud storage or local disk fallback
 * @param {Object} file - Multer file object
 * @param {string} folder - Destination folder ('images' or 'invoices')
 * @param {string} userId - User ID
 * @returns {Promise<{ key: string, url: string, isCloud: boolean }>}
 */
export const storeFile = async (file, folder = 'uploads', userId = '') => {
  if (!file) return null;

  // Cloudinary is used only for images. Invoices/private docs remain on the
  // existing storage path (S3/R2/local fallback).
  if (isImageFolder(folder) && isCloudinaryConfigured()) {
    const fileExt = path.extname(file.originalname || '').toLowerCase();
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedImageExts.includes(fileExt)) {
      throw new Error(`File type ${fileExt} is not supported. Allowed: JPG, PNG, WEBP`);
    }

    const safeBase = String(path.basename(file.originalname || 'image', fileExt))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const publicId = `${crypto.randomBytes(8).toString('hex')}${safeBase ? '-' + safeBase : ''}`;
    const uploadFolder = [process.env.CLOUDINARY_UPLOAD_FOLDER || 'warranty-wallet', folder, String(userId || 'general')]
      .filter(Boolean)
      .join('/');

    try {
      const uploaded = await cloudinaryClient.upload(file, {
        public_id: publicId,
        folder: uploadFolder
      });

      return {
        key: uploaded.public_id,
        url: uploaded.secure_url,
        isCloud: true,
        provider: 'cloudinary'
      };
    } finally {
      // Multer may store a temporary file; remove it whether upload succeeds or fails.
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Failed to remove temp upload file:', e);
        }
      }
    }
  }

  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  if (!allowedExts.includes(fileExt)) {
    throw new Error(`File type ${fileExt} is not supported. Allowed: JPG, PNG, WEBP, PDF`);
  }

  // If Cloud Storage is configured, upload to S3 / Cloudflare R2
  if (isCloudStorageConfigured()) {
    const s3 = getS3Client();
    const bucket = getBucketName();
    const objectKey = generateUniqueKey(folder, file.originalname, userId);

    // Read buffer whether multer used disk or memory
    const fileBuffer = file.buffer || fs.readFileSync(file.path);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
        uploadedBy: String(userId || 'system')
      }
    });

    try {
      await s3.send(command);
    } finally {
      // If multer created a temporary file on disk, clean it up even on failure.
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          console.error('Failed to remove temp upload file:', e);
        }
      }
    }

    // Public URL or cloud reference
    const publicDomain = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;
    const url = publicDomain ? `${publicDomain.replace(/\/$/, '')}/${objectKey}` : `cloud://${objectKey}`;

    return {
      key: objectKey,
      url,
      isCloud: true
    };
  }

  // Fallback: Store on local disk (if Multer already stored to disk, use that path)
  if (file.path) {
    const relativePath = `/uploads/${path.basename(file.path)}`;
    return {
      key: path.basename(file.path),
      url: relativePath,
      isCloud: false
    };
  }

  // If buffer only in local fallback
  const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
  const destPath = path.join(localUploadsDir, uniqueName);
  fs.writeFileSync(destPath, file.buffer);

  return {
    key: uniqueName,
    url: `/uploads/${uniqueName}`,
    isCloud: false
  };
};

/**
 * Delete a file safely from cloud storage or local disk
 */
export const deleteStoredFile = async (fileRef) => {
  if (!fileRef) return;

  const cloudinaryPublicId = getCloudinaryPublicId(fileRef);
  if (cloudinaryPublicId && isCloudinaryConfigured()) {
    try {
      await cloudinaryClient.destroy(cloudinaryPublicId);
    } catch (error) {
      console.error(`Error deleting Cloudinary file ${fileRef}:`, error.message);
    }
    return;
  }

  try {
    // If it's a cloud file reference
    if (fileRef.startsWith('cloud://') || (!fileRef.startsWith('/uploads/') && !cloudinaryPublicId && isCloudStorageConfigured())) {
      const s3 = getS3Client();
      const bucket = getBucketName();
      const key = fileRef.replace(/^cloud:\/\//, '');

      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );
      return;
    }

    // Local file fallback
    if (fileRef.startsWith('/uploads/')) {
      const filename = path.basename(fileRef);
      const fullPath = path.join(localUploadsDir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
          if (err) console.error(`Error deleting local file ${fullPath}:`, err.message);
        });
      }
    }
  } catch (error) {
    console.error(`Error deleting file ${fileRef}:`, error.message);
  }
};

/**
 * Generate a short-lived presigned URL (15 minutes) for private documents (e.g. invoices)
 */
export const getSignedFileUrl = async (fileRef, expiresInSeconds = 900) => {
  if (!fileRef) return '';

  if (fileRef.startsWith('cloud://') || (!fileRef.startsWith('/uploads/') && isCloudStorageConfigured())) {
    const s3 = getS3Client();
    const bucket = getBucketName();
    const key = fileRef.replace(/^cloud:\/\//, '');

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  }

  // Local fallback: returns standard static url
  return fileRef;
};
