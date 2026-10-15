<p align="right"><a href="README.md">English</a> / <strong>日本語</strong></p>

<h1 align="center">🔤 Character Utils Chrome Extension</h1>

<p align="center"><strong>日本語テキストの困りごとを右クリックで解決</strong></p>

Character Utils は plain JavaScript で書いた Manifest V3 の Chrome 拡張機能である。ビルドは不要で、リポジトリのディレクトリがそのまま拡張機能になる。

## ✨ Features

- **文字コードの上書き** — chrome 本体では選べなくなったページの文字コードを右クリックメニューから選べるので、charset の宣言が間違っているページや宣言のないページも、保存して開き直さずに読める。書き換えるのは `Content-Type` ヘッダーの charset だけなので、テキストファイルはテキストファイルのまま表示され、上書きは同じサイトを見ている間タブに残る�
- **全角・半角の変換** — 入力欄の英字、数字、記号、スペース、カタカナを全角と半角の間で変換する。`ｶﾞ` ↔ `ガ` のような濁点付きのカタカナも正しくまとめたり分けたりする�
- **ひらがな・カタカナの変換** — 入力欄のひらがなとカタカナを入れ替える。半角カタカナにも対応する�
- **大文字・小文字の変換** — 入力欄の英字の大文字と小文字を変換する。全角の英字やギリシャ文字など他の文字体系の文字も対象になる�
- **入力と同じように書き換える** — 変換はブラウザーの文字入力の仕組みを通すので、Ctrl+Z で元に戻せ、React などのフレームワークで作られたページにも新しい値が伝わる�

## 🚀 Quick Start

**前提**：デスクトップ版の Chrome

1. このリポジトリを clone する

   ```bash
   git clone https://github.com/amaya382/chrome-character-utils.git
   ```

2. `chrome://extensions/` を開く
3. 「デベロッパー モード」をオンにする
4. 「パッケージ化されていない拡張機能を読み込む」を押し、clone したディレクトリを選ぶ

適当なページの何もないところを右クリックし、「Text encoding」>「Japanese (Shift_JIS)」を選ぶ。ページが再読み込みされ、UTF-8 で書かれたページなら文字化けする。「Page default」を選ぶとページ本来の文字コードに戻る。

更新するときは `git pull` を実行し、`chrome://extensions/` で拡張機能のカードにある再読み込みボタンを押す。

## 🔒 Permissions

- `contextMenus`：右クリックメニューに項目を追加する
- `declarativeNetRequestWithHostAccess`：ページの `Content-Type` ヘッダーを書き換える
- `scripting`：ページの種類を読み取り、入力欄の文字を変換する
- `storage`：ブラウザーの起動中、タブごとの上書き状態を覚えておく
- すべてのサイトへのアクセス：どのページでも文字コードの上書きと変換をできるようにする

## 🔧 Troubleshooting

### 文字コードが変わらない

先頭に byte order mark (BOM) があるページは、BOM が示す文字コードで必ず解釈され、ヘッダーの指定は無視される。また Chrome は `file://` と `chrome://` のページ、Chrome ウェブストアでは拡張機能を動かさない。

### フォームの再送信を確認される

上書きはページを再読み込みする。フォーム送信の結果を表示しているページでは、再送信してよいかを Chrome が確認する。

### 編集可能領域で変換すると書式が消える

`contenteditable` の領域では、変換後の文字列がプレーンテキストとして選択範囲を置き換えるため、範囲内の太字、リンク、行の構造が失われる。残したい部分を避けて範囲を選ぶ。

## 🧪 Development

テストは Node.js 18 以降で実行する。

```bash
node --test
```

編集後は `chrome://extensions/` で拡張機能のカードにある再読み込みボタンを押し、確認に使うページも再読み込みする。
