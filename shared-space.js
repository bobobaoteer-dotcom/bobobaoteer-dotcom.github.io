import {accountStatus} from './account-ui.js';
import {h,icon,header} from './life-ui.js';
import {sharedDailySpace} from './shared-daily.js';

const roles={admin:'管理员',caregiver:'共养者',viewer:'只读家人'};
const kinds={parent_of:'亲子',littermate_of:'同窝',lives_with:'同住',friend_of:'伙伴'};

async function request(path,method='GET',body) {
  const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',
    headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>null);
  if (!response.ok) throw new Error(data?.error || '暂时无法连接共养服务');
  return data;
}

function notice(text) {return `<p class="shared-note">${icon('shield')}${h(text)}</p>`;}
function field(label,name,placeholder='',type='text',required=true) {
  return `<label class="shared-field"><span>${h(label)}</span><input name="${h(name)}" type="${type}" placeholder="${h(placeholder)}" ${required?'required':''}></label>`;
}

export async function renderShared(parts) {
  const status=await accountStatus();
  if (!status.available) return `${header('共同养宠','settings')}<div class="page-heading"><span class="eyebrow">TOGETHER</span><h2>一起养，<br>一起记。</h2><p>共养需要两个已登录账号和云端数据服务。当前公开测试链接只在各自浏览器保存资料，暂时不能互相看见。</p></div><a class="button secondary" href="#data/local">先备份本机资料${icon('arrow-right')}</a>`;
  if (parts[1] === 'feed') {
    const {posts}=await request('/v1/community/posts');
    return `${header('共养动态','shared')}<div class="page-heading"><span class="eyebrow">COMMUNITY</span><h2>一起分享，<br>再让大家看见。</h2><p>这里仅展示由共养空间管理员明确发布的文字动态。</p></div>${posts.length?posts.map(post=>`<article class="shared-post"><small>${h(post.petName)} · ${h(post.createdAt.slice(0,10))}</small><p>${h(post.text)}</p></article>`).join(''):'<p class="shared-empty">还没有公开的共养动态。</p>'}`;
  }
  if (!status.authenticated) return `${header('共同养宠','settings')}<div class="page-heading"><h2>用自己的账号，<br>加入同一个家。</h2><p>登录后才能创建或接受共养邀请。你无需把账号密码交给另一位主人。</p></div><a class="button primary" href="#account">注册或登录${icon('arrow-right')}</a>`;
  if (!parts[1]) {
    const {spaces}=await request('/v1/spaces');
    return `${header('共同养宠','settings')}<div class="page-heading"><span class="eyebrow">ONE HOME, MORE HEARTS</span><h2>同一份日常，<br>由我们一起照顾。</h2><p>一处共养空间可以放多只宠物；每位成员用自己的账号记录。</p></div>${notice('共养宠物、照护记录、文字和主动上传的照片保存在当前连接的服务端；首页、相册和本机旧档案不会自动导入。此功能目前只可在本地账号预览使用，公网链接尚未连接云端。')}<section class="shared-section"><h3>我的共养空间</h3>${spaces.length?spaces.map(space=>`<a class="shared-space-row" href="#shared/${h(space.id)}"><span class="shared-space-icon">${icon('paw')}</span><span><strong>${h(space.name)}</strong><small>${space.petCount} 只宠物 · ${space.memberCount} 位成员 · ${roles[space.role]}</small></span>${icon('chevron-right')}</a>`).join(''):'<p class="shared-empty">还没有共养空间。创建一处，先把它们的名字放进来。</p>'}</section><section class="shared-section"><h3>创建新空间</h3><form data-shared-form="create-space" class="shared-form">${field('空间名称','name','例如：小满和豆豆的家')}<p class="form-error" role="alert"></p><button class="button primary" type="submit">创建共养空间</button></form></section><section class="shared-section"><h3>接受邀请</h3><form data-shared-form="accept-invite" class="shared-form">${field('对方给你的邀请码','code','粘贴一次性邀请码')}<p class="form-error" role="alert"></p><button class="button secondary" type="submit">加入共养空间</button></form></section><a class="shared-feed-link" href="#shared/feed">看看已公开的共养动态${icon('arrow-right')}</a>`;
  }
  const spaceId=parts[1], encoded=encodeURIComponent(spaceId);
  const [{space},{members},{pets},{posts}]=await Promise.all([
    request(`/v1/spaces/${encoded}`),request(`/v1/spaces/${encoded}/members`),
    request(`/v1/spaces/${encoded}/pets`),request(`/v1/spaces/${encoded}/posts`)]);
  const relationRows=await Promise.all(pets.map(p=>request(`/v1/pets/${encodeURIComponent(p.id)}/relations`)));
  const relations=[...new Map(relationRows.flatMap(result=>result.relations).map(row=>[row.id,row])).values()];
  const canWrite=space.role!=='viewer',isAdmin=space.role==='admin';
  const petOptions=pets.map(p=>`<option value="${h(p.id)}">${h(p.name)}</option>`).join('');
  const daily=await sharedDailySpace(space,pets,status.account.id);
  return `${header(space.name,'shared')}<div class="shared-heading"><span class="eyebrow">${roles[space.role]} · ${space.memberCount} 位成员</span><h2>${h(space.name)}</h2><p>${space.petCount} 只宠物住在这里。记录会标明是谁写的；公开分享需要管理员确认。</p></div>
    <section class="shared-section"><div class="shared-section-top"><h3>我们的宠物</h3><span>${pets.length} 只</span></div>${pets.length?`<div class="shared-pet-grid">${pets.map(p=>`<div class="shared-pet-card">${icon('paw')}<strong>${h(p.name)}</strong><small>${h(p.species||'毛孩子')}</small></div>`).join('')}</div>`:'<p class="shared-empty">先添加第一只宠物。</p>'}${canWrite?`<form data-shared-form="add-pet" data-space-id="${h(spaceId)}" class="shared-form shared-inline-form">${field('宠物名字','name','例如：小满')}${field('品种或种类（选填）','species','例如：金毛','text',false)}<p class="form-error" role="alert"></p><button class="button secondary" type="submit">添加宠物</button></form>`:''}</section>
    ${daily}
    <section class="shared-section"><div class="shared-section-top"><h3>分享给社区的草稿</h3><span>${posts.length} 条</span></div>${posts.length?posts.map(post=>`<article class="shared-post"><small>${h(pets.find(p=>p.id===post.petId)?.name||'宠物')} · ${h(members.find(m=>m.accountId===post.authorId)?.email||'一位共养者')} · ${h(post.createdAt.slice(0,10))}</small><p>${h(post.text)}</p><div class="shared-post-foot"><span>${post.visibility==='public'?'已公开':'仅共养成员可见'}</span>${isAdmin&&post.visibility==='private'?`<button data-shared-action="publish" data-space-id="${h(spaceId)}" data-post-id="${h(post.id)}" data-version="${post.version}">确认公开${icon('arrow-right')}</button>`:''}${isAdmin&&post.visibility==='public'?`<button data-shared-action="unpublish" data-space-id="${h(spaceId)}" data-post-id="${h(post.id)}">撤回公开</button>`:''}</div></article>`).join(''):'<p class="shared-empty">还没有准备公开的文字草稿。</p>'}${canWrite&&pets.length?`<form data-shared-form="add-post" data-space-id="${h(spaceId)}" class="shared-form"><label class="shared-field"><span>记录哪只宠物</span><select name="petId">${petOptions}</select></label><label class="shared-field"><span>写一条公开分享草稿</span><textarea name="text" rows="3" maxlength="2000" required placeholder="准备好后再由管理员确认公开……"></textarea></label><p class="form-error" role="alert"></p><button class="button primary" type="submit">保存为共同草稿</button></form>`:''}</section>
    <section class="shared-section"><div class="shared-section-top"><h3>宠物之间</h3><span>${relations.length} 条关系</span></div>${relations.length?relations.map(relation=>`<div class="shared-relation"><span>${h(relation.fromPetName)} <b>${kinds[relation.type]}</b> ${h(relation.toPetName)}</span><small>由 ${h(members.find(m=>m.accountId===relation.createdBy)?.email||'原共养成员')} 记录 · ${h(relation.createdAt.slice(0,10))}${relation.sourceNote?` · 依据：${h(relation.sourceNote)}`:' · 主人提供的信息'}</small>${isAdmin||relation.createdBy===status.account.id?`<button class="shared-relation-remove" data-shared-action="remove-relation" data-relation-id="${h(relation.id)}" data-space-id="${h(spaceId)}">移除这条关系</button>`:''}</div>`).join(''):'<p class="shared-empty">添加关系后，就能沿着它们的故事回看。</p>'}${canWrite&&pets.length>1?`<form data-shared-form="add-relation" class="shared-form" data-space-id="${h(spaceId)}"><div class="shared-two-col"><label class="shared-field"><span>第一只</span><select name="fromPetId">${petOptions}</select></label><label class="shared-field"><span>第二只</span><select name="toPetId">${petOptions}</select></label></div><label class="shared-field"><span>关系</span><select name="type"><option value="friend_of">伙伴</option><option value="lives_with">同住</option><option value="littermate_of">同窝</option><option value="parent_of">第一只是第二只的亲生父母</option></select></label>${field('依据说明（亲子关系必填）','sourceNote','例如：来自原主人提供的信息','text',false)}<p class="form-error" role="alert"></p><button class="button secondary" type="submit">添加关系</button></form>`:''}</section>
    <section class="shared-section"><div class="shared-section-top"><h3>共养成员</h3><span>${members.length} 人</span></div>${members.map(member=>`<div class="shared-member"><span><strong>${h(member.email||'微信用户')}</strong><small>${roles[member.role]}</small></span>${isAdmin&&member.accountId!==status.account.id?`<button data-shared-action="revoke" data-space-id="${h(spaceId)}" data-member-id="${h(member.accountId)}">移除</button>`:''}</div>`).join('')}${isAdmin?`<form data-shared-form="invite" data-space-id="${h(spaceId)}" class="shared-form">${field('邀请对方的注册邮箱','email','对方已注册的邮箱','email')}<label class="shared-field"><span>给予的权限</span><select name="role"><option value="caregiver">共养者：可记录</option><option value="admin">管理员：可管理成员和公开分享</option><option value="viewer">只读家人：仅查看</option></select></label><p class="form-error" role="alert"></p><button class="button secondary" type="submit">生成一次性邀请码</button><div class="shared-invite-result" hidden aria-live="polite"></div></form><p class="shared-helper">邀请码只对指定账号有效，24 小时内可使用一次。请通过你信任的方式交给对方。</p>`:''}</section>`;
}

