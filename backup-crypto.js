// Passwords and derived keys are never persisted. Old plain JSON backups remain readable.
const encoder = new TextEncoder();
const ITERATIONS = 600000;
function base64(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(result);
}
function bytes(value) {
  if (typeof value !== 'string') throw new Error('加密备份格式无效');
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function keyFor(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error('加密备份需要 HTTPS 或本机安全环境');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptArchive(archive, password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw new Error('备份密码须为 12–256 个字符');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(archive)));
  return { format: 'liunian-encrypted-backup', version: 1, algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA256',
    iterations: ITERATIONS, salt: base64(salt), iv: base64(iv), payload: base64(new Uint8Array(encrypted)) };
}
export async function decryptArchive(input, password) {
  if (input?.format !== 'liunian-encrypted-backup') return input;
  if (input.version !== 1 || input.algorithm !== 'AES-256-GCM' || input.kdf !== 'PBKDF2-SHA256' || input.iterations !== ITERATIONS)
    throw new Error('暂不支持这个加密备份版本，请使用匹配版本恢复');
  if (typeof password !== 'string' || !password || password.length > 256) throw new Error('请输入备份密码');
  try {
    const salt = bytes(input.salt), iv = bytes(input.iv), payload = bytes(input.payload);
    if (salt.length !== 16 || iv.length !== 12 || payload.length < 16) throw new Error();
    const key = await keyFor(password, salt);
    const result = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, payload);
    return JSON.parse(new TextDecoder().decode(result));
  } catch { throw new Error('密码不正确或备份已损坏，现有资料未被替换'); }
}
