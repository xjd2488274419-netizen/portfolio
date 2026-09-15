document.documentElement.classList.add('js');

const ASSET_VERSION = '27';

let clockTimer = 0;

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    if (image.dataset.src) {
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    }
    imageObserver.unobserve(image);
  });
}, { rootMargin: '320px 0px', threshold: 0.01 });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('show');
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px 10% 0px', threshold: 0.05 });

const viewer = document.createElement('div');
viewer.className = 'viewer';
viewer.innerHTML = `
  <div class="viewer-backdrop"></div>
  <div class="viewer-dialog" role="dialog" aria-modal="true" aria-label="作品预览">
    <div class="viewer-surface">
      <button class="viewer-close" aria-label="关闭">×</button>
      <button class="viewer-back" aria-label="返回">← 返回</button>
      <div class="viewer-media">
        <img class="viewer-image" alt="项目大图" hidden>
        <div class="viewer-pano" hidden></div>
        <iframe class="viewer-frame" title="互动内容" loading="lazy" allow="fullscreen; accelerometer; gyroscope" allowfullscreen hidden></iframe>
        <video class="viewer-video" controls playsinline preload="metadata" hidden></video>
        <div class="viewer-placeholder" hidden><span>UE</span><small>INTERACTIVE READY</small></div>
      </div>
      <aside class="viewer-info"><small class="viewer-meta"></small><h2></h2><p></p><div class="viewer-hint">完整画面 · 保持原始比例</div></aside>
    </div>
  </div>`;
document.body.append(viewer);

const dialog = viewer.querySelector('.viewer-dialog');
const viewerImage = viewer.querySelector('.viewer-image');
const viewerPano = viewer.querySelector('.viewer-pano');
const viewerFrame = viewer.querySelector('.viewer-frame');
const viewerVideo = viewer.querySelector('.viewer-video');
const viewerPlaceholder = viewer.querySelector('.viewer-placeholder');
const viewerMeta = viewer.querySelector('.viewer-meta');
const viewerTitle = viewer.querySelector('h2');
const viewerDescription = viewer.querySelector('p');
const viewerHint = viewer.querySelector('.viewer-hint');
const viewerMedia = viewer.querySelector('.viewer-media');
const viewerState = {
  request: 0,
  open: false,
  auto: false,
  locked: false,
  inside: false,
  trigger: null,
  hoverTimer: 0,
  pano: null
};

const resetViewerMedia = () => {
  viewerImage.hidden = true;
  viewerImage.removeAttribute('src');
  viewerFrame.hidden = true;
  viewerVideo.hidden = true;
  viewerPlaceholder.hidden = true;
  viewerPano.hidden = true;
  if (viewerState.pano) {
    viewerState.pano.destroy();
    viewerState.pano = null;
  }
  viewerMedia.classList.remove('is-loading');
};

const populateViewer = (title, meta, description, auto = false) => {
  viewerTitle.textContent = title;
  viewerMeta.textContent = meta;
  viewerDescription.textContent = description;
  viewerState.open = true;
  viewerState.auto = auto;
  viewerState.locked = !auto;
  viewerState.inside = false;
  viewer.classList.toggle('auto-preview', auto);
  viewer.classList.add('open');
  document.body.classList.add('viewer-open');
};

const fitShot = (naturalWidth, naturalHeight, tight = false) => {
  if (!naturalWidth || !naturalHeight) return;
  const narrow = innerWidth <= 820;
  const maxW = tight
    ? innerWidth * 0.52
    : (narrow ? innerWidth * 0.88 : Math.min(innerWidth * 0.96 - 400, 1260));
  const maxH = tight
    ? innerHeight * 0.5
    : (narrow ? innerHeight * 0.42 : Math.min(innerHeight * 0.84, 900));
  const scale = Math.min(maxW / naturalWidth, maxH / naturalHeight, 1);
  const w = Math.round(naturalWidth * scale);
  const h = Math.round(naturalHeight * scale);
  const infoWidth = narrow ? 0 : Math.min(360, Math.max(300, innerWidth * 0.23));
  viewer.style.setProperty('--shot-w', `${w}px`);
  viewer.style.setProperty('--shot-h', `${h}px`);
  viewer.style.setProperty('--dialog-w', `${w + infoWidth + 48}px`);
};

