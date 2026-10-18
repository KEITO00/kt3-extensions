# KT3 Player Extension (.kt3x) Specification

日本語版: [SPEC.ja.md](SPEC.ja.md)

> Extensions are supported from KT3 Player 1.5.0. API 2 (3.1) is supported from KT3 Player 1.8.3.

This document describes the file format of extensions for
[KT3 Player](https://github.com/KEITO00/kt3-player) (`.kt3x`) and what extensions can do.

The key words "MUST", "SHOULD" and "MAY" are used as described in RFC 2119.

## 1. Overview

An extension can add the following. One extension can contain several of them.

| Kind | Description |
|---|---|
| Effect | An audio effect (section 4) |
| Theme | CSS that changes the look of the Player (section 5) |
| Main script | JavaScript that runs in the Player window (section 6) |

- Effects and themes work only within their defined formats.
- A main script can use everything in the Player.
- Extensions run in both the desktop version and the browser version.

## 2. File

- A `.kt3x` file MUST be a ZIP file.
  - Entries are stored or deflated.
  - Encrypted entries and ZIP64 are not supported.
- `manifest.json` MUST be at the top level of the ZIP.
- Paths in the ZIP use `/` as the separator.
  - A package with a path that contains `..`, starts with `/` or contains a drive letter MUST NOT be installed.
- Text files and file names MUST be UTF-8.
- The size limits are as follows.
  - Up to 500 files.
  - Up to 20 MB per file.
  - Up to 50 MB each for the `.kt3x` file and for its total uncompressed size.
- The Player does not install a package with a file whose uncompressed size differs from the size recorded in the ZIP.
- `tools/pack.js` builds a `.kt3x` file from a folder (`node tools/pack.js <folder>`).

## 3. manifest.json

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Extension ID in the form `<author>.<name>` (e.g. `keito.second-deck`). It uses lowercase letters, digits, `-`, and one `.` as the separator |
| `name` | Yes | Display name |
| `version` | Yes | Version in the form `x.y.z` |
| `author` | Yes | Author name |
| `description` | Yes | Short description (up to 200 characters) |
| `api` | Yes | Extension API version used (3.1) |
| `icon` | No | Path to an icon image (PNG) |
| `effects` | No | List of effects (section 4) |
| `theme` | No | Theme (section 5) |
| `main` | No | Path to the main script (JavaScript) (section 6). API 2 |

- A manifest with a field that is not in this table cannot be installed. The Player shows the reason.
- The Player shows names, authors and descriptions as plain text, never as HTML.

### 3.1 API versions

`api` is `1` or `2`. The current version is `2`.

- Only extensions with `"api": 2` can use `main`.
- Extensions with `"api": 1` that contain only effects and themes keep working.
- Extensions that use `ui` or `permissions` from API 1 cannot be installed.
  - The Player shows the reason.
  - Rewrite the UI as a main script (section 6).

## 4. Effects

An extension can list up to 8 effects in `effects`.

### 4.1 Common fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Effect ID (lowercase letters, digits, `-`, up to 32 characters) |
| `name` | Yes | Name shown in the DJ zone (up to 24 characters) |
| `kind` | Yes | `graph` or `processor` |
| `slots` | No | Where the effect can be inserted: `vocal`, `inst` or `master`. The default is `["master"]`. The first entry is the initial slot |
| `params` | No | Parameters (up to 16) |

- `vocal` and `inst` are available only for tracks with separate vocal and instrumental audio.
- `master` comes after all Player processing (EQ, filter, BEAT FX, BASS BOOST).
- For each effect, the Player adds controls to the DJ zone.
  - The controls are an ON button, a slot selector and the parameters.
- Effects are OFF after installation and when a track is loaded.

### 4.2 Parameters

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Parameter ID |
| `name` | Yes | Display name (up to 24 characters) |
| `control` | No | `fader` (default), `button` (1 while held) or `toggle` (switches between 0 and 1) |
| `min`, `max` | For `fader` | Value range |
| `default` | No | Initial value. The default is `min` |
| `step` | No | Step size. The default is continuous |
| `unit` | No | Unit shown after the value (up to 8 characters) |
| `map` | For `graph` | Which node values the parameter controls (4.3) |

### 4.3 `graph`

An effect built from standard Web Audio nodes.

```json
{
  "id": "echo", "name": "ECHO", "kind": "graph", "slots": ["master", "vocal"],
  "nodes": {
    "d": { "type": "delay", "maxDelay": 2 },
    "fb": { "type": "gain", "gain": 0.4 },
    "wet": { "type": "gain", "gain": 0.5 }
  },
  "connect": [["in", "out"], ["in", "d"], ["d", "fb"], ["fb", "d"], ["d", "wet"], ["wet", "out"]],
  "params": [
    { "id": "time", "name": "TIME", "min": 0, "max": 1, "default": 0.5,
      "map": [{ "node": "d", "param": "delayTime", "curve": "beats", "from": 0.25, "to": 1 }] },
    { "id": "mix", "name": "MIX", "min": 0, "max": 100, "default": 50, "unit": "%",
      "map": [{ "node": "wet", "param": "gain", "from": 0, "to": 1 }] }
  ]
}
```

- `nodes` lists node names and settings (up to 32).
  - `in` and `out` cannot be used as names.

| `type` | Settings |
|---|---|
| `gain` | `gain` |
| `biquad` | `filter` (`lowpass` `highpass` `bandpass` `lowshelf` `highshelf` `peaking` `notch` `allpass`), `frequency`, `Q`, `gain`, `detune` |
| `delay` | `delayTime`, `maxDelay` (up to 4 seconds) |
| `waveshaper` | `shape` (`tanh` `clip` `fold`), `drive` (0.01 to 100) |
| `compressor` | `threshold`, `knee`, `ratio`, `attack`, `release` |
| `panner` | `pan` |
| `convolver` | `impulse`: `{"file": "ir.wav"}` (up to 10 seconds) or `{"noise": {"seconds": 2, "decay": 3}}` |
| `oscillator` | `wave` (`sine` `square` `sawtooth` `triangle`), `frequency`, `detune` |
| `constant` | `offset` |

- `connect` lists connections as `[source, target]` (up to 64).
  - `in` is the effect input and `out` is the output.
  - A target written as `node.value` (e.g. `"d.delayTime"`) modulates that value with audio.
  - A cycle needs a `delay` node, as in Web Audio.
- `oscillator` and `constant` start automatically.
  - They can connect only to values, `gain`, `panner`, `waveshaper` and `out`.
- `map` scales the parameter value from the range `min` to `max` into the range 0 to 1 (x), then maps it onto the range `from` to `to` as the node value.

| `curve` | Calculation |
|---|---|
| `linear` (default) | `from + (to - from) × x` |
| `exp` | `from × (to / from) ^ x` (`from` and `to` must be positive) |
| `beats` | `from` and `to` are beats, converted to seconds with the track's BPM and pitch. The value follows BPM and pitch changes |

### 4.4 `processor`

Audio processing written as an AudioWorklet.

| Field | Required | Description |
|---|---|---|
| `module` | Yes | Path to the AudioWorklet module (JavaScript) |
| `processor` | Yes | Processor name (lowercase letters, digits, `-`) |

- The module MUST register the processor as `registerProcessor("<extension id>/<processor>", class)`.
  - For example, with the ID `keito.crusher` and `processor` `crush`, the call is `registerProcessor("keito.crusher/crush", ...)`.
  - An effect registered under another name is not loaded.
- There is one input and one output. The output has 2 channels.
- A parameter changes the AudioParam with the same `id` (from `parameterDescriptors`).
  - If there is no such AudioParam, `{ "param": id, "value": value }` is sent to the `port`.
- `processorOptions.transport` is a SharedArrayBuffer with the playback state.
  - Read it with `new Float64Array(transport)`.
  - The Player's playback processor writes it every block (128 samples), before the effects run.

| Index | Value |
|---|---|
| 0 | Frame number at the end of the current block (same counting as `currentFrame` in AudioWorklet) |
| 1 | Playback position in the track (seconds) |
| 2 | Playback rate (1 is normal speed; negative while scratching backwards) |
| 3 | 1 while sound is playing, 0 when stopped |
| 4 | BPM (0 when unknown) |
| 5 | Position of the first beat (seconds) |
| 6 | Beats per bar |

- All effect processors run in the same AudioWorklet.
  - They cannot access the window, files or the network.
  - One effect may still affect the sound of another.
- When a processor stops with an error, the Player turns the effect OFF and shows the error in the DJ zone.
- The processor of an effect that is OFF is not called (`process` does not run).
- The Player measures the processing time of each effect. In the following cases, the Player turns the effect OFF and shows the reason.
  - The processor uses more than 40% of the time of a block (128 samples) for 3 seconds.
  - The sound breaks up while effects are ON. In this case, the heaviest effect is turned OFF.
    - The sound breaks up when the audio processing stays more than 10% behind real time for 2 seconds.
- If a processor never finishes and the sound stops for 3 seconds, the Player disables the extension and asks the user to reload the Player.
- The Player adds one line at the top of the module before loading it.
  - This is to measure the processing time.
  - Line numbers in error messages are one larger.
  - `registerProcessor` inside the module is provided by the Player. It wraps the registered class to measure its time.

## 5. Themes

`theme` names one CSS file.

```json
"theme": { "style": "theme.css" }
```

- The CSS is added to the Player window as it is.
  - IDs and classes of Player elements may change between Player versions.
  - To select parts, a theme SHOULD use the `data-part` names (5.1).
- A theme needs `!important` to change colors the user chose in the settings (Color and similar).
  - The Player sets these colors directly on the elements.
- A theme needs `!important` to hide parts that the Player shows or hides itself (for example the waveform at the top left, which follows a setting).
  - This is because the Player sets `display` directly on these elements.
- `url()` can point only to package files (relative paths).
  - It can be used for images and fonts (`@font-face`).
- CSS that contains any of the following is not loaded.
  - External URLs, `@import`, `@namespace`, `image-set()`, backslashes (`\`) and unclosed comments.
- The CSS can be up to 200 KB.
- While the following screens are shown, the Player turns themes off.
  - The installation and update dialog, other confirmations and the Extensions manager.
  - These screens always appear with the Player's own look.
  - Themes stay on in the settings.
- Ctrl + Shift + E opens the Extensions manager at any time.
  - This is so that extensions can still be disabled or removed even if a theme hides buttons in the settings.

### 5.1 `data-part` names

The main parts of the Player have `data-part` names (KT3 Player 1.8.3 and later). These names stay the same between Player versions.

```css
[data-part="dj-zone"] { display: none !important; }
```

| Name | Part |
|---|---|
| `player` | The main area of the Player (from the record to the DJ zone) |
| `center` | The row of the record, lyrics and spectrum |
| `record` | Record |
| `lyrics-left`, `lyrics-right` | Lyrics |
| `spectrum-left`, `spectrum-right` | Spectrum |
| `seekbar` | Seek bar |
| `time` | Time display |
| `transport` | Row of play buttons |
| `title` | Track title |
| `volume` | Volume |
| `waveform` | Waveform at the top left |
| `beat-lamps` | Beat lamps |
| `top-buttons` | Buttons at the top right |
| `keys-button`, `settings-button` | Keyboard and settings buttons |
| `dj-zone` | DJ zone |
| `dj-row-1` to `dj-row-4` | Rows of the DJ zone |
| `pitch`, `deck-buttons`, `filter` | Parts of the DJ zone (row 1) |
| `hotcues`, `loop`, `beatjump`, `slip` | Parts of the DJ zone (row 2) |
| `beatloop`, `loop-length`, `loop-target`, `quantize` | Parts of the DJ zone (row 3) |
| `eq`, `bass-boost`, `stems`, `beat-fx` | Parts of the DJ zone (row 4) |
| `ext-effects` | Row of extension effects |

- Elements inside these parts have no names.
  - Select them from a named part, as in `[data-part="record"] canvas`.
- The Player draws the record and spectrum at the position of their parts.
  - Hiding them with `display: none` also stops the drawing.

## 6. Main script

The JavaScript named in `main` runs in the Player window. It can use everything in the Player.

```json
{ "id": "yourname.clock", "name": "Clock", "version": "1.0.0", "author": "yourname",
  "description": "Shows the playback position.", "api": 2, "main": "main.js" }
```

```js
const el = document.createElement('div');
el.style.cssText = 'position:fixed;right:20px;bottom:20px;color:var(--accent);font:24px monospace;z-index:240';
document.body.appendChild(el);
(function tick() {
  el.textContent = waBuffer ? curPos().toFixed(1) + ' s' : '';
  requestAnimationFrame(tick);
})();
```

### 6.1 How it runs

- The main script runs once when the extension is loaded.
  - Extensions are loaded when the Player starts, when they are installed and when they are enabled.
  - When it runs, the effects and theme of the same extension are already loaded.
- The main script runs in the same place as the Player window.
  - It can use the elements of the Player window, the Player's functions and variables, and browser features such as network access and Web MIDI, without limits.
- The whole script runs inside a function.
  - Variables and functions declared at its top level are not visible to other scripts.
  - Declaring a name that the Player also uses hides the Player's one inside the script.
- To add CSS, create a `<style>` element and add it to `document.head`.
  - The CSS applies to the whole Player window.
  - Selectors SHOULD use names that only the extension uses (for example classes that start with `kt3x-`).
- The Player's accent color is available as the CSS variable `--accent`.

### 6.2 The `kt3x` object

Main scripts can use `kt3x`.

| Name | Description |
|---|---|
| `kt3x.info` | `{ id, name, version }` |
| `kt3x.file(path)` | URL of a package file (for `img.src` and similar) |
| `kt3x.text(path)` | Contents of a text file in the package |
| `kt3x.storage.get(key)` | Reads from the storage. Returns the stored value, or `null` if there is none |
| `kt3x.storage.set(key, value)` | Writes to the storage. `null` removes the key |

- `kt3x.file()` and `kt3x.text()` throw an error for a file that is not in the package.
- The storage takes values that can be converted to JSON.
  - It holds up to 256 KB per extension. Writing more throws an error.
  - Leaving out `value` throws an error.
  - Removing the extension also removes its storage.
- The Player window has a variable `kt3` for the loaded track, so the object for extensions is named `kt3x`.

### 6.3 Errors

- When an error occurs in the first run of the main script, the extension is treated as not loaded.
  - Its effects and theme are removed too.
  - The Extensions manager shows the reason and the line number.
- When an error occurs in the main script after it has loaded, the Player shows the error.
  - Unhandled Promise rejections are treated the same way.
  - The Extensions manager shows it too.
- The Player does not hide errors or switch to other behavior.

### 6.4 Names that stay and names that may change

- The following stay the same between Player versions.
  - The format of the manifest, effects and themes
  - `kt3x`
  - The `data-part` names (5.1)
- Everything else may change between Player versions.
  - This includes the names and behavior of the Player's functions and variables, and the IDs, classes and order of elements.
  - When an extension stops working because of such a change, its author updates it.

### 6.5 Disabling and removing

- What a main script has done cannot be undone while the Player runs.
- So the Player reloads when an extension with a main script is disabled, removed or updated.
  - Before disabling or removing, the Player asks the user to confirm the reload.
- "Reload" for an extension loaded from a folder in developer mode also reloads the Player.
  - In the desktop version, the same folder is loaded again automatically after the reload.
  - In the browser version, choose the folder again after the reload.

## 7. Installation and management (Player behavior)

- An extension can be installed in three ways.
  - Double-clicking a `.kt3x` file (desktop version)
  - Dropping it on the record
  - "Extensions" → "Install from file" in the settings
- Before installation, the Player shows the name, author, version, ID, description and contents (number of effects, theme, main script), and asks the user to confirm.
  - For a main script, the Player shows the following warnings.
    - It can use everything in the Player, including the audio of the tracks that are opened.
    - It can connect to the network and send data.
    - It may stop working when the Player is updated.
  - The Player also states that the author is not verified.
- A newer version with the same `id` is treated as an update.
  - The same or an older version is treated as a reinstallation.
- Installed extensions are kept in the Player's own storage (they are not extracted to folders on the computer).
- Extensions are enabled, disabled and removed from "Extensions" in the settings.
  - Ctrl + Shift + E also opens the Extensions manager (section 5).
  - Removing an extension also removes its storage (6.2).
- When an effect stops with an error, the Player turns it OFF.
- The Player stops effects that are too heavy and shows the reason (4.4).
- With "Start without extensions" on in the settings, all extensions are turned off from the next start.
  - Main scripts do not run either.
- If the Player did not start normally while extensions were loading, it asks at the next start whether to turn extensions off.
- With "Extension developer mode" on in the settings, "Extensions" → "Load folder" loads an extension from a folder.
  - An extension loaded from a folder is not saved.
  - "Reload" loads it again (6.5).
