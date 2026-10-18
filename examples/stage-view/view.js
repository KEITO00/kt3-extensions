// Stage View: a large now-playing view in the center of the Player.
// It reads the Player's state directly: kt3 (the loaded track), curPos(), waveformPeaks, hotCues,
// cuePoint, segAt() and pitchRate, and seeks with waSeek(). STAGE or Alt+V switches the view.
const style = document.createElement('style');
style.textContent = kt3x.text('view.css');
document.head.appendChild(style);

const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  parent.appendChild(e);
  return e;
};
const root = el('div', 'kt3x-stage', document.querySelector('[data-part="center"]'));
const art = el('div', 'art', root);
const img = el('img', '', art);
const initial = el('div', 'initial', art);
const info = el('div', 'info', root);
const title = el('div', 'title', info);
const artist = el('div', 'artist', info);
const meta = el('div', 'meta', info);
const time = el('span', '', meta);
const bpm = el('span', '', meta);
const pitch = el('span', '', meta);
const beats = el('span', 'beats', meta);
const lyric = el('div', 'lyric', info);
const next = el('div', 'next', info);
const wave = el('canvas', 'wave', root);
const ctx = wave.getContext('2d');

const transport = document.querySelector('[data-part="transport"]');
const button = document.createElement('button');
button.className = 'ctrl-btn kt3x-stage-btn';
button.textContent = 'STAGE';
transport.insertBefore(button, document.querySelector('[data-part="title"]'));

let shown = kt3x.storage.get('shown') !== false;
let track = undefined, layers = null, layersFor = null, artUrl = null, dragging = false;

function setShown(v) {
  shown = v;
  kt3x.storage.set('shown', v);
  document.body.classList.toggle('kt3x-stage-on', v);
  button.classList.toggle('on', v);
}
button.addEventListener('click', () => setShown(!shown));
document.addEventListener('keydown', e => {
  if (e.altKey && !e.ctrlKey && e.code === 'KeyV' && !e.repeat) { e.preventDefault(); setShown(!shown); }
});
setShown(shown);

const fmt = s => { s = Math.max(0, s || 0); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };

function setTrack(t) {
  track = t;
  layers = null;
  layersFor = null;
  if (artUrl) { URL.revokeObjectURL(artUrl); artUrl = null; }
  const m = t ? t.meta || {} : {};
  title.textContent = t ? m.title || 'Untitled' : 'Load a track';
  artist.textContent = t ? m.artist || '' : '';
  if (t && t.thumbnailData && t.thumbnailData.byteLength) artUrl = URL.createObjectURL(new Blob([t.thumbnailData], { type: 'image/webp' }));
  img.hidden = !artUrl;
  if (artUrl) img.src = artUrl;
  initial.textContent = t && !artUrl ? (m.title || '?').trim().charAt(0).toUpperCase() : '';
  lyric.textContent = next.textContent = '';
}

function buildLayers() {
  const w = wave.width, h = wave.height, peaks = waveformPeaks;
  layersFor = peaks;
  const make = color => {
    const c = new OffscreenCanvas(w, h), g = c.getContext('2d');
    let mx = 0;
    for (let i = 0; i < peaks.length; i++) if (peaks[i] > mx) mx = peaks[i];
    g.fillStyle = color;
    const bar = Math.max(1, Math.round(devicePixelRatio * 2));
    for (let x = 0; x < w; x += bar + 1) {
      const s = Math.floor(x / w * peaks.length), e = Math.max(s + 1, Math.floor((x + bar) / w * peaks.length));
      let p = 0;
      for (let i = s; i < e && i < peaks.length; i++) if (peaks[i] > p) p = peaks[i];
      const ph = Math.max(1, (mx ? p / mx : 0) * h * 0.46);
      g.fillRect(x, h / 2 - ph, bar, ph * 2);
    }
    return c;
  };
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  layers = { dim: make('rgba(255, 255, 255, .18)'), lit: make(accent) };
}

function draw(now) {
  const w = wave.width, h = wave.height;
  ctx.clearRect(0, 0, w, h);
  if (!waBuffer || !w) return;
  if (waveformPeaks && layersFor !== waveformPeaks) buildLayers();
  if (!layers) return;
  const d = waBuffer.duration || 1, x = t => t / d * w;
  ctx.drawImage(layers.dim, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, x(now), h);
  ctx.clip();
  ctx.drawImage(layers.lit, 0, 0);
  ctx.restore();
  const loop = loopSeconds(deckRefTrack());
  if (loop) {
    ctx.fillStyle = 'rgba(255, 255, 255, .08)';
    ctx.fillRect(x(loop.s), 0, x(loop.e) - x(loop.s), h);
  }
  ctx.font = Math.round(11 * devicePixelRatio) + 'px monospace';
  ctx.fillStyle = '#ffcf5c';
  const mark = (t, label) => {
    const cx = Math.round(x(t)) + 0.5;
    ctx.fillRect(cx, 0, 1, h);
    ctx.fillText(label, cx + 3, 12 * devicePixelRatio);
  };
  hotCues.forEach((t, i) => { if (t !== null) mark(t, String(i + 1)); });
  if (cuePoint !== null) mark(cuePoint, 'C');
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(x(now)), 0, Math.max(1, devicePixelRatio), h);
}

function tick() {
  requestAnimationFrame(tick);
  if (kt3 !== track) setTrack(kt3);
  if (!shown || !track || !waBuffer) { if (shown) draw(0); return; }
  const now = curPos();
  time.textContent = fmt(now) + ' / ' + fmt(waBuffer.duration);
  const g = segAt(now);
  bpm.textContent = g && g.beat > 0 ? (60 / g.beat).toFixed(1) + ' BPM' : '';
  const pct = (pitchRate - 1) * 100;
  pitch.textContent = 'PITCH ' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
  const n = g && g.beat > 0 ? g.beats : 0;
  if (beats.children.length !== n) beats.replaceChildren(...Array.from({ length: n }, () => document.createElement('span')));
  if (n) {
    const inBar = ((Math.floor((now - g.offset) / g.beat) - g.db) % n + n) % n;
    [...beats.children].forEach((s, i) => s.classList.toggle('on', i === inBar));
  }
  const lines = track.lyrics || [];
  let i = -1;
  while (i + 1 < lines.length && lines[i + 1].time <= now) i++;
  lyric.textContent = i >= 0 ? lines[i].text : '';
  next.textContent = i + 1 < lines.length ? lines[i + 1].text : '';
  draw(now);
}
requestAnimationFrame(tick);

function seekAt(e) {
  if (!waBuffer) return;
  const r = wave.getBoundingClientRect();
  waSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * waBuffer.duration);
}
wave.addEventListener('pointerdown', e => { dragging = true; wave.setPointerCapture(e.pointerId); seekAt(e); });
wave.addEventListener('pointermove', e => { if (dragging) seekAt(e); });
wave.addEventListener('pointerup', () => { dragging = false; });

new ResizeObserver(() => {
  wave.width = Math.round(wave.clientWidth * devicePixelRatio);
  wave.height = Math.round(wave.clientHeight * devicePixelRatio);
  layersFor = null;
}).observe(wave);