const openImage = async (src, title, meta, description, auto = false) => {
  const request = ++viewerState.request;
  resetViewerMedia();
  viewer.dataset.mode = 'image';
  viewerHint.textContent = auto ? '移入画面查看 · 点击可固定' : '完整画面 · 保持原始比例';
  viewerMedia.classList.add('is-loading');
  populateViewer(title, meta, description, auto);

  const preload = new Image();
  preload.decoding = 'async';
  preload.src = new URL(src, location.href).href;
  try {
    await preload.decode();
  } catch {
    await new Promise((resolve) => {
      preload.addEventListener('load', resolve, { once: true });
      preload.addEventListener('error', resolve, { once: true });
    });
  }
  if (request !== viewerState.request || !viewerState.open) return;
  fitShot(preload.naturalWidth, preload.naturalHeight);
  viewerImage.src = preload.currentSrc || preload.src;
  viewerImage.alt = title;
  viewerImage.hidden = false;
  viewerMedia.classList.remove('is-loading');
  requestAnimationFrame(() => {
    if (!viewerState.open || viewer.dataset.mode !== 'image') return;
    const box = viewerImage.getBoundingClientRect();
    if (box.width < 48 || box.height < 48) {
      fitShot(preload.naturalWidth, preload.naturalHeight, true);
    }
  });
};

const openPano = async (src, title, meta, description) => {
  const request = ++viewerState.request;
  resetViewerMedia();
  viewer.dataset.mode = 'pano';
  viewerHint.textContent = '拖动环顾场景 · 滚轮缩放视角';
  viewerMedia.classList.add('is-loading');
  populateViewer(title, meta, description, false);
  viewerPano.hidden = false;

  let mod = null;
  try {
    mod = await import(new URL(`pano.js?v=${ASSET_VERSION}`, document.baseURI).href);
  } catch {
    mod = null;
  }
  if (request !== viewerState.request || !viewerState.open) return;
  if (!mod?.createPano) {
    viewerMedia.classList.remove('is-loading');
    return;
  }
  viewerState.pano = mod.createPano(viewerPano, src, () => viewerMedia.classList.remove('is-loading'));
};

const openEmbed = (src, title, meta, description) => {
  viewerState.request += 1;
  resetViewerMedia();
  viewer.dataset.mode = 'embed';
  viewerFrame.src = src;
  viewerFrame.hidden = false;
  viewerHint.textContent = '拖动查看场景 · 内容按需加载';
  populateViewer(title, meta, description, false);
};

const openPlaceholder = (title, meta, description) => {
  viewerState.request += 1;
  resetViewerMedia();
  viewer.dataset.mode = 'placeholder';
  viewerPlaceholder.hidden = false;
  viewerHint.textContent = '已预留视频、glTF 与 Pixel Streaming 接口';
  populateViewer(title, meta, description, false);
};

const closeViewer = () => {
  clearTimeout(viewerState.hoverTimer);
  viewerState.hoverTimer = 0;
  if (!viewerState.open) return;
  viewerState.open = false;
  viewerState.auto = false;
  viewerState.locked = false;
  viewerState.inside = false;
  viewerState.request += 1;
  viewer.classList.remove('open', 'auto-preview');
  document.body.classList.remove('viewer-open');
  viewerFrame.src = 'about:blank';
  viewerVideo.pause();
  viewerVideo.removeAttribute('src');
  if (viewerState.pano) {
    viewerState.pano.destroy();
    viewerState.pano = null;
  }
  viewerMedia.classList.remove('is-loading');
  const trigger = viewerState.trigger;
  viewerState.trigger = null;
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
};

viewer.querySelector('.viewer-close').addEventListener('click', (event) => {
  event.stopPropagation();
  closeViewer();
});
viewer.querySelector('.viewer-back').addEventListener('click', (event) => {
  event.stopPropagation();
  closeViewer();
});
viewer.querySelector('.viewer-backdrop').addEventListener('click', closeViewer);
dialog.addEventListener('pointerenter', () => { viewerState.inside = true; });
dialog.addEventListener('pointerleave', () => {
  if (viewerState.auto && !viewerState.locked && viewerState.inside) closeViewer();
});
dialog.addEventListener('click', () => {
  if (!viewerState.auto) return;
  viewerState.locked = true;
  viewerState.auto = false;
  viewer.classList.remove('auto-preview');
  viewerHint.textContent = '预览已固定 · 点击右上角或画面外关闭';
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeViewer(); });

