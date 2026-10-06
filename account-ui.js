import {PRIVACY_NOTICE_VERSION} from './first-use.js';

async function request(path, method = 'GET', body) {
  const response = await fetch(path, {method, credentials:'same-origin', cache:'no-store',
    headers: body ? {'Content-Type':'application/json'} : {}, body: body ? JSON.stringify(body) : undefined});
  const data = await response.json().catch(()=>null);
  if (!data || typeof data !== 'object') throw new Error('账号服务尚未连接');
  if (!response.ok) throw new Error(data.error || '账号请求失败，请稍后重试');
  return data;
}

export async function accountStatus() {
  try {return {available:true, ...(await request('/v1/auth/session'))};}
  catch {return {available:false, authenticated:false, account:null};}
}

export async function submitAccount(form) {
  const data = new FormData(form), mode = form.dataset.mode;
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  if (mode === 'register') {
    if (password.length < 12) throw new Error('密码至少需要 12 个字符');
    if (password !== data.get('confirmPassword')) throw new Error('两次密码不一致');
    if (!data.get('privacy')) throw new Error('请先阅读并同意隐私说明');
    return request('/v1/auth/email/register', 'POST', {email, password, privacyAccepted:true,
      privacyNoticeVersion:PRIVACY_NOTICE_VERSION, locationReminder:data.get('locationReminder') === 'on'});
  }
  return request('/v1/auth/email/login', 'POST', {email, password});
}

export const signOut = () => request('/v1/auth/logout', 'POST');
export const deleteAccount = () => request('/v1/account', 'DELETE', {confirm:'DELETE'});
export const saveLocationReminder = enabled => request('/v1/me/location-reminder', 'PATCH', {enabled});

export function accountPage(state, mode, {h, icon, header}) {
  const intro = `${header('账号与登录','settings')}<div class="page-heading"><span class="eyebrow">YOUR ACCOUNT</span><h2>把你的故事，<br>留在自己的名下。</h2><p>账号用于识别你本人。每个账号在这台设备上有独立的本机资料空间；换手机或清理浏览器后仍需靠备份恢复，注册不等于云端同步。</p></div>`;
  if (!state.available) return `${intro}<section class="setting-card"><h2>账号服务尚未连接</h2><p>注册和登录界面已准备好。迁移到支持后端与数据库的托管平台后才能实际创建账号；目前请继续使用本机记录与加密备份。</p><a class="button secondary" href="#data/local">先备份本机资料${icon('arrow-right')}</a></section>`;
  if (state.authenticated) return `${intro}<section class="setting-card"><h2>已登录</h2><p>${h(state.account.email)}<br>隐私说明同意时间：${h(state.account.privacyAcceptedAt?.slice(0,10) || '未记录')}</p><form id="account-preferences" class="form-stack"><label class="first-use-check optional"><input type="checkbox" name="locationReminder" ${state.account.locationReminder?'checked':''}><span>同城功能开放时提醒我选择定位权限<small>仅保存提醒偏好，不会读取设备位置。</small></span></label><button class="button secondary" type="submit">保存选择</button></form><p>当前资料只在这台设备的账号空间，尚未随账号同步。</p><button class="button secondary" data-action="account-logout">退出登录</button><button class="text-button" data-action="account-delete">删除账号与此设备上的账号资料</button></section>`;
  const register = mode !== 'login';
  return `${intro}<div class="account-tabs"><a href="#account/register" ${register?'aria-current="page"':''}>注册</a><a href="#account/login" ${register?'':'aria-current="page"'}>登录</a></div><form id="account-form" data-mode="${register?'register':'login'}" class="form-stack"><div class="field"><label for="account-email">邮箱</label><input id="account-email" name="email" type="email" autocomplete="email" maxlength="254" required></div><div class="field"><label for="account-password">密码</label><input id="account-password" name="password" type="password" autocomplete="${register?'new-password':'current-password'}" minlength="12" maxlength="128" required></div>${register?`<div class="field"><label for="account-confirm">确认密码</label><input id="account-confirm" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div><label class="first-use-check"><input type="checkbox" name="privacy"><span>我已阅读<a href="#privacy">《隐私与安全说明》</a>，同意服务端处理注册邮箱、密码摘要和登录会话；宠物资料目前仍保存在本机。</span></label><label class="first-use-check optional"><input type="checkbox" name="locationReminder"><span>同城功能开放时提醒我选择是否开启定位<small>选填。现在不会请求系统定位权限，拒绝不影响注册。</small></span></label>`:''}<p class="form-error" role="alert"></p><button class="button primary" type="submit">${register?'创建账号':'登录'}</button></form><p class="first-use-footnote">请勿使用常用密码测试。当前版本没有邮件验证和找回密码能力，正式开放注册前仍需补齐。</p>`;
}
