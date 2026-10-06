import * as db from './db.js';
import { encryptArchive, decryptArchive } from './backup-crypto.js';
import {createFullArchive, restoreFullArchive, cloudBackupStatus, uploadCloudBackup} from './backup-service.js';
import {h, icon, today, header, readLocal, writeLocal} from './life-ui.js';
import {renderCare, bindCare, carePreview} from './life-care.js';
import {loadConfig, applyConfig, NAV_LABELS} from './ui-config.js';
import {applyLayout} from './layout-editor.js';
import {firstUseChoice, firstUsePage, saveFirstUseChoice} from './first-use.js';
import {accountStatus, accountPage, submitAccount, signOut, deleteAccount, saveLocationReminder} from './account-ui.js';
import {scopedStorage as localStorage, setLocalScope} from './local-scope.js';
import {buildAlbum, albumMonths} from './album.js';

const root = document.querySelector('#app');
const DEMO = {id:'demo-mochi',name:'糯米',species:'金毛寻回犬',traits:'喜欢散步，也喜欢赖在你身边。',animalType:'dog'};
const ASSETS = '/assets/life/';
let pets=[], pet=DEMO, cover='', video='', urls=[], renderId=0, config=loadConfig(), activeAccountId=null, accountScopeReady=false, accountServiceAvailable=false;
let communityTab='精选', communityQuery='';
const communitySamples = [
 {id:'walk',title:'把散步的时间，留给它慢慢闻。',text:'今天没有赶路，跟着它在草地上多停了一会儿。原来每天走过的路，对它来说都有新发现。\n\n你家的狗狗，也有一条总想多走一遍的路线吗？',author:'栗子和小满',topic:'遛狗日常',location:'同城生活',image:'community-walk.webp'},
 {id:'home',title:'它把窗边，过成了自己的小世界。',text:'搬了一张椅子到窗边，从此这里就是它的专属座位。晒太阳、打盹、看路过的鸟，每一天都很忙。',author:'一只白桃',topic:'居家日常',location:'家里的小事',image:'community-home.webp'},
 {id:'groom',title:'洗完澡，抱起来是蓬松的。',text:'把喜欢的造型照片和洗护时需要注意的习惯提前整理好，下次去店里，沟通就更轻松了。\n\n这里是用于体验页面的示例内容。',author:'毛孩子观察员',topic:'洗护笔记',location:'同城生活',image:'grooming.webp'},
 {id:'mochi',title:'今天的愿望：再陪我玩一会儿。',text:'收拾玩具的时候发现，它最喜欢的还是那只旧球。把这些平平常常的小事留下来，以后翻看，也会记得今天的样子。',author:'糯米的日常',topic:'陪伴时光',location:'家里的小事',image:'hero.webp'}
];
function toast(message) {const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3500);}
function go(path) {if(location.hash==='#'+path)render(true);else location.hash=path;}
function route(){try{return location.hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);}catch{return ['home'];}}
function imageUrl(blob){const url=URL.createObjectURL(blob);urls.push(url);return url;}
const isDemo=()=>pet.id===DEMO.id;
const petPath=()=>isDemo()?'pet/new':'pet/'+encodeURIComponent(pet.id);
const avatar=()=>cover?`<img src="${h(cover)}" alt="${h(pet.name)}的照片">`:`<span class="avatar-fallback">${icon('paw')}</span>`;
function context(){return {h,icon,toast,go,rerender:()=>render(true),pet,today,imageUrl};}
function empty(text,detail='',action=''){return `<section class="empty-state">${icon('photo')}<h2>${h(text)}</h2><p>${h(detail)}</p>${action}</section>`;}
function sectionTitle(title,link='',label='查看全部'){return `<div class="section-title"><h2>${h(title)}</h2>${link?`<a href="#${h(link)}">${h(label)}${icon('chevron-right')}</a>`:''}</div>`;}

async function loadPet(){
 pets=await db.listPets();pet=pets.find(p=>p.id===localStorage.getItem('pet-active-id'))||pets[0]||DEMO;
 cover=isDemo()?ASSETS+'hero.webp':'';video='';
 if(!isDemo()){const [photos,captures]=await Promise.all([db.listPhotos(pet.id),db.listCaptures(pet.id)]);const picture=captures.find(c=>c.slot==='front')?.blob||photos[0]?.blob||captures.find(c=>c.slot!=='video')?.blob; if(picture)cover=imageUrl(picture);const movie=captures.find(c=>c.slot==='video')?.blob;if(movie)video=imageUrl(movie);}
}

