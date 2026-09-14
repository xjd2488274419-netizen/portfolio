const MIN_ZOOM_MARGIN = 0.02;

export function createPano(stage, url, onReady) {
  stage.classList.add('pano-stage');
  stage.innerHTML = '';

  const image = document.createElement('img');
  image.className = 'pano-image';
  image.alt = '360 度全景';
  image.draggable = false;
  image.style.setProperty('max-width', 'none', 'important');
  image.style.setProperty('max-height', 'none', 'important');
  image.style.setProperty('min-width', '0', 'important');
  image.style.setProperty('position', 'absolute', 'important');
  image.style.setProperty('height', 'auto', 'important');
  const hint = document.createElement('div');
  hint.className = 'pano-hint';
  hint.textContent = '按住拖动环顾 · 滚轮缩放 · 双击复位';
  stage.append(image, hint);

  const state = { x: 0, y: 0, z: 1, drag: false, px: 0, py: 0, alive: true };
  const pointers = new Map();
  let pinchStart = 0;
  let pinchZoom = 1;

  const baseWidth = () => {
    const w = stage.clientWidth || stage.getBoundingClientRect().width || 640;
    const h = stage.clientHeight || stage.getBoundingClientRect().height || 400;
    return Math.max(w * 2, h * 2.4, 900);
  };
  const minZoom = () => {
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    return Math.max(1, h / w) * (1 + MIN_ZOOM_MARGIN);
  };
  const maxZoom = () => minZoom() * 2.6;

  const wrap = () => {
    const span = baseWidth() * state.z;
    if (span <= 1) return;
    while (state.x > 0) state.x -= span;
    while (state.x < -span + stage.clientWidth) state.x += span;
  };

  const render = () => {
    if (!state.alive) return;
    image.style.setProperty('width', `${baseWidth()}px`, 'important');
    image.style.transform = `translate3d(${state.x}px, calc(-50% + ${state.y}px), 0) scale(${state.z})`;
  };

  const reset = () => {
    state.x = 0;
    state.y = 0;
    state.z = minZoom();
    render();
  };

  const zoomAt = (clientX, factor) => {
    const rect = stage.getBoundingClientRect();
    const cx = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const next = Math.min(maxZoom(), Math.max(minZoom(), state.z * factor));
    if (Math.abs(next - state.z) < 0.0001) return;
    state.x = cx - (cx - state.x) * (next / state.z);
    state.z = next;
    wrap();
    render();
  };

  image.addEventListener('load', () => {
    if (!state.alive) return;
    reset();
    stage.classList.add('is-ready');
    onReady?.();
  });
  image.addEventListener('error', () => {
    stage.classList.add('is-ready');
    onReady?.();
  });
  image.src = url;

  const onDown = (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    stage.setPointerCapture?.(event.pointerId);
    if (pointers.size === 1) {
      state.drag = true;
      state.px = event.clientX;
      state.py = event.clientY;
      stage.classList.add('dragging');
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      pinchZoom = state.z;
      state.drag = false;
      stage.classList.remove('dragging');
    }
  };

  const onMove = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = (a.x + b.x) / 2;
      const target = Math.min(maxZoom(), Math.max(minZoom(), pinchZoom * (distance / pinchStart)));
      const rect = stage.getBoundingClientRect();
      const cx = Math.min(Math.max(mid - rect.left, 0), rect.width);
      state.x = cx - (cx - state.x) * (target / state.z);
      state.z = target;
      wrap();
      render();
      return;
    }

    if (!state.drag) return;
    const dx = event.clientX - state.px;
    const dy = event.clientY - state.py;
    state.px = event.clientX;
    state.py = event.clientY;
    state.x -= dx / state.z;
    state.y = Math.max(-60, Math.min(60, state.y + dy / state.z));
    wrap();
    render();
  };

  const onUp = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      state.drag = false;
      stage.classList.remove('dragging');
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0016);
    zoomAt(event.clientX, factor);
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('dblclick', reset);
  const onResize = () => {
    state.z = Math.min(maxZoom(), Math.max(minZoom(), state.z));
    wrap();
    render();
  };
  addEventListener('resize', onResize, { passive: true });
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;
  observer?.observe(stage);
  requestAnimationFrame(onResize);

  state.z = minZoom();
  render();

  return {
    resize: render,
    destroy() {
      state.alive = false;
      observer?.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('dblclick', reset);
      removeEventListener('resize', onResize);
      stage.classList.remove('is-ready', 'dragging');
      stage.innerHTML = '';
    }
  };
}