const bindPreview = (element, open, hoverTarget = element) => {
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  const activate = () => {
    clearTimeout(viewerState.hoverTimer);
    viewerState.hoverTimer = 0;
    viewerState.trigger = element;
    open(false);
  };
  element.addEventListener('click', activate);
  element.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activate();
  });
  if (!hoverTarget || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  hoverTarget.addEventListener('pointerenter', () => {
    clearTimeout(viewerState.hoverTimer);
    viewerState.trigger = element;
    viewerState.hoverTimer = setTimeout(() => {
      viewerState.hoverTimer = 0;
      if (element.isConnected) open(true);
    }, 1500);
  });
  hoverTarget.addEventListener('pointerleave', () => {
    clearTimeout(viewerState.hoverTimer);
    viewerState.hoverTimer = 0;
  });
};

const setupClock = (root) => {
  clearInterval(clockTimer);
  const clock = root.querySelector('#clock');
  if (!clock) return;
  for (let i = 0; i < 12; i += 1) {
    const mark = document.createElement('i');
    mark.className = 'tick';
    mark.style.transform = `rotate(${i * 30}deg)`;
    clock.append(mark);
  }
  const hour = root.querySelector('#hour');
  const minute = root.querySelector('#minute');
  const second = root.querySelector('#second');
  const time = root.querySelector('#time');
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const updateClock = () => {
    const date = new Date();
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours() % 12;
    hour.style.transform = `rotate(${hours * 30 + minutes * 0.5}deg)`;
    minute.style.transform = `rotate(${minutes * 6 + seconds * 0.1}deg)`;
    second.style.transform = `rotate(${seconds * 6}deg)`;
    time.textContent = formatter.format(date);
  };
  updateClock();
  clockTimer = setInterval(updateClock, 1000);
};

const initContent = (root = document) => {
  root.querySelectorAll('img').forEach((image) => {
    image.loading = 'lazy';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    if (image.dataset.src) imageObserver.observe(image);
  });
  root.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  setupClock(root);

  const filterButtons = [...root.querySelectorAll('[data-filter]')];
  const filterTargets = [
    ...root.querySelectorAll('.project-card[data-category]'),
    ...root.querySelectorAll('.work-group[data-cat]')
  ];
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const value = button.dataset.filter;
    filterTargets.forEach((target) => {
      const category = target.dataset.category || target.dataset.cat;
      target.classList.toggle('filtered', value !== 'all' && category !== value);
    });
  }));

  projectCards(root).forEach((card) => bindPreview(card, (auto) => {
    const title = card.querySelector('h3').textContent;
    const meta = card.querySelector('small').textContent;
    const image = card.querySelector('img');
    const source = image.dataset.full || image.currentSrc || image.src || image.dataset.src;
    openImage(source, title, meta, card.querySelector('p')?.textContent || '', auto);
  }, card.querySelector('.project-img') || card.querySelector('img')));

  root.querySelectorAll('[data-preview]').forEach((card) => bindPreview(card, (auto) => {
    const image = card.querySelector('img');
    openImage(
      card.dataset.img || image.dataset.full || image.currentSrc || image.src || image.dataset.src,
      card.dataset.title,
      card.dataset.meta,
      card.dataset.desc,
      auto
    );
  }, card.querySelector('.project-img') || card.querySelector('img')));

  root.querySelectorAll('.gallery-item').forEach((item) => bindPreview(item, (auto) => {
    const image = item.querySelector('img');
    const source = image.dataset.full || image.currentSrc || image.src || image.dataset.src;
    const title = item.querySelector('figcaption b')?.textContent || image.alt || '作品画面';
    const meta = item.querySelector('figcaption small')?.textContent || 'VISUAL ARCHIVE';
    openImage(source, title, meta, image.dataset.desc || title, auto);
  }, item.querySelector('img')));

  root.querySelectorAll('[data-pano]').forEach((card) => bindPreview(card, () => {
    openPano(
      card.dataset.pano,
      card.dataset.title,
      card.dataset.meta,
      card.dataset.description
    );
  }, card.querySelector('img')));

  root.querySelectorAll('[data-embed]').forEach((card) => bindPreview(card, () => {
    openEmbed(card.dataset.embed, card.dataset.title, card.dataset.meta, card.dataset.description);
  }));

  root.querySelectorAll('[data-demo-ready]').forEach((card) => bindPreview(card, () => {
    openPlaceholder(card.dataset.title, card.dataset.meta, card.dataset.description);
  }));
};