function shell(content,active='home',hideNav=false){
 const navIcons={home:'home',checkins:'calendar',memories:'photo',community:'paw',settings:'user'};
 return `<div class="desktop-note"><span class="brand-monogram">${icon('paw')}</span><strong>${h(config.branding.name)}</strong><span>和它一起，把日子过好。</span><small>手机体验版 · 生活正在发生</small></div><main class="app-shell ${active}-shell ${hideNav?'subpage':''}"><div id="screen">${content}</div></main>${hideNav?'':`<nav class="bottom-nav" aria-label="主导航">${config.navOrder.map(key=>`<a href="#${key}" ${key===active?'aria-current="page"':''}>${icon(navIcons[key])}<span>${h(NAV_LABELS[key])}</span></a>`).join('')}</nav>`}`;
}
async function home(){
 const date=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
 const intro=`<header class="home-top"><a class="wordmark" href="#home">${config.branding.icon?`<img class="brand-icon" src="${h(config.branding.icon)}" alt="">`:""}${h(config.branding.name)}<span>LIUNIAN</span></a><a class="icon-button" href="#checkins" aria-label="查看今日照护">${icon('calendar')}</a></header><div class="home-greeting"><p>${h(date)}<span>和它一起，慢一点</span></p><button class="pet-switcher" data-action="switch-pet">${avatar()}<strong>${h(pet.name)}的日常</strong>${icon('chevron-down')}${isDemo()?'<small>示例体验</small>':''}</button></div>`;
 const hero=`<section class="home-pet-hero ${cover?'':'without-photo'}">${cover?`<img class="hero-image" src="${h(cover)}" alt="${h(pet.name)}的首页照片" fetchpriority="high">`:`<div class="hero-empty">${icon('camera')}<p>把它的样子，留在首页</p></div>`}${video?`<video class="hero-video" src="${h(video)}" ${cover?`poster="${h(cover)}"`:''} autoplay loop muted playsinline preload="metadata" aria-label="${h(pet.name)}的首页视频"></video>`:''}<div class="hero-shade"></div><a class="hero-edit" href="#${isDemo()?'pet/new':'pet/edit/'+encodeURIComponent(pet.id)}">${icon('camera')}${isDemo()?'换成我家宠物':'更换照片 / 视频'}</a><div class="hero-caption"><span>${video?'生活片段':'属于我们的日常'}</span><h1>平常的一天，<br>因为你，很特别。</h1><a href="#${petPath()}">${h(pet.name)}的生活档案${icon('arrow-right')}</a></div>${video?`<div class="video-controls"><button class="icon-button" data-action="video-play" aria-label="暂停视频">${icon('pause')}</button><button class="icon-button" data-action="video-sound" aria-label="开启视频声音">${icon('mute')}</button></div>`:''}</section>`;
 const quick=`<section class="home-actions"><a href="#checkins/new">${icon('edit')}<span>记一笔</span></a><a href="#memories">${icon('photo')}<span>时光相册</span></a><a href="#community">${icon('paw')}<span>逛逛社区</span></a><a href="#${petPath()}">${icon('user')}<span>宠物档案</span></a></section>`;
 const care=await carePreview(context());
 const recent=isDemo()?`<a class="memory-feature" href="#memories"><img src="${ASSETS}community-walk.webp" alt="散步时光示例"><div><small>日子里的小事 · 示例</small><h3>好好散步，<br>也是好好陪伴。</h3><span>翻开时光相册 ${icon('arrow-right')}</span></div></a>`:await homeRecent();
 const modules={intro,pets:hero,cta:quick+care+`<section class="home-recent">${sectionTitle('值得留下的瞬间','memories')}${recent}</section>`,banner:config.banner.enabled?`<section class="home-guide"><p class="guide-eyebrow">${h(config.banner.eyebrow)}</p>${sectionTitle(config.banner.title||'一起分享那些小事','community','去看看')}<p class="guide-description">${h(config.banner.text)}</p><a class="memory-feature community-feature" href="#community/post/home"><img src="${ASSETS}community-home.webp" alt="居家陪伴示例"><div><small>社区故事 · 示例</small><h3>有你在家，<br>就是好日子。</h3><span>读一读大家的日常 ${icon('arrow-right')}</span></div></a></section>`:'',privacy:`<p class="home-privacy">${isDemo()?'先逛一逛，再留下你们自己的故事。':'你留下的日常，只属于你和它。'} <a href="#privacy">保存说明</a></p>`};
 return config.homeOrder.map(key=>modules[key]||'').join('');
}
async function petAlbum(){
 const [memories,checkins,captures,photos]=await Promise.all([db.listMemories(pet.id),db.listCheckins(pet.id),db.listCaptures(pet.id),db.listPhotos(pet.id)]);
 return buildAlbum({memories,checkins,captures,photos,petId:pet.id});
}
async function homeRecent(){const recent=(await petAlbum())[0];return recent?`<a class="recent-entry" href="#memories"><span class="date-stamp">${h(recent.date.slice(5).replace('-','.'))}</span><div><p>${h(recent.text||recent.tag)}</p><small>${h(pet.name)}的日常</small></div>${recent.photo?`<img src="${imageUrl(recent.photo)}" alt="最近的记录">`:icon('chevron-right')}</a>`:`<a class="blank-memory" href="#checkins/new">${icon('plus')}<div><strong>今天，有什么想记下来？</strong><span>一张照片，或一句话就好。</span></div></a>`;}

async function petForm(id){
 const existing=id?await db.getPet(id):null;if(id&&!existing)return empty('没有找到这份档案','它可能已经被删除。');
 const meta=readLocal('pet-life-meta-v1',{})[id]||{};
 const captures=existing?await db.listCaptures(id):[];const picture=captures.find(c=>c.slot==='front')?.blob;const hasVideo=captures.some(c=>c.slot==='video');
 const src=picture?imageUrl(picture):(existing?.id===pet.id?cover:'');
 return `${header(existing?'编辑宠物档案':'认识你的毛孩子',existing?'pet/'+id:'home')}<div class="page-heading"><span class="eyebrow">每段陪伴，都从认识开始</span><h2>${existing?'把它的日常，慢慢补齐。':'让首页，变成它的模样。'}</h2><p>一张照片或一段视频，就能拥有你们的生活主页。</p></div><form id="life-pet-form" data-id="${h(id||'')}" class="form-stack"><label class="cover-upload form-photo-section"><span id="cover-preview">${src?`<img src="${h(src)}" alt="当前封面">`:`${icon('camera')}<strong>上传一张它的照片</strong><small>JPG / PNG · 8 MB 以内</small>`}</span><span class="upload-edit">${icon('plus')}选择照片</span><input id="life-cover" type="file" name="cover" accept="image/jpeg,image/png" class="file-input"></label><label class="video-upload">${icon('video')}<span><strong>${hasVideo?'更换首页视频':'上传首页视频'}</strong><small id="video-name">可选 · 建议 5–15 秒，25 MB 以内</small></span>${icon('plus')}<input id="life-video" type="file" name="video" accept="video/mp4,video/webm,video/quicktime,.mov" class="file-input"></label>${hasVideo?'<button type="button" class="text-button danger" data-action="remove-video" data-id="'+h(id)+'">移除当前首页视频</button>':''}<div class="field"><label for="pet-name">它叫什么名字 <span>*</span></label><input id="pet-name" name="name" placeholder="例如：糯米" maxlength="60" required value="${h(existing?.name||'')}"></div><div class="field-grid"><div class="field"><label for="pet-type">宠物类型</label><select id="pet-type" name="animalType"><option value="dog"${existing?.animalType==='cat'?'':' selected'}>狗狗</option><option value="cat"${existing?.animalType==='cat'?' selected':''}>猫咪</option></select></div><div class="field"><label for="pet-species">品种</label><input id="pet-species" name="species" placeholder="例如：金毛" maxlength="40" value="${h(existing?.species||'')}"></div></div><div class="field-grid optional-details"><div class="field"><label for="pet-birthday">生日 / 纪念日</label><input id="pet-birthday" type="date" name="birthday" max="${today()}" value="${h(meta.birthday||'')}"></div><div class="field"><label for="pet-sex">性别</label><select id="pet-sex" name="sex"><option value="">暂不填写</option><option value="男孩子"${meta.sex==='男孩子'?' selected':''}>男孩子</option><option value="女孩子"${meta.sex==='女孩子'?' selected':''}>女孩子</option></select></div></div><div class="field"><label for="pet-traits">它的小习惯</label><textarea id="pet-traits" name="traits" maxlength="500" rows="3" placeholder="喜欢什么、怕什么，都可以记在这里。">${h(existing?.traits||'')}</textarea></div><p class="form-footnote">${icon('shield')}照片和视频仅保存在当前设备，不会自动公开。</p><p class="form-error" role="alert"></p><button class="button primary" type="submit">${existing?'保存修改':'建立我们的生活主页'}${icon('arrow-right')}</button></form>`;
}
async function petDetail(id){const p=await db.getPet(id);if(!p)return empty('先认识你的宠物','建一份档案，把今天开始的日子留下来。',`<a class="button primary" href="#pet/new">添加宠物</a>`);const [captures,photos,memories,checks]=await Promise.all([db.listCaptures(id),db.listPhotos(id),db.listMemories(id),db.listCheckins(id)]);const pic=captures.find(c=>c.slot==='front')?.blob||photos[0]?.blob;const meta=readLocal('pet-life-meta-v1',{})[id]||{};return `${header('宠物档案','home',`<a class="icon-button" href="#pet/edit/${h(id)}" aria-label="编辑档案">${icon('edit')}</a>`)}<div class="profile-portrait">${pic?`<img src="${imageUrl(pic)}" alt="${h(p.name)}">`:icon('paw')}</div><div class="profile-title"><small>MY LITTLE COMPANION</small><h1>${h(p.name)}</h1><p>${h(p.species||'我家的毛孩子')}${meta.sex?' · '+h(meta.sex):''}</p></div><div class="pet-stat-grid"><div><strong>${checks.length}</strong><span>生活记录</span></div><div><strong>${memories.length}</strong><span>珍藏回忆</span></div><div><strong>${photos.length+captures.filter(c=>c.slot!=='video').length}</strong><span>照片</span></div></div><section class="profile-note"><h2>关于它的小事</h2><p>${h(p.traits||'它喜欢什么、害怕什么，慢慢写下来。')}</p>${meta.birthday?`<p class="muted">生日 / 纪念日：${h(meta.birthday)}</p>`:''}</section><div class="menu-group">${config.detailOrder.map(key=>key==='photo'?menuRow('camera','首页照片与视频','随时更新它的样子','pet/edit/'+id):menuRow('edit','编辑宠物资料','名字、生日与小习惯','pet/edit/'+id+'/details')).join('')}${menuRow('photo','时光相册','一起经过的日子','memories')}${menuRow('calendar','照护记录','记录每一次用心','checkins')}</div><button class="text-button danger" data-action="delete-pet" data-id="${h(id)}">删除这份宠物档案</button>`;}

