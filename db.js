const BASE_DB_NAME = 'pet-memory-standalone';
const DB_VERSION = 3;
export const CAPTURE_SLOTS = ['front', 'left', 'right', 'back', 'face', 'coat', 'video'];
let connection;
let databaseName = BASE_DB_NAME;

export function setDatabaseScope(accountId) {
  if (connection) throw new Error('资料库已打开，切换账号前请重新载入页面');
  if (accountId !== null && !/^[0-9a-f-]{36}$/i.test(accountId)) throw new Error('账号标识无效');
  databaseName = accountId ? `${BASE_DB_NAME}-account-${accountId}` : BASE_DB_NAME;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finished(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('保存失败'));
  });
}

export function openDatabase() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, DB_VERSION);
    request.onupgradeneeded = event => {
      const database = request.result;
      if (event.oldVersion < 1) {
        database.createObjectStore('pets', { keyPath: 'id' });
        const memories = database.createObjectStore('memories', { keyPath: 'id' });
        memories.createIndex('petId', 'petId');
        const photos = database.createObjectStore('photos', { keyPath: 'id' });
        photos.createIndex('petId', 'petId');
      }
      if (event.oldVersion < 2) {
        const captures = database.createObjectStore('captures', { keyPath: 'id' });
        captures.createIndex('petId', 'petId');
        database.createObjectStore('models', { keyPath: 'petId' });
      }
      if (event.oldVersion < 3) {
        const checkins = database.createObjectStore('checkins', { keyPath: 'id' });
        checkins.createIndex('petId', 'petId');
        const posts = database.createObjectStore('posts', { keyPath: 'id' });
        posts.createIndex('petId', 'petId');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return connection;
}

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function list(storeName) {
  const db = await openDatabase();
  return requestResult(db.transaction(storeName).objectStore(storeName).getAll());
}

async function get(storeName, id) {
  const db = await openDatabase();
  return requestResult(db.transaction(storeName).objectStore(storeName).get(id));
}

async function put(storeName, value) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const done = finished(tx);
  tx.objectStore(storeName).put(value);
  await done;
  return value;
}

async function remove(storeName, id) {
  const db = await openDatabase();
  const tx = db.transaction(storeName, 'readwrite');
  const done = finished(tx);
  tx.objectStore(storeName).delete(id);
  await done;
}

