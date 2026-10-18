# Making an extension

日本語版: [GUIDE.ja.md](GUIDE.ja.md)

How to make and distribute a KT3 Player extension (`.kt3x`). See [SPEC.md](SPEC.md) for the details.

## 1. Create a folder

An extension is made from a folder with `manifest.json` at its top level.

```
my-extension/
  manifest.json
  icon.png        (optional)
  main.js         (for a main script)
  main.css
```

Example `manifest.json` (an extension that shows the playback position at the bottom right):

```json
{
  "id": "yourname.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "yourname",
  "description": "Shows the playback position.",
  "api": 2,
  "main": "main.js"
}
```

`main.js`:

```js
const el = document.createElement('div');
el.style.cssText = 'position:fixed;right:20px;bottom:20px;color:var(--accent);font:24px monospace;z-index:240';
document.body.appendChild(el);
(function tick() {
  el.textContent = waBuffer ? curPos().toFixed(1) + ' s' : '';
  requestAnimationFrame(tick);
})();
```

- `id` has the form `author.name` (lowercase letters, digits, `-`).
  - IDs in this form do not collide with other people's extensions.
- Effects are described in [SPEC.md section 4](SPEC.md#4-effects), themes in [section 5](SPEC.md#5-themes) and main scripts in [section 6](SPEC.md#6-main-script).

## 2. Try it in the Player

1. Turn on "Extension developer mode" in the KT3 Player settings.
2. Choose the folder with "Extensions" → "Load folder" in the settings.
3. After editing, load it again with "Reload" in the "Extensions" list.
   - With a main script, the whole Player reloads.
   - The desktop version loads the same folder again automatically after the reload. In the browser version, choose the folder again.

An extension loaded from a folder is not saved. Load it again after restarting the Player.
If the manifest has an error, or an error occurs in the main script, the reason is shown.
If an effect is too heavy, the Player stops it and shows the reason ([SPEC.md 4.4](SPEC.md#44-processor)).

## 3. Build the `.kt3x` file

With [Node.js](https://nodejs.org/), build the file with `tools/pack.js` from this repository.

```
node tools/pack.js my-extension
```

This creates a file such as `yourname.clock-1.0.0.kt3x`. Files and folders whose names start with `.` are left out.

## 4. Distribute it

Share the `.kt3x` file as it is. People install it by double-clicking it (desktop version) or by dropping it on the
record in the Player. The name, author and contents are shown before installation.

- For an extension with a main script, a warning says that it can use everything in the Player.
- Raise `version` for a new release.
  - A newer version with the same `id` is treated as an update.

## 5. Hiding and moving the Player's own parts

A theme (CSS) can hide or move the parts that the Player window already has.

- Select parts by their `data-part` names (e.g. `[data-part="hotcues"]`).
  - The names are listed in [SPEC.md 5.1](SPEC.md#51-data-part-names).
  - `data-part` names stay the same between Player versions. IDs and classes may change.
- To hide a part, set `display: none`.
  - For parts that the Player shows or hides itself (for example the waveform at the top left), use `display: none !important`.
    - This is because the Player sets `display` directly on these elements.
- To move a part, use `order`, `grid` and similar properties.
  - The rows of the DJ zone (`[data-part="dj-row-1"]` and so on) line up their parts with flexbox.
- See [remove-layout](examples/remove-layout) for an example.

## 6. Building with a main script

A main script runs in the Player window, so it can build any display and any control.

- To add a display, create elements and put them into the Player window.
  - Finding places by their `data-part` names keeps working between Player versions (e.g. `document.querySelector('[data-part="center"]')`).
- Read the CSS with `kt3x.text('main.css')` and put it into a `<style>` element.
  - It applies to the whole Player window, so use selectors such as classes that start with `kt3x-`.
  - `var(--accent)` matches the accent color that the user chose.
- To control the Player, press the Player's buttons, or change the value of the Player's faders and send an `input` event. The Player then behaves the same as when its own controls are used.
  - Example: `document.getElementById('btn-play').click()`
  - Example: `const f = document.getElementById('dj-filter'); f.value = 50; f.dispatchEvent(new Event('input'));`
- The Player's state can be read from its variables and functions. The examples use the following.

| Name | Description |
|---|---|
| `kt3` | The loaded track (`meta`, `lyrics`, `thumbnailData` and more). `null` when there is no track |
| `waBuffer` | The audio of the track. `waBuffer.duration` is its length (seconds) |
| `waPlaying` | Whether the track is playing |
| `curPos()` | Playback position (seconds) |
| `waSeek(t)` | Moves the playback position |
| `hotCues`, `cuePoint` | Positions of the hot cues and the cue point (`null` when not set) |
| `segAt(t)` | Beat information at a position (`beat`, `offset`, `beats`) |
| `waveformPeaks` | Waveform of the whole track |
| `ExtraDeck` | An additional deck |

- These are internal names of the Player, so they may change between Player versions ([SPEC.md 6.4](SPEC.md#64-names-that-stay-and-names-that-may-change)).
- See [stage-view](examples/stage-view) and [dj-console](examples/dj-console) for examples.

### Reading the Player's code

For the variables, functions and element IDs that a main script uses, refer to the code of the web version of the Player (https://kt3.keitodaze.jp/). The desktop version uses the same code.

- Open the web version in a browser and see it in "Sources" of the developer tools (F12).
- In "Console" of the developer tools, the Player's variables and functions can be tried directly (e.g. `kt3`, `curPos()`).

| File | Contents |
|---|---|
| `index.html` | The HTML and CSS of the window, and almost all of the Player's JavaScript |
| `extensions.js` | Loading extensions (manifest checks, effects, themes) |
| `deck-worklet.js` | Audio playback (decks) |
| `ktc.js` | Reading KTC audio |

- The web version may be updated before the desktop version.
  - The version is shown at the bottom of the settings. Check that it is the same as the Player you test the extension with.
- The KT3 Player terms (section 3 (2)) allow reading this code to make extensions.
  - The code cannot be included in an extension (section 3 (3)).

## Examples

See [examples](examples).

| Folder | Description | Uses |
|---|---|---|
| [fx-pack](examples/fx-pack) | A dub echo, a phaser, and a stutter and a slicer that follow the beat | Graph and processor effects |
| [bitcrusher](examples/bitcrusher) | Lowers the bit depth and sample rate | Processor effect |
| [stage-view](examples/stage-view) | A large view with the cover image, the current lyric and the waveform of the whole track | Main script (replaces the center) |
| [dj-console](examples/dj-console) | The DJ zone with a different layout of deck buttons, hot cues, loops, mixer and BEAT FX | Main script (uses the Player's buttons and faders) |
| [karaoke](examples/karaoke) | Shows the current lyric line large and fills it until the next line | Main script |
| [second-deck](examples/second-deck) | A second deck for another track or the vocal or instrumental audio, with scratching | Main script, `ExtraDeck` |
| [sampler](examples/sampler) | Three pads that play sounds made in the extension | Main script, `ExtraDeck` |
| [midi-map](examples/midi-map) | Maps MIDI buttons and knobs to the Player's controls | Main script, Web MIDI |
| [remove-layout](examples/remove-layout) | Keeps only the record and the play buttons, hides the other parts and rearranges the layout | Theme, `data-part` |
| [theme-sunset](examples/theme-sunset) | Changes the accent color to orange | Theme |