async function memories(parts=[]){
 const all=isDemo()?[]:await petAlbum();
 const filter=['all','media','notes'].includes(parts[1])?parts[1]:'all';
 const items=all.filter(item=>filter==='all'||(filter==='media'?item.kind!=='note':item.kind==='note'));
 const tabs=[['all','全部'],['media','照片与视频'],['notes','文字']];
 const card=item=>`<article class="album-entry"><div class="album-entry-meta"><time datetime="${h(item.date)}">${h(item.date.slice(5).replace('-','.'))}</time><span>${h(item.tag)}</span></div>${item.video?`<video src="${imageUrl(item.video)}" ${item.photo?`poster="${imageUrl(item.photo)}"`:''} controls playsinline preload="metadata" aria-label="${h(pet.name)}的首页视频"></video>`:item.photo?`<a href="${h(item.href)}"><img src="${imageUrl(item.photo)}" alt="${h(pet.name)}在${h(item.date)}的照片" loading="lazy"></a>`:''}${item.text?`<p>${h(item.text)}</p>`:''}<a class="album-entry-link" href="${h(item.href)}">${item.source==='memory'||item.source==='checkin'?'查看与编辑':'查看档案'} ${icon('chevron-right')}</a></article>`;
 return `<header class="page-top"><div><span class="eyebrow">OUR LITTLE DAYS</span><h1>时光相册</h1></div><a class="icon-button filled" href="#${isDemo()?'pet/new':'checkins/new'}" aria-label="记录这一刻">${icon('plus')}</a></header><div class="page-heading"><span class="eyebrow">${h(pet.name)} & YOU</span><h2>把平常，留成珍藏。</h2><p>${isDemo()?'先看看样子，再换成你家毛孩子的故事。':`已留下 ${all.length} 个瞬间。照片、视频和文字按发生时间排在一起。`}</p></div>${isDemo()?`<p class="notice subtle">以下为相册示例，添加宠物后将展示自己的记录。</p><div class="album-grid"><a class="album-image tall" href="#community/post/walk"><img src="${ASSETS}community-walk.webp" alt="一起散步的示例照片"><span>散步时的小发现</span></a><a class="album-image" href="#community/post/mochi"><img src="${ASSETS}hero.webp" alt="居家陪伴示例照片"><span>有你在家的日子</span></a><div class="album-quote">一起慢慢走，<br>把日子过成<br>喜欢的样子。<span>OUR LITTLE DAYS</span></div></div><a class="button primary" href="#pet/new">开始记录我们的故事${icon('plus')}</a>`:`<div class="album-privacy">${icon('shield')} 仅保存在这台设备，不会自动分享</div><div class="album-filters" role="group" aria-label="筛选时光记录">${tabs.map(([key,label])=>`<a href="#memories/${key}" ${key===filter?'aria-current="page"':''}>${label}</a>`).join('')}</div><a class="album-write" href="#memory/new">写一段只属于我们的回忆 ${icon('arrow-right')}</a>${items.length?`<div class="album-months">${albumMonths(items).map(group=>`<section class="album-month"><h3>${h(group.month.slice(0,4))} 年 ${Number(group.month.slice(5))} 月 <span>${group.entries.length} 个瞬间</span></h3>${group.entries.map(card).join('')}</section>`).join('')}</div>`:all.length?empty('这个筛选下还没有记录','换一个分类，看看其他日常。','<a class="button secondary" href="#memories/all">查看全部</a>'):empty('我们的故事，从今天开始','不必写得完整，一句话或一张照片都值得留下。',`<a class="button primary" href="#checkins/new">记下今天${icon('plus')}</a>`)}`}`;
}
async function memoryForm(id){if(isDemo())return petForm();const item=id?await db.getMemory(id):null;if(id&&item?.petId!==pet.id)return empty('这段回忆不属于当前宠物','请切换到对应的宠物档案后再查看。','<a class="button secondary" href="#pets">切换宠物</a>');return `${header(id?'编辑回忆':'写一段回忆','memories')}<div class="page-heading"><h2>有什么小事，<br>想以后也记得？</h2></div><form id="life-memory-form" class="form-stack" data-id="${h(id||'')}"><div class="field"><label for="memory-text">想留下的话</label><textarea id="memory-text" name="text" rows="8" maxlength="2000" required placeholder="今天，它又做了一件让我笑的事……">${h(item?.text||'')}</textarea></div><div class="field"><label for="memory-date">发生的日期</label><input id="memory-date" name="date" type="date" max="${today()}" value="${h(item?.happenedOn||today())}"></div><p class="form-error" role="alert"></p><button class="button primary" type="submit">保存这段回忆</button>${id?`<button type="button" class="text-button danger" data-action="delete-memory" data-id="${h(id)}">删除回忆</button>`:''}</form>`;}

