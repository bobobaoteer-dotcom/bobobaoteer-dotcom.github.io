// Named, visible UI only: saved settings contain bounded numbers, never CSS or JavaScript.
// Legacy IDs stay valid so existing saved layouts continue to load.
// Fixed :has() scopes distinguish forms that share the same app shell.
export const LAYOUT_TARGETS = [
  { id: "welcome.title", page: "旧版归档（仅兼容）", label: "旧版 · 欢迎标题", selector: ".new-onboarding h1" },
  { id: "welcome.panel", page: "旧版归档（仅兼容）", label: "旧版 · 欢迎内容", selector: ".new-onboarding" },
  { id: "welcome.copy", page: "旧版归档（仅兼容）", label: "旧版 · 说明文字", selector: ".new-onboarding p:not(.eyebrow)" },
  { id: "welcome.button", page: "旧版归档（仅兼容）", label: "旧版 · 开始按钮", selector: ".new-onboarding .button" },
  { id: "home.heading", page: "首页", label: "顶部标题", selector: ".home-top" },
  { id: "home.hero", page: "首页", label: "宠物照片与视频区域", selector: ".home-pet-hero, .home-empty" },
  { id: "home.heroPhoto", page: "首页", label: "宠物照片 / 视频画面", selector: ".home-pet-hero .hero-image, .home-pet-hero .hero-video, .home-pet-hero > img" },
  { id: "home.petSwitch", page: "首页", label: "切换宠物", selector: ".pet-switcher" },
  { id: "home.actions", page: "首页", label: "快捷按钮区域", selector: ".home-actions" },
  { id: "home.action", page: "首页", label: "单个快捷按钮", selector: ".home-actions a" },
  { id: "home.recent", page: "首页", label: "最近记录", selector: ".home-recent" },
  { id: "home.create", page: "首页", label: "更换首页照片与视频", selector: ".hero-edit, .home-empty .button" },
  { id: "home.banner", page: "首页", label: "社区精选 Banner", selector: ".home-guide" },
  { id: "home.note", page: "首页", label: "底部说明", selector: ".home-privacy" },
  { id: "nav.bar", page: "全局", label: "底部导航", selector: ".bottom-nav" },
  { id: "nav.buttons", page: "全局", label: "导航按钮", selector: ".bottom-nav a" },
  { id: "checkins.header", page: "照护日常", label: "页面导航", selector: ".lc-page:not(.lc-editor) > .lc-header, .checkins-shell > .screen-header" },
  { id: "checkins.title", page: "照护日常", label: "照护标题", selector: ".lc-header h1, .checkins-shell .page-heading" },
  { id: "checkins.calendar", page: "照护日常", label: "日历区域", selector: ".lc-calendar, .calendar-panel" },
  { id: "checkins.card", page: "照护日常", label: "单条生活记录", selector: ".lc-record, .checkin-card" },
  { id: "checkins.button", page: "照护日常", label: "新增记录按钮", selector: ".lc-add-record, .checkin-add" },
  { id: "community.header", page: "社区", label: "社区顶部导航", selector: ".community-shell .page-top, .community-shell .screen-header" },
  { id: "community.title", page: "社区", label: "社区标题", selector: ".community-shell .page-top h1, .community-shell .page-heading" },
  { id: "community.notice", page: "社区", label: "示例与隐私说明", selector: ".community-shell .sample-caption, .community-shell .notice, .community-shell .community-notice" },
  { id: "community.card", page: "社区", label: "分享草稿卡片", selector: ".post-draft" },
  { id: "community.button", page: "社区", label: "新建分享按钮", selector: ".community-shell .page-top > a, .community-shell > .button" },
  { id: "pet.header", page: "我的宠物", label: "顶部返回与编辑", selector: "#screen:has(.profile-portrait) > .screen-header, .pets-shell .screen-header, .real-detail-hero .screen-header" },
  { id: "pet.name", page: "我的宠物", label: "宠物名称与状态", selector: ".profile-title, .real-detail-hero .detail-name" },
  { id: "pet.sheet", page: "我的宠物", label: "宠物习惯与资料", selector: ".profile-note, .real-detail-hero .detail-sheet" },
  { id: "pet.facts", page: "我的宠物", label: "宠物资料统计", selector: ".pet-stat-grid, .real-detail-hero .pet-facts" },
  { id: "pet.button", page: "我的宠物", label: "首页照片与视频入口", selector: "#screen:has(.profile-portrait) .menu-row[href^=\"#pet/edit/\"], .real-detail-hero .detail-sheet .primary" },
  { id: "pet.tools", page: "旧版归档（仅兼容）", label: "旧版 · 3D/照片/回忆按钮", selector: ".detail-tools" },
  { id: "pet.capture", page: "旧版归档（仅兼容）", label: "旧版 · 建模照片区域", selector: ".detail-workspace .capture-grid:not(.video-grid)" },
  { id: "pet.captureCard", page: "旧版归档（仅兼容）", label: "旧版 · 单个角度照片卡片", selector: ".detail-workspace .capture-card" },
  { id: "pet.model", page: "旧版归档（仅兼容）", label: "旧版 · 3D 模型区域", selector: ".model-import" },
  { id: "pet.memories", page: "回忆相册", label: "回忆时间线", selector: ".timeline, .memory-list" },
  { id: "upload.header", page: "照片上传", label: "页面导航", selector: "#screen:has(#life-pet-form) > .screen-header, .form-shell .screen-header" },
  { id: "upload.title", page: "照片上传", label: "标题说明", selector: "#screen:has(#life-pet-form) > .page-heading, .form-shell .page-heading" },
  { id: "upload.photos", page: "照片上传", label: "宠物封面照片上传", selector: ".cover-upload, .form-photo-section" },
  { id: "upload.photoCard", page: "照片上传", label: "封面照片预览", selector: "#cover-preview, .form-photo-card" },
  { id: "upload.name", page: "照片上传", label: "宠物名字输入框", selector: "#pet-name" },
  { id: "upload.species", page: "照片上传", label: "品种输入框", selector: "#pet-species" },
  { id: "upload.fields", page: "照片上传", label: "生日与性别字段", selector: "#life-pet-form .optional-details, .optional-details" },
  { id: "upload.button", page: "照片上传", label: "保存宠物档案按钮", selector: "#life-pet-form > button[type=\"submit\"], #pet-form > button[type=\"submit\"]" },
  { id: "write.header", page: "写回忆", label: "页面导航", selector: "#screen:has(#life-memory-form) > .screen-header, .writer-shell .screen-header" },
  { id: "write.title", page: "写回忆", label: "标题说明", selector: "#screen:has(#life-memory-form) > .page-heading, .writer-shell .page-heading" },
  { id: "write.text", page: "写回忆", label: "回忆编辑框", selector: "#memory-text" },
  { id: "write.date", page: "写回忆", label: "日期输入框", selector: "#memory-date" },
  { id: "write.button", page: "写回忆", label: "保存回忆按钮", selector: "#life-memory-form > button[type=\"submit\"], #memory-form > button[type=\"submit\"]" },
  { id: "memories.header", page: "回忆相册", label: "页面导航", selector: ".memories-shell .screen-header" },
  { id: "memories.title", page: "回忆相册", label: "标题说明", selector: ".memories-shell .page-heading" },
  { id: "memories.list", page: "回忆相册", label: "相册 / 回忆内容", selector: ".album-grid, .timeline, .memory-group, .memories-shell .empty-state" },
  { id: "memories.card", page: "回忆相册", label: "单条回忆 / 照片", selector: ".timeline-entry, .album-image, .memory-link" },
  { id: "settings.header", page: "我的", label: "顶部标题与设置", selector: ".settings-shell .page-top, .settings-shell > .screen-header" },
  { id: "settings.profile", page: "我的", label: "资料卡片", selector: ".account-summary" },
  { id: "settings.privacy", page: "资料与备份", label: "资料保存说明", selector: ".data-shell .page-heading, .privacy-shell .reading-page, .settings-shell .setting-card:nth-of-type(1)" },
  { id: "settings.backup", page: "资料与备份", label: "导出与恢复资料", selector: ".data-shell .setting-card:not(.quiet-danger), .settings-shell .setting-card:nth-of-type(2)" },
  { id: "settings.actions", page: "资料与备份", label: "资料操作按钮", selector: ".data-shell .setting-card .button, .data-shell .setting-card .danger, .settings-shell .setting-card .button, .settings-shell .setting-card .danger-button" },
  { id: "settings.delete", page: "资料与备份", label: "清除资料区域", selector: ".data-shell .quiet-danger, .settings-shell .setting-card:nth-of-type(3)" },
  { id: "home.greeting", page: "首页", label: "日期与宠物问候", selector: ".home-greeting" },
  { id: "home.heroCaption", page: "首页", label: "主图标题与档案入口", selector: ".hero-caption" },
  { id: "home.videoControls", page: "首页", label: "首页视频播放按钮", selector: ".video-controls" },
  { id: "home.care", page: "首页", label: "今日照护待办", selector: ".home-shell .lc-preview" },
  { id: "home.careTask", page: "首页", label: "单个今日待办", selector: ".home-shell .lc-task-compact" },
  { id: "home.recentCard", page: "首页", label: "最近回忆卡片", selector: ".home-recent .memory-feature, .home-recent .recent-entry, .home-recent .blank-memory" },
  { id: "home.serviceCard", page: "旧版归档（仅兼容）", label: "旧版 · 首页服务推荐卡片", selector: ".home-guide .ls-home-preview" },
  { id: "home.communityCard", page: "首页", label: "首页社区精选卡片", selector: ".home-guide .community-feature" },
  { id: "nav.home", page: "全局", label: "首页导航按钮", selector: ".bottom-nav a[href=\"#home\"]" },
  { id: "nav.care", page: "全局", label: "照护导航按钮", selector: ".bottom-nav a[href=\"#checkins\"]" },
  { id: "nav.services", page: "旧版归档（仅兼容）", label: "旧版 · 服务导航按钮", selector: ".bottom-nav a[href=\"#services\"]" },
  { id: "nav.memories", page: "全局", label: "时光导航按钮", selector: ".bottom-nav a[href=\"#memories\"]" },
  { id: "nav.community", page: "全局", label: "社区导航按钮", selector: ".bottom-nav a[href=\"#community\"]" },
  { id: "nav.settings", page: "全局", label: "我的导航按钮", selector: ".bottom-nav a[href=\"#settings\"]" },
  { id: "care.week", page: "照护日常", label: "七日日历", selector: ".lc-week" },
  { id: "care.day", page: "照护日常", label: "单个日期按钮", selector: ".lc-day" },
  { id: "care.tasks", page: "照护日常", label: "照护待办列表", selector: ".lc-page .lc-task-list" },
  { id: "care.task", page: "照护日常", label: "单项待办", selector: ".lc-page .lc-task" },
  { id: "care.addTask", page: "照护日常", label: "添加待办按钮", selector: ".lc-add-task" },
  { id: "care.taskForm", page: "照护日常", label: "新增待办表单", selector: ".lc-task-form" },
  { id: "care.records", page: "照护日常", label: "当天记录区域", selector: ".lc-record-section" },
  { id: "care.recordHeader", page: "写日常记录", label: "记录页导航", selector: ".lc-editor-heading" },
  { id: "care.recordForm", page: "写日常记录", label: "生活记录表单", selector: ".lc-record-form" },
  { id: "care.recordDate", page: "写日常记录", label: "记录日期", selector: ".lc-record-form input[name=\"date\"]" },
  { id: "care.recordTags", page: "写日常记录", label: "记录分类按钮", selector: ".lc-category" },
  { id: "care.recordText", page: "写日常记录", label: "记录文字输入框", selector: ".lc-record-form textarea" },
  { id: "care.recordPhoto", page: "写日常记录", label: "记录照片上传", selector: ".lc-photo-field, .lc-demo-upload" },
  { id: "care.recordSave", page: "写日常记录", label: "保存记录按钮", selector: ".lc-record-form > button[type=\"submit\"]" },
  { id: "services.header", page: "服务", label: "服务页标题", selector: ".ls-listing-head" },
  { id: "services.search", page: "服务", label: "服务搜索框", selector: ".ls-search" },
  { id: "services.filters", page: "服务", label: "服务分类与收藏筛选", selector: ".ls-filter-line" },
  { id: "services.filterButton", page: "服务", label: "单个服务分类按钮", selector: ".ls-listing .ls-tabs > button" },
  { id: "services.intro", page: "服务", label: "服务介绍文案", selector: ".ls-editorial" },
  { id: "services.list", page: "服务", label: "门店列表", selector: "#ls-shop-list" },
  { id: "services.card", page: "服务", label: "单个门店信息", selector: ".ls-shop-row" },
  { id: "services.photo", page: "服务", label: "门店图片", selector: ".ls-shop-photo" },
  { id: "services.orders", page: "服务", label: "我的预约入口", selector: ".ls-order-link" },
  { id: "services.detailHeader", page: "服务详情", label: "详情顶部导航", selector: ".ls-detail > .ls-header" },
  { id: "services.detailPhoto", page: "服务详情", label: "服务主图", selector: ".ls-detail-photo" },
  { id: "services.detailIntro", page: "服务详情", label: "门店介绍", selector: ".ls-detail-intro" },
  { id: "services.choices", page: "服务详情", label: "服务套餐选项", selector: ".ls-services-choice" },
  { id: "services.choice", page: "服务详情", label: "单个服务套餐", selector: ".ls-service-choice" },
  { id: "services.detailSections", page: "服务详情", label: "门店说明区域", selector: ".ls-detail > .ls-section" },
  { id: "services.detailAction", page: "服务详情", label: "底部预约栏", selector: ".ls-detail > .ls-bottom-action" },
  { id: "services.bookButton", page: "服务详情", label: "体验预约按钮", selector: ".ls-detail > .ls-bottom-action .primary" },
  { id: "booking.header", page: "预约服务", label: "预约顶部导航", selector: ".ls-booking > .ls-header" },
  { id: "booking.summary", page: "预约服务", label: "已选服务摘要", selector: ".ls-book-summary" },
  { id: "booking.pet", page: "预约服务", label: "赴约宠物信息", selector: ".ls-pet-line" },
  { id: "booking.dates", page: "预约服务", label: "预约日期选择", selector: ".ls-day-options" },
  { id: "booking.times", page: "预约服务", label: "预约时段选择", selector: ".ls-time-options" },
  { id: "booking.timeButton", page: "预约服务", label: "单个预约时段", selector: ".ls-time" },
  { id: "booking.notes", page: "预约服务", label: "照护偏好备注", selector: "#ls-notes" },
  { id: "booking.confirm", page: "预约服务", label: "预约演示确认", selector: ".ls-confirm-box" },
  { id: "booking.action", page: "预约服务", label: "底部确认栏", selector: ".ls-booking .ls-bottom-action" },
  { id: "booking.submit", page: "预约服务", label: "确认并保存按钮", selector: "#ls-book-form button[type=\"submit\"]" },
  { id: "orders.header", page: "我的预约", label: "预约顶部导航", selector: ".ls-orders > .ls-header, .ls-order-detail > .ls-header" },
  { id: "orders.filters", page: "我的预约", label: "预约状态筛选", selector: ".ls-order-tabs" },
  { id: "orders.list", page: "我的预约", label: "预约记录列表", selector: ".ls-order-list" },
  { id: "orders.card", page: "我的预约", label: "单个预约记录", selector: ".ls-order-card" },
  { id: "orders.result", page: "我的预约", label: "预约结果提示", selector: ".ls-order-result" },
  { id: "orders.details", page: "我的预约", label: "预约详情信息", selector: ".ls-order-details" },
  { id: "orders.actions", page: "我的预约", label: "预约管理按钮", selector: ".ls-order-actions" },
  { id: "community.tabs", page: "社区", label: "社区内容切换", selector: ".community-tabs" },
  { id: "community.search", page: "社区", label: "社区搜索框", selector: "#community-search" },
  { id: "community.topics", page: "社区", label: "社区话题按钮", selector: ".topic-strip" },
  { id: "community.grid", page: "社区", label: "社区故事列表", selector: ".community-grid" },
  { id: "community.story", page: "社区", label: "单个社区故事", selector: ".community-card" },
  { id: "community.storyPhoto", page: "社区", label: "社区故事照片", selector: ".community-card .feed-photo" },
  { id: "community.detailPhoto", page: "社区故事", label: "故事主图", selector: ".post-detail-image" },
  { id: "community.detailText", page: "社区故事", label: "故事详情内容", selector: ".post-detail" },
  { id: "community.detailButton", page: "社区故事", label: "写下日常按钮", selector: ".post-detail > .button" },
  { id: "post.header", page: "写分享草稿", label: "草稿顶部导航", selector: "#screen:has(#life-post-form) > .screen-header" },
  { id: "post.title", page: "写分享草稿", label: "草稿标题说明", selector: "#screen:has(#life-post-form) > .page-heading" },
  { id: "post.text", page: "写分享草稿", label: "草稿文字输入框", selector: "#post-text" },
  { id: "post.photo", page: "写分享草稿", label: "草稿照片上传", selector: ".post-photo-upload" },
  { id: "post.topic", page: "写分享草稿", label: "草稿话题选择", selector: "#post-topic" },
  { id: "post.submit", page: "写分享草稿", label: "保存草稿按钮", selector: "#life-post-form > button[type=\"submit\"]" },
  { id: "pet.photo", page: "我的宠物", label: "宠物档案照片", selector: ".profile-portrait" },
  { id: "pet.menu", page: "我的宠物", label: "宠物功能入口", selector: "#screen:has(.profile-portrait) .menu-group" },
  { id: "pet.list", page: "我的宠物", label: "家庭宠物列表", selector: ".pets-shell .menu-group" },
  { id: "pet.add", page: "我的宠物", label: "添加宠物按钮", selector: ".pets-shell #screen > .button" },
  { id: "upload.video", page: "照片上传", label: "首页视频上传", selector: ".video-upload" },
  { id: "upload.type", page: "照片上传", label: "宠物类型选择", selector: "#pet-type" },
  { id: "upload.traits", page: "照片上传", label: "宠物习惯输入框", selector: "#pet-traits" },
  { id: "settings.counts", page: "我的", label: "生活记录与收藏统计", selector: ".profile-counts" },
  { id: "settings.album", page: "我的", label: "时光相册 Banner", selector: ".album-banner" },
  { id: "settings.menu", page: "我的", label: "我的功能菜单", selector: ".settings-shell .menu-group" },
  { id: "settings.menuRow", page: "我的", label: "单项功能入口", selector: ".settings-shell .menu-row" },
  { id: "settings.dataHeader", page: "资料与备份", label: "资料页顶部导航", selector: ".data-shell .screen-header" },
];

