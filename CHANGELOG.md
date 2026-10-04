# Changelog / 変更履歴

The `api` field of `manifest.json` is the extension API version.

`manifest.json` の `api` は、拡張機能 API の版を表します。

## API 1 — KT3 Player 1.5.0

- File format (ZIP), manifest and permissions (`control`, `decks`, `midi`, `network`).
- Effects: `graph` (standard Web Audio nodes in JSON) and `processor` (AudioWorklet).
  - The playback state is shared with the effects.
- UI in isolated iframes: `dj-zone`, `side-panel`, `vinyl`, `overlay`, and the `kt3` object
  (events `track`, `frame`, `spectrum`, `effects`, `decks`, `midi`, and commands).
- Decks, MIDI and themes (CSS).
- Automatic stop of effects that are too heavy and of UI that stops answering.

- ファイル形式（ZIP）、manifest、権限（`control`・`decks`・`midi`・`network`）。
- エフェクト：`graph`（Web Audio の標準ノードを JSON で組む）と `processor`（AudioWorklet）。
  - 再生の状態を共有します。
- 隔離した iframe で動く UI：`dj-zone`・`side-panel`・`vinyl`・`overlay` と `kt3` オブジェクト
  （情報 `track`・`frame`・`spectrum`・`effects`・`decks`・`midi` と操作）。
- デッキ、MIDI、テーマ（CSS）。
- 重すぎるエフェクトと、応答しなくなった UI の自動停止。