function liked(id){return readLocal('pet-life-likes-v1',[]).includes(id);}
async function community(parts){
 if(parts[1]==='post'){const post=communitySamples.find(p=>p.id===parts[2]);if(!post)return empty('内容不存在');return `${header('社区故事','community',`<button class="icon-button ${liked(post.id)?'is-liked':''}" data-action="like" data-id="${post.id}" aria-label="${liked(post.id)?'取消收藏':'收藏故事'}">${icon('bookmark')}</button>`)}<img class="post-detail-image" src="${ASSETS+post.image}" alt="${h(post.title)}"><div class="post-detail"><span class="entry-tag">${h(post.topic)} · 示例内容</span><h1>${h(post.title)}</h1><div class="post-author"><span>${h(post.author.slice(0,1))}</span><strong>${h(post.author)}</strong><small>生活灵感</small></div><p>${h(post.text).replace(/\n/g,'<br>')}</p><div class="post-footer">${icon('heart')}喜欢这些小事，就把自己的日常也留下来。</div><a class="button secondary" href="#community/new">写下我的日常${icon('edit')}</a></div>`;}
 if(['new','edit'].includes(parts[1]))return postForm(parts[1]==='edit'?parts[2]:null);
 const drafts=await db.listPosts();let samples=communitySamples.filter(p=>(communityTab!=='同城'||p.location==='同城生活')&&(p.title+p.topic+p.author).includes(communityQuery));
 return `<header class="page-top"><div><span class="eyebrow">在这里，遇见同样的喜欢</span><h1>毛孩子的朋友圈</h1></div><a class="icon-button filled" href="#community/new" aria-label="写分享草稿">${icon('plus')}</a></header><div class="community-tabs" role="tablist" aria-label="社区内容">${['精选','同城','我的草稿'].map(t=>`<button role="tab" aria-selected="${t===communityTab}" data-action="community-tab" data-tab="${t}">${t}${t==='我的草稿'&&drafts.length?`<small>${drafts.length}</small>`:''}</button>`).join('')}</div>${communityTab==='我的草稿'?`<p class="notice">草稿只保存在你的设备上，由你决定什么时候分享。</p>${drafts.length?`<div class="draft-list">${drafts.map(p=>`<article class="post-draft">${p.photo?`<img src="${imageUrl(p.photo)}" alt="草稿照片">`:''}<div><small>${h(p.topic||'日常分享')} · 未公开</small><p>${h(p.text)}</p><a href="#community/edit/${encodeURIComponent(p.id)}">继续编辑${icon('arrow-right')}</a></div></article>`).join('')}</div>`:empty('先写下，再决定分享','社区发布尚未开放，自己的内容可以先存为草稿。',`<a class="button primary" href="#community/new">写一条草稿</a>`)}`:`<form id="community-search" class="search-field">${icon('search')}<input name="query" value="${h(communityQuery)}" placeholder="找找散步、洗护和生活灵感" aria-label="搜索社区"><button type="submit">搜索</button></form><div class="story-strip" aria-label="日常故事"><a class="story-new" href="#community/new"><span>${icon('plus')}</span><small>我的日常</small></a>${communitySamples.slice(0,3).map(p=>`<a href="#community/post/${p.id}"><img src="${ASSETS+p.image}" alt="${h(p.author)}"><small>${h(p.author)}</small></a>`).join('')}</div><div class="topic-strip"><button data-action="topic" data-topic="遛狗"># 好好散步</button><button data-action="topic" data-topic="居家"># 在家的日子</button><button data-action="topic" data-topic="">全部话题</button></div><p class="sample-caption">${communityTab==='同城'?'同城版式预览 · 未使用定位':'精选内容为示例 · 你的资料不会自动公开'}</p>${samples.length?`<div class="community-grid">${samples.map(p=>`<article class="community-card"><div class="community-author"><img src="${ASSETS+p.image}" alt=""><div><strong>${h(p.author)}</strong><span>${h(p.location)} · 示例</span></div><span class="author-topic"># ${h(p.topic)}</span></div><a href="#community/post/${p.id}"><img class="feed-photo" src="${ASSETS+p.image}" alt="${h(p.title)}" loading="lazy"></a><div class="community-meta"><button class="story-save ${liked(p.id)?'is-liked':''}" data-action="like" data-id="${p.id}" aria-label="${liked(p.id)?'取消收藏':'收藏'}${h(p.title)}" aria-pressed="${liked(p.id)}">${icon('heart')}<span>${liked(p.id)?'已收藏':'收藏这份日常'}</span></button><a href="#community/post/${p.id}">读一读${icon('arrow-right')}</a></div><a href="#community/post/${p.id}"><h2>${h(p.title)}</h2></a><p class="feed-excerpt">${h(p.text.split('\n')[0])}</p></article>`).join('')}</div>`:empty('还没有找到相关内容','换一个关键词，或看看全部话题。')}`}`;
}
async function postForm(id){const p=id?await db.getPost(id):null;if(id&&!p)return empty('没有找到这条草稿');return `${header(id?'编辑分享草稿':'记一件小事','community')}<div class="page-heading"><h2>它的日常，<br>有你才完整。</h2><p>先保存在自己这里，准备好了再分享。</p></div><form id="life-post-form" class="form-stack" data-id="${h(id||'')}"><div class="field"><label for="post-text">想分享的日常</label><textarea id="post-text" name="text" maxlength="1000" rows="6" placeholder="今天和毛孩子一起……">${h(p?.text||'')}</textarea></div><label class="post-photo-upload">${icon('camera')}<span id="post-photo-name">${p?.photo?'替换草稿照片':'添一张照片'}</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" class="file-input"></label>${p?.photo?`<img class="draft-photo-preview" src="${imageUrl(p.photo)}" alt="草稿照片"><label class="checkbox-row"><input type="checkbox" name="removePhoto">移除这张照片</label>`:''}<div class="field"><label for="post-topic">话题</label><select id="post-topic" name="topic">${['日常分享','遛狗日常','居家日常','洗护笔记'].map(t=>`<option${p?.topic===t?' selected':''}>${t}</option>`).join('')}</select></div><p class="form-footnote">${icon('shield')}仅存为本机草稿，尚不会发布到社区。</p><p class="form-error" role="alert"></p><button class="button primary" type="submit">保存草稿</button>${id?`<button type="button" class="text-button danger" data-action="delete-post" data-id="${h(id)}">删除草稿</button>`:''}</form>`;}

