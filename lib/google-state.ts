import crypto from 'node:crypto';

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET is required');
  return value;
}

export function createGoogleState() {
  const nonce = crypto.randomBytes(24).toString('hex');
  const sig = crypto.createHmac('sha256', secret()).update(nonce).digest('hex');
  return `${nonce}.${sig}`;
}

export function verifyGoogleState(state: string) {
  const [nonce, sig] = state.split('.');
  if (!nonce || !sig) return false;
  const expected = crypto.createHmac('sha256', secret()).update(nonce).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
