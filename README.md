<p align="right"><strong>English</strong> / <a href="README_ja.md">日本語</a></p>

<h1 align="center">🔤 Character Utils</h1>

<p align="center">
  <strong>Override the text encoding of a page and convert the text in input fields in Chrome.</strong><br/>
  Both are on the right-click menu.
</p>

Character Utils is a Manifest V3 Chrome extension written in plain JavaScript. There is no build step: the repository directory is the extension.

## Why Character Utils?

- **Brings back the encoding menu** — Chrome no longer lets users pick the encoding of a page. Character Utils adds that choice to the right-click menu, so a page that declares the wrong charset, or none, can be read without saving and reopening it
- **Keeps the page's type** — the override replaces only the charset of the `Content-Type` header, so a plain text file stays plain text
- **Edits like typing** — conversion goes through the browser's text insertion, so Ctrl+Z undoes it and pages built with frameworks such as React see the new value

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

## 📖 Usage

### Text encoding

Right-click a part of the page that is not a link, an image, or a text field, and open "Text encoding". Choosing an encoding reloads the tab and decodes the page with that encoding. The extension does this by setting the charset in the `Content-Type` response header of the page, which takes priority over the `<meta charset>` of the HTML.

The override belongs to the tab. It stays while the tab moves between pages of the same origin, such as `https://example.com`, and ends when the tab moves to another origin or is closed. Other tabs, and frames inside the page, keep their own encodings.

The checked item in the menu shows the override of the active tab. "Page default" removes the override and reloads the tab, and its label shows the encoding the page uses without an override, such as "Page default (Shift_JIS)". While an override is in effect, the label shows the encoding recorded just before the override, and only on the page where the override was chosen; after the tab moves to another page, the label is plain "Page default", because the page then reports the overridden encoding.

The menu offers UTF-8, Shift_JIS, EUC-JP, ISO-2022-JP, GBK, gb18030, Big5, EUC-KR, windows-1252, windows-1251, and KOI8-R.

### Text conversion

Right-click a text field and choose one of the items under "Character Utils": "Convert to fullwidth", "Convert to halfwidth", "Convert to hiragana", "Convert to katakana", "Convert to uppercase", or "Convert to lowercase". When text is selected in the field, only the selection is converted; otherwise the whole field is. This works on `<input>`, `<textarea>`, and editable regions (`contenteditable`), including those inside frames.

| Characters | Halfwidth | Fullwidth |
| --- | --- | --- |
| Letters, digits, and symbols | `A1!~` | `Ａ１！～` |
| Space | ` ` | `　` (U+3000) |
| Katakana and Japanese punctuation | `ｱｶﾞﾊﾟ｢｣ｰ` | `アガパ「」ー` |

A halfwidth katakana followed by `ﾞ` or `ﾟ` becomes one fullwidth character, such as `ｶﾞ` → `ガ`, and converting to halfwidth splits it again. A mark that cannot combine with the character before it becomes `゛` or `゜`. Characters without a counterpart, such as hiragana, kanji, and `ヵ`, stay as they are.

Converting to hiragana or katakana swaps the two kana sets, such as `カタカナ` ↔ `かたかな` and `ヽヾ` ↔ `ゝゞ`. Halfwidth katakana are first made fullwidth, so `ｶﾞﾅ` becomes `がな` or `ガナ`. Katakana without a hiragana form, such as `ヷ` and `ー`, stay as they are.

Converting to uppercase or lowercase follows the case rules of Unicode, so fullwidth letters such as `ａ` and letters of other scripts such as Greek change too.

Ctrl+Z undoes a conversion.

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

| File | Role |
| --- | --- |
| `manifest.json` | Extension manifest |
| `core.js` | Character conversion and header rules. Shared by the background, the injected script, and the tests |
| `background.js` | Builds the right-click menu, sets header rules, and tracks the override of each tab |
| `inject.js` | The function injected into pages to convert the focused field |
| `icons/` | Extension icons |
| `test/` | Unit tests for `core.js` |

Run the tests with Node.js 18 or later:

```bash
node --test
```

After editing, click the reload button on the extension's card in `chrome://extensions/`, then reload the page you test on.

## 📄 License

[MIT](LICENSE)
