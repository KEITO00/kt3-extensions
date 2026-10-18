# KT3 Player 拡張機能（.kt3x）仕様

English: [SPEC.md](SPEC.md)

> 拡張機能は KT3 Player 1.5.0 以降で使えます。API 2（3.1）は KT3 Player 1.8.3 以降で使えます。

この文書では、[KT3 Player](https://github.com/KEITO00/kt3-player) に機能を追加する
拡張機能のファイル形式（`.kt3x`）と、拡張機能から使える機能を説明します。

「しなければならない（MUST）」「すべきである（SHOULD）」「してもよい（MAY）」は、
RFC 2119 の意味で使います。

## 1. 全体の構成

拡張機能は、次のものを追加できます。1 つの拡張機能に複数を入れることもできます。

| 種類 | 内容 |
|---|---|
| エフェクト | 音にかけるエフェクト（4 章） |
| テーマ | Player の見た目を変える CSS（5 章） |
| main スクリプト | Player の画面の中で動く JavaScript（6 章） |

- エフェクトとテーマは、決まった書き方の中でだけ動きます。
- main スクリプトは、Player の中のすべてを使えます。
- 拡張機能は、デスクトップ版とブラウザ版の両方で動きます。

## 2. ファイル

- `.kt3x` は ZIP ファイルでなければなりません（MUST）。
  - 圧縮方式は、無圧縮（stored）か deflate です。
  - 暗号化したファイルと ZIP64 は使えません。
- ZIP の最上位に `manifest.json` を置かなければなりません（MUST）。
- ZIP 内のパスは `/` で区切ります。
  - `..` を含むパス、`/` で始まるパス、ドライブ名を含むパスがある場合は、導入してはなりません（MUST NOT）。
- テキストファイルとファイル名は UTF-8 でなければなりません（MUST）。
- 大きさの上限は次のとおりです。
  - ファイル数は 500 までです。
  - 1 ファイルは 20 MB までです。
  - `.kt3x` 全体と、展開後の合計は、それぞれ 50 MB までです。
- 展開した大きさが ZIP に書かれた大きさと違うファイルがある場合、Player は導入しません。
- `tools/pack.js` で、フォルダから `.kt3x` を作成できます（`node tools/pack.js <フォルダ>`）。

## 3. manifest.json

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | 拡張機能の ID。`<作者>.<名前>` の形です（例：`keito.second-deck`）。英小文字・数字・`-` と、区切りの `.` 1 つだけを使えます |
| `name` | 必須 | 表示名 |
| `version` | 必須 | `x.y.z` の形の版 |
| `author` | 必須 | 作者名 |
| `description` | 必須 | 短い説明（200 文字まで） |
| `api` | 必須 | 使う拡張機能 API の版（3.1） |
| `icon` | 任意 | アイコン画像（PNG）のパス |
| `effects` | 任意 | エフェクトの一覧（4 章） |
| `theme` | 任意 | テーマ（5 章） |
| `main` | 任意 | main スクリプト（JavaScript）のパス（6 章）。API 2 |

- この表にない項目がある manifest は、導入できません。Player は理由を表示します。
- Player は、名前・作者・説明などの文字列を、HTML として解釈せずに文字として表示します。

### 3.1 API の版

`api` には `1` か `2` を書きます。現在の版は `2` です。

- `main` は、`"api": 2` の拡張機能だけが使えます。
- `"api": 1` の拡張機能のうち、エフェクトとテーマだけのものは、そのまま動きます。
- API 1 の `ui`・`permissions` を書いた拡張機能は、導入できません。
  - Player は理由を表示します。
  - UI は、main スクリプト（6 章）で作り直します。

## 4. エフェクト

`effects` には、1 つの拡張機能につき 8 個までエフェクトを書けます。

### 4.1 共通の項目

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | エフェクトの ID（英小文字・数字・`-`、32 文字まで） |
| `name` | 必須 | DJ ゾーンに表示する名前（24 文字まで） |
| `kind` | 必須 | `graph` または `processor` |
| `slots` | 任意 | 差し込める場所。`vocal`（ボーカル）・`inst`（インスト）・`master`（全体）から選びます。省略時は `["master"]` です。最初のものが初期の場所になります |
| `params` | 任意 | つまみ（16 個まで） |

- `vocal` と `inst` は、ボーカルとインストに分かれた曲でだけ使えます。
- `master` は、Player のすべての処理（EQ・フィルター・BEAT FX・BASS BOOST）の後に入ります。
- Player は、エフェクトごとに DJ ゾーンへ操作部品を作成します。
  - 操作部品は、ON ボタン、差し込む場所の切り替え、つまみです。
- エフェクトは、導入した直後と曲を読み込んだ時に OFF になります。

### 4.2 つまみ

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | つまみの ID |
| `name` | 必須 | 表示名（24 文字まで） |
| `control` | 任意 | `fader`（初期値）・`button`（押している間 1）・`toggle`（押すたびに 0 と 1 が切り替わる） |
| `min`、`max` | `fader` で必須 | 値の範囲 |
| `default` | 任意 | 初期値。省略時は `min` です |
| `step` | 任意 | 刻み。省略時は連続です |
| `unit` | 任意 | 値の後ろに表示する単位（8 文字まで） |
| `map` | `graph` で必須 | つまみの値を、どの部品の値に反映するか（4.3） |

### 4.3 `graph`

Web Audio の標準ノードを組み合わせて、エフェクトを作成します。

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

- `nodes` には、部品の名前と設定を書きます（32 個まで）。
  - 名前に `in` と `out` は使えません。

| `type` | 設定できる値 |
|---|---|
| `gain` | `gain` |
| `biquad` | `filter`（`lowpass` `highpass` `bandpass` `lowshelf` `highshelf` `peaking` `notch` `allpass`）、`frequency`、`Q`、`gain`、`detune` |
| `delay` | `delayTime`、`maxDelay`（4 秒まで） |
| `waveshaper` | `shape`（`tanh` `clip` `fold`）、`drive`（0.01〜100） |
| `compressor` | `threshold`、`knee`、`ratio`、`attack`、`release` |
| `panner` | `pan` |
| `convolver` | `impulse`：`{"file": "ir.wav"}`（10 秒まで）または `{"noise": {"seconds": 2, "decay": 3}}` |
| `oscillator` | `wave`（`sine` `square` `sawtooth` `triangle`）、`frequency`、`detune` |
| `constant` | `offset` |

- `connect` には、`[接続元, 接続先]` の一覧を書きます（64 個まで）。
  - `in` はエフェクトの入力、`out` は出力です。
  - 接続先を `部品名.値の名前`（例：`"d.delayTime"`）にすると、音で値を変化させられます。
  - ループを作る時は、Web Audio の決まりどおり `delay` を間に入れます。
- `oscillator` と `constant` は、自動で動き始めます。
  - 接続先にできるのは、値・`gain`・`panner`・`waveshaper`・`out` だけです。
- `map` では、つまみの値を `min`〜`max` から 0〜1 に変換し、`from`〜`to` に当てはめて部品の値にします。

| `curve` | 計算 |
|---|---|
| `linear`（初期値） | `from + (to - from) × x` |
| `exp` | `from × (to / from) ^ x`（`from` と `to` は正の値） |
| `beats` | `from`〜`to` を拍数として、曲の BPM とピッチから秒に変換します。BPM やピッチが変わると追従します |

### 4.4 `processor`

音の処理を AudioWorklet で書きます。

| 項目 | 必須 | 内容 |
|---|---|---|
| `module` | 必須 | AudioWorklet のモジュール（JavaScript）のパス |
| `processor` | 必須 | 処理の名前（英小文字・数字・`-`） |

- モジュールは、`registerProcessor("<拡張機能の ID>/<processor>", クラス)` で登録しなければなりません（MUST）。
  - 例：ID が `keito.crusher`、`processor` が `crush` の場合は、`registerProcessor("keito.crusher/crush", ...)` です。
  - 違う名前で登録したエフェクトは読み込まれません。
- 入力と出力は 1 つずつです。出力は 2 チャンネルです。
- つまみを動かすと、同じ `id` の AudioParam（`parameterDescriptors`）の値が変わります。
  - 同じ `id` の AudioParam がない場合は、`port` に `{ "param": id, "value": 値 }` が届きます。
- `processorOptions.transport` に、再生の状態を入れた SharedArrayBuffer が渡されます。
  - `new Float64Array(transport)` で読みます。
  - 値は、Player の再生処理がブロック（128 サンプル）ごとに、エフェクトより先に書き込みます。

| 位置 | 内容 |
|---|---|
| 0 | 今のブロックの終わりのフレーム番号（AudioWorklet の `currentFrame` と同じ数え方） |
| 1 | 曲の再生位置（秒） |
| 2 | 再生の速さ（1 が等速。スクラッチ中は負の値にもなります） |
| 3 | 音が出ている時 1、止まっている時 0 |
| 4 | BPM（不明な時 0） |
| 5 | 最初の拍の位置（秒） |
| 6 | 1 小節の拍数 |

- すべてのエフェクトの処理は、同じ AudioWorklet の中で動きます。
  - 画面・ファイル・通信には触れられません。
  - 他のエフェクトの音に影響しないことは、保証しません。
- 処理がエラーで止まったエフェクトは、Player が OFF にし、DJ ゾーンにエラーを表示します。
- OFF のエフェクトの処理（`process`）は呼ばれません。
- Player は、エフェクトごとに処理にかかった時間を測ります。次の場合は、Player がエフェクトを OFF にして理由を表示します。
  - 1 ブロック（128 サンプル）の時間の 40% を超える処理が、3 秒続いた時。
  - エフェクトが ON の間に音が途切れた時。この場合は、いちばん重いエフェクトを OFF にします。
    - 音が途切れたとは、音の処理が実時間より 10% 以上遅れる状態が 2 秒続いたことを指します。
- 処理が終わらなくなり、音が 3 秒止まった時は、Player がその拡張機能を無効にし、Player の再読み込みを促します。
- Player は、モジュールの先頭に 1 行を加えてから読み込みます。
  - 処理時間を測るためです。
  - エラーに表示される行番号は、1 つ大きくなります。
  - モジュールの中の `registerProcessor` は Player が用意したもので、登録したクラスを包んで時間を測ります。

## 5. テーマ

`theme` に CSS ファイルを 1 つ指定します。

```json
"theme": { "style": "theme.css" }
```

- CSS は、Player の画面にそのまま加わります。
  - Player の要素の ID や class は、Player の版が変わると変わることがあります。
  - 部品を選ぶ時は、`data-part` の名前（5.1）を使うべきです（SHOULD）。
- 設定の Color などで利用者が選んだ色を、テーマで変えるには `!important` が必要です。
  - これらの色は、Player が要素に直接指定しているためです。
- 設定などで Player が表示を切り替える部品（左上の波形など）を、テーマで隠すには `!important` が必要です。
  - これらの部品は、Player が要素に直接 `display` を指定しているためです。
- `url()` で指せるのは、パッケージのファイル（相対パス）だけです。
  - 画像やフォント（`@font-face`）に使えます。
- 次のものを含む CSS は読み込まれません。
  - 外部の URL、`@import`、`@namespace`、`image-set()`、バックスラッシュ（`\`）、閉じていないコメントです。
- CSS は 200 KB までです。
- 次の画面を表示している間は、Player がテーマを停止します。
  - 対象は、導入・更新の確認画面、削除などの確認、Extensions の管理画面です。
  - これらの画面は、テーマに関係なく Player 本来の見た目で表示されます。
  - 設定画面では、テーマを停止しません。
- Ctrl + Shift + E で、いつでも Extensions の管理画面を開けます。
  - テーマで設定画面のボタンが隠されても、拡張機能を無効にしたり削除したりできるようにするためです。

### 5.1 `data-part` の名前

Player の主な部品には、`data-part` の名前がついています（KT3 Player 1.8.3 以降）。この名前は、Player の版が変わっても変えません。

```css
[data-part="dj-zone"] { display: none !important; }
```

| 名前 | 部品 |
|---|---|
| `player` | Player の画面の本体（レコードから DJ ゾーンまで） |
| `center` | レコード・歌詞・スペクトラムの段 |
| `record` | レコード |
| `lyrics-left`、`lyrics-right` | 歌詞 |
| `spectrum-left`、`spectrum-right` | スペクトラム |
| `seekbar` | シークバー |
| `time` | 時間の表示 |
| `transport` | 再生ボタンの並び |
| `title` | 曲名 |
| `volume` | 音量 |
| `waveform` | 左上の波形 |
| `beat-lamps` | 拍のランプ |
| `top-buttons` | 右上のボタン |
| `keys-button`、`settings-button` | キー操作・設定のボタン |
| `dj-zone` | DJ ゾーン |
| `dj-row-1`〜`dj-row-4` | DJ ゾーンの段 |
| `pitch`、`deck-buttons`、`filter` | DJ ゾーンの部品（1 段目） |
| `hotcues`、`loop`、`beatjump`、`slip` | DJ ゾーンの部品（2 段目） |
| `beatloop`、`loop-length`、`loop-target`、`quantize` | DJ ゾーンの部品（3 段目） |
| `eq`、`bass-boost`、`stems`、`beat-fx` | DJ ゾーンの部品（4 段目） |
| `ext-effects` | 拡張機能のエフェクトの段 |

- 部品の中の要素には名前がありません。
  - `[data-part="record"] canvas` のように、名前のある部品からたどって選びます。
- レコードとスペクトラムは、Player が部品の位置に合わせて描いています。
  - `display: none` で隠すと、描画も止まります。

## 6. main スクリプト

`main` に書いた JavaScript は、Player の画面の中で動きます。Player の中のすべてを使えます。

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

### 6.1 動き方

- main スクリプトは、拡張機能を読み込んだ時に 1 回実行されます。
  - 読み込むのは、Player の起動時、導入した時、有効にした時です。
  - 実行する時には、同じ拡張機能のエフェクトとテーマは、すでに読み込まれています。
- main スクリプトは、Player の画面と同じ場所で動きます。
  - Player の画面の要素、Player の関数と変数、通信や Web MIDI などのブラウザの機能を、制限なく使えます。
- スクリプト全体は、関数の中に入れて実行されます。
  - 一番外側で宣言した変数や関数は、ほかのスクリプトからは見えません。
  - Player の変数や関数と同じ名前を宣言すると、そのスクリプトの中では Player のものが見えなくなります。
- CSS を加える時は、`<style>` 要素を作って `document.head` に入れます。
  - CSS は Player の画面全体に効きます。
  - セレクターには、自分の拡張機能だけが使う名前（例：`kt3x-` で始まる class）をつけるべきです（SHOULD）。
- Player のアクセント色は、CSS の変数 `--accent` で使えます。

### 6.2 `kt3x` オブジェクト

main スクリプトの中では、`kt3x` を使えます。

| 名前 | 内容 |
|---|---|
| `kt3x.info` | `{ id, name, version }` |
| `kt3x.file(path)` | パッケージのファイルの URL（`img.src` などに使います） |
| `kt3x.text(path)` | パッケージのテキストファイルの中身 |
| `kt3x.storage.get(key)` | 保存領域から読みます。保存した値を返し、ない時は `null` を返します |
| `kt3x.storage.set(key, value)` | 保存領域に書きます。`null` で削除します |

- `kt3x.file()` と `kt3x.text()` は、パッケージにないファイルを指定するとエラーになります。
- 保存領域には、JSON にできる値を書きます。
  - 拡張機能ごとに、合計 256 KB までです。超えるとエラーになります。
  - `value` を省略するとエラーになります。
  - 拡張機能を削除すると、保存領域も削除されます。
- Player の画面には、読み込んだ曲を表す変数 `kt3` があります。そのため、拡張機能用のオブジェクトの名前は `kt3x` です。

### 6.3 エラー

- main スクリプトの最初の実行でエラーが起きた時は、拡張機能を読み込めなかったものとして扱います。
  - 同じ拡張機能のエフェクトとテーマも外します。
  - Extensions の管理画面に、理由と行番号を表示します。
- 読み込んだ後に main スクリプトの中でエラーが起きた時は、Player がエラーを表示します。
  - 処理されなかった Promise の拒否も同じです。
  - Extensions の管理画面にも表示します。
- Player は、エラーを隠したり、別の動きに切り替えたりしません。

### 6.4 変えない名前と、変わることがある名前

- 次のものは、Player の版が変わっても変えません。
  - manifest、エフェクト、テーマの書き方
  - `kt3x`
  - `data-part` の名前（5.1）
- それ以外は、Player の版が変わると変わることがあります。
  - Player の関数や変数の名前と動き、要素の ID・class・並びなどです。
  - 変わって動かなくなった時は、拡張機能の作者が対応します。

### 6.5 無効にする時と削除する時

- main スクリプトがしたことは、途中で取り消せません。
- そのため、main スクリプトを持つ拡張機能を、無効にする時・削除する時・更新する時は、Player を再読み込みします。
  - 無効にする時と削除する時は、再読み込みすることを確認してから行います。
- 開発者モードでフォルダから読み込んだ拡張機能を「Reload」した時も、再読み込みします。
  - デスクトップ版では、再読み込みの後に、同じフォルダを自動で読み込みます。
  - ブラウザ版では、再読み込みの後に、フォルダをもう一度選んでください。

## 7. 導入と管理（Player の動作）

- 導入の方法は、次の 3 つです。
  - `.kt3x` のダブルクリック（デスクトップ版）
  - レコードへのドラッグ＆ドロップ
  - 設定画面の「Extensions」→「Install from file」
- 導入の前に、名前・作者・版・ID・説明・中身（エフェクトの数、テーマ、main スクリプト）を表示し、利用者の確認を得ます。
  - main スクリプトがある時は、次のことを注意として表示します。
    - Player の中のすべてを使えること（開いた曲の音声も含みます）
    - 通信して、データを送れること
    - Player の更新で、動かなくなることがあること
  - 作者が確認されていないことも表示します。
- 同じ `id` の新しい版は、更新として扱います。
  - 古い版や同じ版は、再インストールとして扱います。
- 導入した拡張機能は、Player の中の保存領域に置きます（PC のフォルダには展開しません）。
- 有効・無効の切り替えと削除は、設定画面の「Extensions」で行います。
  - Ctrl + Shift + E でも、Extensions の管理画面を開けます（5 章）。
  - 削除すると、その拡張機能の保存領域（6.2）も削除されます。
- 処理がエラーで止まったエフェクトは、Player が OFF にします。
- 重すぎるエフェクトは、Player が停止して理由を表示します（4.4）。
- 設定の「Start without extensions」をオンにすると、次の起動からすべての拡張機能を停止します。
  - main スクリプトも動かしません。
- 拡張機能の読み込み中に Player が正常に起動しなかった場合は、次の起動時に、拡張機能を停止するかどうかを確認します。
- 設定の「Extension developer mode」をオンにすると、「Extensions」→「Load folder」でフォルダから読み込めます。
  - フォルダから読み込んだ拡張機能は保存されません。
  - 「Reload」で再読み込みできます（6.5）。
