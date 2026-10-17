// Second Deck: a second turntable. Drag the platter to scratch.
const $ = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};

const title = $('div', 'title', 'Deck B (empty)');
const time = $('div', 'time', '0:00 / 0:00');
const platter = $('div', 'platter');
const buttons = $('div', 'buttons');
const loadBtn = $('button', '', 'LOAD');
const vocalBtn = $('button', '', 'VOCAL');
const instBtn = $('button', '', 'INST');
const playBtn = $('button', '', 'PLAY');
const volume = $('input');
volume.type = 'range';
volume.min = 0;
volume.max = 100;
volume.value = 100;
buttons.append(loadBtn, vocalBtn, instBtn, playBtn);
const side = $('div', 'side');
side.append(title, time, buttons, volume);
document.body.append(platter, side);

let deck = null, playing = false, angle = 0;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

async function ensureDeck() {
  if (!deck) deck = await kt3.send('deck.create');
  return deck;
}

async function load(source) {
  try {
    const id = await ensureDeck();
    const info = await kt3.send('deck.load', { deck: id, source });
    title.textContent = info.title || 'Deck B';
    playing = false;
    playBtn.textContent = 'PLAY';
  } catch (e) {
    if (e.message !== 'cancelled') title.textContent = e.message;
  }
}

loadBtn.onclick = () => load('pick');
vocalBtn.onclick = () => load('vocal');
instBtn.onclick = () => load('inst');
playBtn.onclick = async () => {
  if (!deck) return;
  playing = !playing;
  if (playing) kt3.send('deck.rate', { deck, rate: 1 });
  await kt3.send(playing ? 'deck.play' : 'deck.pause', { deck });
  playBtn.textContent = playing ? 'PAUSE' : 'PLAY';
};
volume.oninput = () => { if (deck) kt3.send('deck.volume', { deck, value: volume.value / 100 }); };

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
  if (!deck) return;
  held = true;
  lastA = handAngle(e);
  lastT = e.timeStamp;
  platter.setPointerCapture(e.pointerId);
  kt3.send('deck.rate', { deck, rate: 0, smooth: true });
  kt3.send('deck.play', { deck });
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
  kt3.send('deck.rate', { deck, rate: da / dt / DEG_PER_SEC, smooth: true });
  // When the hand stops, the record stops too.
  clearTimeout(still);
  still = setTimeout(() => { if (held) kt3.send('deck.rate', { deck, rate: 0, smooth: true }); }, 60);
});
const release = () => {
  if (!held) return;
  held = false;
  clearTimeout(still);
  if (playing) kt3.send('deck.rate', { deck, rate: 1, smooth: true });
  else kt3.send('deck.pause', { deck });
};
platter.addEventListener('pointerup', release);
platter.addEventListener('pointercancel', release);

kt3.on('decks', list => {
  const d = list.find(x => x.id === deck);
  if (!d) return;
  time.textContent = fmt(d.time) + ' / ' + fmt(d.duration);
  angle = d.time * 200;
  platter.style.transform = 'rotate(' + angle + 'deg)';
});
