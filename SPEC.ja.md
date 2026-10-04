# KT3 Player 拡張機能（.kt3x）仕様

English: [SPEC.md](SPEC.md)

> 拡張機能は KT3 Player 1.5.0 以降で使えます。

この文書では、[KT3 Player](https://github.com/KEITO00/kt3-player) に機能を追加する
拡張機能のファイル形式（`.kt3x`）と、拡張機能から使える機能を説明します。

「しなければならない（MUST）」「すべきである（SHOULD）」「してもよい（MAY）」は、
RFC 2119 の意味で使います。

## 1. 全体の構成

拡張機能は、次のものを追加できます。1 つの拡張機能に複数を入れることもできます。

| 種類 | 内容 |
|---|---|
| エフェクト | 音にかけるエフェクト。ボーカル・インスト・全体のいずれかに差し込みます |
| UI | Player の画面に追加する表示や操作部品 |
| テーマ | Player の見た目（色・配置・画像・フォント） |

拡張機能は、デスクトップ版とブラウザ版の両方で動きます。

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
| `description` | 必須 | 短い説明 |
| `api` | 必須 | 対応する拡張機能 API の版（整数）。現在の版は `1` です |
| `icon` | 任意 | アイコン画像（PNG）のパス |
| `permissions` | 任意 | 使う権限（4 章） |
| `effects` | 任意 | エフェクトの一覧（5 章） |
| `ui` | 任意 | UI の一覧（6 章） |
| `theme` | 任意 | テーマ（7 章） |

Player は、名前・作者・説明などの文字列を、HTML として解釈せずに文字として表示します。

## 4. 権限

権限がなくても、エフェクト・UI・テーマは使えます。次の機能は、`permissions` に書き、
導入時に利用者の許可を得た場合だけ使えます。

| 権限 | 内容 |
|---|---|
| `control` | Player の操作（再生・シーク・CUE・ループ・ピッチ・FX など） |
| `decks` | デッキの追加と、音の読み込み |
| `network` | 外部との通信。通信先のホスト名を列挙します（例：`{"network": ["lyrics.example.com"]}`）。すべてのホストを許可する書き方はありません |
| `midi` | MIDI 機器の利用。SysEx は使えません |

更新で権限が増える場合、Player は増えた権限を示して、もう一度許可を求めます。

## 5. エフェクト

`effects` には、1 つの拡張機能につき 8 個までエフェクトを書けます。

### 5.1 共通の項目

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

### 5.2 つまみ

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | つまみの ID |
| `name` | 必須 | 表示名（24 文字まで） |
| `control` | 任意 | `fader`（初期値）・`button`（押している間 1）・`toggle`（押すたびに 0 と 1 が切り替わる） |
| `min`、`max` | `fader` で必須 | 値の範囲 |
| `default` | 任意 | 初期値。省略時は `min` です |
| `step` | 任意 | 刻み。省略時は連続です |
| `unit` | 任意 | 値の後ろに表示する単位（8 文字まで） |
| `map` | `graph` で必須 | つまみの値を、どの部品の値に反映するか（5.3） |

### 5.3 `graph`

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

### 5.4 `processor`

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
  - 他のエフェクトの音に影響を与えられないことは、保証しません。
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

## 6. UI

`ui` には、1 つの拡張機能につき 8 個まで UI を書けます。

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | UI の ID |
| `name` | 必須 | 名前（24 文字まで） |
| `slot` | 必須 | 置き場所（下の表） |
| `script` | 必須 | UI のスクリプト（JavaScript）のパス |
| `style` | 任意 | CSS のパス |
| `width` | 任意 | 幅（`dj-zone` のみ。80〜480、初期値 240） |
| `height` | 任意 | 高さ（`dj-zone` と `side-panel`。40〜400、初期値 120） |

| `slot` | 場所 | 操作 |
|---|---|---|
| `dj-zone` | DJ ゾーンの拡張機能の段 | できる |
| `side-panel` | 画面右端のタブで開くパネル | できる |
| `vinyl` | レコードの上（レコードと同じ大きさ） | できない（表示だけ） |
| `overlay` | 画面全体の上 | できない（表示だけ） |

### 6.1 動く環境

- UI は、Player が用意した空のページを入れた iframe の中で動きます。
  - iframe は `sandbox="allow-scripts"` です（出どころは `null`）。
  - 新しいウィンドウ・ページの移動・ダウンロード・フォームは使えません。
  - カメラ・マイク・クリップボード・位置情報なども使えません。
- Player は、パッケージのファイルを iframe に渡してから、`style`、`script` の順に読み込みます。
  - ページの中身は、スクリプトで作成します。
  - 背景は透明です。
- 文字の選択とドラッグ（ブラウザのドラッグ＆ドロップ）は、無効になっています。
  - マウスで引っ張る操作を、そのままポインターのイベントとしてスクリプトに届けるためです。
  - 文字を選択できるようにしたい場合は、CSS で `user-select: text` を指定します。
- UI のページは、Player からの合図に応答し続けなければなりません（MUST）。
  - 3 秒応答しない UI は、Player が取り除いて理由を表示します。
  - 重い処理を続けると、応答できなくなります。
- UI が重い時の Player の画面への影響は、版によって異なります。
  - デスクトップ版では、UI は Player とは別のプロセスで動くため、Player の画面は止まりません。
  - ブラウザ版では、ブラウザによっては同じプロセスで動くため、UI の重い処理で Player の画面も止まります。
- 外部との通信は、`network` の権限で許可した通信先（`https://` のみ）にだけできます。
  - それ以外に読み込めるのは、パッケージのファイル（`kt3.file()`）と `data:` だけです。

### 6.2 `kt3` オブジェクト

UI のスクリプトからは、`window.kt3` を使います。

| 名前 | 内容 |
|---|---|
| `kt3.on(type, fn)` | 情報の受け取りを始めます（6.3） |
| `kt3.off(type, fn)` | 情報の受け取りをやめます |
| `kt3.send(cmd, args)` | Player に操作を依頼します（6.4）。結果を返す Promise を返します |
| `kt3.file(path)` | パッケージのファイルの URL（`img.src` などに使います）。ないファイルは `null` です |
| `kt3.text(path)` | パッケージのテキストファイルの中身 |
| `kt3.info` | `{ id, name, version, slot, permissions }` |

### 6.3 受け取れる情報

| `type` | 届く時 | 中身 |
|---|---|---|
| `track` | 受け取りを始めた時と、曲を読み込んだ時・閉じた時 | `{ title, artist, duration, bpm, beats, stems, loop: { start, end }, lyrics: [{ time, text }], lyrics2 }`。曲がない時は `null` です |
| `frame` | 画面を描くたび（通常は 1 秒に 60 回） | `{ time, playing, rate, pitch, beat, loop, djLoop }`。`beat` は `{ index, phase, inBar, beats, bpm }` です（BPM がない時は `null`）。`loop` は今かかっているループの `{ start, end }` です |
| `spectrum` | 画面を描くたび | `{ freq, wave }`。`freq` は周波数ごとの強さ（`Uint8Array`、1024 個）、`wave` は波形（`Uint8Array`、2048 個）です |
| `effects` | 受け取りを始めた時と、自分のエフェクトが変わった時 | `[{ id, on, slot, values, error }]` |
| `decks` | 画面を描くたび（自分のデッキがある時） | `[{ id, loaded, time, duration, playing, rate, volume, title }]` |
| `midi` | MIDI 機器からメッセージが届いた時（`midi` の権限が必要） | `{ input, data, time }`。`data` はバイトの配列です。SysEx は届きません。受け取りを始めた時と、機器の接続・切断の時は `{ devices }` が届きます（6.6） |

### 6.4 送れる操作

権限がなくても使える操作です。

| `cmd` | `args` | 内容 |
|---|---|---|
| `effect` | `{ effect, on?, slot? }` | 自分のエフェクトの ON・OFF と、差し込む場所の切り替え |
| `param` | `{ effect, param, value }` | 自分のエフェクトのつまみの変更（範囲外の値は範囲に収めます） |
| `storage.get` | `{ key }` | 拡張機能ごとの保存領域からの読み込み |
| `storage.set` | `{ key, value }` | 保存領域への書き込み（`null` で削除します）。拡張機能ごとに合計 256 KB までです |

`control` の権限が必要な操作です。曲を読み込んでいる時だけ使えます。

| `cmd` | `args` | 内容 |
|---|---|---|
| `play`、`pause` | なし | 再生・一時停止 |
| `seek` | `{ time }` | 移動（秒） |
| `hotcue` | `{ index }` | ホットキュー（0〜7）を押す操作 |
| `loop` | `{ beats }` | ビートループ（0.25・0.5・1・2・4・8・16 拍） |
| `loopExit` | なし | ループの解除 |
| `beatJump` | `{ direction }` | ビートジャンプ（負の値で戻ります） |
| `pitch` | `{ percent }` | ピッチ（今のピッチの範囲に収めます） |
| `fx` | `{ type }` | BEAT FX（`off` `echo` `gate` `reverb` `rvbout` `filtout` `rollout`） |
| `brake`、`spin` | なし | BRAKE・SPIN |
| `stem` | `{ which, volume }` | メインのデッキのボーカル（`vocal`）・インスト（`inst`）の音量（0〜1）。ボーカルとインストに分かれた曲だけで使えます |

`decks` の権限が必要な操作です（6.5）。

| `cmd` | `args` | 内容 |
|---|---|---|
| `deck.create` | なし | デッキを作成し、その番号を返します（1 つの拡張機能につき 3 台まで） |
| `deck.load` | `{ deck, source }` | 音の読み込み。`source` は `pick`（利用者がファイルを選ぶ）・`main`（今の曲全体）・`vocal`・`inst`（今の曲のボーカル・インスト）です。曲の情報 `{ title, artist, bpm, duration, stems }` を返します |
| `deck.play`、`deck.pause` | `{ deck }` | 再生・一時停止 |
| `deck.seek` | `{ deck, time }` | 移動（秒） |
| `deck.rate` | `{ deck, rate, smooth? }` | 再生の速さ（-8〜8）。`smooth: true` の場合は、速さをなめらかに変え、スクラッチ用の補間を使います（聞こえる範囲を超える音を、折り返さずに取り除きます） |
| `deck.loop` | `{ deck, start, end }` または `{ deck, off: true }` | ループ（1 サンプル単位で、つなぎ目は連続します） |
| `deck.volume` | `{ deck, value }` | 音量（0〜2） |
| `deck.destroy` | `{ deck }` | デッキの削除 |

`midi` の権限が必要な操作です（6.6）。

| `cmd` | `args` | 内容 |
|---|---|---|
| `midi.devices` | なし | `{ inputs, outputs }` を返します。それぞれ `[{ id, name, manufacturer, state }]` です |
| `midi.send` | `{ output, data }` | MIDI 機器への送信。`data` に使えるのは、チャンネルメッセージ（1〜3 バイト、先頭が 0x80〜0xEF）だけです |

- 操作は、1 つの UI につき 1 秒に 120 回までです。
  - 超えた分は失敗します。
- 失敗した操作の Promise は、理由を入れた Error で拒否されます。

### 6.5 デッキ

- デッキは、Player のメインのデッキと同じ再生処理を使います。
  - 音は、全体の差し込み口（`master`、5.1）の手前に入ります。
  - Player の EQ・フィルター・BEAT FX・BASS BOOST は通りません。
- `pick` では、Player がファイル選択の画面を表示します。
  - 利用者が選んだ `.kt3` / `.kt4` の音声だけをデッキに読み込み、拡張機能にはファイルの場所も中身も渡しません。
  - ファイル選択の画面は、UI が操作された直後にしか表示できません。
  - 利用者が選ばなかった場合は、`cancelled` で失敗します。
- `vocal`・`inst`・`main` は、今の曲と同じ音声を使います（コピーしません）。
- 拡張機能を無効にした時や削除した時は、そのデッキも削除されます。

### 6.6 MIDI

- UI は Web MIDI を直接使えません。
  - Player が MIDI 機器に接続し、メッセージを受け渡します。
- Player は、`midi` の権限を持つ UI が `midi` の受け取りを始めた時に、初めて MIDI 機器に接続します。
- SysEx は、受け取りも送信もできません。
- ブラウザ版では、ブラウザが MIDI の利用の許可を求めることがあります。

## 7. テーマ

`theme` に CSS ファイルを 1 つ指定します。

```json
"theme": { "style": "theme.css" }
```

- CSS は、Player の画面にそのまま加わります。
  - Player の要素の ID や class は、Player の版が変わると変わることがあります。
- 設定の Color などで利用者が選んだ色を、テーマで変えるには `!important` が必要です。
  - これらの色は、Player が要素に直接指定しているためです。
- `url()` で指せるのは、パッケージのファイル（相対パス）だけです。
  - 画像やフォント（`@font-face`）に使えます。
- 次のものを含む CSS は読み込まれません。
  - 外部の URL、`@import`、`@namespace`、`image-set()`、バックスラッシュ（`\`）、閉じていないコメントです。
- CSS は 200 KB までです。
- 次の画面を表示している間は、Player がテーマを停止します。
  - 対象は、導入・更新の確認画面、削除などの確認、Extensions の管理画面、設定画面です。
  - これらの画面は、テーマに関係なく Player 本来の見た目で表示されます。

## 8. 拡張機能ができないこと

- PC のファイルの読み書き
  - 曲は、利用者が Player で選んだものだけを受け取ります。
- Player の画面や設定の書き換え
- 許可されていない通信
- 新しいウィンドウの表示、ダウンロード、ページの移動
- 他の拡張機能の導入・削除
- カメラ・マイク・クリップボード・位置情報の利用

## 9. 導入と管理（Player の動作）

- 導入の方法は、次の 3 つです。
  - `.kt3x` のダブルクリック（デスクトップ版）
  - レコードへのドラッグ＆ドロップ
  - 設定画面の「Extensions」→「Install from file」
- 導入の前に、名前・作者・版・ID・説明・権限・中身（エフェクトと UI の数）を表示し、利用者の確認を得ます。
  - 作者が確認されていないことも表示します。
- 同じ `id` の新しい版は、更新として扱います。
  - 更新で新しく増える権限を示します。
  - 古い版や同じ版は、再インストールとして扱います。
- 導入した拡張機能は、Player の中の保存領域に置きます（PC のフォルダには展開しません）。
- 有効・無効の切り替えと削除は、設定画面の「Extensions」で行います。
  - 削除すると、その拡張機能の保存領域（6.4）も削除されます。
- 処理がエラーで止まったエフェクトは、Player が OFF にします。
- 重すぎるエフェクトと、応答しなくなった UI は、Player が停止して理由を表示します（5.4、6.1）。
- 設定の「Start without extensions」をオンにすると、次の起動からすべての拡張機能を停止します。
- 拡張機能の読み込み中に Player が正常に起動しなかった場合は、次の起動時に、拡張機能を停止するかどうかを確認します。
- 設定の「Extension developer mode」をオンにすると、「Extensions」→「Load folder」でフォルダから読み込めます。
  - フォルダから読み込んだ拡張機能は保存されません。
  - 「Reload」で再読み込みできます。