const projectCards = (root) => [...root.querySelectorAll('.project-card:not([data-preview])')].filter((card) => card.querySelector('img'));

const routeCache = new Map();
const routeLoads = new Map();
const routeKey = (value) => {
  const url = new URL(value, location.href);
  url.hash = '';
  if (url.pathname === '/') url.pathname = '/index.html';
  return url.href;
};

const snapshotPage = (doc = document) => ({
  title: doc.title,
  html: doc.querySelector('.page')?.outerHTML || ''
});

const loadRoute = (value) => {
  const key = routeKey(value);
  if (routeCache.has(key)) return Promise.resolve(routeCache.get(key));
  if (routeLoads.has(key)) return routeLoads.get(key);
  const request = fetch(key, { cache: 'force-cache', credentials: 'same-origin' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Route ${response.status}`);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const snapshot = snapshotPage(doc);
      if (!snapshot.html) throw new Error('Route markup missing');
      routeCache.set(key, snapshot);
      return snapshot;
    })
    .finally(() => routeLoads.delete(key));
  routeLoads.set(key, request);
  return request;
};

const showRoute = (value, push = true) => {
  const key = routeKey(value);
  const snapshot = routeCache.get(key);
  if (!snapshot) return false;

  clearTimeout(viewerState.hoverTimer);
  viewerState.hoverTimer = 0;
  closeViewer();
  imageObserver.disconnect();
  revealObserver.disconnect();
  const template = document.createElement('template');
  template.innerHTML = snapshot.html.trim();
  const nextPage = template.content.firstElementChild;
  if (!nextPage) return false;
  document.querySelector('.page').replaceWith(nextPage);
  document.title = snapshot.title;
  if (push) history.pushState({}, '', key);
  scrollTo({ top: 0, left: 0, behavior: 'instant' });
  lastScroll = 0;
  document.querySelector('.top')?.classList.remove('nav-hidden');
  initContent(nextPage);
  return true;
};

const prefetchRoutes = () => {
  routeCache.set(routeKey(location.href), snapshotPage());
  document.querySelectorAll('.nav a[href$=".html"]').forEach((anchor) => {
    loadRoute(anchor.href).catch(() => {});
  });
};

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('.nav a[href$=".html"]');
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const key = routeKey(anchor.href);
  if (key === routeKey(location.href)) {
    event.preventDefault();
    scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return;
  }
  if (!routeCache.has(key)) return;
  event.preventDefault();
  showRoute(key, true);
});

document.addEventListener('pointerover', (event) => {
  const anchor = event.target.closest('.nav a[href$=".html"]');
  if (anchor) loadRoute(anchor.href).catch(() => {});
}, { passive: true });

addEventListener('popstate', () => {
  if (!showRoute(location.href, false)) location.reload();
});

let navGoldTimer = 0;
let lastScroll = 0;
let navAccum = 0;
addEventListener('scroll', () => {
  const top = document.querySelector('.top');
  if (!top) return;
  top.classList.add('nav-gold');
  clearTimeout(navGoldTimer);
  navGoldTimer = setTimeout(() => top.classList.remove('nav-gold'), 180);

  const y = Math.max(0, scrollY);
  const delta = y - lastScroll;
  lastScroll = y;
  if (delta === 0) return;

  navAccum = (delta > 0) === (navAccum > 0) ? navAccum + delta : delta;

  if (y < 110) {
    top.classList.remove('nav-hidden');
    navAccum = 0;
    return;
  }
  if (navAccum > 6) top.classList.add('nav-hidden');
  else if (navAccum < -6) top.classList.remove('nav-hidden');
}, { passive: true });

initContent(document);
prefetchRoutes();