export async function listPets() {
  return (await list('pets')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export const getPet = id => get('pets', id);

export async function savePet(input, id) {
  const name = String(input.name || '').trim();
  if (!name || name.length > 60) throw new Error('名字需要填写，且不能超过 60 字');
  const species = String(input.species || '').trim().slice(0, 40);
  const traits = String(input.traits || '').trim().slice(0, 500);
  const appearance = String(input.appearance || '').trim().slice(0, 500);
  const videoHabits = String(input.videoHabits || '').trim().slice(0, 500);
  const previous = id ? await getPet(id) : null;
  if (id && !previous) throw new Error('找不到这份宠物档案');
  const now = new Date().toISOString();
  const animalType = ['cat', 'dog'].includes(input.animalType) ? input.animalType : (previous?.animalType || 'dog');
  const coatColor = ['honey', 'cream', 'cocoa', 'charcoal', 'ginger'].includes(input.coatColor)
    ? input.coatColor : (previous?.coatColor || 'honey');
  return put('pets', {
    ...previous, id: id || makeId(), name, species, traits, appearance, videoHabits, animalType, coatColor,
    createdAt: previous?.createdAt || now, updatedAt: now,
  });
}

export async function listMemories(petId) {
  return (await list('memories')).filter(item => item.petId === petId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const getMemory = id => get('memories', id);

export async function saveMemory(petId, input, id) {
  if (!await getPet(petId)) throw new Error('宠物档案不存在');
  const text = String(input.text || '').trim();
  if (!text || text.length > 2000) throw new Error('回忆需要填写，且不能超过 2000 字');
  const happenedOn = input.happenedOn || '';
  if (happenedOn && !/^\d{4}-\d{2}-\d{2}$/.test(happenedOn)) throw new Error('日期格式不正确');
  const previous = id ? await getMemory(id) : null;
  if (id && previous?.petId !== petId) throw new Error('找不到这段回忆');
  const now = new Date().toISOString();
  const memory = await put('memories', {
    id: id || makeId(), petId, text, happenedOn,
    createdAt: previous?.createdAt || now, updatedAt: now,
  });
  const pet = await getPet(petId);
  await put('pets', { ...pet, updatedAt: now });
  return memory;
}

export const deleteMemory = id => remove('memories', id);

function checkedDate(value) {
  const date = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('日期格式不正确');
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) throw new Error('日期格式不正确');
  return date;
}

function checkedImage(file) {
  if (file == null) return null;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) {
    throw new Error('照片须为不超过 8 MB 的 JPG、PNG 或 WebP');
  }
  return file;
}

export async function listCheckins(petId) {
  const items = await list('checkins');
  return items.filter(item => !petId || item.petId === petId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
export const getCheckin = id => get('checkins', id);
export async function saveCheckin(petId, input, id) {
  if (!await getPet(petId)) throw new Error('宠物档案不存在');
  const text = String(input.text || '').trim();
  if (text.length > 1000) throw new Error('打卡文字不能超过 1000 字');
  const previous = id ? await getCheckin(id) : null;
  if (id && previous?.petId !== petId) throw new Error('找不到这条打卡');
  const photo = checkedImage(input.photo === undefined ? previous?.photo : input.photo);
  if (!text && !photo) throw new Error('请写一句话或上传一张照片');
  const now = new Date().toISOString();
  return put('checkins', {
    id: id || makeId(), petId, date: checkedDate(input.date), text,
    tag: String(input.tag || '').trim().slice(0, 24), photo,
    createdAt: previous?.createdAt || now, updatedAt: now,
  });
}
export const deleteCheckin = id => remove('checkins', id);

export async function listPosts() {
  return (await list('posts')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const getPost = id => get('posts', id);
export async function savePost(input, id) {
  const text = String(input.text || '').trim();
  const previous = id ? await getPost(id) : null;
  if (id && !previous) throw new Error('找不到这份草稿');
  const photo = checkedImage(input.photo === undefined ? previous?.photo : input.photo);
  if (!text && !photo) throw new Error('请写一点内容或上传一张照片');
  if (text.length > 1000) throw new Error('分享文字不能超过 1000 字');
  const petId = input.petId || '';
  if (petId && !await getPet(petId)) throw new Error('关联的宠物档案不存在');
  const now = new Date().toISOString();
  return put('posts', {
    id: id || makeId(), petId, text, photo, topic: String(input.topic || '').trim().slice(0, 30),
    status: 'local-draft', createdAt: previous?.createdAt || now, updatedAt: now,
  });
}
export const deletePost = id => remove('posts', id);

export async function listPhotos(petId) {
  return (await list('photos')).filter(item => item.petId === petId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addPhoto(petId, file) {
  if (!await getPet(petId)) throw new Error('宠物档案不存在');
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('仅支持 PNG 或 JPEG 照片');
  if (file.size > 5 * 1024 * 1024) throw new Error('每张照片不能超过 5 MB');
  if (!file.size) throw new Error('照片内容为空');
  const photo = { id: makeId(), petId, mime: file.type, blob: file, createdAt: new Date().toISOString() };
  await put('photos', photo);
  return photo;
}
export const deletePhoto = id => remove('photos', id);

export async function listCaptures(petId) {
  return (await list('captures')).filter(item => item.petId === petId);
}

export async function saveCapture(petId, slot, file) {
  if (!await getPet(petId)) throw new Error('宠物档案不存在');
  if (!CAPTURE_SLOTS.includes(slot)) throw new Error('拍摄角度不受支持');
  const video = slot === 'video';
  const allowed = video ? ['video/mp4', 'video/quicktime', 'video/webm'] : ['image/png', 'image/jpeg'];
  if (!allowed.includes(file.type)) throw new Error(video ? '仅支持 MP4、MOV 或 WebM 视频' : '仅支持 PNG 或 JPEG 照片');
  if (!file.size || file.size > (video ? 25 : 8) * 1024 * 1024) {
    throw new Error(video ? '视频须小于 25 MB' : '每张角度照片须小于 8 MB');
  }
  let width, height, sha256;
  if (!video) {
    let image;
    try { image = await createImageBitmap(file); }
    catch { throw new Error('图片无法读取，请换一张清晰的照片'); }
    width = image.width; height = image.height; image.close();
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if ((await listCaptures(petId)).some(item => item.slot !== slot && item.sha256 === sha256)) {
      throw new Error('这张照片已用于其他角度；请上传真正不同视角的照片');
    }
  }
  const capture = { id: petId + ':' + slot, petId, slot, mime: file.type, blob: file,
    width, height, sha256, createdAt: new Date().toISOString() };
  return put('captures', capture);
}

export const deleteCapture = id => remove('captures', id);
export const getModel = petId => get('models', petId);

async function validateGlb(blob) {
  if (blob.size < 20) throw new Error('GLB 文件不完整');
  const header = new DataView(await blob.slice(0, 20).arrayBuffer());
  const jsonLength = header.getUint32(12, true);
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 ||
      header.getUint32(8, true) !== blob.size || header.getUint32(16, true) !== 0x4e4f534a ||
      !jsonLength || jsonLength > 5 * 1024 * 1024 || 20 + jsonLength > blob.size) {
    throw new Error('GLB 文件格式无效或未完整保存');
  }
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(await blob.slice(20, 20 + jsonLength).arrayBuffer())); }
  catch { throw new Error('GLB 模型描述无法读取'); }
  function checkResource(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.uri === 'string' && !value.uri.startsWith('data:')) {
      throw new Error('请导入资源已内嵌的 GLB；模型不能引用外部网址或文件');
    }
    for (const child of Object.values(value)) checkResource(child);
  }
  checkResource(manifest);
}

export async function saveModel(petId, file) {
  if (!await getPet(petId)) throw new Error('宠物档案不存在');
  if (!/\.glb$/i.test(file.name) || !file.size || file.size > 50 * 1024 * 1024) {
    throw new Error('请选择小于 50 MB 的 GLB 3D 模型');
  }
  await validateGlb(file);
  return put('models', { petId, name: file.name, blob: file, createdAt: new Date().toISOString() });
}

export const deleteModel = petId => remove('models', petId);
export async function approveModel(petId) {
  const model = await getModel(petId);
  if (!model) throw new Error('尚未导入 3D 模型');
  return put('models', { ...model, approvedAt: new Date().toISOString() });
}

export async function deletePet(id) {
  const db = await openDatabase();
  const tx = db.transaction(['pets', 'memories', 'photos', 'captures', 'models', 'checkins', 'posts'], 'readwrite');
  const done = finished(tx);
  tx.objectStore('pets').delete(id);
  tx.objectStore('models').delete(id);
  for (const name of ['memories', 'photos', 'captures', 'checkins', 'posts']) {
    tx.objectStore(name).index('petId').openCursor(IDBKeyRange.only(id)).onsuccess = event => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };
  }
  await done;
}

export async function deleteEverything() {
  const db = await openDatabase();
  const tx = db.transaction(['pets', 'memories', 'photos', 'captures', 'models', 'checkins', 'posts'], 'readwrite');
  const done = finished(tx);
  for (const name of ['pets', 'memories', 'photos', 'captures', 'models', 'checkins', 'posts']) tx.objectStore(name).clear();
  await done;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function exportArchive() {
  const [pets, memories, photos, captures, models, checkins, posts] = await Promise.all([
    list('pets'), list('memories'), list('photos'), list('captures'), list('models'), list('checkins'), list('posts'),
  ]);
  return {
    format: 'pet-memory-standalone', version: 3, exportedAt: new Date().toISOString(),
    pets, memories,
    photos: await Promise.all(photos.map(async ({ blob, ...photo }) => ({ ...photo, dataUrl: await blobToDataUrl(blob) }))),
    captures: await Promise.all(captures.map(async ({ blob, ...capture }) => ({ ...capture, dataUrl: await blobToDataUrl(blob) }))),
    models: await Promise.all(models.map(async ({ blob, ...model }) => ({ ...model, dataUrl: await blobToDataUrl(blob) }))),
    checkins: await Promise.all(checkins.map(async ({ photo, ...item }) => ({ ...item, photoDataUrl: photo ? await blobToDataUrl(photo) : null }))),
    posts: await Promise.all(posts.map(async ({ photo, ...item }) => ({ ...item, photoDataUrl: photo ? await blobToDataUrl(photo) : null }))),
  };
}

function archiveBlob(dataUrl, mime, maxBytes) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(`data:${mime};base64,`)) throw new Error('备份中的媒体数据无效');
  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1);
  if (encoded.length > Math.ceil(maxBytes * 4 / 3) + 16) throw new Error('备份中的媒体文件过大');
  const bytes = atob(encoded);
  if (bytes.length > maxBytes) throw new Error('备份中的媒体文件过大');
  return new Blob([Uint8Array.from(bytes, char => char.charCodeAt(0))], { type: mime });
}

function checkedArchiveRows(items, label, key = 'id', updated = false) {
  if (!Array.isArray(items)) throw new Error('备份缺少' + label + '资料');
  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        typeof item[key] !== 'string' || !item[key].trim()) throw new Error('备份中的' + label + '标识无效');
    if (ids.has(item[key])) throw new Error('备份中存在重复的' + label);
    ids.add(item[key]);
    for (const field of updated ? ['createdAt', 'updatedAt'] : ['createdAt']) {
      if (typeof item[field] !== 'string' || !Number.isFinite(Date.parse(item[field]))) {
        throw new Error('备份中的' + label + '保存时间无效');
      }
    }
  }
  return ids;
}

