// DJ Console: a different layout for the DJ zone.
// Every control presses the Player's own button or moves the Player's own fader, so the Player
// behaves exactly as if its own controls were used. The console copies their state every frame.
// Hot cue pads: click to set or jump, right-click to clear.
const style = document.createElement('style');
style.textContent = kt3x.text('console.css');
document.head.appendChild(style);

const $ = sel => document.querySelector(sel);
const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
};
const syncs = [];
const sync = fn => syncs.push(fn);
const click = sel => $(sel).click();
const pointer = (sel, type) => $(sel).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1 }));
const setInput = (sel, v) => { const i = $(sel); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };

const root = el('div', 'kt3x-console', $('[data-part="dj-zone"]'));
const toggleBtn = document.createElement('button');
toggleBtn.className = 'ctrl-btn kt3x-console-btn';
toggleBtn.textContent = 'CONSOLE';
$('[data-part="transport"]').insertBefore(toggleBtn, $('[data-part="title"]'));
let shown = kt3x.storage.get('shown') === true;
function setShown(v) {
  shown = v;
  kt3x.storage.set('shown', v);
  document.body.classList.toggle('kt3x-console-on', v);
  toggleBtn.classList.toggle('on', v);
}
toggleBtn.addEventListener('click', () => setShown(!shown));
setShown(shown);

function section(title) {
  const s = el('section', '', root);
  el('h2', '', s, title);
  return s;
}
function button(parent, label, onClick, isOn, cls) {
  const b = el('button', cls || '', parent, label);
  b.addEventListener('click', onClick);
  if (isOn) sync(() => b.classList.toggle('on', !!isOn()));
  return b;
}
function hold(parent, label, sel, isOn) {
  const b = el('button', '', parent, label);
  b.addEventListener('pointerdown', e => { b.setPointerCapture(e.pointerId); pointer(sel, 'pointerdown'); });
  b.addEventListener('pointerup', () => pointer(sel, 'pointerup'));
  b.addEventListener('pointercancel', () => pointer(sel, 'pointercancel'));
  sync(() => b.classList.toggle('hot', !!isOn()));
  return b;
}
function fader(parent, label, sel, opts) {
  const box = el('div', 'fader', parent);
  el('label', '', box, label);
  const input = el('input', opts.vertical ? 'v' : 'h', box);
  input.type = 'range';
  const out = el('output', '', box);
  let dragging = false;
  input.addEventListener('pointerdown', () => { dragging = true; });
  input.addEventListener('pointerup', () => { dragging = false; });
  input.addEventListener('input', () => setInput(sel, input.value));
  input.addEventListener('dblclick', () => setInput(sel, opts.reset));
  sync(() => {
    const src = $(sel);
    input.min = src.min;
    input.max = src.max;
    input.step = src.step || 1;
    if (!dragging) input.value = src.value;
    out.textContent = opts.format ? opts.format(+src.value) : Math.round(+src.value);
  });
  return box;
}

const deck = section('DECK');
const deckGrid = el('div', 'grid deck', deck);
button(deckGrid, 'PLAY', () => click('#btn-play'), () => waPlaying);
hold(deckGrid, 'CUE', '#btn-cue', () => cuePreview);
hold(deckGrid, 'CENSOR', '#btn-censor', () => $('#btn-censor').classList.contains('on'));
button(deckGrid, 'BRAKE', () => click('#btn-brake'), () => $('#btn-brake').classList.contains('on'));
button(deckGrid, 'SPIN', () => click('#btn-spin'), () => $('#btn-spin').classList.contains('on'));
button(deckGrid, 'SLIP', () => click('#btn-slip'), () => $('#btn-slip').classList.contains('on'));
fader(deck, 'PITCH', '#dj-pitch', { reset: 0, format: v => (v >= 0 ? '+' : '') + v.toFixed(2) + '%' });

const pads = section('HOT CUES');
const padGrid = el('div', 'grid pads', pads);
for (let i = 0; i < 8; i++) {
  const sel = '#cue-pads [data-cue="' + i + '"]', b = el('button', '', padGrid);
  el('span', '', b, String(i + 1));
  const t = el('small', '', b, '');
  b.addEventListener('click', () => click(sel));
  b.addEventListener('contextmenu', e => { e.preventDefault(); $(sel).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })); });
  sync(() => {
    const v = hotCues[i];
    b.classList.toggle('on', v !== null);
    t.textContent = v === null ? '' : Math.floor(v / 60) + ':' + (v % 60).toFixed(1).padStart(4, '0');
  });
}

const loops = section('BEAT LOOP');
const loopGrid = el('div', 'grid loops', loops);
for (const [label, beats] of [['1/4', '0.25'], ['1/2', '0.5'], ['1', '1'], ['2', '2'], ['4', '4'], ['8', '8'], ['16', '16']]) {
  const sel = '#bl-seg [data-bl="' + beats + '"]';
  button(loopGrid, label, () => click(sel), () => $(sel).classList.contains('on'));
}
button(loopGrid, 'EXIT', () => click('#btn-loop-exit'));
const loopRow = el('div', 'row', loops);
button(loopRow, '½', () => click('#btn-loop-half'));
button(loopRow, '×2', () => click('#btn-loop-double'));
button(loopRow, 'IN', () => click('#btn-loop-in'));
button(loopRow, 'OUT', () => click('#btn-loop-out'));

const mixer = section('MIXER');
const faders = el('div', 'faders', mixer);
for (const band of ['high', 'mid', 'low']) {
  const f = fader(faders, band.toUpperCase(), '#eq-' + band, { vertical: true, reset: 0 });
  const kill = '#dj-rack4 .eq-kill[data-band="' + band + '"]';
  button(f, 'KILL', () => click(kill), () => $(kill).classList.contains('on'), 'kill');
}
fader(faders, 'VOLUME', '#volume', { vertical: true, reset: 80 });
fader(mixer, 'FILTER', '#dj-filter', { reset: 0, format: v => Math.abs(v) < 4 ? 'OFF' : v < 0 ? 'LP' : 'HP' });

const fx = section('BEAT FX');
const fxGrid = el('div', 'grid fx', fx);
for (const [label, type] of [['ECHO', 'echo'], ['GATE', 'gate'], ['REVERB', 'reverb'], ['RVB OUT', 'rvbout'], ['FILT OUT', 'filtout'], ['ROLL OUT', 'rollout']]) {
  const sel = '#fx-type [data-fx="' + type + '"]';
  button(fxGrid, label, () => click(sel), () => $(sel).classList.contains('on'));
}
fader(fx, 'DEPTH', '#fx-depth', { reset: 100, format: v => Math.round(v) + '%' });

const KILL_KEYS = { KeyQ: 'high', KeyW: 'mid', KeyE: 'low' };
let censorKey = false;
document.addEventListener('keydown', e => {
  if (!e.altKey || e.ctrlKey || e.repeat) return;
  if (KILL_KEYS[e.code]) { e.preventDefault(); click('#dj-rack4 .eq-kill[data-band="' + KILL_KEYS[e.code] + '"]'); }
  else if (e.code === 'KeyA' && !censorKey) { e.preventDefault(); censorKey = true; pointer('#btn-censor', 'pointerdown'); }
});
document.addEventListener('keyup', e => {
  if (e.code === 'KeyA' && censorKey) { censorKey = false; pointer('#btn-censor', 'pointerup'); }
});

(function frame() {
  if (shown) for (const fn of syncs) fn();
  requestAnimationFrame(frame);
})();
