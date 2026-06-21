import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Encrypts plaintext using AES-256-GCM with a dynamic IV and authorization tag.
 * @param text The plaintext to encrypt
 * @param secretKey The secret key/passphrase (hashed to 32 bytes internally)
 * @returns Encrypted string in the format iv:encryptedContent:authTag
 */
export function encrypt(text: string, secretKey: string): string {
  if (!text) return '';
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts encrypted text using AES-256-GCM and verifies the authorization tag integrity.
 * @param encryptedData The payload in the format iv:encryptedContent:authTag
 * @param secretKey The secret key/passphrase
 * @returns The decrypted plaintext string
 */
export function decrypt(encryptedData: string, secretKey: string): string {
  if (!encryptedData) return '';
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error(
      'Invalid encrypted text payload format (missing IV or AuthTag)',
    );
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');

  const key = crypto.createHash('sha256').update(secretKey).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
