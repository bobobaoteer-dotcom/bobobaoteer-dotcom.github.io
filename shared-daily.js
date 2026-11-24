import {h,icon,today} from './life-ui.js';
import {scopedStorage} from './local-scope.js';

const SELECTED_KEY='pet-shared-daily-active-v1';
const names={feed:'喂食',walk:'散步',moment:'生活瞬间'};

async function request(path,method='GET',body,contentType='application/json') {
  const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',
    headers:body?{'Content-Type':contentType}:{},body:body?(contentType==='application/json'?JSON.stringify(body):body):undefined});
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(data?.error||'共养资料暂时无法读取');
  return data;
}

function startOfWeek() {
  const date=new Date();date.setDate(date.getDate()-6);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function summarizeSharedWeek(events,petId,since=startOfWeek()) {
  const items=events.filter(item=>item.petId===petId&&item.occurredOn>=since);
  return {feed:items.filter(item=>item.kind==='feed').length,
    walk:items.filter(item=>item.kind==='walk').length,
    moments:items.filter(item=>item.kind==='moment').length,
    photos:items.filter(item=>item.kind==='moment'&&item.photoId).length,
    latestMoment:items.find(item=>item.kind==='moment')||null};
}

function selectedPet(pets,preferredName='') {
  const id=scopedStorage.getItem(SELECTED_KEY);
  return pets.find(pet=>pet.id===id)||pets.find(pet=>pet.name===preferredName)||pets[0];
}

function author(item,accountId) {
  if(!item)return '';
  return item.authorId===accountId?'你':h((item.authorEmail||'一位家人').split('@')[0].slice(0,18));
}

function eventTime(item) {
  return new Date(item.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});
}

function photoUrl(petId,photoId) {
  return `/v1/pets/${encodeURIComponent(petId)}/photos/${encodeURIComponent(photoId)}`;
}

async function model(space,pets,accountId,preferredName='') {
  const pet=selectedPet(pets,preferredName);
  if(!pet)return null;
  const since=startOfWeek();
  const [{events},{photos}]=await Promise.all([
    request(`/v1/spaces/${encodeURIComponent(space.id)}/events?since=${since}`),
    request(`/v1/pets/${encodeURIComponent(pet.id)}/photos`),
  ]);
  const own=events.filter(item=>item.petId===pet.id);
  const todayEvents=own.filter(item=>item.occurredOn===today());
  const latestPhoto=own.find(item=>item.photoId)?.photoId||photos.at(-1)?.id||null;
  return {space,pets,pet,events:own,todayEvents,weekly:summarizeSharedWeek(own,pet.id,since),
    photoUrl:latestPhoto?photoUrl(pet.id,latestPhoto):'',accountId};
}

function todayStatus(items,kind,accountId) {
  const item=items.find(row=>row.kind===kind);
  return `<div class="sd-status"><span class="sd-status-icon">${icon(kind==='feed'?'bowl':'walk')}</span><div><strong>${names[kind]}</strong><small>${item?`${author(item,accountId)} ${eventTime(item)} 记录`:'今天暂无记录'}</small></div>${item?'<span class="sd-confirmed">已记</span>':''}</div>`;
}

function eventRow(item,accountId,role,spaceId) {
  const image=item.photoId?`<img src="${h(photoUrl(item.petId,item.photoId))}" alt="家人留下的宠物照片" loading="lazy">`:'';
  const time=`${h(item.occurredOn.slice(5))} ${h(eventTime(item))}`;
  return `<article class="sd-event"><div class="sd-event-meta"><span>${h(names[item.kind])} · ${author(item,accountId)}</span><time>${time}</time></div>${item.text?`<p>${h(item.text)}</p>`:''}${image}${role!=='viewer'&&(item.authorId===accountId||role==='admin')?`<button type="button" data-shared-daily-delete="${h(item.id)}" data-space-id="${h(spaceId)}">删除这条记录${item.photoId?'及照片':''}</button>`:''}</article>`;
}

function panel(data,{compact=false}={}) {
  const {space,pets,pet,todayEvents,weekly,events,accountId}=data;
  const canWrite=pet.myRole!=='viewer';
  return `<section class="sd-panel${compact?' sd-compact':''}" aria-label="共养的今天">
    <div class="sd-top"><span class="sd-eyebrow">TOGETHER TODAY</span><a href="#shared/${h(space.id)}">共养详情 ${icon('chevron-right')}</a></div>
    <div class="sd-heading">${data.photoUrl?`<img src="${h(data.photoUrl)}" alt="${h(pet.name)}的照片">`:`<span class="sd-photo-empty">${icon('paw')}</span>`}<div><small>${h(space.name)}</small><h2>${h(pet.name)}的今天</h2><p>由家人记录的真实日常</p></div></div>
    ${pets.length>1?`<label class="sd-pet-choice">查看哪只宠物 <select data-shared-daily-pet>${pets.map(item=>`<option value="${h(item.id)}" ${item.id===pet.id?'selected':''}>${h(item.name)}</option>`).join('')}</select></label>`:''}
    <div class="sd-statuses">${todayStatus(todayEvents,'feed',accountId)}${todayStatus(todayEvents,'walk',accountId)}</div>
    ${canWrite?`<div class="sd-care-actions"><button type="button" data-shared-daily-care="feed" data-space-id="${h(space.id)}" data-pet-id="${h(pet.id)}">${icon('bowl')}刚喂过</button><button type="button" data-shared-daily-care="walk" data-space-id="${h(space.id)}" data-pet-id="${h(pet.id)}">${icon('walk')}刚散步</button></div>`:''}
    <div class="sd-week"><div><span>最近七天</span><strong>${weekly.walk} 次散步 · ${weekly.feed} 次喂食记录</strong></div><p>${weekly.moments?`还留下 ${weekly.moments} 个生活瞬间${weekly.photos?`，其中 ${weekly.photos} 张照片`:''}。`:'留下一句话或一张照片，周末就能一起翻看。'}</p></div>
    ${canWrite?`<form class="sd-moment-form" data-shared-daily-moment data-space-id="${h(space.id)}" data-pet-id="${h(pet.id)}"><label for="sd-moment-text">给家人留个瞬间</label><textarea id="sd-moment-text" name="text" maxlength="300" rows="2" placeholder="今天它做了什么，让你想告诉家人？"></textarea><label class="sd-photo-picker">${icon('camera')}选一张真实照片（选填）<input type="file" name="photo" accept="image/jpeg,image/png"></label><span class="sd-photo-name" aria-live="polite"></span><p class="sd-upload-note">提交后保存在当前服务端，仅共养成员可见。原始照片可能含拍摄地点。</p><p class="form-error" role="alert"></p><button class="sd-save" type="submit">留在我们的小家 ${icon('arrow-right')}</button></form>`:''}
    ${!compact?`<div class="sd-timeline"><h3>这周的共同记录</h3>${events.length?events.slice(0,12).map(item=>eventRow(item,accountId,pet.myRole,space.id)).join(''):'<p class="sd-empty">还没有记录。所有内容仅共养成员可见。</p>'}</div>`:''}
    <p class="sd-privacy">记录和照片保存在当前连接的服务端，仅共养成员可见，不会自动发布到社区。照片原文件可能带有拍摄地点信息。个人首页视频和本机相册尚未同步。</p>
  </section>`;
}