function menuRow(ico,title,note,link){return `<a class="menu-row" href="#${h(link)}"><span class="menu-icon">${icon(ico)}</span><div><strong>${h(title)}</strong>${note?`<small>${h(note)}</small>`:''}</div>${icon('chevron-right')}</a>`;}
async function settings(){
 const records=isDemo()?[]:await db.listCheckins(pet.id), posts=await db.listPosts();
 const accountNote=accountServiceAvailable?'账号仅识别身份，资料仍在本机':'此测试版尚未连接账号服务';
 return `<header class="page-top"><h1>我的</h1><a class="icon-button" href="#data" aria-label="数据与设置">${icon('settings')}</a></header>
 <a class="account-summary" href="#${petPath()}"><div class="account-avatar">${avatar()}</div><div><small>${isDemo()?'欢迎来到留念':'和毛孩子一起的每一天'}</small><h2>${isDemo()?'建立我们的生活主页':h(pet.name)+'的家'}</h2><p>${isDemo()?'添加宠物，开始你们的故事':h(pet.species||'我的毛孩子')+' · 私人生活档案'}</p></div>${icon('chevron-right')}</a>
 <div class="profile-counts"><a href="#checkins"><strong>${records.length}</strong><span>生活记录</span></a><a href="#community" data-action="my-drafts"><strong>${posts.length}</strong><span>分享草稿</span></a><a href="#saved"><strong>${readLocal('pet-life-likes-v1',[]).length}</strong><span>我的收藏</span></a></div>
 <section class="storage-card" aria-label="资料保存状态"><div class="storage-card-copy"><span class="storage-state"><i aria-hidden="true"></i>仅此浏览器保存</span><p>换手机或清理浏览器前，请先导出备份。</p></div><a href="#data/local">去备份${icon('arrow-right')}</a></section>
 <a class="album-banner" href="#memories"><div><span>OUR LITTLE DAYS</span><h3>一起走过的日子，<br>都值得珍藏。</h3><small>翻开时光相册 ${icon('arrow-right')}</small></div><img src="${cover||ASSETS+'community-home.webp'}" alt="时光相册封面"></a>
 <div class="menu-group">${menuRow('paw','我的宠物',pets.length?pets.length+' 份宠物档案':'添加第一位家庭成员','pets')}${menuRow('bookmark','收藏的故事','喜欢的日常，留着慢慢看','saved')}</div>
 <div class="menu-group">${menuRow('download','资料与备份','导出、恢复你的生活记录','data')}${menuRow('user',accountServiceAvailable?'注册与登录':'账号服务未连接',accountNote,'account')}${menuRow('shield','隐私与安全','','privacy')}${menuRow('shield','首次使用与定位选择','查看或修改本机授权选择','permissions')}${menuRow('message','关于留念','每一天，都有它','about')}</div><p class="app-version">留念 · 宠物生活内测版 <span>v1.0 beta.2</span></p>`;
}
async function petList(){return `${header('我的宠物','settings')}<div class="page-heading"><h2>家里的每一位，<br>都有自己的故事。</h2></div><div class="menu-group">${pets.map(p=>`<button class="menu-row" data-action="select-pet" data-id="${h(p.id)}"><span class="menu-icon">${icon('paw')}</span><div><strong>${h(p.name)}</strong><small>${h(p.species||'家庭成员')}</small></div>${p.id===pet.id?icon('check'):icon('chevron-right')}</button>`).join('')}</div><a class="button primary" href="#pet/new">${icon('plus')}添加宠物</a>`;}
function saved(){const ids=readLocal('pet-life-likes-v1',[]);const items=communitySamples.filter(p=>ids.includes(p.id));return `${header('收藏的故事','settings')}${items.length?`<div class="saved-list">${items.map(p=>`<a class="saved-story" href="#community/post/${p.id}"><img src="${ASSETS+p.image}" alt="${h(p.title)}"><div><small>${h(p.topic)}</small><h2>${h(p.title)}</h2><span>${h(p.author)}</span></div>${icon('chevron-right')}</a>`).join('')}</div>`:empty('把喜欢的日常留在这里','在社区点亮爱心，就能在这里找到。',`<a class="button primary" href="#community">逛逛社区</a>`)}`;}
async function dataPage(){
 const cloud=await cloudBackupStatus();
 return `${header('资料与备份','settings')}<div class="page-heading"><span class="eyebrow">目前仅此浏览器保存</span><h2>先留一份，<br>在自己手里。</h2><p>照片、视频和记录尚未实时同步。换设备前，请导出加密备份文件。</p></div><section class="setting-card"><h2>导出或恢复全部资料</h2><p>把照片、视频、记录和设置导出成加密文件，由你保管；也可以从文件恢复。</p><a class="button primary" href="#data/local">管理本机备份${icon('arrow-right')}</a></section><section class="setting-card"><h2>云端备份 · ${cloud.connected?'已连接':'未连接'}</h2><p>${cloud.connected?'可以主动备份到当前登录的云端空间。资料仍不会自动同步。':'云端数据库尚未接入这个测试版；这里保留后续接入和查看状态的入口。'}</p><a class="button secondary" href="#data/cloud">${cloud.connected?'管理云端备份':'查看接入状态'}${icon('arrow-right')}</a></section>`;
}
async function cloudBackupPage(){let state;try{state=await cloudBackupStatus();}catch{state={connected:false,reason:'暂时无法连接云端服务，请稍后重试'};}return `${header('云端备份','data')}<div class="page-heading"><h2>在云端，<br>多留一份。</h2><p>仅在你主动确认后备份，不会自动上传本机资料。</p></div><section class="setting-card"><h2>${state.connected?'已连接账户':'尚未连接云端'}</h2><p>${state.connected?'可以备份全部宠物资料、照片、视频、记录和设置。':h(state.reason||'需要先连接云端服务并登录账户。')}</p><p>你的资料仍保存在当前设备。云端备份完成后才会显示保存结果。</p><button class="button primary" data-action="cloud-backup" ${state.connected?'':'disabled'}>备份全部资料到云端</button><button class="text-button" data-action="retry">刷新连接状态</button></section><section class="setting-card"><h2>云端备份记录</h2><p>恢复与删除入口已预留，连接正式服务后开放。恢复前将先让你确认，避免覆盖当前资料。</p><button class="button secondary" disabled>查看与恢复备份（待接入）</button></section><a class="text-button" href="#data/local">现在先导出一份本机备份</a>`;}
function localBackupPage(){return `${header('自行备份全部资料','data')}<div class="page-heading"><h2>你留下的，<br>由你保管。</h2><p>资料目前保存在当前浏览器。换设备前，记得导出一份备份。</p></div><section class="setting-card"><div class="setting-heading">${icon('download')}<h2>保存一份完整备份</h2></div><p>新备份使用密码加密。包含宠物资料、照片、视频、日常记录、草稿和本机照护设置；城市与界面设置、旧版预约演示记录也会保留。登录凭据不导出。</p><div class="field"><label for="backup-password">备份密码（至少 12 个字符）</label><input id="backup-password" type="password" minlength="12" maxlength="256" autocomplete="new-password"></div><div class="field"><label for="backup-password-confirm">再次输入密码</label><input id="backup-password-confirm" type="password" maxlength="256" autocomplete="new-password"></div><p>请单独保存密码，遗失后无法找回。此密码仅用于备份文件，不会给本机资料上锁。</p><button class="button primary" data-action="export">导出加密备份</button></section><section class="setting-card"><div class="setting-heading">${icon('upload')}<h2>从备份恢复</h2></div><p>恢复会替换当前设备的宠物资料，请先导出已有内容。</p><div class="field"><label for="restore-password">备份密码（旧版未加密文件可留空）</label><input id="restore-password" type="password" maxlength="256" autocomplete="off"></div><label class="button secondary">选择备份文件<input id="archive-file" type="file" accept="application/json,.json" class="file-input"></label></section><section class="setting-card quiet-danger"><h2>清除本机资料</h2><p>清除后无法撤销，请先妥善保存备份。</p><button class="text-button danger" data-action="clear">清除资料</button></section>`;}
function privacy(){const city=readLocal('pet-location-city-v1','');return `${header('隐私与安全','settings')}<article class="reading-page"><span class="eyebrow">PRIVATE BY DEFAULT</span><h2>关于它的故事，<br>由你决定。</h2><h3>私人保存 · 尚未云端同步</h3><p>照片、视频、照护记录和草稿保存在当前浏览器，当前业务功能不会上传这些内容。连接账号服务时，不同账号使用不同的本机资料空间，但这些资料没有额外加密；能访问该设备浏览器的人仍可能读取。清理浏览器或更换设备可能导致资料丢失。</p><h3>体验版账号</h3><p>连接账号服务并注册时，服务端保存邮箱、加盐后的密码摘要、隐私说明版本和同意时间、可选的定位提醒设置，并用必要的会话 Cookie 保持登录。当前不会将宠物照片、视频、照护或草稿自动上传到账号。体验版尚无邮箱验证和密码找回，暂不适合开放正式注册。</p><h3>社区发布由你决定</h3><p>当前社区是示例，自己的内容仅存为私人草稿，首页照片和视频不会自动公开。原始媒体可能含拍摄地点等信息，向他人分享原文件前请检查。</p><section class="setting-card"><h3>设备定位 · 未启用</h3><p>当前版本不调用 GPS，不记录实时位置或遛狗轨迹。拒绝定位不影响养宠记录。可以选填城市，仅保存在本机，不会出现在社区动态中。</p><form id="privacy-city-form" class="form-stack"><div class="field"><label for="privacy-city">所在城市（选填，不要填写住址）</label><input id="privacy-city" name="city" maxlength="20" autocomplete="off" placeholder="例如：杭州" value="${h(city)}"></div><p class="form-error" role="alert"></p><button type="submit" class="button primary">保存城市</button></form><button class="text-button" data-action="clear-city">清除城市信息</button><p>同城内容仍为示例，暂未根据城市推荐真实内容。城市设置会包含在你主动创建的完整备份中。</p></section><h3>首次使用与定位选择</h3><p>首次进入时会分别说明本机资料保存和定位选择。当前定位只记录是否希望未来收到提醒；没有系统定位授权，也没有采集坐标。注册账号时会单独记录隐私选择。</p><a class="button secondary" href="#permissions">查看或修改选择${icon('arrow-right')}</a><h3>备份与删除</h3><p>可以导出、恢复或清除本机资料。新导出的备份使用密码加密，遗失密码无法恢复。旧版未加密备份仍含私人照片和视频，请妥善保管。清除本机资料不会删除已下载的备份。</p><a class="button secondary" href="#data">管理我的资料${icon('arrow-right')}</a><h3>网络访问与安全边界</h3><p>打开网页仍会连接网站托管服务，服务商可能记录 IP、访问时间等请求信息。当前不是正式云端产品，静态公开版尚未连接账号服务；云端备份和正式后台权限尚未上线。</p></article>`;}

