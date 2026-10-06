import { listCheckins, saveCheckin, getCheckin, deleteCheckin } from './db.js';
import {scopedStorage} from './local-scope.js';

const TASK_KEY = 'pet-life-care-tasks-v1';
const DEMO_KEY = 'pet-life-care-demo-v1';
const categories = ['日常', '第一次', '遛弯', '饮食', '洗护', '体重', '健康'];
const views = new Map();
const bindings = new WeakMap();
const petId = ctx => ctx.pet?.id || 'demo-mochi';
const demo = ctx => petId(ctx).startsWith('demo-');
const uuid = () => crypto.randomUUID?.() || `care-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const read = (key, fallback) => {
  const value = scopedStorage.getItem(key);
  if (!value) return fallback;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object') throw new Error('本机照护数据暂时无法读取，请先备份数据后重试');
  return parsed;
};
const write = (key, value) => scopedStorage.setItem(key, JSON.stringify(value));
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = value => new Date(`${value}T12:00:00`);
const offsetDate = (value, offset) => { const date = parseDate(value); date.setDate(date.getDate() + offset); return dateKey(date); };
function view(ctx) {
  const id = petId(ctx);
  if (!views.has(id)) views.set(id, { date: ctx.today(), addTask: false, manage: false });
  return views.get(id);
}
function taskData(ctx) {
  const all = read(TASK_KEY, {});
  return { all, value: all[petId(ctx)] || { tasks: [], removed: [], done: {} } };
}
function changeTasks(ctx, mutate) {
  const { all, value } = taskData(ctx);
  mutate(value);
  all[petId(ctx)] = value;
  write(TASK_KEY, all);
}
function tasksFor(ctx, date) {
  const { value } = taskData(ctx);
  const isCat = ctx.pet?.animalType === 'cat' || /猫|cat/i.test(ctx.pet?.species || '');
  const legacyUsed = Object.values(value.done || {}).some(ids => Array.isArray(ids) && ids.some(id => id.startsWith('default-'))) ||
    (value.removed || []).some(id => id.startsWith('default-'));
  const defaults = demo(ctx) || legacyUsed ? [
    { id: 'default-breakfast', title: '喂食与换水', time: '08:00', icon: 'bowl', repeat: true },
    { id: 'default-walk', title: isCat ? '陪它玩一会儿' : '出门遛弯', time: '18:30', icon: isCat ? 'heart' : 'walk', repeat: true },
    { id: 'default-brush', title: '梳毛与日常检查', time: '20:00', icon: 'heart', repeat: true },
  ] : [];
  const items = [...defaults.filter(item => !(value.removed || []).includes(item.id)), ...(value.tasks || []).filter(item => item.repeat ? date >= item.date : item.date === date)]
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  return items.map(item => ({ ...item, done: (value.done?.[date] || []).includes(item.id) }));
}
async function recordsFor(ctx) {
  if (!demo(ctx)) return listCheckins(petId(ctx));
  const records = read(DEMO_KEY, []);
  if (!Array.isArray(records)) throw new Error('示例记录暂时无法读取');
  return records.filter(item => item.petId === petId(ctx)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}
async function recordFor(ctx, id) {
  const record = demo(ctx) ? (await recordsFor(ctx)).find(item => item.id === id) : await getCheckin(id);
  return record?.petId === petId(ctx) ? record : null;
}
function taskRow(task, date, ctx, compact = false) {
  const { h, icon } = ctx;
  return `<div class="lc-task${task.done ? ' lc-task-done' : ''}${compact ? ' lc-task-compact' : ''}">
    <button class="lc-task-toggle" type="button" data-lc-toggle="${h(task.id)}" data-lc-date="${h(date)}" aria-label="${task.done ? '撤销完成' : '标记完成'}：${h(task.title)}" aria-pressed="${task.done}">
      <span class="lc-task-check">${task.done ? icon('check') : ''}</span><span class="lc-task-copy"><strong>${h(task.title)}</strong><small>${task.time ? h(task.time) : '时间自定'}${compact ? '' : task.repeat ? ' · 每日' : ' · 当天'}</small></span>
    </button>${!compact && view(ctx).manage ? `<button class="lc-task-remove" type="button" data-lc-remove-task="${h(task.id)}" aria-label="删除待办：${h(task.title)}">${icon('close')}</button>` : !compact ? `<span class="lc-task-icon">${icon(task.icon || 'clock')}</span>` : ''}
  </div>`;
}
function message(ctx, text) {
  return `<div class="lc-empty"><span class="lc-empty-icon">${ctx.icon('calendar')}</span><p>${ctx.h(text)}</p></div>`;
}
function errorMessage(error, fallback) {
  if (error?.name === 'QuotaExceededError') return '设备存储空间不足，未能保存。请先备份并清理部分照片后重试';
  if (error?.name === 'SecurityError') return '当前浏览器不允许保存本机数据，请使用普通浏览模式重试';
  return error?.message || fallback;
}
function taskForm(ctx, date) {
  return `<form class="lc-task-form" data-lc-task-form>
    <div class="lc-form-top"><h3>添加一个小安排</h3><button class="lc-icon-button" type="button" data-lc-cancel-task aria-label="关闭添加待办">${ctx.icon('close')}</button></div>
    <label class="lc-field">待办名称<input name="title" maxlength="40" placeholder="例如：修剪指甲" required autocomplete="off"></label>
    <div class="lc-form-pair"><label class="lc-field">提醒时间<input name="time" type="time"></label><label class="lc-field">日期<input name="date" type="date" value="${ctx.h(date)}" required></label></div>
    <label class="lc-repeat"><input type="checkbox" name="repeat"><span>从这天起，每日重复</span></label>
    <p class="lc-helper">时间会显示在待办列表中，暂不发送系统通知。</p>
    <p class="lc-form-error" data-lc-task-error role="alert" hidden></p><button class="button primary lc-full" type="submit">保存待办</button>
  </form>`;
}
function recordCard(item, ctx) {
  const { h, icon } = ctx;
  const photo = item.photo ? ctx.imageUrl(item.photo) : '';
  return `<a class="lc-record" href="#checkins/edit/${encodeURIComponent(item.id)}"><div class="lc-record-marker">${icon(item.tag === '遛弯' ? 'walk' : item.tag === '饮食' ? 'bowl' : item.tag === '体重' ? 'scale' : 'heart')}</div><div class="lc-record-content"><div class="lc-record-top"><strong>${h(item.tag || '日常')}</strong><span>${h(new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }))}</span></div>${item.text ? `<p>${h(item.text)}</p>` : ''}${photo ? `<img class="lc-record-photo" src="${h(photo)}" alt="这次记录的照片" loading="lazy">` : ''}<span class="lc-record-edit">查看记录 ${icon('chevron-right')}</span></div></a>`;
}
export async function carePreview(ctx) {
  try {
    const date = ctx.today();
    const tasks = tasksFor(ctx, date);
    const count = tasks.filter(item => item.done).length;
    return `<div class="lc-preview"><div class="lc-preview-heading"><span>${tasks.length ? `已完成 ${count} / ${tasks.length}` : '今天，慢慢来'}</span><a href="#checkins">全部安排 ${ctx.icon('chevron-right')}</a></div>${tasks.slice(0, 3).map(task => taskRow(task, date, ctx, true)).join('') || '<a class="lc-preview-empty" href="#checkins">为它添加今天的第一件小事</a>'}</div>`;
  } catch (error) {
    return `<p class="lc-error" role="alert">${ctx.h(errorMessage(error, '暂时无法读取今日安排'))}</p>`;
  }
}
export async function renderCare(parts, ctx) {
  const { h, icon } = ctx;
  try {
    if (parts[1] === 'new' || parts[1] === 'edit') return await renderRecordForm(parts, ctx);
    const state = view(ctx);
    const records = await recordsFor(ctx);
    const tasks = tasksFor(ctx, state.date);
    const selected = parseDate(state.date);
    const weekStart = offsetDate(state.date, -(selected.getDay() || 7) + 1);
    const dateCounts = new Set(records.map(item => item.date));
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = offsetDate(weekStart, index);
      return `<button type="button" class="lc-day${date === state.date ? ' lc-day-active' : ''}${date === ctx.today() ? ' lc-day-today' : ''}" data-lc-select-date="${date}" aria-label="${date}${date === ctx.today() ? ' 今天' : ''}" aria-pressed="${date === state.date}"><span>${'一二三四五六日'[index]}</span><strong>${parseDate(date).getDate()}</strong><i class="${dateCounts.has(date) ? 'lc-day-dot' : ''}"></i></button>`;
    }).join('');
    const dayRecords = records.filter(item => item.date === state.date);
    const completed = tasks.filter(item => item.done).length;
    return `<section class="lc-page"><header class="screen-header lc-header"><div><p class="lc-eyebrow">把照顾，放进每一天</p><h1>照护日常</h1></div><a class="lc-add-record" href="#checkins/new" aria-label="写一条记录">${icon('plus')}</a></header>
      ${demo(ctx) ? '<p class="lc-demo-note">示例体验 · 待办与文字记录仅保存在这台设备</p>' : `<p class="lc-pet-note">${h(ctx.pet?.name || '它')}的小日历</p>`}
      <div class="lc-calendar"><div class="lc-calendar-heading"><h2>${selected.getFullYear()} 年 ${selected.getMonth() + 1} 月</h2><div class="lc-calendar-actions"><button type="button" class="lc-today" data-lc-today>今天</button><button type="button" class="lc-icon-button" data-lc-shift="-7" aria-label="上一周">${icon('arrow-left')}</button><button type="button" class="lc-icon-button" data-lc-shift="7" aria-label="下一周">${icon('chevron-right')}</button></div></div><div class="lc-week">${days}</div></div>
      <section class="lc-section"><div class="lc-section-heading"><h2>${state.date === ctx.today() ? '今日' : `${selected.getMonth() + 1} 月 ${selected.getDate()} 日`}待办 <span>${completed}/${tasks.length}</span></h2><button type="button" class="lc-text-button" data-lc-manage>${state.manage ? '完成管理' : '管理'}</button></div><div class="lc-task-list">${tasks.map(task => taskRow(task, state.date, ctx)).join('') || message(ctx, '这一天还没有安排，按自己的节奏来。')}</div>${state.addTask ? taskForm(ctx, state.date) : `<button class="lc-add-task" type="button" data-lc-add-task>${icon('plus')}添加待办</button>`}</section>
      <section class="lc-section lc-record-section"><div class="lc-section-heading"><h2>这一天的小事</h2><a class="lc-text-button" href="#checkins/new">记一笔 ${icon('plus')}</a></div>${dayRecords.length ? `<div class="lc-record-list">${dayRecords.map(item => recordCard(item, ctx)).join('')}</div>` : `<div class="lc-record-empty"><span>${icon('heart')}</span><h3>平常的一天，也值得留下</h3><p>散步的新路线，吃饭的小习惯，<br>或只是今天一起晒过的太阳。</p><a href="#checkins/new" class="lc-record-empty-link">写下第一条记录 ${icon('chevron-right')}</a></div>`}</section>
    </section>`;
  } catch (error) {
    return `<section class="lc-page"><header class="screen-header"><h1>照护日常</h1></header><p class="lc-error" role="alert">${h(errorMessage(error, '照护数据暂时无法读取'))}</p><button class="button" data-lc-retry type="button">重新加载</button></section>`;
  }
}
async function renderRecordForm(parts, ctx) {
  const { h, icon } = ctx;
  const editing = parts[1] === 'edit';
  const record = editing ? await recordFor(ctx, parts[2]) : null;
  if (editing && !record) return `<section class="lc-page"><a class="lc-back" href="#checkins">${icon('arrow-left')}返回照护日常</a>${message(ctx, '这条记录已不存在，或属于另一只宠物。')}</section>`;
  const preview = record?.photo ? ctx.imageUrl(record.photo) : '';
  return `<section class="lc-page lc-editor"><header class="screen-header lc-editor-heading"><a class="lc-icon-button" href="#checkins" aria-label="返回照护日常">${icon('arrow-left')}</a><h1>${editing ? '这一刻的记录' : '记下今天的小事'}</h1><span></span></header>
    <p class="lc-editor-intro">${demo(ctx) ? '示例体验 · 文字记录保存在这台设备' : `给 ${h(ctx.pet?.name || '它')} 留下一点生活的细节`}</p>
    <form data-lc-record-form data-lc-id="${h(record?.id || '')}" class="lc-record-form"><label class="lc-field">发生日期<input type="date" name="date" value="${h(record?.date || view(ctx).date)}" required></label>
      <fieldset class="lc-category"><legend>是哪一种小事</legend><div>${categories.map(tag => `<label><input type="radio" name="tag" value="${tag}" ${(record?.tag || '日常') === tag ? 'checked' : ''}><span>${tag}</span></label>`).join('')}</div></fieldset>
      <label class="lc-field">想记住什么<textarea name="text" rows="6" maxlength="1000" placeholder="今天遛弯时，它第一次主动和邻居家的狗狗打了招呼……">${h(record?.text || '')}</textarea></label>
      ${demo(ctx) ? '<div class="lc-demo-upload"><span>照片随真实宠物档案保存</span><p>先体验文字记录；建立自己的宠物档案后，就能添加照片。</p></div>' : `<div class="lc-photo-field"><div class="lc-photo-heading"><span>一张照片 <small>选填</small></span><button type="button" class="lc-text-button" data-lc-clear-photo ${preview ? '' : 'hidden'}>移除照片</button></div><label class="lc-photo-picker" data-lc-original-photo="${h(preview)}">${preview ? `<img src="${h(preview)}" alt="已保存的记录照片" data-lc-photo-preview>` : `<span data-lc-photo-placeholder>${icon('plus')}留下这一刻</span>`}<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" aria-label="选择记录照片"></label><p class="lc-helper">JPG、PNG 或 WebP，单张不超过 8 MB</p><input type="hidden" name="removePhoto" value="0"></div>`}
      <p class="lc-form-error" data-lc-record-error role="alert" hidden></p><button class="button primary lc-full" type="submit">${editing ? '保存修改' : '保存这条记录'}</button>
      ${editing ? `<button type="button" class="lc-delete-record" data-lc-delete-record="${h(record.id)}">删除这条记录</button><div class="lc-delete-confirm" data-lc-delete-confirm hidden><p>确定删除这条记录？删除后无法恢复。</p><div><button type="button" class="button" data-lc-cancel-delete>保留记录</button><button type="button" class="button lc-danger" data-lc-confirm-delete="${h(record.id)}">确认删除</button></div></div>` : ''}
    </form>
  </section>`;
}
function checkedDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || dateKey(parseDate(value)) !== value) throw new Error('请填写有效日期');
  return value;
}
function formError(form, selector, error, fallback) {
  const target = form.querySelector(selector);
  if (target) { target.textContent = errorMessage(error, fallback); target.hidden = false; }
}
export function bindCare(root, ctx) {
  bindings.get(root)?.abort();
  const controller = new AbortController();
  bindings.set(root, controller);
  const options = { signal: controller.signal };
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-lc-toggle],[data-lc-select-date],[data-lc-shift],[data-lc-today],[data-lc-add-task],[data-lc-cancel-task],[data-lc-manage],[data-lc-remove-task],[data-lc-clear-photo],[data-lc-delete-record],[data-lc-cancel-delete],[data-lc-confirm-delete],[data-lc-retry]');
    if (!button || !root.contains(button)) return;
    try {
      if (button.hasAttribute('data-lc-toggle')) {
        const date = button.dataset.lcDate;
        const id = button.dataset.lcToggle;
        if (!tasksFor(ctx, date).some(item => item.id === id)) throw new Error('这条待办已不存在');
        changeTasks(ctx, value => {
          const done = new Set(value.done[date] || []);
          if (done.has(id)) done.delete(id); else done.add(id);
          value.done[date] = [...done];
        });
        await ctx.rerender();
      } else if (button.hasAttribute('data-lc-select-date')) { view(ctx).date = button.dataset.lcSelectDate; await ctx.rerender(); }
      else if (button.hasAttribute('data-lc-shift')) { view(ctx).date = offsetDate(view(ctx).date, Number(button.dataset.lcShift)); await ctx.rerender(); }
      else if (button.hasAttribute('data-lc-today')) { view(ctx).date = ctx.today(); await ctx.rerender(); }
      else if (button.hasAttribute('data-lc-add-task')) { view(ctx).addTask = true; await ctx.rerender(); root.querySelector('[data-lc-task-form] input[name="title"]')?.focus(); }
      else if (button.hasAttribute('data-lc-cancel-task')) { view(ctx).addTask = false; await ctx.rerender(); }
      else if (button.hasAttribute('data-lc-manage')) { view(ctx).manage = !view(ctx).manage; await ctx.rerender(); }
      else if (button.hasAttribute('data-lc-remove-task')) {
        const id = button.dataset.lcRemoveTask;
        changeTasks(ctx, value => { if (id.startsWith('default-')) value.removed = [...new Set([...value.removed, id])]; else value.tasks = value.tasks.filter(item => item.id !== id); });
        ctx.toast('已删除这项待办'); await ctx.rerender();
      } else if (button.hasAttribute('data-lc-clear-photo')) {
        const form = button.closest('form');
        form.elements.removePhoto.value = '1'; form.elements.photo.value = '';
        form.querySelector('[data-lc-photo-preview]')?.remove();
        const picker = form.querySelector('.lc-photo-picker');
        if (!picker.querySelector('[data-lc-photo-placeholder]')) picker.insertAdjacentHTML('afterbegin', `<span data-lc-photo-placeholder>${ctx.icon('plus')}留下这一刻</span>`);
        button.hidden = true;
      } else if (button.hasAttribute('data-lc-delete-record')) root.querySelector('[data-lc-delete-confirm]').hidden = false;
      else if (button.hasAttribute('data-lc-cancel-delete')) root.querySelector('[data-lc-delete-confirm]').hidden = true;
      else if (button.hasAttribute('data-lc-confirm-delete')) {
        const id = button.dataset.lcConfirmDelete;
        if (!await recordFor(ctx, id)) throw new Error('这条记录已不存在');
        button.disabled = true;
        if (demo(ctx)) write(DEMO_KEY, read(DEMO_KEY, []).filter(item => item.id !== id)); else await deleteCheckin(id);
        ctx.toast('记录已删除'); ctx.go('checkins');
      } else if (button.hasAttribute('data-lc-retry')) await ctx.rerender();
    } catch (error) { button.disabled = false; ctx.toast(errorMessage(error, '操作未完成，请重试')); }
  }, options);
  root.addEventListener('change', event => {
    const input = event.target;
    if (input.name !== 'photo' || !input.closest('[data-lc-record-form]')) return;
    const form = input.closest('form');
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) throw new Error('请选择不超过 8 MB 的 JPG、PNG 或 WebP 照片');
      form.querySelector('[data-lc-photo-placeholder]')?.remove();
      let preview = form.querySelector('[data-lc-photo-preview]');
      if (!preview) { preview = document.createElement('img'); preview.dataset.lcPhotoPreview = ''; preview.alt = '待保存的照片'; form.querySelector('.lc-photo-picker').prepend(preview); }
      preview.src = ctx.imageUrl(file);
      form.elements.removePhoto.value = '0';
      const remove = form.querySelector('[data-lc-clear-photo]'); if (remove) remove.hidden = false;
      const error = form.querySelector('[data-lc-record-error]'); if (error) error.hidden = true;
    } catch (error) {
      input.value = '';
      const picker = form.querySelector('.lc-photo-picker');
      const original = form.elements.removePhoto.value === '1' ? '' : picker.dataset.lcOriginalPhoto;
      const preview = form.querySelector('[data-lc-photo-preview]');
      if (original && preview) preview.src = original;
      else {
        preview?.remove();
        if (!picker.querySelector('[data-lc-photo-placeholder]')) picker.insertAdjacentHTML('afterbegin', `<span data-lc-photo-placeholder>${ctx.icon('plus')}留下这一刻</span>`);
      }
      const remove = form.querySelector('[data-lc-clear-photo]'); if (remove) remove.hidden = !original;
      formError(form, '[data-lc-record-error]', error);
    }
  }, options);
  root.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.matches('[data-lc-task-form],[data-lc-record-form]')) return;
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = '正在保存…';
    try {
      const data = new FormData(form);
      const date = checkedDate(String(data.get('date') || ''));
      if (form.hasAttribute('data-lc-task-form')) {
        const title = String(data.get('title') || '').trim();
        if (!title || title.length > 40) throw new Error('请填写 1—40 字的待办名称');
        const time = String(data.get('time') || '');
        if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('请填写有效时间');
        changeTasks(ctx, value => value.tasks.push({ id: uuid(), title, date, time, repeat: data.get('repeat') === 'on', icon: 'clock' }));
        view(ctx).date = date; view(ctx).addTask = false; ctx.toast('待办已保存'); await ctx.rerender();
      } else {
        const text = String(data.get('text') || '').trim();
        const tag = String(data.get('tag') || '日常');
        if (text.length > 1000) throw new Error('记录最多可以写 1000 字');
        const id = form.dataset.lcId || undefined;
        if (demo(ctx)) {
          if (!text) throw new Error('写一句话，留下这一天的小事');
          const all = read(DEMO_KEY, []);
          const previous = id ? all.find(item => item.id === id && item.petId === petId(ctx)) : null;
          if (id && !previous) throw new Error('这条记录已不存在');
          const now = new Date().toISOString();
          const record = { id: id || uuid(), petId: petId(ctx), date, tag, text, createdAt: previous?.createdAt || now, updatedAt: now };
          write(DEMO_KEY, [...all.filter(item => item.id !== record.id), record]);
        } else {
          const file = form.elements.photo?.files?.[0];
          const photo = file || (form.elements.removePhoto?.value === '1' ? null : undefined);
          await saveCheckin(petId(ctx), { date, tag, text, photo }, id);
        }
        view(ctx).date = date;
        ctx.toast(id ? '记录已更新' : '这一刻，留下了'); ctx.go('checkins');
      }
    } catch (error) { formError(form, form.hasAttribute('data-lc-task-form') ? '[data-lc-task-error]' : '[data-lc-record-error]', error, '保存失败，请重试'); }
    finally { submit.disabled = false; submit.textContent = original; }
  }, options);
}
