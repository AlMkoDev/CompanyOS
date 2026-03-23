import { BadRequestException } from '@nestjs/common';

const DEFAULT_FALLBACK_FILE_NAME = 'upload.bin';
const MAX_SANITIZED_FILE_NAME_LENGTH = 180;

export type UploadValidationOptions = {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxBytes: number;
};

export function sanitizeStorageFileName(fileName: string | undefined | null) {
  const rawName = fileName?.split(/[\\/]/).pop()?.trim() || DEFAULT_FALLBACK_FILE_NAME;
  const sanitized = rawName
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9._() -]/g, '_')
    .replace(/^\.+/, '')
    .trim();

  if (!sanitized) {
    return DEFAULT_FALLBACK_FILE_NAME;
  }

  return sanitized.slice(0, MAX_SANITIZED_FILE_NAME_LENGTH);
}

function getNormalizedExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex < 0) {
    return '';
  }

  return fileName.slice(lastDotIndex).toLowerCase();
}

export function validateUploadedFile(
  file: {
    originalname?: string;
    mimetype?: string;
    size?: number;
    buffer?: Buffer;
  } | null | undefined,
  options: UploadValidationOptions,
) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }

  const sanitizedFileName = sanitizeStorageFileName(file.originalname);
  const mimeType = file.mimetype?.trim().toLowerCase() || '';
  const size = typeof file.size === 'number' ? file.size : file.buffer?.length ?? 0;
  const extension = getNormalizedExtension(sanitizedFileName);

  if (!mimeType || !options.allowedMimeTypes.includes(mimeType)) {
    throw new BadRequestException(
      `Unsupported file type. Allowed types: ${options.allowedMimeTypes.join(', ')}.`,
    );
  }

  if (!extension || !options.allowedExtensions.includes(extension)) {
    throw new BadRequestException(
      `Unsupported file extension. Allowed extensions: ${options.allowedExtensions.join(', ')}.`,
    );
  }

  if (size <= 0) {
    throw new BadRequestException('Uploaded file is empty.');
  }

  if (size > options.maxBytes) {
    throw new BadRequestException(
      `File exceeds maximum allowed size of ${options.maxBytes} bytes.`,
    );
  }

  return {
    sanitizedFileName,
    mimeType,
    size,
  };
}
