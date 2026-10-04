# KT3 Player 拡張機能（.kt3x）仕様

English: [SPEC.md](SPEC.md)

> 拡張機能は KT3 Player 1.5.0 以降で使えます。
> 「未定」と書いた部分は、実装に合わせて決めます。

この文書は、[KT3 Player](https://github.com/KEITO00/kt3-player) に機能を追加する
拡張機能のファイル形式（`.kt3x`）と、拡張機能から使える機能を説明します。

「しなければならない（MUST）」「すべきである（SHOULD）」「してもよい（MAY）」は
RFC 2119 の意味で使います。

## 1. 全体の構成

拡張機能は、次のものを追加できます。1 つの拡張機能に複数を入れてもかまいません。

| 種類 | 内容 |
|---|---|
| エフェクト | 音にかけるエフェクト。ボーカル・インスト・全体のどこかに差し込む |
| UI | Player の画面に追加する表示や操作部品 |
| テーマ | Player の見た目（色・配置・画像・フォント） |

拡張機能は、デスクトップ版とブラウザ版の両方で動きます。

## 2. ファイル

- `.kt3x` は ZIP ファイルでなければならない（MUST）。圧縮方式は無圧縮（stored）か deflate とする。
- ZIP の最上位に `manifest.json` を置かなければならない（MUST）。
- ZIP 内のパスは `/` で区切る。`..` を含むパス、`/` で始まるパス、ドライブ名を含むパスがあるファイルは、
  導入してはならない（MUST NOT）。
- テキストファイルは UTF-8 とする。
- ファイル名は UTF-8 でなければならない（MUST）。暗号化したファイルと ZIP64 は使えない。
- 上限は、ファイル数 500、1 ファイル 20 MB、`.kt3x` 全体と展開後の合計がそれぞれ 50 MB。
  展開した大きさが ZIP に書かれた大きさと違うファイルがあれば、導入しない。
- `tools/pack.js` で、フォルダから `.kt3x` を作れる（`node tools/pack.js <フォルダ>`）。

## 3. manifest.json

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | 拡張機能の ID。`<作者>.<名前>` の形（例：`keito.second-deck`）。英小文字・数字・`-` と、区切りの `.` 1 つだけを使う |
| `name` | 必須 | 表示名 |
| `version` | 必須 | `x.y.z` の形の版 |
| `author` | 必須 | 作者名 |
| `description` | 必須 | 短い説明 |
| `api` | 必須 | 対応する拡張機能 API の版（整数）。現在の版は `1` |
| `icon` | 任意 | アイコン画像（PNG）のパス |
| `permissions` | 任意 | 使う権限（4 章） |
| `effects` | 任意 | エフェクトの一覧（5 章） |
| `ui` | 任意 | UI の一覧（6 章） |
| `theme` | 任意 | テーマ（7 章） |

Player は、名前・作者・説明などの文字列を、HTML として解釈せずに文字として表示する。

## 4. 権限

権限がなくても、エフェクト・UI・テーマは使える。次の機能は、`permissions` に書き、
導入時に利用者の許可を得た場合だけ使える。

| 権限 | 内容 |
|---|---|
| `control` | Player を操作する（再生・シーク・CUE・ループ・ピッチ・FX など） |
| `decks` | デッキを追加し、音を読み込む |
| `network` | 外部と通信する。通信先のホスト名を列挙する（例：`{"network": ["lyrics.example.com"]}`）。すべてのホストを許す書き方はない |
| `midi` | MIDI 機器を使う。SysEx は使えない |

更新で権限が増える場合、Player は増えた権限を示して、もう一度許可を求める。

## 5. エフェクト

`effects` には、1 つの拡張機能につき 8 個までエフェクトを書ける。

### 5.1 共通の項目

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | エフェクトの ID（英小文字・数字・`-`、32 文字まで） |
| `name` | 必須 | DJ ゾーンに表示する名前（24 文字まで） |
| `kind` | 必須 | `graph` または `processor` |
| `slots` | 任意 | 差し込める場所。`vocal`（ボーカル）・`inst`（インスト）・`master`（全体）から選ぶ。省略時は `["master"]`。最初のものが初期の場所 |
| `params` | 任意 | つまみ（16 個まで） |

- `vocal` と `inst` は、ボーカルとインストに分かれた曲でだけ使える。
- `master` は、Player のすべての処理（EQ・フィルター・BEAT FX・BASS BOOST）の後に入る。
- Player は、エフェクトごとに DJ ゾーンへ操作部品（ON ボタン、差し込む場所の切り替え、つまみ）を作る。
  導入した直後と曲を読み込んだ時は OFF になる。

### 5.2 つまみ

| 項目 | 必須 | 内容 |
|---|---|---|
| `id` | 必須 | つまみの ID |
| `name` | 必須 | 表示名（24 文字まで） |
| `control` | 任意 | `fader`（初期値）・`button`（押している間 1）・`toggle`（押すたびに 0 と 1） |
| `min`、`max` | `fader` で必須 | 値の範囲 |
| `default` | 任意 | 初期値。省略時は `min` |
| `step` | 任意 | 刻み。省略時は連続 |
| `unit` | 任意 | 値の後ろに表示する単位（8 文字まで） |
| `map` | `graph` で必須 | つまみの値をどの部品の値に反映するか（5.3） |

### 5.3 `graph`

Web Audio の標準ノードを組み合わせる。

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

- `nodes`：部品の名前と設定（32 個まで）。名前に `in` と `out` は使えない。

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

- `connect`：`[つなぐ元, つなぐ先]` の一覧（64 個まで）。`in` はエフェクトの入力、`out` は出力。
  つなぐ先を `部品名.値の名前`（例：`"d.delayTime"`）にすると、音で値を揺らせる。
  ループを作る時は、Web Audio の決まりどおり `delay` を間に入れる。
- `oscillator` と `constant` は自動で動き出す。つなげる先は、値・`gain`・`panner`・`waveshaper`・`out` だけ。
- `map`：つまみの値を `min`〜`max` から 0〜1 に直し、`from`〜`to` に当てはめて部品の値にする。

| `curve` | 計算 |
|---|---|
| `linear`（初期値） | `from + (to - from) × x` |
| `exp` | `from × (to / from) ^ x`（`from` と `to` は正） |
| `beats` | `from`〜`to` を拍数として、曲の BPM とピッチから秒に直す。BPM やピッチが変わると追従する |

### 5.4 `processor`

音の処理を AudioWorklet で書く。

| 項目 | 必須 | 内容 |
|---|---|---|
| `module` | 必須 | AudioWorklet のモジュール（JavaScript）のパス |
| `processor` | 必須 | 処理の名前（英小文字・数字・`-`） |

- モジュールは `registerProcessor("<拡張機能の ID>/<processor>", クラス)` で登録しなければならない（MUST）。
  例：ID が `keito.crusher`、`processor` が `crush` なら、`registerProcessor("keito.crusher/crush", ...)`。
  違う名前で登録したエフェクトは読み込まれない。
- 入力と出力は 1 つずつ、出力は 2 チャンネル。
- つまみは、同じ `id` の AudioParam（`parameterDescriptors`）があればその値を変える。なければ
  `port` に `{ "param": id, "value": 値 }` を送る。
- `processorOptions.transport` に、再生の状態を入れた SharedArrayBuffer が渡る。
  `new Float64Array(transport)` で読む。値は、Player の再生処理がブロック（128 サンプル）ごとに、エフェクトより先に書き込む。

| 位置 | 内容 |
|---|---|
| 0 | 今のブロックの終わりのフレーム番号（AudioWorklet の `currentFrame` と同じ数え方） |
| 1 | 曲の再生位置（秒） |
| 2 | 再生の速さ（1 が等速。スクラッチ中は負の値にもなる） |
| 3 | 音が出ている時 1、止まっている時 0 |
| 4 | BPM（わからない時 0） |
| 5 | 最初の拍の位置（秒） |
| 6 | 1 小節の拍数 |

- すべてのエフェクトの処理は、同じ AudioWorklet の中で動く。画面・ファイル・通信には触れないが、
  他のエフェクトの音に影響を与えられないことは保証しない。
- 処理がエラーで止まったエフェクトは、Player が OFF にし、DJ ゾーンにエラーを表示する。
- OFF のエフェクトの処理（`process`）は呼ばれない。
- Player は、エフェクトごとに処理にかかった時間を測る。次の場合、Player がエフェクトを OFF にして理由を表示する。
  - 1 ブロック（128 サンプル）の時間の 40% を超える処理が 3 秒続いた時。
  - エフェクトが ON の間に音が途切れた時（音の処理が実時間より 10% 以上遅れる状態が 2 秒続いた時）。
    いちばん重いエフェクトを OFF にする。
- 処理が終わらなくなり音が 3 秒止まった時は、Player がその拡張機能を無効にし、Player の読み込み直しを促す。
- 処理時間を測るため、Player はモジュールの先頭に 1 行を加えてから読み込む。エラーに出る行番号は 1 つ大きくなる。
  モジュールの中の `registerProcessor` は Player が用意したもので、登録したクラスを包んで時間を測る。

## 6. UI

`ui` には、1 つの拡張機能につき 8 個まで UI を書ける。

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
| `vinyl` | レコードの上に重ねる（レコードと同じ大きさ） | できない（表示だけ） |
| `overlay` | 画面全体に重ねる | できない（表示だけ） |

### 6.1 動く環境

- UI は、Player が用意した空のページを入れた iframe の中で動く。iframe は `sandbox="allow-scripts"`
  （出どころは `null`）で、新しいウィンドウ・ページの移動・ダウンロード・フォームは使えない。
  カメラ・マイク・クリップボード・位置情報なども使えない。
- Player は、パッケージのファイルを iframe に渡してから、`style`、`script` の順に読み込む。
  ページの中身は、スクリプトで作る。背景は透明。
- 文字の選択はできず、ドラッグ（ブラウザのドラッグ＆ドロップ）も始まらない。マウスで引っ張る操作が、
  そのままポインターのイベントとしてスクリプトに届くようにするため。文字を選べるようにしたい時は、
  CSS で `user-select: text` を指定する。
- UI のページは、Player からの合図に応え続けなければならない（MUST）。3 秒応えない UI は、Player が取り除いて理由を表示する。
  重い処理を続けると、応えなくなる。
- デスクトップ版では、UI は Player とは別のプロセスで動き、UI が重くても Player の画面は止まらない。
  ブラウザ版では、ブラウザによっては同じプロセスで動き、UI の重い処理が Player の画面も止める。
- 外部との通信は、`network` の権限で許した通信先（`https://` のみ）にだけできる。それ以外の読み込みは
  パッケージのファイル（`kt3.file()`）と `data:` だけ。

### 6.2 `kt3` オブジェクト

UI のスクリプトからは、`window.kt3` を使う。

| 名前 | 内容 |
|---|---|
| `kt3.on(type, fn)` | 情報を受け取り始める（6.3） |
| `kt3.off(type, fn)` | 受け取るのをやめる |
| `kt3.send(cmd, args)` | Player に操作を頼む（6.4）。結果を返す Promise |
| `kt3.file(path)` | パッケージのファイルの URL（`img.src` などに使う）。ないファイルは `null` |
| `kt3.text(path)` | パッケージのテキストファイルの中身 |
| `kt3.info` | `{ id, name, version, slot, permissions }` |

### 6.3 受け取れる情報

| `type` | 届く時 | 中身 |
|---|---|---|
| `track` | 受け取り始めた時と、曲を読み込んだ・外した時 | `{ title, artist, duration, bpm, beats, stems, loop: { start, end }, lyrics: [{ time, text }], lyrics2 }`。曲がない時は `null` |
| `frame` | 画面を描くたび（通常は 1 秒に 60 回） | `{ time, playing, rate, pitch, beat, loop, djLoop }`。`beat` は `{ index, phase, inBar, beats, bpm }`（BPM がない時は `null`）。`loop` は今かかっているループの `{ start, end }` |
| `spectrum` | 画面を描くたび | `{ freq, wave }`。`freq` は周波数ごとの強さ（`Uint8Array`、1024 個）、`wave` は波形（`Uint8Array`、2048 個） |
| `effects` | 受け取り始めた時と、自分のエフェクトが変わった時 | `[{ id, on, slot, values, error }]` |
| `decks` | 画面を描くたび（自分のデッキがある時） | `[{ id, loaded, time, duration, playing, rate, volume, title }]` |
| `midi` | MIDI 機器からメッセージが届いた時（`midi` の権限が必要） | `{ input, data, time }`。`data` はバイトの配列。SysEx は届かない。受け取り始めた時と機器のつなぎ外しの時は `{ devices }`（6.6） |

### 6.4 送れる操作

権限がなくても使える操作：

| `cmd` | `args` | 内容 |
|---|---|---|
| `effect` | `{ effect, on?, slot? }` | 自分のエフェクトの ON・OFF と差し込む場所 |
| `param` | `{ effect, param, value }` | 自分のエフェクトのつまみ（範囲外の値は範囲に収める） |
| `storage.get` | `{ key }` | 拡張機能ごとの保存領域から読む |
| `storage.set` | `{ key, value }` | 保存領域に書く（`null` で消す）。拡張機能ごとに合計 256 KB まで |

`control` の権限が必要な操作（曲を読み込んでいる時だけ）：

| `cmd` | `args` | 内容 |
|---|---|---|
| `play`、`pause` | なし | 再生・一時停止 |
| `seek` | `{ time }` | 移動（秒） |
| `hotcue` | `{ index }` | ホットキュー（0〜7）を押す |
| `loop` | `{ beats }` | ビートループ（0.25・0.5・1・2・4・8・16 拍） |
| `loopExit` | なし | ループを抜ける |
| `beatJump` | `{ direction }` | ビートジャンプ（負の値で戻る） |
| `pitch` | `{ percent }` | ピッチ（今のピッチの範囲に収める） |
| `fx` | `{ type }` | BEAT FX（`off` `echo` `gate` `reverb` `rvbout` `filtout` `rollout`） |
| `brake`、`spin` | なし | BRAKE・SPIN |
| `stem` | `{ which, volume }` | メインのデッキのボーカル（`vocal`）・インスト（`inst`）の音量（0〜1）。ボーカルとインストに分かれた曲だけ |

`decks` の権限が必要な操作（6.5）：

| `cmd` | `args` | 内容 |
|---|---|---|
| `deck.create` | なし | デッキを作り、その番号を返す（1 つの拡張機能につき 3 台まで） |
| `deck.load` | `{ deck, source }` | 音を載せる。`source` は `pick`（利用者がファイルを選ぶ）・`main`（今の曲全体）・`vocal`・`inst`（今の曲のボーカル・インスト）。曲の情報 `{ title, artist, bpm, duration, stems }` を返す |
| `deck.play`、`deck.pause` | `{ deck }` | 再生・一時停止 |
| `deck.seek` | `{ deck, time }` | 移動（秒） |
| `deck.rate` | `{ deck, rate, smooth? }` | 再生の速さ（-8〜8）。`smooth: true` で、なめらかに変え、スクラッチ用の補間を使う（聞こえる範囲を超える音を、折り返さずに取り除く） |
| `deck.loop` | `{ deck, start, end }` または `{ deck, off: true }` | ループ（1 サンプル単位、つなぎ目は連続） |
| `deck.volume` | `{ deck, value }` | 音量（0〜2） |
| `deck.destroy` | `{ deck }` | デッキを消す |

`midi` の権限が必要な操作（6.6）：

| `cmd` | `args` | 内容 |
|---|---|---|
| `midi.devices` | なし | `{ inputs, outputs }`。それぞれ `[{ id, name, manufacturer, state }]` |
| `midi.send` | `{ output, data }` | MIDI 機器へ送る。`data` はチャンネルメッセージ（1〜3 バイト、先頭が 0x80〜0xEF）だけ |

- 操作は 1 つの UI につき 1 秒に 120 回まで。超えた分は失敗する。
- 失敗した操作の Promise は、理由を入れた Error で拒否される。

### 6.5 デッキ

- デッキは、Player のメインのデッキと同じ再生処理を使う。音は、全体の差し込み口（`master`、5.1）の手前に入る。
  Player の EQ・フィルター・BEAT FX・BASS BOOST は通らない。
- `pick` では、Player がファイル選択の画面を出す。利用者が選んだ `.kt3` / `.kt4` の音声だけをデッキに載せ、
  拡張機能にはファイルの場所も中身も渡さない。ファイル選択の画面は、UI が操作された直後にしか出せない。
  選ばなかった時は `cancelled` で失敗する。
- `vocal`・`inst`・`main` は、今の曲と同じ音声を使う（コピーしない）。
- 拡張機能を無効にした時や削除した時、そのデッキも消える。

### 6.6 MIDI

- UI は Web MIDI を直接使えない。Player が MIDI 機器とつながり、メッセージを受け渡す。
- Player は、`midi` の権限を持つ UI が `midi` を受け取り始めた時に、初めて MIDI 機器とつながる。
- SysEx は受け取れず、送れない。
- ブラウザ版では、ブラウザが MIDI の利用を許可するか尋ねることがある。

## 7. テーマ

`theme` に CSS ファイルを 1 つ指定する。

```json
"theme": { "style": "theme.css" }
```

- CSS は Player の画面にそのまま加わる。Player の要素の ID や class は、Player の版が変わると変わることがある。
- 設定の Color などで利用者が選んだ色は、Player が直接指定している。テーマで変える時は `!important` が必要。
- `url()` は、パッケージのファイル（相対パス）だけを指せる。画像やフォント（`@font-face`）に使える。
- 次のものを含む CSS は読み込まれない：外部の URL、`@import`、`@namespace`、`image-set()`、バックスラッシュ（`\`）、閉じていないコメント。CSS は 200 KB まで。
- 導入・更新の確認画面、削除などの確認、Extensions の管理画面、設定画面を表示している間は、Player がテーマを止める。
  これらの画面は、テーマに関係なく Player 本来の見た目で表示される。

## 8. 拡張機能ができないこと

- PC のファイルを読み書きすること（曲は、利用者が Player で選んだものだけを受け取る）
- Player の画面や設定を書き換えること
- 許可されていない通信
- 新しいウィンドウを開くこと、ダウンロードをさせること、ページを移動させること
- 他の拡張機能の導入・削除
- カメラ・マイク・クリップボード・位置情報を使うこと

## 9. 導入と管理（Player の動作）

- 導入の方法は、`.kt3x` のダブルクリック（デスクトップ版）、レコードへのドラッグ＆ドロップ、
  設定画面の「Extensions」→「Install from file」。
- 導入の前に、名前・作者・版・ID・説明・権限・中身（エフェクトと UI の数）を表示し、利用者の確認を得る。
  作者は確認されていないことも表示する。
- 同じ `id` の新しい版は更新として扱い、新しく増える権限を示す。古い版や同じ版は入れ直しとして扱う。
- 導入した拡張機能は、Player の中の保存領域に置く（PC のフォルダには展開しない）。
- 有効・無効の切り替えと削除は、設定画面の「Extensions」で行う。削除すると、その拡張機能の保存領域（6.4）も消える。
- 処理がエラーで止まったエフェクトは、Player が OFF にする。
- 重すぎるエフェクトと、応えなくなった UI は、Player が止めて理由を表示する（5.4、6.1）。
- 設定の「Start without extensions」をオンにすると、次の起動からすべての拡張機能を止める。
  拡張機能の読み込み中に Player が正常に起動しなかった場合は、次の起動時に止めるかどうかを尋ねる。
- 設定の「Extension developer mode」をオンにすると、「Extensions」→「Load folder」でフォルダから読み込める。
  フォルダから読み込んだ拡張機能は保存されず、「Reload」で読み直せる。
