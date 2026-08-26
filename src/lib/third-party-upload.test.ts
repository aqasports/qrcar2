import { describe, it, expect } from 'vitest';
import { parseBase64Payload, uploadImageToThirdParty } from './third-party-upload';

describe('Third-Party Image Upload Service', () => {
  it('parses data URI payload and extracts MIME type and base64 body', () => {
    const rawDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseBase64Payload(rawDataUri);

    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.base64).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  });

  it('parses plain base64 without data URI prefix with fallback MIME type', () => {
    const plainBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const parsed = parseBase64Payload(plainBase64);

    expect(parsed.mimeType).toBe('image/png');
    expect(parsed.base64).toBe(plainBase64);
  });

  it('uploads small valid image and returns standardized payload with checksum', async () => {
    const samplePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = await uploadImageToThirdParty({
      fileBase64: samplePng,
      filename: 'garage_logo.png',
      organizationId: 'org_123',
    });

    expect(result.success).toBe(true);
    expect(result.url).toBeTruthy();
    expect(result.checksum).toHaveLength(64); // SHA-256 hex string
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.uploadedAt).toBeTruthy();
    expect(['imgbb', 'cloudinary', 'netlify-blobs', 'local_cdn']).toContain(result.provider);
  });
});
