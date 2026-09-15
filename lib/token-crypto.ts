import crypto from 'node:crypto';

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64url')).join('.');
}

export function decryptToken(value: string) {
  const [ivText, tagText, dataText] = value.split('.');
  if (!ivText || !tagText || !dataText) throw new Error('Invalid encrypted token');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}
