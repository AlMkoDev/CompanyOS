import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Config } from '../env';
import { sanitizeStorageFileName } from '../upload-policy';

@Injectable()
export class DocumentStorageService {
  private s3Client: S3Client | null;
  private bucket: string | null;
  private endpoint: string | null;

  constructor() {
    const config = getS3Config();

    if (config) {
      this.s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        endpoint: config.endpoint,
        forcePathStyle: true,
      });
      this.bucket = config.bucket;
      this.endpoint = config.endpoint;
      return;
    }

    this.s3Client = null;
    this.bucket = null;
    this.endpoint = null;
  }

  private ensureConfigured() {
    if (!this.s3Client || !this.bucket || !this.endpoint) {
      throw new Error(
        'Document storage is not configured. Set S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ENDPOINT, and S3_BUCKET.',
      );
    }
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
    companyId: string,
  ) {
    this.ensureConfigured();
    const key = `${companyId}/${Date.now()}-${sanitizeStorageFileName(fileName)}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
      }),
    );
    return { key, url: `${this.endpoint}/${this.bucket}/${key}` };
  }

  async getPresignedUrl(key: string) {
    this.ensureConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteFile(key: string) {
    this.ensureConfigured();
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  extractKeyFromUrl(url: string) {
    if (!this.endpoint || !this.bucket) {
      return null;
    }

    try {
      const expectedPrefix = `${this.endpoint}/${this.bucket}/`;
      if (!url.startsWith(expectedPrefix)) {
        return null;
      }

      const key = url.slice(expectedPrefix.length);
      return key.length > 0 ? decodeURIComponent(key) : null;
    } catch {
      return null;
    }
  }

  isCompanyOwnedUrl(url: string, companyId: string) {
    const key = this.extractKeyFromUrl(url);
    if (!key) {
      return false;
    }

    return key.startsWith(`${companyId}/`);
  }
}
