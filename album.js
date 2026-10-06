const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';

export function buildAlbum({ memories = [], checkins = [], captures = [], photos = [], petId }) {
  const front = captures.find(item => item.slot === 'front');
  const items = [
    ...checkins.map(item => ({ id: item.id, kind: item.photo ? 'photo' : 'note', source: 'checkin', date: day(item.date) || day(item.createdAt), createdAt: item.createdAt, tag: item.tag || '日常', text: item.text || '', photo: item.photo || null, href: `#checkins/edit/${encodeURIComponent(item.id)}` })),
    ...memories.map(item => ({ id: item.id, kind: 'note', source: 'memory', date: day(item.happenedOn) || day(item.createdAt), createdAt: item.createdAt, tag: '珍藏回忆', text: item.text || '', href: `#memory/edit/${encodeURIComponent(item.id)}` })),
    ...photos.map(item => ({ id: item.id, kind: 'photo', source: 'photo', date: day(item.createdAt), createdAt: item.createdAt, tag: '旧照片', text: '', photo: item.blob, href: `#pet/${encodeURIComponent(petId)}` })),
    ...captures.filter(item => item.slot === 'front' || item.slot === 'video').map(item => ({ id: item.id, kind: item.slot === 'video' ? 'video' : 'photo', source: item.slot, date: day(item.createdAt), createdAt: item.createdAt, tag: item.slot === 'video' ? '首页视频' : '首页照片', text: '', photo: item.slot === 'front' ? item.blob : front?.blob || null, video: item.slot === 'video' ? item.blob : null, href: item.slot === 'video' ? '#home' : `#pet/edit/${encodeURIComponent(petId)}` })),
  ];
  return items.filter(item => item.date).sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)) || a.id.localeCompare(b.id));
}

export function albumMonths(items) {
  const months = new Map();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(item);
  }
  return [...months].map(([month, entries]) => ({ month, entries }));
}
