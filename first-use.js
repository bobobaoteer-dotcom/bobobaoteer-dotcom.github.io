const KEY = 'pet-life-first-use-v1';
export const PRIVACY_NOTICE_VERSION = 'preview-2026-10-07';

function storedChoice() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch { return null; }
}

export function firstUseChoice() {
  const value = storedChoice();
  return value?.noticeVersion === PRIVACY_NOTICE_VERSION && value.privacyAccepted === true ? value : null;
}

export function saveFirstUseChoice(form) {
  if (!form.get('privacy')) throw new Error('请先阅读并勾选隐私说明');
  const choice = {
    noticeVersion: PRIVACY_NOTICE_VERSION,
    privacyAccepted: true,
    acceptedAt: new Date().toISOString(),
    locationReminder: form.get('locationReminder') === 'on'
  };
  localStorage.setItem(KEY, JSON.stringify(choice));
  return choice;
}

export function firstUsePage() {
  const choice = storedChoice();
  return `<div class="first-use">
    <div class="first-use-photo"><img src="/assets/life/hero.webp" alt="在草地上散步的狗狗" fetchpriority="high"><span>留念 · FIRST STEPS</span></div>
    <div class="first-use-intro"><span class="eyebrow">第一次相遇</span><h1>先把重要的事，<br>说清楚。</h1><p>在记录它的日常之前，请了解资料如何保存，并选择未来是否需要定位提醒。</p></div>
    <div class="first-use-facts"><div><b>01</b><p><strong>个人故事留在这台设备</strong><span>个人宠物档案、照片、视频和照护记录保存在当前浏览器；清理浏览器可能丢失资料。注册账号不会自动同步这些资料。</span></p></div><div><b>02</b><p><strong>位置由你决定</strong><span>目前不读取设备位置。同城内容仍是示例；将来有真实同城功能时，才会再次说明用途并向系统申请定位权限。</span></p></div><div><b>03</b><p><strong>共养资料单独保存</strong><span>登录后主动创建的共养宠物、照护、文字和照片保存在当前连接的服务端，按成员权限可见；可在“我的”里管理本机资料。</span></p></div></div>
    <form id="first-use-form" class="first-use-form"><label class="first-use-check"><input type="checkbox" name="privacy" value="yes" ${choice?.noticeVersion===PRIVACY_NOTICE_VERSION?'checked':''}><span>我已阅读<a href="#privacy">《隐私与安全说明》</a>，同意在本机保存我主动填写的个人资料。<small>共养资料另存服务端，创建账号时还需单独同意；此项不会代替正式产品的注册协议。</small></span></label><label class="first-use-check optional"><input type="checkbox" name="locationReminder" ${choice?.locationReminder?'checked':''}><span>同城定位功能开放时提醒我选择是否授权<small>选填。现在不会弹出系统定位请求，也不会获取位置；不勾选仍可使用。</small></span></label><p class="form-error" role="alert"></p><button class="button primary" type="submit" value="${choice?'continue':'create'}">${choice?'保存并继续':'建立我家宠物'}</button>${choice?'':'<button class="button secondary first-use-explore" type="submit" value="explore">先看看示例</button>'}</form>
    <p class="first-use-footnote">这是手机网页体验版。资料不会自动云端同步；账号服务是否可用，以“我的”页面显示为准。</p>
  </div>`;
}
