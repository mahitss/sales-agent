import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = (() => {
  const secret = process.env.ENCRYPTION_KEY || 'super-secret-encryption-key-32-chars-long';
  // Enforce exactly 32 bytes key length for aes-256
  return crypto.createHash('sha256').update(secret).digest();
})();

export function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const parts = hash.split(':');
  if (parts.length !== 2) return hash; // Fallback if plain text (existing unencrypted data)
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    // Graceful fallback to raw value in case of key mismatch or bad format
    return hash;
  }
}