function about(){return `${header('关于留念','settings')}<article class="about-page"><div class="brand-seal">${icon('paw')}</div><h1>留念</h1><span>LIUNIAN · LITTLE DAYS, TOGETHER</span><h2>养宠的日子，<br>值得认真过。</h2><p>记住它的小习惯，安排好下一次照护，<br>也留下那些没什么特别、却舍不得忘的小事。</p><p class="notice">这是可交互的手机网页原型，尚未作为微信小程序发布。示例图片为生成的摄影风素材，示例宠物和社区内容均用于体验。</p><a class="button secondary" href="#home">回到我们的日常</a></article>`;}

async function render(keepScroll=false){
 const token=++renderId, oldUrls=urls;urls=[];const scroll=window.scrollY;
 try{config=loadConfig();applyConfig(config);const parts=route();const section=parts[0]||'home';
  if(!firstUseChoice()&&section!=='privacy'&&section!=='permissions'){
   root.innerHTML=shell(firstUsePage(),'home',true);oldUrls.forEach(URL.revokeObjectURL);window.scrollTo({top:0,behavior:'instant'});return;
  }
  await loadPet();let html='',active=section,hide=false;
  if(section==='home'||section==='start')html=await home(),active='home';
  else if(section==='checkins'){html=await renderCare(parts,context());hide=parts.length>1;}
  else if(section==='services'||section==='orders'){go('home');return;}
  else if(section==='community'){html=await community(parts);hide=parts.length>1;}
  else if(section==='pet'){hide=true;active='settings';html=parts[1]==='new'?await petForm():parts[1]==='edit'?await petForm(parts[2]):await petDetail(parts[1]);}
  else if(section==='pets')html=await petList(),hide=true;
  else if(section==='memories')html=await memories(parts),active='memories';
  else if(section==='memory')html=await memoryForm(parts[1]==='edit'?parts[2]:null),hide=true;
  else if(section==='settings')html=await settings();
  else if(section==='saved')html=saved(),hide=true;
  else if(section==='data'){html=parts[1]==='local'?localBackupPage():parts[1]==='cloud'?await cloudBackupPage():await dataPage();hide=true;}
  else if(section==='privacy')html=privacy(),hide=true;
  else if(section==='permissions')html=firstUsePage(),hide=true;
  else if(section==='account')html=accountPage(await accountStatus(),parts[1],{h,icon,header}),hide=true;
  else if(section==='about')html=about(),hide=true;
  else html=empty('这一页暂时找不到','回到首页，继续你们的日常。','<a class="button primary" href="#home">回到首页</a>'),hide=true;
  if(token!==renderId)return;
  root.innerHTML=shell(html,active,hide);oldUrls.forEach(URL.revokeObjectURL);
  const screen=document.querySelector('#screen');bindCare(screen,context());applyLayout(root,config.layout);
  document.title=config.branding.name+' · 和它一起过日子';
  const hero=screen.querySelector('.hero-video');if(hero){hero.play().catch(()=>{const b=screen.querySelector('[data-action="video-play"]');if(b){b.innerHTML=icon('play');b.setAttribute('aria-label','播放视频');}});hero.addEventListener('error',()=>{hero.remove();screen.querySelector('.video-controls')?.remove();toast('这个视频暂时无法播放，可更换为 MP4 视频。');});}
  window.scrollTo({top:keepScroll?scroll:0,behavior:'instant'});if(section==='pet'&&parts[1]==='edit'&&parts[3]==='details')screen.querySelector('#pet-name')?.scrollIntoView({block:'center',behavior:'instant'});
 }catch(error){console.error(error);root.innerHTML=shell(empty('暂时没有打开这页',error.message,'<button class="button primary" data-action="retry">重新加载</button>'),'home',true);}
}

