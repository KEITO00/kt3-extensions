# 拡張機能の作り方

English: [GUIDE.md](GUIDE.md)

KT3 Player の拡張機能（`.kt3x`）を作成して配布するまでの手順です。詳しい仕様は [SPEC.ja.md](SPEC.ja.md) を参照してください。

## 1. フォルダを作成する

拡張機能は、`manifest.json` を最上位に置いたフォルダから作成します。

```
my-extension/
  manifest.json
  icon.png        （任意）
  main.js         （main スクリプトを使用する場合）
  main.css
```

`manifest.json` の例（画面の右下に、現在の再生位置を表示する拡張機能）：

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

`main.js`：

```js
const el = document.createElement('div');
el.style.cssText = 'position:fixed;right:20px;bottom:20px;color:var(--accent);font:24px monospace;z-index:240';
document.body.appendChild(el);
(function tick() {
  el.textContent = waBuffer ? curPos().toFixed(1) + ' s' : '';
  requestAnimationFrame(tick);
})();
```

- `id` は、`作者名.拡張機能名` の形式にしてください（英小文字・数字・`-`）。
  - 他の作者の拡張機能と重複しないようにするためです。
- エフェクトの書き方は [SPEC.ja.md の 4 章](SPEC.ja.md#4-エフェクト)、テーマは [5 章](SPEC.ja.md#5-テーマ)、main スクリプトは [6 章](SPEC.ja.md#6-main-スクリプト) に記載しています。

## 2. Player で動作を確認する

1. KT3 Player の設定で、「Extension developer mode」をオンにしてください。
2. 設定の「Extensions」→「Load folder」で、作成したフォルダを選択してください。
3. ファイルを変更した後は、「Extensions」の一覧の「Reload」で再度読み込んでください。
   - main スクリプトがある場合は、Player 全体が再読み込みされます。
   - デスクトップ版では、再読み込みの後に、同じフォルダが自動で読み込まれます。
   - ブラウザ版では、再読み込みの後に、フォルダを再度選択してください。

フォルダから読み込んだ拡張機能は保存されません。Player を再起動した後は、再度読み込んでください。
manifest に誤りがある場合や、main スクリプトでエラーが発生した場合は、その理由が表示されます。
エフェクトの処理が重すぎる場合は、Player がエフェクトを停止して理由を表示します（[SPEC.ja.md の 4.4](SPEC.ja.md#44-processor)）。

## 3. `.kt3x` を作成する

[Node.js](https://nodejs.org/) と、このリポジトリの `tools/pack.js` を使用すると、フォルダから `.kt3x` を作成できます。

```
node tools/pack.js my-extension
```

`yourname.clock-1.0.0.kt3x` のような名前のファイルが作成されます。名前が `.` で始まるファイルとフォルダは含まれません。

## 4. 配布する

`.kt3x` のファイルを、そのまま配布してください。受け取った利用者は、ダブルクリック（デスクトップ版）か、Player のレコードへのドラッグ＆ドロップで導入できます。
導入の前に、名前・作者・内容が表示されます。

- main スクリプトがある拡張機能では、Player のすべての機能を使用できることが、注意として表示されます。
- 新しい版を配布する場合は、`version` を上げてください。
  - 同じ `id` の新しい版は、更新として扱われます。

## 5. 既存の部品を非表示にする・移動する

Player の画面にある既存の部品は、テーマ（CSS）で非表示にしたり、移動したりできます。

- 部品は、`data-part` の名前で選択してください（例：`[data-part="hotcues"]`）。
  - 名前の一覧は、[SPEC.ja.md の 5.1](SPEC.ja.md#51-data-part-の名前) に記載しています。
  - `data-part` の名前は、Player の版が変わっても変更されません。
  - 要素の ID や class は、Player の版が変わると変更されることがあります。
- 非表示にする場合は、`display: none` を指定してください。
  - 設定などで Player が表示を切り替える部品（左上の波形など）には、`display: none !important` を指定してください。
    - Player が要素に直接 `display` を指定しているためです。
- 移動する場合は、`order` や `grid` などを指定してください。
  - DJ ゾーンの段（`[data-part="dj-row-1"]` など）は、flexbox で部品を配置しています。
- 見本は [remove-layout](examples/remove-layout) です。

## 6. main スクリプトで作成する

main スクリプトは Player の画面の中で動作するため、表示も操作も自由に作成できます。

- 表示を追加する場合は、要素を作成して、Player の画面に追加してください。
  - 追加する場所を `data-part` の名前で指定すると、Player の版が変わっても同じ部品を特定できます（例：`document.querySelector('[data-part="center"]')`）。
- CSS は、`kt3x.text('main.css')` で読み込み、`<style>` 要素に追加してください。
  - CSS は Player の画面全体に適用されるため、セレクターには `kt3x-` で始まる class などを使用してください。
  - 色に `var(--accent)` を使用すると、利用者が設定したアクセント色に合わせられます。
- Player を操作する場合は、Player のボタンを押すか、フェーダーの値を変更して `input` イベントを送ってください。
  - Player の操作部品を使用した場合と、同じ動作になります。
  - 例：`document.getElementById('btn-play').click()`
  - 例：`const f = document.getElementById('dj-filter'); f.value = 50; f.dispatchEvent(new Event('input'));`
- Player の状態は、Player の変数や関数から取得できます。
  - 見本では、次のものを使用しています。

| 名前 | 内容 |
|---|---|
| `kt3` | 読み込んだ曲（`meta`・`lyrics`・`thumbnailData` など）。曲がない場合は `null` |
| `waBuffer` | 曲の音声。`waBuffer.duration` が長さ（秒） |
| `waPlaying` | 再生中かどうか |
| `curPos()` | 再生位置（秒） |
| `waSeek(t)` | 再生位置の移動 |
| `hotCues`、`cuePoint` | ホットキューと CUE の位置（未設定の場合は `null`） |
| `segAt(t)` | 指定した位置の拍の情報（`beat`・`offset`・`beats`） |
| `waveformPeaks` | 曲全体の波形 |
| `ExtraDeck` | 追加のデッキ |

- これらは Player の内部の名前のため、Player の版が変わると変更されることがあります（[SPEC.ja.md の 6.4](SPEC.ja.md#64-変更しない名前と変更されることがある名前)）。
- 見本は [stage-view](examples/stage-view) と [dj-console](examples/dj-console) です。

### Player のコードを確認する

main スクリプトで使用する変数・関数・要素の ID は、Web 版の Player（https://kt3.keitodaze.jp/）のコードを参考にしてください。デスクトップ版も、同じコードで動作しています。

- ブラウザで Web 版を開くと、開発者ツール（F12）の「Sources」で確認できます。
- 開発者ツールの「Console」では、Player の変数や関数を直接実行して確認できます（例：`kt3`、`curPos()`）。

| ファイル | 内容 |
|---|---|
| `index.html` | 画面の HTML・CSS と、Player の JavaScript の大部分 |
| `extensions.js` | 拡張機能の読み込み（manifest の検証、エフェクト、テーマ） |
| `deck-worklet.js` | 音声を再生する処理（デッキ） |
| `ktc.js` | KTC の音声を読み込む処理 |

- Web 版は、デスクトップ版より先に更新されることがあります。
  - 版は、設定画面の最下部に表示されます。
  - 拡張機能の動作を確認する Player と同じ版かどうか、確認してください。
- 拡張機能を作成するためにこのコードを読むことは、KT3 Player の利用条件（第 3 項 (2)）で認めています。
  - コードを拡張機能に含めて配布することはできません（第 3 項 (3)）。

## 見本

[examples](examples) に見本があります。

| フォルダ | 内容 | 使用する仕組み |
|---|---|---|
| [fx-pack](examples/fx-pack) | ダブエコー・フェイザーと、拍に合わせるスタッター・スライサー | 組み立て型と処理型のエフェクト |
| [bitcrusher](examples/bitcrusher) | ビット数とサンプリング周波数を下げるエフェクト | 処理型のエフェクト |
| [stage-view](examples/stage-view) | ジャケット・現在の歌詞・曲全体の波形を大きく表示する画面 | main スクリプト（画面中央を差し替える） |
| [dj-console](examples/dj-console) | デッキ・ホットキュー・ループ・ミキサー・BEAT FX を再配置した DJ ゾーン | main スクリプト（Player のボタンとフェーダーを操作する） |
| [karaoke](examples/karaoke) | 現在の歌詞を大きく表示し、次の行までの時間に合わせて色を付ける表示 | main スクリプト |
| [second-deck](examples/second-deck) | 別の曲やボーカル・インストを読み込んでスクラッチできる、2 台目のデッキ | main スクリプト、`ExtraDeck` |
| [sampler](examples/sampler) | 拡張機能の中で作成した音声を再生する 3 つのパッド | main スクリプト、`ExtraDeck` |
| [midi-map](examples/midi-map) | MIDI 機器のボタンとつまみを、Player の操作に割り当てる | main スクリプト、Web MIDI |
| [remove-layout](examples/remove-layout) | レコードと再生ボタンだけを残し、ほかの部品を非表示にして配置を変更するテーマ | テーマ、`data-part` |
| [theme-sunset](examples/theme-sunset) | アクセント色をオレンジにするテーマ | テーマ |
