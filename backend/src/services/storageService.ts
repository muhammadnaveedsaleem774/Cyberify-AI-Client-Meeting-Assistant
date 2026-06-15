import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { config } from '../config';

type StoredFileMode = 'local' | 's3';

const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

export function isS3Enabled() {
  return Boolean(config.awsRegion && config.s3BucketName);
}

export function getUploadDir() {
  ensureUploadDir();
  return uploadDir;
}

function getS3Client() {
  const credentials = config.awsAccessKeyId && config.awsSecretAccessKey
    ? {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
        sessionToken: config.awsSessionToken || undefined
      }
    : undefined;

  return new S3Client({
    region: config.awsRegion,
    forcePathStyle: config.s3ForcePathStyle,
    credentials
  });
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export function buildS3Key(params: { workspaceId: string; projectId?: string; originalName: string }) {
  const prefix = [params.workspaceId, params.projectId || 'shared'].filter(Boolean).join('/');
  const unique = `${Date.now()}-${crypto.randomUUID?.() || crypto.randomBytes(8).toString('hex')}`;
  return `${prefix}/${unique}-${sanitizeName(params.originalName)}`;
}

export async function moveUploadedFileToStorage(params: {
  localPath: string;
  mimeType: string;
  workspaceId: string;
  projectId?: string;
  originalName: string;
}) {
  if (!isS3Enabled()) {
    return {
      mode: 'local' as StoredFileMode,
      path: params.localPath,
      key: params.localPath,
      bucket: undefined
    };
  }

  const key = buildS3Key({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    originalName: params.originalName
  });

  const client = getS3Client();
  const body = fs.createReadStream(params.localPath);
  await client.send(new PutObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
    Body: body,
    ContentType: params.mimeType
  }));

  try {
    if (fs.existsSync(params.localPath)) fs.unlinkSync(params.localPath);
  } catch {}

  return {
    mode: 's3' as StoredFileMode,
    path: key,
    key,
    bucket: config.s3BucketName
  };
}

export async function deleteStoredFile(file: { storageProvider?: StoredFileMode; path: string }) {
  if (file.storageProvider === 's3' && isS3Enabled()) {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({
      Bucket: config.s3BucketName,
      Key: file.path
    }));
    return;
  }

  if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
}

export async function getStoredFileStream(file: { storageProvider?: StoredFileMode; path: string }) {
  if (file.storageProvider === 's3' && isS3Enabled()) {
    const client = getS3Client();
    const response = await client.send(new GetObjectCommand({
      Bucket: config.s3BucketName,
      Key: file.path
    }));
    return response;
  }

  return {
    Body: fs.createReadStream(file.path)
  };
}

export function getStoredFileDownloadName(file: { originalName: string }) {
  return file.originalName || 'download';
}
