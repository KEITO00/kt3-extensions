# KT3 Player Extension (.kt3x) Specification

日本語版: [SPEC.ja.md](SPEC.ja.md)

> Extensions are supported from KT3 Player 1.5.0.

This document describes the file format of extensions for
[KT3 Player](https://github.com/KEITO00/kt3-player) (`.kt3x`) and what extensions can do.

The key words "MUST", "SHOULD" and "MAY" are used as described in RFC 2119.

## 1. Overview

An extension can add the following. One extension can contain several of them.

| Kind | Description |
|---|---|
| Effect | An audio effect. It is inserted on the vocal track, the instrumental track or the whole mix |
| UI | Displays and controls added to the Player window |
| Theme | The look of the Player (colors, layout, images, fonts) |

Extensions run in both the desktop version and the browser version.

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
| `description` | Yes | Short description |
| `api` | Yes | Extension API version (integer). The current version is `1` |
| `icon` | No | Path to an icon image (PNG) |
| `permissions` | No | Permissions used (section 4) |
| `effects` | No | List of effects (section 5) |
| `ui` | No | List of UI parts (section 6) |
| `theme` | No | Theme (section 7) |

The Player shows names, authors and descriptions as plain text, never as HTML.

## 4. Permissions

Effects, UI and themes work without permissions. The following features are available only
when they are listed in `permissions` and the user allows them at installation.

| Permission | Description |
|---|---|
| `control` | Control of the Player (play, seek, cue, loops, pitch, FX, etc.) |
| `decks` | Additional decks and loading audio into them |
| `network` | Connections to external hosts. The host names are listed (e.g. `{"network": ["lyrics.example.com"]}`). There is no way to allow all hosts |
| `midi` | Use of MIDI devices. SysEx is not available |

When an update adds permissions, the Player shows the new permissions and asks again.

## 5. Effects

An extension can list up to 8 effects in `effects`.

### 5.1 Common fields

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

### 5.2 Parameters

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Parameter ID |
| `name` | Yes | Display name (up to 24 characters) |
| `control` | No | `fader` (default), `button` (1 while held) or `toggle` (switches between 0 and 1) |
| `min`, `max` | For `fader` | Value range |
| `default` | No | Initial value. The default is `min` |
| `step` | No | Step size. The default is continuous |
| `unit` | No | Unit shown after the value (up to 8 characters) |
| `map` | For `graph` | Which node values the parameter controls (5.3) |

### 5.3 `graph`

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
- `map` scales the parameter value from `min`–`max` to 0–1 (x), then maps it to `from`–`to` as the node value.

| `curve` | Calculation |
|---|---|
| `linear` (default) | `from + (to - from) × x` |
| `exp` | `from × (to / from) ^ x` (`from` and `to` must be positive) |
| `beats` | `from`–`to` are beats, converted to seconds with the track's BPM and pitch. The value follows BPM and pitch changes |

### 5.4 `processor`

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
  - There is no guarantee that one effect cannot affect the sound of another.
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

## 6. UI

An extension can list up to 8 UI parts in `ui`.

| Field | Required | Description |
|---|---|---|
| `id` | Yes | UI ID |
| `name` | Yes | Name (up to 24 characters) |
| `slot` | Yes | Placement (table below) |
| `script` | Yes | Path to the UI script (JavaScript) |
| `style` | No | Path to a CSS file |
| `width` | No | Width (`dj-zone` only; 80 to 480, default 240) |
| `height` | No | Height (`dj-zone` and `side-panel`; 40 to 400, default 120) |

| `slot` | Placement | Input |
|---|---|---|
| `dj-zone` | The extension row of the DJ zone | Yes |
| `side-panel` | A panel opened from a tab at the right edge | Yes |
| `vinyl` | Over the record (same size as the record) | No (display only) |
| `overlay` | Over the whole window | No (display only) |

### 6.1 Environment

- UI runs in an iframe that contains an empty page prepared by the Player.
  - The iframe uses `sandbox="allow-scripts"` (origin `null`).
  - New windows, navigation, downloads and forms are not available.
  - The camera, microphone, clipboard, location and similar features are not available.
- The Player passes the package files to the iframe, then loads `style` and `script` in that order.
  - The script builds the page.
  - The background is transparent.
- Text selection and dragging (the browser's drag and drop) are turned off.
  - This is so that dragging with the mouse reaches the script as pointer events.
  - To make text selectable, set `user-select: text` in your CSS.
- The UI page MUST keep answering the Player's signal.
  - A UI that does not answer for 3 seconds is removed by the Player, and the reason is shown.
  - A page that keeps running heavy work cannot answer.
- The effect of heavy UI on the Player's window depends on the version.
  - In the desktop version, UI runs in a different process from the Player, so the Player's window does not freeze.
  - In the browser version, some browsers run UI in the same process, so heavy UI work also freezes the Player's window.
- Network access is possible only to hosts allowed by the `network` permission (`https://` only).
  - Everything else can be loaded only from package files (`kt3.file()`) or `data:`.

### 6.2 The `kt3` object

UI scripts use `window.kt3`.

| Name | Description |
|---|---|
| `kt3.on(type, fn)` | Starts receiving information (6.3) |
| `kt3.off(type, fn)` | Stops receiving information |
| `kt3.send(cmd, args)` | Asks the Player to run a command (6.4). Returns a Promise with the result |
| `kt3.file(path)` | URL of a package file (for `img.src` and similar). `null` if the file does not exist |
| `kt3.text(path)` | Contents of a text file in the package |
| `kt3.info` | `{ id, name, version, slot, permissions }` |

### 6.3 Information

| `type` | When | Contents |
|---|---|---|
| `track` | When subscribing, when a track is loaded or closed, and when another loop of the track is selected | `{ title, artist, duration, bpm, beats, stems, loop: { start, end }, loops: [{ start, end, name }], loopIndex, lyrics: [{ time, text }], lyrics2 }`. `loop` is the selected loop of the track, `loops` the list of its loops (up to 10) and `loopIndex` the number of the selected loop (0-based). `null` when there is no track |
| `frame` | Every drawn frame (usually 60 times a second) | `{ time, playing, rate, pitch, beat, loop, djLoop }`. `beat` is `{ index, phase, inBar, beats, bpm }` (`null` without a BPM). `loop` is the active loop `{ start, end }` |
| `spectrum` | Every drawn frame | `{ freq, wave }`. `freq` is the level per frequency (`Uint8Array`, 1024 values). `wave` is the waveform (`Uint8Array`, 2048 values) |
| `effects` | When subscribing, and when one of the extension's effects changes | `[{ id, on, slot, values, error }]` |
| `decks` | Every drawn frame (while the extension has decks) | `[{ id, loaded, time, duration, playing, rate, volume, title }]` |
| `midi` | When a MIDI message arrives (requires the `midi` permission) | `{ input, data, time }`. `data` is an array of bytes. SysEx is not delivered. `{ devices }` arrives when subscribing and when devices are connected or disconnected (6.6) |

### 6.4 Commands

Commands available without permissions:

| `cmd` | `args` | Description |
|---|---|---|
| `effect` | `{ effect, on?, slot? }` | Turns the extension's own effect on or off and chooses its slot |
| `param` | `{ effect, param, value }` | Sets a parameter of the extension's own effect (clamped to its range) |
| `storage.get` | `{ key }` | Reads from the extension's storage |
| `storage.set` | `{ key, value }` | Writes to the storage (`null` removes the key). Up to 256 KB per extension |

Commands that require the `control` permission (only while a track is loaded):

| `cmd` | `args` | Description |
|---|---|---|
| `play`, `pause` | none | Play or pause |
| `seek` | `{ time }` | Move to a position (seconds) |
| `hotcue` | `{ index }` | Press a hot cue (0 to 7) |
| `loop` | `{ beats }` | Beat loop (0.25, 0.5, 1, 2, 4, 8 or 16 beats) |
| `loopExit` | none | Exit the loop |
| `beatJump` | `{ direction }` | Beat jump (negative to jump back) |
| `pitch` | `{ percent }` | Pitch (clamped to the current pitch range) |
| `fx` | `{ type }` | BEAT FX (`off` `echo` `gate` `reverb` `rvbout` `filtout` `rollout`) |
| `brake`, `spin` | none | BRAKE or SPIN |
| `stem` | `{ which, volume }` | Volume (0 to 1) of the main deck's vocal (`vocal`) or instrumental (`inst`) audio. Only for tracks with separate vocal and instrumental audio |

Commands that require the `decks` permission (6.5):

| `cmd` | `args` | Description |
|---|---|---|
| `deck.create` | none | Creates a deck and returns its number (up to 3 per extension) |
| `deck.load` | `{ deck, source }` | Loads audio. `source` is `pick` (the user chooses a file), `main` (the whole current track), `vocal` or `inst` (its vocal or instrumental audio). Returns `{ title, artist, bpm, duration, stems }` |
| `deck.play`, `deck.pause` | `{ deck }` | Play or pause |
| `deck.seek` | `{ deck, time }` | Move to a position (seconds) |
| `deck.rate` | `{ deck, rate, smooth? }` | Playback rate (-8 to 8). With `smooth: true`, the rate changes smoothly and the scratch resampling is used (sound above the audible range is removed instead of folding back) |
| `deck.loop` | `{ deck, start, end }` or `{ deck, off: true }` | Loop (sample-accurate and gapless) |
| `deck.volume` | `{ deck, value }` | Volume (0 to 2) |
| `deck.destroy` | `{ deck }` | Removes the deck |

Commands that require the `midi` permission (6.6):

| `cmd` | `args` | Description |
|---|---|---|
| `midi.devices` | none | Returns `{ inputs, outputs }`. Each is `[{ id, name, manufacturer, state }]` |
| `midi.send` | `{ output, data }` | Sends to a MIDI device. `data` must be a channel message (1 to 3 bytes, first byte 0x80 to 0xEF) |

- Each UI can send up to 120 commands per second.
  - Commands above the limit fail.
- The Promise of a failed command is rejected with an Error that gives the reason.

### 6.5 Decks

- Decks use the same playback processor as the Player's main deck.
  - Their audio enters before the `master` slot (5.1).
  - It does not pass through the Player's EQ, filter, BEAT FX or BASS BOOST.
- With `pick`, the Player shows a file dialog.
  - Only the audio of the `.kt3` / `.kt4` file that the user chooses is loaded. The extension receives neither the file location nor its contents.
  - The dialog can be shown only right after the user interacts with the UI.
  - If no file is chosen, the command fails with `cancelled`.
- `vocal`, `inst` and `main` use the audio of the current track (it is not copied).
- The decks of an extension are removed when the extension is disabled or removed.

### 6.6 MIDI

- UI cannot use Web MIDI directly.
  - The Player connects to MIDI devices and passes the messages on.
- The Player connects to MIDI devices only when a UI with the `midi` permission starts receiving `midi`.
- SysEx can be neither received nor sent.
- In the browser version, the browser may ask the user whether to allow MIDI.

## 7. Themes

`theme` names one CSS file.

```json
"theme": { "style": "theme.css" }
```

- The CSS is added to the Player window as it is.
  - IDs and classes of Player elements may change between Player versions.
- A theme needs `!important` to change colors the user chose in the settings (Color and similar).
  - This is because the Player sets these colors directly on the elements.
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

## 8. What extensions cannot do

- Reading or writing files on the computer
  - Audio is passed only after the user selects it in the Player.
- Changing the contents (elements) of the Player window or the settings
  - The look (hiding or moving parts, changing colors) can be changed with a theme (section 7).
- Connecting to hosts that are not allowed
- Opening new windows, starting downloads or navigating the page
- Installing or removing other extensions
- Using the camera, microphone, clipboard or location

## 9. Installation and management (Player behavior)

- An extension can be installed in three ways.
  - Double-clicking a `.kt3x` file (desktop version)
  - Dropping it on the record
  - "Extensions" → "Install from file" in the settings
- Before installation, the Player shows the name, author, version, ID, description, permissions and contents (number of effects and UI parts), and asks the user to confirm.
  - The Player also states that the author is not verified.
- A newer version with the same `id` is treated as an update.
  - Permissions added by the update are marked.
  - The same or an older version is treated as a reinstallation.
- Installed extensions are kept in the Player's own storage (they are not extracted to folders on the computer).
- Extensions are enabled, disabled and removed from "Extensions" in the settings.
  - Ctrl + Shift + E also opens the Extensions manager (section 7).
  - Removing an extension also removes its storage (6.4).
- When an effect processor stops with an error, the Player turns the effect OFF.
- Effects that are too heavy and UI that stops answering are stopped by the Player, and the reason is shown (5.4, 6.1).
- With "Start without extensions" turned on in the settings, all extensions are turned off from the next start.
- If the Player did not start normally while extensions were loading, it asks at the next start whether to turn them off.
- With "Extension developer mode" turned on, "Extensions" → "Load folder" loads an extension from a folder.
  - Such an extension is not saved.
  - It can be loaded again with "Reload".