export const LAYOUT_PAGES = {
  "首页": "#home",
  "照护日常": "#checkins",
  "写日常记录": "#checkins/new",
  "服务": "#services",
  "服务详情": "#services/detail/slow-groom",
  "预约服务": "#services/book/slow-groom",
  "我的预约": "#orders",
  "社区": "#community",
  "社区故事": "#community/post/walk",
  "写分享草稿": "#community/new",
  "我的宠物": "#pets",
  "照片上传": "#pet/new",
  "写回忆": "#memory/new",
  "回忆相册": "#memories",
  "我的": "#settings",
  "资料与备份": "#data",
  "全局": "#home",
  "旧版归档（仅兼容）": "#home"
};

export function validateLayout(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('布局配置无效');
  const allowed = new Set(LAYOUT_TARGETS.map(item => item.id));
  const retired = /^(sample\.|welcome\.photo$|home\.(search|filter|categories|section|seeall|cards|card|cardPhoto|favorite|cardOpen)$)/;
  const result = {};
  for (const [id, item] of Object.entries(value)) {
    if (retired.test(id)) continue;
    if (!allowed.has(id) || !item || typeof item !== 'object' || Array.isArray(item)) throw new Error('布局位置无效：' + id);
    const bounds = { x: [-80, 80], y: [-120, 120], width: [35, 100], height: [44, 650] };
    const entry = {};
    for (const [key, raw] of Object.entries(item)) {
      if (!bounds[key] || !Number.isInteger(raw) || raw < bounds[key][0] || raw > bounds[key][1]) throw new Error('布局尺寸超出范围：' + id + '.' + key);
      entry[key] = raw;
    }
    result[id] = entry;
  }
  return result;
}