async function checkMedia(file,kind){
 if(!file?.size)return null;
 if(kind==='image') {if(!['image/jpeg','image/png'].includes(file.type)||file.size>8*1024*1024)throw new Error('请选择 8 MB 以内的 JPG 或 PNG 照片');const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('这张照片无法读取，请重新选择');});bitmap.close();}
 else if(!['video/mp4','video/quicktime','video/webm'].includes(file.type)||file.size>25*1024*1024)throw new Error('请选择 25 MB 以内的 MP4、MOV 或 WebM 视频');
 return file;
}
root.addEventListener('submit',async event=>{
 const form=event.target;if(!['account-form','account-preferences','first-use-form','life-pet-form','life-post-form','life-memory-form','community-search','privacy-city-form'].includes(form.id))return;event.preventDefault();
 const data=new FormData(form),button=form.querySelector('[type="submit"]'),error=form.querySelector('.form-error');if(button)button.disabled=true;if(error)error.textContent='';
 try{
  if(form.id==='first-use-form'){const returning=Boolean(firstUseChoice());saveFirstUseChoice(data);toast('选择已保存在本机');go(returning||event.submitter?.value==='explore'?'home':'pet/new');return;}
  if(form.id==='account-form'){await submitAccount(form);form.querySelectorAll('[type="password"]').forEach(input=>input.value='');location.hash='account';location.reload();return;}
  if(form.id==='account-preferences'){await saveLocationReminder(data.get('locationReminder')==='on');toast('定位提醒选择已保存；设备定位仍未开启');await render();return;}
  if(form.id==='privacy-city-form'){const city=String(data.get('city')||'').trim();if(city.length>20||/[<>]/.test(city))throw new Error('请填写 20 字以内的城市名称，不要填写详细住址');if(city)localStorage.setItem('pet-location-city-v1',JSON.stringify(city));else localStorage.removeItem('pet-location-city-v1');toast(city?'城市已保存在本机，未开启设备定位':'城市信息已清除');return;}
  if(form.id==='community-search'){communityQuery=String(data.get('query')||'').trim();await render();return;}
  if(form.id==='life-pet-form'){
   const id=form.dataset.id||undefined;const picture=await checkMedia(data.get('cover'),'image'),movie=await checkMedia(data.get('video'),'video');
   const previous=id?await db.getPet(id):{};const saved=await db.savePet({...previous,name:data.get('name'),species:data.get('species'),animalType:data.get('animalType'),traits:data.get('traits')},id);
   try{if(picture)await db.saveCapture(saved.id,'front',picture);if(movie)await db.saveCapture(saved.id,'video',movie);}catch(e){if(!id)await db.deletePet(saved.id);throw e;}
   const metadata=readLocal('pet-life-meta-v1',{});metadata[saved.id]={birthday:String(data.get('birthday')||''),sex:String(data.get('sex')||'')};writeLocal('pet-life-meta-v1',metadata);localStorage.setItem('pet-active-id',saved.id);toast(id?'档案已更新':'你们的生活主页，准备好了');go('home');
  }else if(form.id==='life-post-form'){
   const id=form.dataset.id||undefined;const old=id?await db.getPost(id):null;const photo=data.get('photo');await db.savePost({petId:old?.petId||(isDemo()?'':pet.id),text:data.get('text'),topic:data.get('topic'),photo:data.has('removePhoto')?null:photo?.size?photo:old?.photo||null},id);communityTab='我的草稿';toast('草稿已保存在本机，未公开');go('community');
  }else if(form.id==='life-memory-form'){const id=form.dataset.id||undefined;await db.saveMemory(pet.id,{text:data.get('text'),happenedOn:data.get('date')},id);toast('这段回忆，留下了');go('memories');}
 }catch(e){if(error)error.textContent=e.message;else toast(e.message);}finally{if(button)button.disabled=false;}
});