export async function sharedDailyHome(accountId,preferredName='') {
  if(!accountId)return {html:'',hero:null};
  try {
    const [{spaces},{pets}]=await Promise.all([request('/v1/spaces'),request('/v1/pets')]);
    if(!pets.length)return {html:`<a class="sd-start" href="#shared">${icon('paw')}和家人共养？建立共享宠物档案 ${icon('arrow-right')}</a>`,hero:null};
    const pet=selectedPet(pets,preferredName);
    const space=spaces.find(item=>item.id===pet.spaceId);
    if(!space)throw new Error('共养空间暂时不可用');
    const data=await model(space,pets.filter(item=>item.spaceId===space.id),accountId,preferredName);
    return {html:panel(data,{compact:true}),hero:{name:data.pet.name,photoUrl:data.photoUrl,spaceId:space.id}};
  } catch(error) {
    return {html:`<a class="sd-start" href="#shared">共养状态暂时无法显示，点此重试 ${icon('arrow-right')}</a>`,hero:null};
  }
}

export async function sharedDailySpace(space,pets,accountId) {
  if(!pets.length)return '';
  try {return panel(await model(space,pets,accountId));}
  catch(error) {return `<p class="shared-empty" role="alert">${h(error.message||'共同记录暂时无法读取')}</p>`;}
}

export function bindSharedDaily(root,{render,toast}) {
  root.addEventListener('change',async event=>{
    const input=event.target;
    if(input.matches('[data-shared-daily-pet]')){
      scopedStorage.setItem(SELECTED_KEY,input.value);await render();
    }else if(input.matches('.sd-photo-picker input')){
      const name=input.closest('form')?.querySelector('.sd-photo-name');
      if(name)name.textContent=input.files?.[0]?.name||'';
    }
  });
  root.addEventListener('click',async event=>{
    const button=event.target.closest('[data-shared-daily-care],[data-shared-daily-delete]');
    if(!button)return;
    button.disabled=true;
    try {
      const spaceId=encodeURIComponent(button.dataset.spaceId);
      if(button.hasAttribute('data-shared-daily-care')){
        await request(`/v1/spaces/${spaceId}/events`,'POST',{petId:button.dataset.petId,
          kind:button.dataset.sharedDailyCare,occurredOn:today()});
        toast('已同步给共养家人');
      }else{
        if(!confirm('删除这条共养记录？如果附有照片，照片也会一并删除。'))return;
        await request(`/v1/spaces/${spaceId}/events/${encodeURIComponent(button.dataset.sharedDailyDelete)}`,'DELETE');
        toast('记录已删除');
      }
      await render();
    }catch(error){toast(error.message);}finally{button.disabled=false;}
  });
  root.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-shared-daily-moment]');if(!form)return;
    event.preventDefault();
    const button=form.querySelector('[type="submit"]'),error=form.querySelector('.form-error');
    button.disabled=true;error.textContent='';
    let uploaded=null;
    const petId=encodeURIComponent(form.dataset.petId),spaceId=encodeURIComponent(form.dataset.spaceId);
    try {
      const text=form.elements.text.value.trim(),file=form.elements.photo.files?.[0];
      if(!text&&!file)throw new Error('写一句话或选一张照片就好');
      if(file){
        if(!['image/jpeg','image/png'].includes(file.type)||!file.size||file.size>5*1024*1024)
          throw new Error('请选择 5 MB 以内的 JPG 或 PNG 照片');
        const result=await request(`/v1/pets/${petId}/photos?purpose=moment`,'POST',file,file.type);
        uploaded=result.photo.id;
      }
      await request(`/v1/spaces/${spaceId}/events`,'POST',{
        petId:form.dataset.petId,kind:'moment',text,photoId:uploaded,occurredOn:today()});
      toast('这一刻已和家人共享');await render();
    }catch(problem){
      if(uploaded)await request(`/v1/pets/${petId}/photos/${encodeURIComponent(uploaded)}`,'DELETE').catch(()=>{});
      error.textContent=problem.message||'保存失败，请稍后重试';
    }finally{button.disabled=false;}
  });
}
