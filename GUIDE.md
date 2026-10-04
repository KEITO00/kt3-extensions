# Making an extension

日本語版: [GUIDE.ja.md](GUIDE.ja.md)

How to make and distribute a KT3 Player extension (`.kt3x`). See [SPEC.md](SPEC.md) for the details.

## 1. Create a folder

An extension is made from a folder with `manifest.json` at its top level.

```
my-extension/
  manifest.json
  icon.png        (optional)
  ui/main.js      (for UI)
  ui/main.css
```

Example `manifest.json` (a UI that shows the playback position over the window):

```json
{
  "id": "yourname.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "yourname",
  "description": "Shows the playback position.",
  "api": 1,
  "ui": [{ "id": "clock", "name": "Clock", "slot": "overlay", "script": "ui/main.js" }]
}
```

`ui/main.js`:

```js
const el = document.createElement('div');
el.style.cssText = 'position:fixed;right:20px;bottom:20px;color:#fff;font:24px monospace';
document.body.appendChild(el);
kt3.on('frame', f => { el.textContent = f.time.toFixed(1) + ' s'; });
```

- `id` has the form `author.name` (lowercase letters, digits, `-`).
  - This keeps it from colliding with other extensions.
- Effects are described in [SPEC.md section 5](SPEC.md#5-effects) and UI in [section 6](SPEC.md#6-ui).

## 2. Try it in the Player

1. Turn on "Extension developer mode" in the KT3 Player settings.
2. Choose the folder with "Extensions" → "Load folder" in the settings.
3. After editing, load it again with "Reload" in the "Extensions" list.

An extension loaded from a folder is not saved. Load it again after restarting the Player.
If the manifest has an error, the reason is shown.
If an effect is too heavy or a UI stops answering, the Player stops it and shows the reason ([SPEC.md 5.4](SPEC.md#54-processor), [6.1](SPEC.md#61-environment)).

## 3. Build the `.kt3x` file

With [Node.js](https://nodejs.org/), build the file with `tools/pack.js` from this repository.

```
node tools/pack.js my-extension
```

This creates a file such as `yourname.clock-1.0.0.kt3x`. Files and folders whose names start with `.` are left out.

## 4. Distribute it

Share the `.kt3x` file as it is. People install it by double-clicking it (desktop version) or by dropping it on the
record in the Player. The name, author and permissions are shown before installation.

- Raise `version` for a new release.
  - A newer version with the same `id` is treated as an update.
- Ask only for the permissions you need.
  - When an update adds permissions, the new ones are shown to the user.

## Examples

See [examples](examples).

| Folder | Description | Uses |
|---|---|---|
| [bitcrusher](examples/bitcrusher) | Lowers the bit depth and sample rate | Processor effect |
| [karaoke](examples/karaoke) | Shows the current lyric line large and fills it until the next line | UI (overlay) |
| [second-deck](examples/second-deck) | A second deck for another track or the vocal or instrumental audio, with scratching | Decks, `decks` permission |
| [midi-map](examples/midi-map) | Maps MIDI buttons and knobs to play, hot cues and pitch | MIDI, `midi` permission |
| [theme-sunset](examples/theme-sunset) | Changes the accent color to orange | Theme |
