# Changelog / 変更履歴

The `api` field of `manifest.json` is the extension API version.

`manifest.json` の `api` は、拡張機能 API の版を表します。

## API 2 (KT3 Player 1.8.3)

- Main scripts: `main` in the manifest names a JavaScript file that runs in the Player window and can use everything in the Player.
  - Main scripts use the `kt3x` object (`info`, `file`, `text`, `storage`).
  - The Player shows a warning before installing an extension with a main script.
  - Disabling, removing or updating such an extension reloads the Player.
- UI (`ui`, `kt3.on`, `kt3.off`, `kt3.send`) and permissions (`permissions`) were removed.
  - Extensions that use them cannot be installed, and the Player shows the reason.
  - Extensions with `"api": 1` that contain only effects and themes keep working.
- Themes can select parts by `data-part` names, which stay the same between Player versions.
- A manifest with a field that is not in the specification cannot be installed.

- main スクリプト：manifest の `main` に指定した JavaScript が Player の画面の中で動作し、Player のすべての機能を使用できるようにしました。
  - main スクリプトでは、`kt3x`（`info`・`file`・`text`・`storage`）を使用できます。
  - main スクリプトを含む拡張機能を導入する前に、Player が注意を表示します。
  - このような拡張機能の無効化・削除・更新の際は、Player を再読み込みします。
- UI（`ui`・`kt3.on`・`kt3.off`・`kt3.send`）と権限（`permissions`）を廃止しました。
  - これらを使用する拡張機能は導入できず、Player が理由を表示します。
  - `"api": 1` の拡張機能のうち、エフェクトとテーマだけを含むものは、引き続き動作します。
- テーマで、Player の版が変わっても変更されない `data-part` の名前を使用できるようにしました。
- 仕様にない項目がある manifest は、導入できないようにしました。

## API 1 (KT3 Player 1.5.0)

- File format (ZIP), manifest and permissions (`control`, `decks`, `midi`, `network`).
- Effects: `graph` (standard Web Audio nodes in JSON) and `processor` (AudioWorklet).
  - The playback state is shared with the effects.
- UI in isolated iframes: `dj-zone`, `side-panel`, `vinyl`, `overlay`, and the `kt3` object
  (events `track`, `frame`, `spectrum`, `effects`, `decks`, `midi`, and commands).
- Decks, MIDI and themes (CSS).
- Automatic stop of effects that are too heavy and of UI that stops answering.
- KT3 Player 1.6.0: `loops` and `loopIndex` in the `track` information.
  - This is for tracks with several loops.

- ファイル形式（ZIP）、manifest、権限（`control`・`decks`・`midi`・`network`）。
- エフェクト：`graph`（Web Audio の標準ノードを JSON で構成する）と `processor`（AudioWorklet）。
  - エフェクトと再生の状態を共有します。
- 隔離した iframe で動作する UI：`dj-zone`・`side-panel`・`vinyl`・`overlay` と `kt3` オブジェクト
  （情報 `track`・`frame`・`spectrum`・`effects`・`decks`・`midi` と操作）。
- デッキ、MIDI、テーマ（CSS）。
- 重すぎるエフェクトと、応答しなくなった UI の自動停止。
- KT3 Player 1.6.0：情報 `track` に `loops` と `loopIndex` を追加。
  - 複数のループを持つ曲のためです。
