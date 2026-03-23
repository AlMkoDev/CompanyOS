import { BadRequestException } from '@nestjs/common';
import { sanitizeStorageFileName, validateUploadedFile } from './upload-policy';

describe('upload policy helpers', () => {
  it('sanitizes storage file names and strips path segments', () => {
    expect(sanitizeStorageFileName('..\\unsafe folder\\Quarterly Report?.pdf')).toBe(
      'Quarterly Report_.pdf',
    );
  });

  it('rejects unsupported mime types', () => {
    expect(() =>
      validateUploadedFile(
        {
          originalname: 'proof.exe',
          mimetype: 'application/x-msdownload',
          size: 128,
        },
        {
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['.pdf'],
          maxBytes: 1024,
        },
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects files above the configured size limit', () => {
    expect(() =>
      validateUploadedFile(
        {
          originalname: 'proof.pdf',
          mimetype: 'application/pdf',
          size: 2048,
        },
        {
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['.pdf'],
          maxBytes: 1024,
        },
      ),
    ).toThrow('File exceeds maximum allowed size of 1024 bytes.');
  });

  it('returns sanitized metadata for valid uploads', () => {
    expect(
      validateUploadedFile(
        {
          originalname: 'folder/invoice final.PDF',
          mimetype: 'application/pdf',
          size: 512,
        },
        {
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['.pdf'],
          maxBytes: 1024,
        },
      ),
    ).toEqual({
      sanitizedFileName: 'invoice final.PDF',
      mimeType: 'application/pdf',
      size: 512,
    });
  });
});
