# KT3 Player Extensions

[English](#english) | [日本語](#日本語)

## English

Specification of extensions (`.kt3x`) for [KT3 Player](https://github.com/KEITO00/kt3-player).

> Extensions are supported from KT3 Player 1.5.0.

An extension can add audio effects, UI, and themes to KT3 Player. Extensions run inside
the Player with limited access: they cannot read files on the computer, and they can connect
to external hosts only with the user's permission.

### Documents

- [GUIDE.md](GUIDE.md): how to make an extension ([日本語](GUIDE.ja.md))
- [SPEC.md](SPEC.md): the specification ([日本語](SPEC.ja.md))
- [examples](examples): example extensions
- [CHANGELOG.md](CHANGELOG.md): API versions
- [tools/pack.js](tools/pack.js): builds a `.kt3x` file from a folder (`node tools/pack.js <folder>`, requires Node.js)

### What an extension can add

- Audio effects on the vocal track, the instrumental track or the whole mix
- Displays and controls in the DJ zone, on the record, over the window or in a side panel
- Themes: colors, layout, images and fonts
- With permission: control of the Player, additional decks, network access to listed hosts, MIDI devices

### License

The specification is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The tools (tools) and the example extensions (examples) are licensed under the MIT License.
You can make and distribute extensions without asking for permission. See [LICENSE](LICENSE).

## 日本語

[KT3 Player](https://github.com/KEITO00/kt3-player) の拡張機能（`.kt3x`）の仕様です。

> 拡張機能は KT3 Player 1.5.0 以降で使えます。

拡張機能を使うと、KT3 Player にエフェクト・UI・テーマを追加できます。拡張機能は Player の中で、
できることを制限した状態で動きます。PC のファイルは読めず、外部との通信は利用者が許可した場合だけできます。

### 文書

- [GUIDE.ja.md](GUIDE.ja.md)：作り方（[English](GUIDE.md)）
- [SPEC.ja.md](SPEC.ja.md)：仕様（[English](SPEC.md)）
- [examples](examples)：見本の拡張機能
- [CHANGELOG.md](CHANGELOG.md)：API の版ごとの変更
- [tools/pack.js](tools/pack.js)：フォルダから `.kt3x` を作る（`node tools/pack.js <フォルダ>`、Node.js が必要）

### 拡張機能で追加できるもの

- エフェクト（ボーカル・インスト・全体のどこかにかける）
- 表示や操作部品（DJ ゾーン、レコードの上、画面全体、横のパネル）
- テーマ（色・配置・画像・フォント）
- 権限を許可した場合：Player の操作、デッキの追加、指定したサイトとの通信、MIDI 機器

### ライセンス

仕様は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja) で公開しています。
ツール（tools）と見本の拡張機能（examples）は、MIT ライセンスで公開しています。
許可なく拡張機能を作成・配布できます。詳しくは [LICENSE](LICENSE) を参照してください。
