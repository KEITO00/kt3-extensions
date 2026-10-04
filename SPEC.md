# KT3 Player Extension (.kt3x) Specification

日本語版: [SPEC.ja.md](SPEC.ja.md)

> Extensions are supported from KT3 Player 1.5.0.
> Parts marked "TBD" will be decided during implementation.

This document describes the file format of extensions for
[KT3 Player](https://github.com/KEITO00/kt3-player) (`.kt3x`) and what extensions can do.

The key words "MUST", "SHOULD" and "MAY" are used as described in RFC 2119.

## 1. Overview

An extension can add the following. One extension may contain several of them.

| Kind | Description |
|---|---|
| Effect | An audio effect inserted on the vocal track, the instrumental track or the whole mix |
| UI | Displays and controls added to the Player window |
| Theme | The look of the Player (colors, layout, images, fonts) |

Extensions run in both the desktop version and the browser version.

## 2. File

- A `.kt3x` file MUST be a ZIP file. Entries are stored or deflated.
- `manifest.json` MUST be at the top level of the ZIP.
- Paths in the ZIP use `/`. A file that contains a path with `..`, a path starting with `/`,
  or a path with a drive letter MUST NOT be installed.
- Text files are UTF-8.
- File names MUST be UTF-8. Encrypted entries and ZIP64 are not supported.
- Limits: 500 files, 20 MB per file, and 50 MB each for the `.kt3x` file and its total uncompressed size.
  A package with a file whose uncompressed size differs from the size recorded in the ZIP is not installed.
- `tools/pack.js` builds a `.kt3x` file from a folder (`node tools/pack.js <folder>`).

## 3. manifest.json

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Extension ID in the form `<author>.<name>` (e.g. `keito.second-deck`). Lowercase letters, digits, `-`, and one `.` as the separator |
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
when listed in `permissions` and allowed by the user at installation.

| Permission | Description |
|---|---|
| `control` | Control the Player (play, seek, cue, loops, pitch, FX, etc.) |
| `decks` | Add decks and load audio into them |
| `network` | Connect to external hosts. Lists host names (e.g. `{"network": ["lyrics.example.com"]}`). There is no way to allow all hosts |
| `midi` | Use MIDI devices. SysEx is not available |

When an update adds permissions, the Player shows the new permissions and asks again.

## 5. Effects

An extension can list up to 8 effects in `effects`.

### 5.1 Common fields

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Effect ID (lowercase letters, digits, `-`, up to 32 characters) |
| `name` | Yes | Name shown in the DJ zone (up to 24 characters) |
| `kind` | Yes | `graph` or `processor` |
| `slots` | No | Where the effect can be inserted: `vocal`, `inst` or `master`. Default `["master"]`. The first entry is the initial slot |
| `params` | No | Parameters (up to 16) |

- `vocal` and `inst` are available only for tracks with separate vocal and instrumental audio.
- `master` comes after all Player processing (EQ, filter, BEAT FX, BASS BOOST).
- For each effect, the Player adds controls to the DJ zone: an ON button, a slot selector and the
  parameters. Effects are OFF after installation and when a track is loaded.

### 5.2 Parameters

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Parameter ID |
| `name` | Yes | Display name (up to 24 characters) |
| `control` | No | `fader` (default), `button` (1 while held) or `toggle` (switches between 0 and 1) |
| `min`, `max` | For `fader` | Value range |
| `default` | No | Initial value. Default `min` |
| `step` | No | Step size. Default continuous |
| `unit` | No | Unit shown after the value (up to 8 characters) |
| `map` | For `graph` | Which node values the parameter controls (5.3) |

### 5.3 `graph`

A combination of standard Web Audio nodes.

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

- `nodes`: node names and settings (up to 32). `in` and `out` cannot be used as names.

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

- `connect`: a list of `[source, target]` (up to 64). `in` is the effect input and `out` the output.
  A target written as `node.value` (e.g. `"d.delayTime"`) modulates that value with audio.
  Cycles need a `delay` node, as in Web Audio.
- `oscillator` and `constant` start automatically. They can connect only to values, `gain`,
  `panner`, `waveshaper` and `out`.
- `map`: the parameter value is scaled from `min`–`max` to 0–1 (x), then mapped to `from`–`to`.

| `curve` | Calculation |
|---|---|
| `linear` (default) | `from + (to - from) × x` |
| `exp` | `from × (to / from) ^ x` (`from` and `to` must be positive) |
| `beats` | `from`–`to` are beats, converted to seconds with the track's BPM and pitch. Follows BPM and pitch changes |

### 5.4 `processor`

Audio processing written as an AudioWorklet.

| Field | Required | Description |
|---|---|---|
| `module` | Yes | Path to the AudioWorklet module (JavaScript) |
| `processor` | Yes | Processor name (lowercase letters, digits, `-`) |

- The module MUST register the processor as `registerProcessor("<extension id>/<processor>", class)`.
  For example, with the ID `keito.crusher` and `processor` `crush`, call
  `registerProcessor("keito.crusher/crush", ...)`. An effect registered under another name is not loaded.
- One input and one output. The output has 2 channels.
- A parameter changes the AudioParam with the same `id` (from `parameterDescriptors`) if there is one.
  Otherwise `{ "param": id, "value": value }` is sent to the `port`.
- `processorOptions.transport` is a SharedArrayBuffer with the playback state. Read it with
  `new Float64Array(transport)`. The Player's playback processor writes it every block (128 samples),
  before the effects run.

| Index | Value |
|---|---|
| 0 | Frame number at the end of the current block (same counting as `currentFrame` in AudioWorklet) |
| 1 | Playback position in the track (seconds) |
| 2 | Playback rate (1 is normal speed; negative while scratching backwards) |
| 3 | 1 while sound is playing, 0 when stopped |
| 4 | BPM (0 when unknown) |
| 5 | Position of the first beat (seconds) |
| 6 | Beats per bar |

- All effect processors run in the same AudioWorklet. They cannot access the window, files or the
  network, but there is no guarantee that one effect cannot affect the sound of another.
- When a processor stops with an error, the Player turns the effect OFF and shows the error in the DJ zone.
- The processor of an effect that is OFF is not called (`process` does not run).
- The Player measures the processing time of each effect. In these cases the Player turns the effect OFF and shows the reason:
  - The processor uses more than 40% of the time of a block (128 samples) for 3 seconds.
  - The sound breaks up while effects are ON (the audio processing falls more than 10% behind real time
    for 2 seconds). The heaviest effect is turned OFF.
- If a processor never finishes and the sound stops for 3 seconds, the Player disables the extension and
  asks the user to reload the Player.
- To measure the processing time, the Player adds one line at the top of the module before loading it.
  Line numbers in error messages are one larger. `registerProcessor` inside the module is provided by
  the Player and wraps the registered class to measure its time.

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

- UI runs in an iframe that contains an empty page prepared by the Player. The iframe uses
  `sandbox="allow-scripts"` (origin `null`). New windows, navigation, downloads and forms are not
  available, nor are the camera, microphone, clipboard, location and similar features.
- The Player passes the package files to the iframe, then loads `style` and `script` in that order.
  The script builds the page. The background is transparent.
- Text selection is off and dragging (the browser's drag and drop) does not start, so that dragging
  with the mouse reaches the script as pointer events. To make text selectable, set `user-select: text`
  in your CSS.
- The UI page MUST keep answering the Player's signal. A UI that does not answer for 3 seconds is removed
  by the Player, and the reason is shown. A page that keeps running heavy work stops answering.
- In the desktop version, UI runs in a different process from the Player, so heavy UI does not freeze the
  Player's window. In the browser version, some browsers run it in the same process, and heavy UI work
  also freezes the Player's window.
- Network access is possible only to hosts allowed by the `network` permission (`https://` only).
  Everything else is loaded from package files (`kt3.file()`) or `data:`.

### 6.2 The `kt3` object

UI scripts use `window.kt3`.

| Name | Description |
|---|---|
| `kt3.on(type, fn)` | Start receiving information (6.3) |
| `kt3.off(type, fn)` | Stop receiving |
| `kt3.send(cmd, args)` | Ask the Player to do something (6.4). Returns a Promise with the result |
| `kt3.file(path)` | URL of a package file (for `img.src` and similar). `null` if the file does not exist |
| `kt3.text(path)` | Contents of a text file in the package |
| `kt3.info` | `{ id, name, version, slot, permissions }` |

### 6.3 Information

| `type` | When | Contents |
|---|---|---|
| `track` | When subscribing, and when a track is loaded or ejected | `{ title, artist, duration, bpm, beats, stems, loop: { start, end }, lyrics: [{ time, text }], lyrics2 }`, or `null` without a track |
| `frame` | Every drawn frame (usually 60 times a second) | `{ time, playing, rate, pitch, beat, loop, djLoop }`. `beat` is `{ index, phase, inBar, beats, bpm }` (`null` without a BPM). `loop` is the active loop `{ start, end }` |
| `spectrum` | Every drawn frame | `{ freq, wave }`: `freq` is the level per frequency (`Uint8Array`, 1024 values), `wave` the waveform (`Uint8Array`, 2048 values) |
| `effects` | When subscribing, and when one of the extension's effects changes | `[{ id, on, slot, values, error }]` |
| `decks` | Every drawn frame (while the extension has decks) | `[{ id, loaded, time, duration, playing, rate, volume, title }]` |
| `midi` | When a MIDI message arrives (requires the `midi` permission) | `{ input, data, time }`, where `data` is an array of bytes. SysEx is not delivered. `{ devices }` when subscribing and when devices are connected or disconnected (6.6) |

### 6.4 Commands

Available without permissions:

| `cmd` | `args` | Description |
|---|---|---|
| `effect` | `{ effect, on?, slot? }` | Turn the extension's own effect on or off and choose its slot |
| `param` | `{ effect, param, value }` | Set a parameter of the extension's own effect (clamped to its range) |
| `storage.get` | `{ key }` | Read from the extension's storage |
| `storage.set` | `{ key, value }` | Write to the storage (`null` removes the key). Up to 256 KB per extension |

Require the `control` permission (only while a track is loaded):

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

Require the `decks` permission (6.5):

| `cmd` | `args` | Description |
|---|---|---|
| `deck.create` | none | Create a deck and return its number (up to 3 per extension) |
| `deck.load` | `{ deck, source }` | Load audio. `source` is `pick` (the user chooses a file), `main` (the whole current track), `vocal` or `inst` (its vocal or instrumental audio). Returns `{ title, artist, bpm, duration, stems }` |
| `deck.play`, `deck.pause` | `{ deck }` | Play or pause |
| `deck.seek` | `{ deck, time }` | Move to a position (seconds) |
| `deck.rate` | `{ deck, rate, smooth? }` | Playback rate (-8 to 8). With `smooth: true` the rate changes smoothly and the scratch resampling is used (sound above the audible range is removed instead of folding back) |
| `deck.loop` | `{ deck, start, end }` or `{ deck, off: true }` | Loop (sample-accurate, gapless) |
| `deck.volume` | `{ deck, value }` | Volume (0 to 2) |
| `deck.destroy` | `{ deck }` | Remove the deck |

Require the `midi` permission (6.6):

| `cmd` | `args` | Description |
|---|---|---|
| `midi.devices` | none | `{ inputs, outputs }`, each `[{ id, name, manufacturer, state }]` |
| `midi.send` | `{ output, data }` | Send to a MIDI device. `data` must be a channel message (1 to 3 bytes, first byte 0x80 to 0xEF) |

- Each UI can send up to 120 commands per second. Commands above the limit fail.
- The Promise of a failed command is rejected with an Error that gives the reason.

### 6.5 Decks

- Decks use the same playback processor as the Player's main deck. Their audio enters before the
  `master` slot (5.1). It does not pass through the Player's EQ, filter, BEAT FX or BASS BOOST.
- With `pick`, the Player shows a file dialog. Only the audio of the `.kt3` / `.kt4` file the user chooses is
  loaded; the extension receives neither the file location nor its contents. The dialog can be shown only
  right after the user interacts with the UI. If no file is chosen, the command fails with `cancelled`.
- `vocal`, `inst` and `main` use the audio of the current track (not copied).
- The decks of an extension are removed when it is disabled or removed.

### 6.6 MIDI

- UI cannot use Web MIDI directly. The Player connects to MIDI devices and passes messages on.
- The Player connects to MIDI devices only when a UI with the `midi` permission subscribes to `midi`.
- SysEx can be neither received nor sent.
- In the browser version, the browser may ask the user whether to allow MIDI.

## 7. Themes

`theme` names one CSS file.

```json
"theme": { "style": "theme.css" }
```

- The CSS is added to the Player window as it is. IDs and classes of Player elements may change between Player versions.
- Colors the user chose in the settings (Color and similar) are set directly by the Player. A theme needs `!important` to change them.
- `url()` can point only to package files (relative paths). It can be used for images and fonts (`@font-face`).
- CSS that contains any of the following is not loaded: external URLs, `@import`, `@namespace`, `image-set()`, backslashes (`\`), unclosed comments. Up to 200 KB.
- While the Player shows the installation or update dialog, other confirmations, the Extensions manager or the settings,
  it turns themes off. These screens always appear with the Player's own look.

## 8. What extensions cannot do

- Read or write files on the computer (audio is passed only after the user selects it in the Player)
- Change the Player window or settings
- Connect to hosts that are not allowed
- Open new windows, start downloads or navigate the page
- Install or remove other extensions
- Use the camera, microphone, clipboard or location

## 9. Installation and management (Player behavior)

- An extension is installed by double-clicking a `.kt3x` file (desktop version), dropping it on the
  record, or with "Extensions" → "Install from file" in the settings.
- Before installation, the Player shows the name, author, version, ID, description, permissions and
  contents (number of effects and UI parts), states that the author is not verified, and asks the
  user to confirm.
- A newer version with the same `id` is treated as an update, and newly added permissions are marked.
  The same or an older version is treated as a reinstallation.
- Installed extensions are kept in the Player's own storage. They are not extracted to folders on the computer.
- Extensions are enabled, disabled and removed from "Extensions" in the settings. Removing an extension
  also removes its storage (6.4).
- When an effect processor stops with an error, the Player turns the effect OFF.
- Effects that are too heavy and UI that stops answering are stopped by the Player, and the reason is shown (5.4, 6.1).
- With "Start without extensions" turned on in the settings, all extensions are turned off from the next
  start. If the Player did not start normally while extensions were loading, it asks at the next start
  whether to turn them off.
- With "Extension developer mode" turned on, "Extensions" → "Load folder" loads an extension from a folder.
  Such an extension is not saved and can be loaded again with "Reload".