root.addEventListener('change',async event=>{
 const el=event.target;try{
 if(el.id==='life-cover'&&el.files[0]){const file=await checkMedia(el.files[0],'image');document.querySelector('#cover-preview').innerHTML=`<img src="${imageUrl(file)}" alt="已选择的宠物照片">`;}
 if(el.id==='life-video'&&el.files[0]){await checkMedia(el.files[0],'video');document.querySelector('#video-name').textContent=el.files[0].name;}
 if(el.name==='photo'&&el.files[0]){const label=document.querySelector('#post-photo-name');if(label)label.textContent=el.files[0].name;}
 if(el.id==='archive-file'&&el.files[0]){
  if(el.files[0].size>250*1024*1024)throw new Error('备份文件过大，请选择 250 MB 以内的文件');
  const archive=await decryptArchive(JSON.parse(await el.files[0].text()),document.querySelector('#restore-password')?.value||'');if(!confirm('恢复备份将替换当前设备的宠物资料。已保存好现有备份并继续吗？'))return;
  await restoreFullArchive(archive);
  toast('资料已恢复');go('home');
 }
 }catch(e){toast(e.message);el.value='';}
});
root.addEventListener('click',async event=>{
 const el=event.target.closest('[data-action]');if(!el)return;const action=el.dataset.action,id=el.dataset.id;
 try{
 if(action==='clear-city'){localStorage.removeItem('pet-location-city-v1');await render();toast('城市信息已清除');}
  if(action==='account-logout'){await signOut();location.hash='account';location.reload();return;}
  if(action==='account-delete'&&confirm('永久删除此账号及其服务端资料，并清除这台设备上该账号的本机记录？此操作无法撤销，请先导出备份。')){await deleteAccount();await db.deleteEverything();localStorage.keys().forEach(key=>localStorage.removeItem(key));location.hash='account';location.reload();return;}
 if(action==='retry')await render();
 if(action==='switch-pet')go('pets');
 if(action==='select-pet'){localStorage.setItem('pet-active-id',id);go('home');}
 if(action==='community-tab'){communityTab=el.dataset.tab;communityQuery='';await render();}
 if(action==='topic'){communityQuery=el.dataset.topic;await render();}
 if(action==='my-drafts')communityTab='我的草稿';
 if(action==='like'){const ids=readLocal('pet-life-likes-v1',[]);writeLocal('pet-life-likes-v1',ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);await render(true);}
 if(action==='video-play'){const v=root.querySelector('.hero-video');if(v.paused){await v.play();el.innerHTML=icon('pause');el.setAttribute('aria-label','暂停视频');}else{v.pause();el.innerHTML=icon('play');el.setAttribute('aria-label','播放视频');}}
 if(action==='video-sound'){const v=root.querySelector('.hero-video');v.muted=!v.muted;el.innerHTML=icon(v.muted?'mute':'volume');el.setAttribute('aria-label',v.muted?'开启视频声音':'关闭视频声音');}
 if(action==='remove-video'&&confirm('移除首页视频？已有照片会继续作为首页封面。')){await db.deleteCapture(id+':video');toast('视频已移除');await render();}
 if(action==='delete-pet'&&confirm('删除这份宠物档案以及关联的照片、视频、日常记录和预约演示？此操作无法撤销。')){await db.deletePet(id);const meta=readLocal('pet-life-meta-v1',{});delete meta[id];writeLocal('pet-life-meta-v1',meta);const care=readLocal('pet-life-care-tasks-v1',{});delete care[id];writeLocal('pet-life-care-tasks-v1',care);const service=readLocal('pet-life-service-v1',{});if(Array.isArray(service.orders)){service.orders=service.orders.filter(o=>o.petId!==id);writeLocal('pet-life-service-v1',service);}localStorage.removeItem('pet-active-id');toast('档案已删除');go('home');}
 if(action==='delete-memory'){const target=await db.getMemory(id);if(target?.petId!==pet.id)throw new Error('这段回忆不属于当前宠物');if(confirm('删除这段回忆？')){await db.deleteMemory(id);toast('回忆已删除');go('memories');}}
 if(action==='delete-post'&&confirm('删除这条草稿？')){await db.deletePost(id);communityTab='我的草稿';toast('草稿已删除');go('community');}
 if(action==='cloud-backup'&&confirm('将全部资料备份到你登录账户的云端空间？')){el.disabled=true;try{await uploadCloudBackup();toast('云端备份已完成');}finally{el.disabled=false;}}
 if(action==='export'){el.disabled=true;try{const password=document.querySelector('#backup-password')?.value||'';if(password!==document.querySelector('#backup-password-confirm')?.value)throw new Error('两次输入的密码不一致');if(password.length<12)throw new Error('请设置至少 12 个字符的备份密码');const archive=await createFullArchive();const encrypted=await encryptArchive(archive,password);const blob=new Blob([JSON.stringify(encrypted)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='留念-生活备份-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);document.querySelector('#backup-password').value='';document.querySelector('#backup-password-confirm').value='';toast('加密备份已生成，请单独保管密码');}finally{el.disabled=false;}}
 if(action==='clear'&&confirm('清除全部本机资料？此操作无法撤销，请确认已导出备份。')){await db.deleteEverything();localStorage.keys().filter(k=>k.startsWith('pet-life-')||k==='pet-active-id'||k==='pet-location-city-v1').forEach(k=>localStorage.removeItem(k));toast('本机资料已清除');go('home');}
 }catch(e){toast(e.message);}
});
window.addEventListener('hashchange',()=>render());
window.addEventListener('storage',e=>{if(e.key==='pet-memory-ui-config-v1')render(true);});
window.addEventListener('focus',async()=>{
 if(!accountScopeReady)return;
 const status=await accountStatus();
 accountServiceAvailable=status.available;
 if((status.authenticated?status.account?.id:null)!==activeAccountId)location.reload();
});
try {
 const status=await accountStatus();
 accountServiceAvailable=status.available;
 const id=status.authenticated ? status.account?.id : null;
 activeAccountId=id||null;
 setLocalScope(id || null);db.setDatabaseScope(id || null);
 accountScopeReady=true;
} catch(error) {console.error('无法确定账号资料空间',error);root.textContent='暂时无法打开资料，请重新载入页面。';throw error;}
await render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
