// Guest storage retains the original keys so existing on-device archives remain readable.
let accountId = null;
const GLOBAL_KEYS = new Set(['pet-life-first-use-v1', 'pet-memory-ui-config-v1']);

export function setLocalScope(id) {
  if (id !== null && !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('账号标识无效');
  accountId = id;
}

export function scopedKey(key) {
  return accountId && !GLOBAL_KEYS.has(key) ? `pet-account:${accountId}:${key}` : key;
}

export const scopedStorage = {
  getItem(key) { return localStorage.getItem(scopedKey(key)); },
  setItem(key, value) { localStorage.setItem(scopedKey(key), value); },
  removeItem(key) { localStorage.removeItem(scopedKey(key)); },
  keys() {
    const prefix = accountId ? `pet-account:${accountId}:` : '';
    return Object.keys(localStorage).filter(key => accountId ? key.startsWith(prefix) :
      !key.startsWith('pet-account:')).map(key => accountId ? key.slice(prefix.length) : key);
  }
};