export async function importArchive(archive) {
  if (archive?.format !== 'pet-memory-standalone' || ![1, 2, 3].includes(archive.version)
      || !Array.isArray(archive.pets) || !Array.isArray(archive.memories) || !Array.isArray(archive.photos)) {
    throw new Error('这不是受支持的回忆册备份文件');
  }
  if (archive.pets.length > 100 || archive.memories.length > 10000 || archive.photos.length > 1000 ||
      (archive.captures?.length || 0) > 700 || (archive.models?.length || 0) > 100 ||
      (archive.checkins?.length || 0) > 10000 || (archive.posts?.length || 0) > 5000) {
    throw new Error('备份内容超出单机版容量限制');
  }
  // Validate keys and fields before starting a transaction that replaces existing data.
  // These fields are present in backups exported by all supported versions (1–3).
  const petIds = checkedArchiveRows(archive.pets, '宠物', 'id', true);
  checkedArchiveRows(archive.memories, '回忆', 'id', true);
  checkedArchiveRows(archive.photos, '照片');
  if (archive.version >= 2) {
    checkedArchiveRows(archive.captures, '角度素材');
    checkedArchiveRows(archive.models, '模型', 'petId');
  }
  if (archive.version === 3) {
    checkedArchiveRows(archive.checkins, '打卡', 'id', true);
    checkedArchiveRows(archive.posts, '社区草稿', 'id', true);
  }
  for (const pet of archive.pets) {
    if (typeof pet.name !== 'string' || !pet.name.trim() || pet.name.length > 60) throw new Error('备份中的宠物资料无效');
  }
  const photos = [];
  for (const photo of archive.photos) {
    if (!petIds.has(photo.petId) || !['image/png', 'image/jpeg'].includes(photo.mime)
        || typeof photo.dataUrl !== 'string' || !photo.dataUrl.startsWith(`data:${photo.mime};base64,`)) {
      throw new Error('备份中的照片无效');
    }
    const blob = archiveBlob(photo.dataUrl, photo.mime, 5 * 1024 * 1024);
    photos.push({ id: photo.id, petId: photo.petId, mime: photo.mime, createdAt: photo.createdAt, blob });
  }
  const captures = [];
  const models = [];
  if (archive.version >= 2) {
    if (!Array.isArray(archive.captures) || !Array.isArray(archive.models)) throw new Error('备份缺少模型素材');
    for (const item of archive.captures) {
      if (!petIds.has(item.petId) || !CAPTURE_SLOTS.includes(item.slot) || item.id !== item.petId + ':' + item.slot) throw new Error('备份中的角度素材无效');
      const allowed = item.slot === 'video' ? ['video/mp4', 'video/quicktime', 'video/webm'] : ['image/png', 'image/jpeg'];
      if (!allowed.includes(item.mime)) throw new Error('备份中的角度素材格式无效');
      captures.push({ id: item.id, petId: item.petId, slot: item.slot, mime: item.mime,
        width: item.width, height: item.height, sha256: item.sha256,
        createdAt: item.createdAt, blob: archiveBlob(item.dataUrl, item.mime, (item.slot === 'video' ? 25 : 8) * 1024 * 1024) });
    }
    for (const item of archive.models) {
      if (!petIds.has(item.petId) || typeof item.name !== 'string' || !/\.glb$/i.test(item.name) || item.mime !== undefined && item.mime !== 'model/gltf-binary') {
        throw new Error('备份中的 3D 模型无效');
      }
      const mime = item.dataUrl?.slice(5, item.dataUrl.indexOf(';'));
      if (!['model/gltf-binary', 'application/octet-stream', ''].includes(mime)) throw new Error('备份中的 3D 模型格式无效');
      const blob = archiveBlob(item.dataUrl, mime, 50 * 1024 * 1024);
      await validateGlb(blob);
      models.push({ petId: item.petId, name: item.name, createdAt: item.createdAt, approvedAt: item.approvedAt, blob });
    }
  }
  for (const memory of archive.memories) {
    if (!petIds.has(memory.petId) || typeof memory.text !== 'string' || !memory.text.trim() || memory.text.length > 2000) throw new Error('备份中的回忆无效');
    if (memory.happenedOn !== undefined && memory.happenedOn !== '') checkedDate(memory.happenedOn);
  }
  const restoreEntries = (items, kind) => {
    if (!Array.isArray(items)) throw new Error('备份缺少' + kind + '资料');
    const ids = new Set();
    return items.map(item => {
      if (!item || typeof item.id !== 'string' || ids.has(item.id) || typeof item.text !== 'string' || item.text.length > 1000 ||
          !petIds.has(item.petId) && !(kind === '社区草稿' && item.petId === '')) throw new Error('备份中的' + kind + '无效');
      ids.add(item.id);
      if (kind === '打卡') checkedDate(item.date);
      const mime = item.photoDataUrl?.slice(5, item.photoDataUrl.indexOf(';'));
      const photo = item.photoDataUrl == null ? null : ['image/png', 'image/jpeg', 'image/webp'].includes(mime) ?
        archiveBlob(item.photoDataUrl, mime, 8 * 1024 * 1024) : (() => { throw new Error('备份中的照片格式无效'); })();
      if (!item.text.trim() && !photo) throw new Error('备份中的' + kind + '没有内容');
      const { photoDataUrl, ...rest } = item;
      return kind === '社区草稿' ? { ...rest, photo, status: 'local-draft' } : { ...rest, photo };
    });
  };
  const checkins = archive.version === 3 ? restoreEntries(archive.checkins, '打卡') : [];
  const posts = archive.version === 3 ? restoreEntries(archive.posts, '社区草稿') : [];
  const db = await openDatabase();
  const tx = db.transaction(['pets', 'memories', 'photos', 'captures', 'models', 'checkins', 'posts'], 'readwrite');
  const done = finished(tx);
  try {
    for (const name of ['pets', 'memories', 'photos', 'captures', 'models', 'checkins', 'posts']) tx.objectStore(name).clear();
    for (const pet of archive.pets) tx.objectStore('pets').put(pet);
    for (const memory of archive.memories) tx.objectStore('memories').put(memory);
    for (const photo of photos) tx.objectStore('photos').put(photo);
    for (const capture of captures) tx.objectStore('captures').put(capture);
    for (const model of models) tx.objectStore('models').put(model);
    for (const item of checkins) tx.objectStore('checkins').put(item);
    for (const item of posts) tx.objectStore('posts').put(item);
    await done;
  } catch (error) {
    // A synchronous put() failure does not abort IndexedDB automatically. Without
    // this, earlier queued clear()/put() requests could still partially commit.
    try { tx.abort(); } catch { /* A request failure may already have aborted it. */ }
    await done.catch(() => {});
    throw error;
  }
}
