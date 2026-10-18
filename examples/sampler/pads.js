// Sampler: makes three short sounds as WAV data, decodes them and plays each on its own ExtraDeck.
// SYNC uses the Player's beat grid (segAt) to wait for the next 16th note.
const SR = 48000;

const style = document.createElement('style');
style.textContent = kt3x.text('pads.css');
document.head.appendChild(style);

function wav(samples) {
  const buf = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true));
  return buf;
}
function synth(seconds, fn) {
  const out = new Float32Array(Math.round(SR * seconds));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / SR);
  return out;
}
const SOUNDS = [
  { name: 'KICK', key: 'Digit1', data: () => { let ph = 0; return synth(0.6, t => { ph += 2 * Math.PI * (45 + 90 * Math.exp(-t * 28)) / SR; return Math.sin(ph) * Math.exp(-t * 6) * 0.95; }); } },
  { name: 'CLAP', key: 'Digit2', data: () => { let lp = 0; return synth(0.5, t => { lp += (Math.random() * 2 - 1 - lp) * 0.35; const burst = [0, 0.012, 0.024].reduce((a, s) => a + (t >= s ? Math.exp(-(t - s) * (s < 0.02 ? 140 : 22)) : 0), 0); return lp * burst * 0.8; }); } },
  { name: 'HORN', key: 'Digit3', data: () => synth(1.4, t => { const vib = 1 + 0.006 * Math.sin(2 * Math.PI * 5.5 * t); const env = Math.min(1, t * 30) * Math.exp(-Math.max(0, t - 0.9) * 6); return [220, 277.2, 329.6].reduce((a, f) => a + (((t * f * vib) % 1) * 2 - 1), 0) * env * 0.22; }) },
];

const row = document.createElement('div');
row.className = 'dj-rack kt3x-sampler';
const pads = SOUNDS.map(s => {
  const b = document.createElement('button');
  b.textContent = s.name;
  b.disabled = true;
  row.appendChild(b);
  return { ...s, el: b, deck: null };
});
const sync = document.createElement('button');
sync.textContent = 'SYNC';
sync.className = 'sync';
const vol = document.createElement('input');
vol.type = 'range';
vol.min = 0;
vol.max = 200;
vol.value = 100;
row.append(sync, vol);
document.querySelector('[data-part="ext-effects"]').after(row);
fitDjRacks();

let synced = false;
sync.addEventListener('click', () => { synced = !synced; sync.classList.toggle('on', synced); });
vol.addEventListener('input', () => pads.forEach(p => p.deck && p.deck.gain.gain.setTargetAtTime(vol.value / 100, waCtx.currentTime, 0.01)));

function delayToNext16th() {
  if (!synced || !waPlaying) return 0;
  const g = segAt(curPos());
  if (!g || !(g.beat > 0)) return 0;
  const sixteenth = g.beat / 4, rel = (curPos() - g.offset) / sixteenth;
  return (Math.ceil(rel) - rel) * sixteenth / Math.max(0.05, pitchRate) * 1000;
}
function hit(p) {
  if (!p.deck) return;
  setTimeout(() => {
    p.el.classList.add('hit');
    setTimeout(() => p.el.classList.remove('hit'), 120);
    if (waCtx.state === 'suspended') waCtx.resume();
    p.deck.send({ t: 'seek', tracks: null, pos: 0 });
    p.deck.send({ t: 'rate', r: 1 });
    p.deck.send({ t: 'play' });
  }, delayToNext16th());
}
pads.forEach(p => p.el.addEventListener('pointerdown', () => hit(p)));
document.addEventListener('keydown', e => {
  if (!e.altKey || e.ctrlKey || e.repeat) return;
  const p = pads.find(x => x.key === e.code);
  if (p) { e.preventDefault(); hit(p); }
});

(async () => {
  if (!waCtx) waCtx = new AudioContext({ sampleRate: 48000 });
  await ensureDeck();
  ensureAudioGraph();
  for (const p of pads) {
    p.deck = new ExtraDeck();
    p.deck.load([toTrack(await waCtx.decodeAudioData(wav(p.data())))], { title: p.name });
    p.el.disabled = false;
  }
})();

(function frame() {
  row.hidden = !settings.djRack;
  requestAnimationFrame(frame);
})();
