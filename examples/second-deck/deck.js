// Second Deck: a second turntable in the DJ zone. Drag the platter to scratch.
// It uses the Player's ExtraDeck, which plays with the same processor as the main deck.
const style = document.createElement('style');
style.textContent = kt3x.text('deck.css');
document.head.appendChild(style);

const make = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const row = make('div', 'dj-rack kt3x-deck');
const title = make('div', 'title', 'Deck B (empty)');
const time = make('div', 'time', '0:00 / 0:00');
const platter = make('div', 'platter');
const buttons = make('div', 'buttons');
const loadBtn = make('button', '', 'LOAD');
const vocalBtn = make('button', '', 'VOCAL');
const instBtn = make('button', '', 'INST');
const playBtn = make('button', '', 'PLAY');
const volume = make('input');
volume.type = 'range';
volume.min = 0;
volume.max = 100;
volume.value = 100;
const picker = make('input');
picker.type = 'file';
picker.accept = '.kt3,.kt4';
picker.hidden = true;
buttons.append(loadBtn, vocalBtn, instBtn, playBtn);
const side = make('div', 'side');
side.append(title, time, buttons, volume);
row.append(platter, side, picker);
document.querySelector('[data-part="ext-effects"]').after(row);
fitDjRacks();

let deck = null, playing = false;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

async function getDeck() {
  if (deck) return deck;
  if (!waCtx) waCtx = new AudioContext({ sampleRate: 48000 });
  await ensureDeck();
  ensureAudioGraph();
  deck = new ExtraDeck();
  return deck;
}
function setRate(r, smooth) {
  deck.rate = r;
  deck.send(smooth ? { t: 'rate', r, smooth: 0.01 } : { t: 'rate', r });
}
function play() {
  if (waCtx.state === 'suspended') waCtx.resume();
  deck.send({ t: 'rate', r: deck.rate });
  deck.send({ t: 'play' });
}
function pause() { deck.send({ t: 'stop' }); }

async function loadInto(getTracks) {
  try {
    const d = await getDeck();
    const { tracks, name } = await getTracks();
    d.load(tracks, { title: name });
    title.textContent = name || 'Deck B';
    playing = false;
    playBtn.textContent = 'PLAY';
  } catch (e) {
    title.textContent = e.message;
  }
}
function stem(which) {
  return async () => {
    if (!stemBufs) throw new Error('This track has no separate vocal and instrumental audio');
    return { tracks: [stemBufs[which]], name: (kt3.meta.title || '') + ' (' + which + ')' };
  };
}

loadBtn.onclick = () => picker.click();
picker.onchange = () => {
  const file = picker.files[0];
  picker.value = '';
  if (!file) return;
  loadInto(async () => {
    await getDeck();
    const kt = await KT3.parseFile(file);
    const r = await decodeTracks(kt, await ktMainAudio(kt));
    return { tracks: r.tracks, name: (kt.meta && kt.meta.title) || file.name.replace(/\.kt[34]$/i, '') };
  });
};
vocalBtn.onclick = () => loadInto(stem('vocal'));
instBtn.onclick = () => loadInto(stem('inst'));
playBtn.onclick = () => {
  if (!deck || !deck.tracks) return;
  playing = !playing;
  if (playing) { setRate(1); play(); } else pause();
  playBtn.textContent = playing ? 'PAUSE' : 'PLAY';
};
volume.oninput = () => { if (deck) deck.gain.gain.setTargetAtTime(volume.value / 100, waCtx.currentTime, 0.01); };

// Scratching: while the platter is held, the record turns with the hand.
// The record turns 200 degrees per second at normal speed, the same as the record in the Player.
const DEG_PER_SEC = 200;
let lastA = 0, lastT = 0, held = false, still = 0;
const handAngle = e => {
  const r = platter.getBoundingClientRect();
  return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
};
platter.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (!deck || !deck.tracks) return;
  held = true;
  lastA = handAngle(e);
  lastT = e.timeStamp;
  platter.setPointerCapture(e.pointerId);
  setRate(0, true);
  play();
});
platter.addEventListener('pointermove', e => {
  if (!held) return;
  const now = e.timeStamp, dt = Math.max(1, now - lastT) / 1000;
  const a = handAngle(e);
  let da = a - lastA;
  if (da > 180) da -= 360;
  if (da < -180) da += 360;
  lastA = a;
  lastT = now;
  setRate(da / dt / DEG_PER_SEC, true);
  // When the hand stops, the record stops too.
  clearTimeout(still);
  still = setTimeout(() => { if (held) setRate(0, true); }, 60);
});
const release = () => {
  if (!held) return;
  held = false;
  clearTimeout(still);
  if (playing) setRate(1, true);
  else pause();
};
platter.addEventListener('pointerup', release);
platter.addEventListener('pointercancel', release);

(function frame() {
  row.hidden = !settings.djRack;
  if (deck && deck.tracks) {
    const t = deck.pos();
    time.textContent = fmt(t) + ' / ' + fmt(deck.duration);
    platter.style.transform = 'rotate(' + t * DEG_PER_SEC + 'deg)';
  }
  requestAnimationFrame(frame);
})();
