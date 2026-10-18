// Karaoke: shows the current lyric line large and fills it until the next line starts.
// The main script runs in the Player page, so it reads the Player's state directly:
// kt3 is the loaded track and curPos() is the playback position.
const style = document.createElement('style');
style.textContent = kt3x.text('karaoke.css');
document.head.appendChild(style);

const box = document.createElement('div');
box.className = 'kt3x-karaoke';
const line = document.createElement('div');
line.className = 'line';
const base = document.createElement('span');
base.className = 'base';
const fill = document.createElement('span');
fill.className = 'fill';
line.append(base, fill);
box.appendChild(line);
document.body.appendChild(box);

let track = null, lines = [];

function tick() {
  if (kt3 !== track) {
    track = kt3;
    lines = track ? track.lyrics.filter(l => l.text.trim()) : [];
  }
  const time = track && waBuffer ? curPos() : 0;
  let i = -1;
  while (i + 1 < lines.length && lines[i + 1].time <= time) i++;
  const cur = lines[i], next = lines[i + 1];
  const text = cur ? cur.text : '';
  if (base.textContent !== text) {
    base.textContent = text;
    fill.textContent = text;
  }
  const end = next ? next.time : cur ? cur.time + 4 : 0;
  const progress = cur ? Math.min(1, (time - cur.time) / Math.max(0.3, end - cur.time)) : 0;
  fill.style.clipPath = 'inset(0 ' + (100 - progress * 100) + '% 0 0)';
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
