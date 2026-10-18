# KT3 Player Extensions

[English](#english) | [日本語](#日本語)

## English

Specification of extensions (`.kt3x`) for [KT3 Player](https://github.com/KEITO00/kt3-player).

> Extensions are supported from KT3 Player 1.5.0. API 2 is supported from KT3 Player 1.8.3.

An extension can add audio effects, themes and a main script to KT3 Player.
A main script runs inside the Player and can use everything in it, so the Player shows a warning
before installing an extension that has one.

### Documents

- [GUIDE.md](GUIDE.md): how to make an extension ([日本語](GUIDE.ja.md))
- [SPEC.md](SPEC.md): the specification ([日本語](SPEC.ja.md))
- [examples](examples): example extensions
- [CHANGELOG.md](CHANGELOG.md): API versions
- [tools/pack.js](tools/pack.js): builds a `.kt3x` file from a folder (`node tools/pack.js <folder>`, requires Node.js)

### What an extension can add

- Audio effects on the vocal track, the instrumental track or the whole mix
- Themes: colors, layout, images and fonts
- Main scripts (API 2): any display or control in the Player window, and anything else the Player and the browser can do

### License

The specification is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
The tools (tools) and the example extensions (examples) are licensed under the MIT License.
You can make and distribute extensions without asking for permission. See [LICENSE](LICENSE).

## 日本語

[KT3 Player](https://github.com/KEITO00/kt3-player) の拡張機能（`.kt3x`）の仕様です。

> 拡張機能は KT3 Player 1.5.0 以降で使用できます。API 2 は KT3 Player 1.8.3 以降で使用できます。

拡張機能を使用すると、KT3 Player にエフェクト・テーマ・main スクリプトを追加できます。
main スクリプトは Player の中で動作し、Player のすべての機能を使用できます。そのため、main スクリプトを含む拡張機能を
導入する前に、Player が注意を表示します。

### 文書

- [GUIDE.ja.md](GUIDE.ja.md)：拡張機能の作り方（[English](GUIDE.md)）
- [SPEC.ja.md](SPEC.ja.md)：仕様（[English](SPEC.md)）
- [examples](examples)：見本の拡張機能
- [CHANGELOG.md](CHANGELOG.md)：API の版ごとの変更点
- [tools/pack.js](tools/pack.js)：フォルダから `.kt3x` を作成する（`node tools/pack.js <フォルダ>`、Node.js が必要）

### 拡張機能で追加できるもの

- エフェクト（ボーカル・インスト・全体のいずれかにかける）
- テーマ（色・配置・画像・フォント）
- main スクリプト（API 2）：Player の画面の表示や操作のほか、Player とブラウザで実行できる処理全般

### ライセンス

仕様は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja) で公開しています。
ツール（tools）と見本の拡張機能（examples）は、MIT ライセンスで公開しています。
許可なく、拡張機能を作成・配布できます。詳しくは [LICENSE](LICENSE) を参照してください。
