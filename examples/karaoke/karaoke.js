// Karaoke: shows the current lyric line and fills it until the next line starts.
let lines = [];

const line = document.createElement('div');
line.className = 'line';
const base = document.createElement('span');
base.className = 'base';
const fill = document.createElement('span');
fill.className = 'fill';
line.append(base, fill);
document.body.appendChild(line);

kt3.on('track', track => {
  lines = track ? track.lyrics.filter(l => l.text.trim()) : [];
});

kt3.on('frame', frame => {
  let i = -1;
  while (i + 1 < lines.length && lines[i + 1].time <= frame.time) i++;
  const cur = lines[i], next = lines[i + 1];
  const text = cur ? cur.text : '';
  if (base.textContent !== text) {
    base.textContent = text;
    fill.textContent = text;
  }
  const end = next ? next.time : cur ? cur.time + 4 : 0;
  const progress = cur ? Math.min(1, (frame.time - cur.time) / Math.max(0.3, end - cur.time)) : 0;
  fill.style.clipPath = 'inset(0 ' + (100 - progress * 100) + '% 0 0)';
});