const layoutWatchers = new WeakMap();

function applyLayoutValues(container, layout) {
  for (const target of LAYOUT_TARGETS) {
    const setting = layout[target.id];
    if (!setting) continue;
    for (const element of container.querySelectorAll(target.selector)) {
      if (setting.width !== undefined) { element.style.width = `${setting.width}%`; element.style.maxWidth = 'calc(100vw - 24px)'; }
      if (setting.height !== undefined) element.style.height = `${setting.height}px`;
      if (setting.x !== undefined || setting.y !== undefined) {
        // Measure the unshifted box so repeated application does not accumulate offsets.
        element.style.translate = '';
        const box = element.getBoundingClientRect();
        const minX = 12 - box.left;
        const maxX = window.innerWidth - 12 - box.right;
        const x = setting.x === undefined ? 0 : minX <= maxX ? Math.max(minX, Math.min(maxX, setting.x)) : 0;
        element.style.translate = `${x}px ${setting.y || 0}px`;
      }
    }
  }
}

export function applyLayout(container, layout = {}) {
  layoutWatchers.get(container)?.disconnect();
  applyLayoutValues(container, layout);
  if (!Object.keys(layout).length || typeof MutationObserver === 'undefined') return;
  // Search results and appointment times update in place without rebuilding the app.
  // Observe new nodes only; applying numeric style attributes cannot trigger a loop.
  const observer = new MutationObserver(() => applyLayoutValues(container, layout));
  observer.observe(container, { childList: true, subtree: true });
  layoutWatchers.set(container, observer);
}
