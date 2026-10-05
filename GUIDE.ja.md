# 拡張機能の作り方

English: [GUIDE.md](GUIDE.md)

KT3 Player の拡張機能（`.kt3x`）を作って配るまでの流れです。細かい決まりは [SPEC.ja.md](SPEC.ja.md) を参照してください。

## 1. フォルダを作る

拡張機能は、`manifest.json` を最上位に置いたフォルダから作ります。

```
my-extension/
  manifest.json
  icon.png        （任意）
  ui/main.js      （UI を作る場合）
  ui/main.css
```

`manifest.json` の例（画面全体に今の時刻を出す UI）：

```json
{
  "id": "yourname.clock",
  "name": "Clock",
  "version": "1.0.0",
  "author": "yourname",
  "description": "Shows the playback position.",
  "api": 1,
  "ui": [{ "id": "clock", "name": "Clock", "slot": "overlay", "script": "ui/main.js" }]
}
```

`ui/main.js`：

```js
const el = document.createElement('div');
el.style.cssText = 'position:fixed;right:20px;bottom:20px;color:#fff;font:24px monospace';
document.body.appendChild(el);
kt3.on('frame', f => { el.textContent = f.time.toFixed(1) + ' s'; });
```

- `id` は `作者名.拡張機能名` の形にします（英小文字・数字・`-`）。
  - 他の人の拡張機能と重ならないようにするためです。
- エフェクトの書き方は [SPEC.ja.md の 5 章](SPEC.ja.md#5-エフェクト)、UI の書き方は [6 章](SPEC.ja.md#6-ui) にあります。

## 2. Player で試す

1. KT3 Player の設定で「Extension developer mode」をオンにします。
2. 設定の「Extensions」→「Load folder」で、作ったフォルダを選びます。
3. 書き換えたら、「Extensions」の一覧の「Reload」で読み直します。

フォルダから読み込んだ拡張機能は保存されません。Player を再起動したら、もう一度読み込んでください。
manifest に誤りがあると、理由が表示されます。
エフェクトの処理が重すぎる時や、UI が応答しなくなった時は、Player が停止して理由を表示します（[SPEC.ja.md の 5.4](SPEC.ja.md#54-processor)、[6.1](SPEC.ja.md#61-動く環境)）。

## 3. `.kt3x` にする

[Node.js](https://nodejs.org/) を使って、このリポジトリの `tools/pack.js` でフォルダを `.kt3x` にします。

```
node tools/pack.js my-extension
```

`yourname.clock-1.0.0.kt3x` のような名前のファイルができます。名前が `.` で始まるファイルとフォルダは含まれません。

## 4. 配る

`.kt3x` をそのまま渡します。受け取った人は、ダブルクリック（デスクトップ版）か、Player のレコードへのドラッグで導入できます。
導入の前に、名前・作者・権限が表示されます。

- 新しい版を配る時は、`version` を上げます。
  - 同じ `id` の新しい版は、更新として扱われます。
- 権限は、必要なものだけにします。
  - 権限が増えた更新では、増えた権限が利用者に示されます。

## 5. 既存の部品を隠す・動かす

Player の画面にもともとある部品は、テーマ（CSS）で隠したり動かしたりできます。

- 隠す時は、`display: none` を指定します。
  - 設定などで Player が表示を切り替える部品（左上の波形など）は、`display: none !important` にします。
    - Player が要素に直接 `display` を指定しているためです。
- 動かす時は、`order` などを指定します。
  - DJ ゾーンの段（`.dj-rack`）は、flexbox で部品（`.dj-mod`）を並べています。
- 部品は、中にある操作部品の ID と `:has()` で選べます（例：`.dj-mod:has(#cue-pads)`）。
- 隠した部品の代わりは、DJ ゾーンやサイドパネルに置いた UI から、`control` の権限で操作します。
- 見本は [remove-layout](examples/remove-layout) です。
- Player の要素の ID や class は、Player の版が変わると変わることがあります。
  - 新しい版の Player で、見た目が崩れていないか確かめてください。

## 見本

[examples](examples) に見本があります。

| フォルダ | 内容 | 使う仕組み |
|---|---|---|
| [bitcrusher](examples/bitcrusher) | ビット数とサンプリング周波数を落とすエフェクト | 処理型のエフェクト |
| [karaoke](examples/karaoke) | 今の歌詞を大きく表示し、次の行までの時間に合わせて塗る表示 | UI（画面全体） |
| [second-deck](examples/second-deck) | 別の曲やボーカル・インストを載せてスクラッチできる、2 枚目のデッキ | デッキ、`decks` 権限 |
| [midi-map](examples/midi-map) | MIDI 機器のボタンとつまみを、再生・ホットキュー・ピッチに割り当てる UI | MIDI、`midi` 権限 |
| [theme-sunset](examples/theme-sunset) | アクセント色をオレンジにするテーマ | テーマ |
| [remove-layout](examples/remove-layout) | レコードと再生ボタンだけを残し、ほかの部品を隠して配置を組み替えるテーマ | テーマ（部品を隠す・動かす） |
