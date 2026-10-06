import { validateLayout } from './layout-editor.js';
const KEY = 'pet-memory-ui-config-v1';
export const MODULE_LABELS = { intro: '首页顶部', banner: '社区精选 Banner', pets: '我的宠物照片', privacy: '资料说明', cta: '首页快捷操作' };
export const NAV_LABELS = { home: '我家', checkins: '照护', memories: '时光', community: '社区', settings: '我的' };
export const ACTION_LABELS = { photo: '首页照片与视频', edit: '编辑宠物资料' };
export const PRESETS = {
  life: { name: '晴日生活', paper: '#f4f4f3', cream: '#ffffff', ink: '#20211e', muted: '#747570', accent: '#cc4b27', line: '#e9e9e5' },
  blush: { name: '莓粉陪伴', paper: '#ffcee0', cream: '#fbfbfa', ink: '#171515', muted: '#756f70', accent: '#ef285c', line: '#eadce0' },
  memory: { name: '暖纸相册', paper: '#f4f2ec', cream: '#fdfcf9', ink: '#252b26', muted: '#69736a', accent: '#345442', line: '#e1e4dc' },
  forest: { name: '森林日记', paper: '#eef2eb', cream: '#ffffff', ink: '#253a30', muted: '#52695b', accent: '#375f48', line: '#cedbcf' },
  dusk: { name: '暮色纪念', paper: '#f3eff1', cream: '#fffafd', ink: '#3f303c', muted: '#705f6d', accent: '#76546f', line: '#e1d5dd' },
};
export const DEFAULT_CONFIG = {
  version: 1,
  homeOrder: ['intro', 'pets', 'cta', 'banner', 'privacy'],
  navOrder: ['home', 'checkins', 'memories', 'community', 'settings'],
  detailOrder: ['photo', 'edit'],
  layout: {},
  banner: { enabled: true, eyebrow: '社区里的小日子', title: '一起分享那些小事', text: '看看其他毛孩子的日常，也把你的故事慢慢留下。' },
  theme: { preset: 'life', buttonShape: 'pill', buttonStyle: 'filled' },
  branding: { name: '留念', icon: '' },
};

const clone = value => JSON.parse(JSON.stringify(value));
function isOrder(value, allowed) {
  return Array.isArray(value) && value.length === allowed.length &&
    new Set(value).size === allowed.length && value.every(item => allowed.includes(item));
}
export function validateConfig(input) {
  if (!input || typeof input !== 'object' || input.version !== 1) throw new Error('配置文件版本不支持');
  const config = clone(DEFAULT_CONFIG);
  for (const [key, allowed] of [['homeOrder', Object.keys(MODULE_LABELS)], ['navOrder', Object.keys(NAV_LABELS)], ['detailOrder', Object.keys(ACTION_LABELS)]]) {
    let order = input[key];
    if (key === 'navOrder' && (isOrder(order, ['home','memories','settings']) || isOrder(order, ['home','memories','capture','settings']))) {
      order = order.filter(item => item !== 'capture');
      order.splice(order.indexOf('home') + 1, 0, 'checkins', 'community');
    }
    if (key === 'navOrder' && isOrder(order, ['home','checkins','services','community','settings'])) {
      order = order.map(item => item === 'services' ? 'memories' : item);
    }
    if (!isOrder(order, allowed)) throw new Error('模块顺序不完整：' + key);
    config[key] = [...order];
  }
  if (!input.banner || typeof input.banner.enabled !== 'boolean') throw new Error('Banner 配置无效');
  config.banner.enabled = input.banner.enabled;
  for (const [field, limit] of [['eyebrow', 30], ['title', 60], ['text', 240]]) {
    if (typeof input.banner[field] !== 'string' || input.banner[field].length > limit) throw new Error('Banner 文案无效');
    config.banner[field] = input.banner[field].trim();
  }
  if (!input.theme || !PRESETS[input.theme.preset] || !['rounded', 'pill', 'square'].includes(input.theme.buttonShape) || !['filled', 'outlined'].includes(input.theme.buttonStyle)) throw new Error('界面样式配置无效');
  config.theme = { preset: input.theme.preset, buttonShape: input.theme.buttonShape, buttonStyle: input.theme.buttonStyle };
  if (!input.branding || typeof input.branding.name !== 'string' || !input.branding.name.trim() || input.branding.name.length > 20) throw new Error('应用名称无效');
  const icon = input.branding.icon || '';
  if (typeof icon !== 'string' || icon.length > 600000 || (icon && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(icon))) throw new Error('图标格式无效');
  config.branding = { name: input.branding.name.trim(), icon };
  config.layout = validateLayout(input.layout);
  return config;
}
export function loadConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (['同一只狗 · 多个角度', '下一次，好好照顾'].includes(raw?.banner?.title)) raw.banner = clone(DEFAULT_CONFIG.banner);
    return validateConfig(raw);
  }
  catch { return clone(DEFAULT_CONFIG); }
}
export function saveConfig(value) {
  const config = validateConfig(value);
  localStorage.setItem(KEY, JSON.stringify(config));
  return config;
}
export function resetConfig() { localStorage.removeItem(KEY); return loadConfig(); }
export function moveInOrder(config, key, item, direction) {
  const copy = clone(config);
  const index = copy[key].indexOf(item);
  const next = index + direction;
  if (index >= 0 && next >= 0 && next < copy[key].length) [copy[key][index], copy[key][next]] = [copy[key][next], copy[key][index]];
  return saveConfig(copy);
}
export function applyConfig(config) {
  const colors = PRESETS[config.theme.preset];
  const root = document.documentElement;
  for (const [name, value] of Object.entries(colors)) if (name !== 'name') root.style.setProperty('--' + (name === 'accent' ? 'forest' : name), value);
  root.dataset.buttonShape = config.theme.buttonShape;
  root.dataset.buttonStyle = config.theme.buttonStyle;
  document.title = config.branding.name + ' · 和它一起过日子';
  document.querySelector('link[rel="icon"]').href = config.branding.icon || '/icon.svg';
  document.querySelector('meta[name="theme-color"]').content = colors.paper;
}
