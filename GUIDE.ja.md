# 拡張機能の作り方

English: [GUIDE.md](GUIDE.md)

KT3 Player の拡張機能（`.kt3x`）を作って配るまでの流れです。細かい決まりは [SPEC.ja.md](SPEC.ja.md) を参照してください。

## 1. フォルダを作る

拡張機能は、`manifest.json` を最上位に置いたフォルダから作ります。

```
my-extension/
  manifest.json
  icon.png        （任意）
  main.js         （main スクリプトを使う場合）
  main.css
```

`manifest.json` の例（画面の右下に今の再生位置を出す拡張機能）：

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

- `id` は `作者名.拡張機能名` の形にします（英小文字・数字・`-`）。
  - 他の人の拡張機能と重ならないようにするためです。
- エフェクトの書き方は [SPEC.ja.md の 4 章](SPEC.ja.md#4-エフェクト)、テーマは [5 章](SPEC.ja.md#5-テーマ)、main スクリプトは [6 章](SPEC.ja.md#6-main-スクリプト) にあります。

## 2. Player で試す

1. KT3 Player の設定で「Extension developer mode」をオンにします。
2. 設定の「Extensions」→「Load folder」で、作ったフォルダを選びます。
3. 書き換えたら、「Extensions」の一覧の「Reload」で読み直します。
   - main スクリプトがある時は、Player ごと再読み込みします。
   - デスクトップ版では、再読み込みの後に同じフォルダを自動で読み込みます。ブラウザ版では、フォルダをもう一度選んでください。

フォルダから読み込んだ拡張機能は保存されません。Player を再起動したら、もう一度読み込んでください。
manifest に誤りがある時や、main スクリプトでエラーが起きた時は、理由が表示されます。
エフェクトの処理が重すぎる時は、Player が停止して理由を表示します（[SPEC.ja.md の 4.4](SPEC.ja.md#44-processor)）。

## 3. `.kt3x` にする

[Node.js](https://nodejs.org/) を使って、このリポジトリの `tools/pack.js` でフォルダを `.kt3x` にします。

```
node tools/pack.js my-extension
```

`yourname.clock-1.0.0.kt3x` のような名前のファイルができます。名前が `.` で始まるファイルとフォルダは含まれません。

## 4. 配る

`.kt3x` をそのまま渡します。受け取った人は、ダブルクリック（デスクトップ版）か、Player のレコードへのドラッグで導入できます。
導入の前に、名前・作者・中身が表示されます。

- main スクリプトがある拡張機能では、Player の中のすべてを使えることが、注意として表示されます。
- 新しい版を配る時は、`version` を上げます。
  - 同じ `id` の新しい版は、更新として扱われます。

## 5. 既存の部品を隠す・動かす

Player の画面にもともとある部品は、テーマ（CSS）で隠したり動かしたりできます。

- 部品は、`data-part` の名前で選びます（例：`[data-part="hotcues"]`）。
  - 名前の一覧は [SPEC.ja.md の 5.1](SPEC.ja.md#51-data-part-の名前) にあります。
  - `data-part` の名前は、Player の版が変わっても変わりません。ID や class は変わることがあります。
- 隠す時は、`display: none` を指定します。
  - 設定などで Player が表示を切り替える部品（左上の波形など）は、`display: none !important` にします。
    - Player が要素に直接 `display` を指定しているためです。
- 動かす時は、`order` や `grid` などを指定します。
  - DJ ゾーンの段（`[data-part="dj-row-1"]` など）は、flexbox で部品を並べています。
- 見本は [remove-layout](examples/remove-layout) です。

## 6. main スクリプトで作る

main スクリプトは Player の画面の中で動くので、画面も操作も自由に作れます。

- 画面を足す時は、要素を作って Player の画面に入れます。
  - 場所は `data-part` の名前で探すと、Player の版が変わっても見つかります（例：`document.querySelector('[data-part="center"]')`）。
- CSS は、`kt3x.text('main.css')` で読んで `<style>` 要素に入れます。
  - Player の画面全体に効くため、セレクターは `kt3x-` で始まる class などにします。
  - 色は `var(--accent)` を使うと、利用者が選んだアクセント色に合います。
- Player を操作する時は、Player のボタンを押したり、Player のつまみの値を変えて `input` イベントを送ったりすると、Player のボタンを使った時と同じ動きになります。
  - 例：`document.getElementById('btn-play').click()`
  - 例：`const f = document.getElementById('dj-filter'); f.value = 50; f.dispatchEvent(new Event('input'));`
- Player の状態は、Player の変数や関数から読めます。見本では次のものを使っています。

| 名前 | 内容 |
|---|---|
| `kt3` | 読み込んだ曲（`meta`・`lyrics`・`thumbnailData` など）。曲がない時は `null` |
| `waBuffer` | 曲の音声。`waBuffer.duration` が長さ（秒） |
| `waPlaying` | 再生中かどうか |
| `curPos()` | 再生位置（秒） |
| `waSeek(t)` | 再生位置の移動 |
| `hotCues`、`cuePoint` | ホットキューと CUE の位置（未設定は `null`） |
| `segAt(t)` | その位置の拍の情報（`beat`・`offset`・`beats`） |
| `waveformPeaks` | 曲全体の波形 |
| `ExtraDeck` | 追加のデッキ |

- これらは Player の内部の名前なので、Player の版が変わると変わることがあります（[SPEC.ja.md の 6.4](SPEC.ja.md#64-変えない名前と変わることがある名前)）。
- 見本は [stage-view](examples/stage-view) と [dj-console](examples/dj-console) です。

## 見本

[examples](examples) に見本があります。

| フォルダ | 内容 | 使う仕組み |
|---|---|---|
| [fx-pack](examples/fx-pack) | ダブエコー・フェイザーと、拍に合わせるスタッター・スライサー | 組み立て型と処理型のエフェクト |
| [bitcrusher](examples/bitcrusher) | ビット数とサンプリング周波数を落とすエフェクト | 処理型のエフェクト |
| [stage-view](examples/stage-view) | ジャケット・今の歌詞・曲全体の波形を大きく表示する画面 | main スクリプト（画面中央を差し替える） |
| [dj-console](examples/dj-console) | デッキ・ホットキュー・ループ・ミキサー・BEAT FX を並べ直した DJ ゾーン | main スクリプト（Player のボタンとつまみを操作する） |
| [karaoke](examples/karaoke) | 今の歌詞を大きく表示し、次の行までの時間に合わせて塗る表示 | main スクリプト |
| [second-deck](examples/second-deck) | 別の曲やボーカル・インストを載せてスクラッチできる、2 枚目のデッキ | main スクリプト、`ExtraDeck` |
| [sampler](examples/sampler) | 拡張機能の中で作った音を鳴らす 3 つのパッド | main スクリプト、`ExtraDeck` |
| [midi-map](examples/midi-map) | MIDI 機器のボタンとつまみを、Player の操作に割り当てる | main スクリプト、Web MIDI |
| [remove-layout](examples/remove-layout) | レコードと再生ボタンだけを残し、ほかの部品を隠して配置を組み替えるテーマ | テーマ、`data-part` |
| [theme-sunset](examples/theme-sunset) | アクセント色をオレンジにするテーマ | テーマ |
