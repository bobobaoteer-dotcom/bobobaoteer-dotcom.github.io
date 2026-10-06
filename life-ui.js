export const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
 paw:'<ellipse cx="6" cy="8" rx="2" ry="3"/><ellipse cx="11" cy="5" rx="2" ry="3"/><ellipse cx="17" cy="7" rx="2" ry="3"/><path d="M8 14c2-5 5-5 7-1 1 2 5 3 4 6s-5 0-7 1-6 1-6-2 1-3 2-4z"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 shop:'<path d="M4 10v11h16V10M3 4h18l1 6a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2zM9 21v-6h6v6"/>',
 'arrow-left':'<path d="m11 5-7 7 7 7m-7-7h16"/>',
 'arrow-right':'<path d="m13 5 7 7-7 7M4 12h16"/>',
 'chevron-right':'<path d="m9 5 7 7-7 7"/>',
 'chevron-down':'<path d="m6 9 6 6 6-6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
 check:'<path d="m5 12 4 4L19 6"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
 camera:'<path d="M5 6h3l2-3h4l2 3h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="4"/>',
 photo:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-7 5 8"/>',
 video:'<rect x="3" y="5" width="12" height="14" rx="3"/><path d="m15 9 6-3v12l-6-3"/>',
 play:'<path d="m9 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
 volume:'<path d="m11 4-6 5H2v6h3l6 5zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
 mute:'<path d="m11 4-6 5H2v6h3l6 5zm5 5 6 6m0-6-6 6"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8 8 12 13M8 16 20 3"/>',
 shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z"/><path d="m8 11 3 3 5-5"/>',
 bookmark:'<path d="M6 3h12v19l-6-4-6 4z"/>',
 walk:'<path d="M7 3c6 0 2 7 8 8s5 8 0 9-11-2-10-5 10 1 12-2M7 3 4 5m3-2 2 3"/>',
 bowl:'<path d="M3 12h18l-3 8H6zm5-8v3m4-5v5m4-3v3"/>',
 drop:'<path d="M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13z"/>',
 scale:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8a6 6 0 0 1 8 0l-4 5zm4 5 2-6"/>',
 edit:'<path d="m16 3 5 5-13 13H3v-5zm-2 2 5 5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
 message:'<path d="M21 11a9 9 0 0 1-9 9 12 12 0 0 1-4-1l-5 2 1-5a9 9 0 1 1 17-5z"/><path d="M8 11h8"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
 gift:'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12m0-12C3 10 4 2 8 3c2 0 4 6 4 6s2-6 4-6c4-1 5 7-4 6"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'
};
export const icon = name => `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.paw}</svg>`;
export const today = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const header = (title, back='home', action='') => `<header class="screen-header"><a class="icon-button" href="#${h(back)}" aria-label="返回">${icon('arrow-left')}</a><h1>${h(title)}</h1>${action||'<span class="header-spacer"></span>'}</header>`;
import {scopedStorage} from './local-scope.js';
export function readLocal(key, fallback) { try { const value=JSON.parse(scopedStorage.getItem(key));return value != null && typeof value===typeof fallback && Array.isArray(value)===Array.isArray(fallback) ? value : fallback; } catch {return fallback;} }
export function writeLocal(key, value) { try {scopedStorage.setItem(key,JSON.stringify(value));} catch {throw new Error('设备存储空间不足，暂时无法保存。请先备份资料。');} }
