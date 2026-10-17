// MIDI Map: note 36 = play/pause, notes 40-47 = hot cues 1-8, CC 1 = pitch.
const status = document.createElement('div');
status.className = 'status';
status.textContent = 'Waiting for a MIDI device...';
const last = document.createElement('div');
last.className = 'last';
document.body.append(status, last);

const PLAY_NOTE = 36, CUE_FIRST = 40, PITCH_CC = 1;
let playing = false;

kt3.on('frame', f => { playing = f.playing; });

kt3.on('midi', m => {
  if (m.devices) {
    const names = m.devices.inputs.map(d => d.name);
    status.textContent = names.length ? 'Inputs: ' + names.join(', ') : 'No MIDI input connected';
    return;
  }
  const [st, a, b] = m.data;
  const type = st & 0xf0;
  last.textContent = 'Last: ' + m.data.map(x => x.toString(16).padStart(2, '0')).join(' ');
  if (type === 0x90 && b > 0) {
    if (a === PLAY_NOTE) kt3.send(playing ? 'pause' : 'play');
    else if (a >= CUE_FIRST && a < CUE_FIRST + 8) kt3.send('hotcue', { index: a - CUE_FIRST });
  } else if (type === 0xb0 && a === PITCH_CC) {
    kt3.send('pitch', { percent: (b - 64) / 64 * 8 });
  }
});
