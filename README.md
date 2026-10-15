<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">🔤 Character Utils Chrome Extension</h1>

<p align="center"><strong>A right-click cure for Japanese text troubles.</strong></p>

Character Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## ✨ Features

- **Text encoding override** — pick the encoding of a page from the right-click menu, which Chrome itself no longer offers, so a page that declares the wrong charset, or none, can be read without saving and reopening it. Only the charset of the `Content-Type` header changes, so a plain text file stays plain text, and the override stays with the tab while it browses the same site
- **Fullwidth / halfwidth conversion** — convert letters, digits, symbols, spaces, and katakana in a text field between fullwidth and halfwidth, joining and splitting voiced katakana such as `ｶﾞ` ↔ `ガ` correctly
- **Hiragana / katakana conversion** — swap hiragana and katakana in a text field, including halfwidth katakana
- **Uppercase / lowercase conversion** — change the case of letters in a text field, fullwidth letters and other scripts such as Greek included
- **Edits like typing** — conversions go through the browser's text insertion, so Ctrl+Z undoes them and pages built with frameworks such as React see the new value

## 🚀 Quick Start

**Requirements:** desktop Chrome.

1. Clone this repository

   ```bash
   git clone https://github.com/amaya382/chrome-character-utils.git
   ```

2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the cloned directory

Right-click an empty part of any page and choose "Text encoding" > "Japanese (Shift_JIS)". The page reloads, and a page written in UTF-8 turns into garbled text. Choose "Page default" to return to the page's own encoding.

To update, run `git pull` and click the reload button on the extension's card in `chrome://extensions/`.

## 🔒 Permissions

- `contextMenus` — add the items to the right-click menu
- `declarativeNetRequestWithHostAccess` — rewrite the `Content-Type` header of the page
- `scripting` — read the page's type and convert text in fields
- `storage` — remember each tab's override while the browser runs
- Access to all sites — override the encoding and convert text on every page

## 🔧 Troubleshooting

### The encoding does not change

A page that starts with a byte order mark (BOM) is always decoded by the encoding the BOM names, and Chrome ignores the header for it. Chrome also does not run extensions on `file://` pages, `chrome://` pages, or the Chrome Web Store.

### Chrome asks to resend a form

The override reloads the page. A page that shows the result of a submitted form asks before sending the form again.

### Formatting is lost after converting an editable region

In a `contenteditable` region, the converted text replaces the selection as plain text, so bold, links, and line structure inside the selection are lost. Select a smaller range to keep the rest.

## 🧪 Development

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.