export function bindShared(root,{go,render,toast}) {
  root.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-shared-form]');if(!form)return;
    event.preventDefault();const button=form.querySelector('[type="submit"]'),error=form.querySelector('.form-error');
    button.disabled=true;if(error)error.textContent='';
    const data=Object.fromEntries(new FormData(form));
    try {
      const spaceId=encodeURIComponent(form.dataset.spaceId||'');
      if(form.dataset.sharedForm==='create-space') {
        const result=await request('/v1/spaces','POST',{name:data.name});go(`shared/${result.space.id}`);
      } else if(form.dataset.sharedForm==='accept-invite') {
        const result=await request('/v1/invites/accept','POST',{code:String(data.code||'').trim()});go(`shared/${result.space.id}`);
      } else if(form.dataset.sharedForm==='add-pet') {
        await request(`/v1/spaces/${spaceId}/pets`,'POST',{name:data.name,species:data.species});await render();toast('宠物已加入共养空间');
      } else if(form.dataset.sharedForm==='add-post') {
        await request(`/v1/spaces/${spaceId}/posts`,'POST',{petId:data.petId,text:data.text});await render();toast('共同草稿已保存');
      } else if(form.dataset.sharedForm==='add-relation') {
        await request('/v1/pet-relations','POST',{fromPetId:data.fromPetId,toPetId:data.toPetId,
          type:data.type,sourceNote:data.sourceNote});await render();toast('宠物关系已记录');
      } else if(form.dataset.sharedForm==='invite') {
        const result=await request(`/v1/spaces/${spaceId}/invites`,'POST',{email:data.email,role:data.role});
        const output=form.querySelector('.shared-invite-result');output.hidden=false;
        output.textContent=`请交给 ${data.email} 的一次性邀请码：${result.invite.code}`;
      }
    } catch(e) {if(error)error.textContent=e.message;else toast(e.message);}
    finally {button.disabled=false;}
  });
  root.addEventListener('click',async event=>{
    const button=event.target.closest('[data-shared-action]');if(!button)return;
    const spaceId=encodeURIComponent(button.dataset.spaceId),postId=encodeURIComponent(button.dataset.postId||'');
    try {
      if(button.dataset.sharedAction==='publish') {
        if(!confirm('确认把这条文字动态公开给所有人？宠物名字也会显示。'))return;
        await request(`/v1/spaces/${spaceId}/posts/${postId}/publish`,'POST',
          {expectedVersion:Number(button.dataset.version)});
      } else if(button.dataset.sharedAction==='unpublish') {
        await request(`/v1/spaces/${spaceId}/posts/${postId}/unpublish`,'POST');
      } else if(button.dataset.sharedAction==='remove-relation') {
        if(!confirm('移除这条宠物关系？'))return;
        await request(`/v1/pet-relations/${encodeURIComponent(button.dataset.relationId)}`,'DELETE');
      } else if(button.dataset.sharedAction==='revoke') {
        if(!confirm('移除这位成员后，对方将无法再查看或修改此共养空间。继续吗？'))return;
        await request(`/v1/spaces/${spaceId}/members/${encodeURIComponent(button.dataset.memberId)}`,'DELETE');
      }
      await render();
    } catch(e) {toast(e.message);}
  });
}
