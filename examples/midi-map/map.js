// MIDI Map: connects a MIDI controller to the Player.
// Notes press the Player's own buttons and knobs move the Player's own faders.
// Change NOTES and KNOBS to match your controller. Pads light up (note on, velocity 127) while their hot cue is set.
const NOTES = {
  36: { sel: '#btn-play', mode: 'click' },
  37: { sel: '#btn-cue', mode: 'hold' },
  38: { sel: '#btn-censor', mode: 'hold' },
  39: { sel: '#btn-brake', mode: 'click' },
};
for (let i = 0; i < 8; i++) NOTES[40 + i] = { sel: '#cue-pads [data-cue="' + i + '"]', mode: 'click', lit: () => hotCues[i] !== null };
NOTES[36].lit = () => waPlaying;
const KNOBS = { 1: '#dj-pitch', 2: '#dj-filter', 3: '#eq-high', 4: '#eq-mid', 5: '#eq-low', 7: '#volume' };

const style = document.createElement('style');
style.textContent = kt3x.text('map.css');
document.head.appendChild(style);
const status = document.createElement('div');
status.className = 'kt3x-midi';
document.body.appendChild(status);
let hideTimer = 0;
function show(text) {
  status.textContent = text;
  status.classList.add('on');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => status.classList.remove('on'), 4000);
}

const $ = sel => document.querySelector(sel);
const pointer = (sel, type) => $(sel).dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1 }));

function knob(sel, cc) {
  const input = $(sel), min = +input.min, max = +input.max;
  input.value = min === -max ? Math.max(-1, Math.min(1, (cc - 64) / 63)) * max : min + cc / 127 * (max - min);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function onMessage(e) {
  const [st, a, b] = e.data;
  const type = st & 0xf0, note = NOTES[a];
  if (note && (type === 0x90 || type === 0x80)) {
    const down = type === 0x90 && b > 0;
    if (note.mode === 'click' && down) $(note.sel).click();
    else if (note.mode === 'hold') pointer(note.sel, down ? 'pointerdown' : 'pointerup');
  } else if (type === 0xb0 && KNOBS[a]) knob(KNOBS[a], b);
}

if (!navigator.requestMIDIAccess) throw new Error('Web MIDI is not available');
navigator.requestMIDIAccess({ sysex: false }).then(access => {
  const lit = new Map();
  const bind = () => {
    access.inputs.forEach(input => { input.onmidimessage = onMessage; });
    lit.clear();
    const names = [...access.inputs.values()].map(d => d.name);
    show(names.length ? 'MIDI: ' + names.join(', ') : 'MIDI: no input connected');
  };
  access.onstatechange = bind;
  bind();
  (function frame() {
    for (const [n, m] of Object.entries(NOTES)) {
      if (!m.lit) continue;
      const on = !!m.lit();
      if (lit.get(n) === on) continue;
      lit.set(n, on);
      access.outputs.forEach(out => out.send([0x90, +n, on ? 127 : 0]));
    }
    requestAnimationFrame(frame);
  })();
}, e => { throw new Error('MIDI: ' + e.message); });
