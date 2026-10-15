(function (root) {
  // Labels from the WHATWG Encoding Standard, which is what Chrome accepts in a Content-Type charset.
  const ENCODINGS = [
    { id: 'UTF-8', title: 'Unicode (UTF-8)' },
    { id: 'Shift_JIS', title: 'Japanese (Shift_JIS)' },
    { id: 'EUC-JP', title: 'Japanese (EUC-JP)' },
    { id: 'ISO-2022-JP', title: 'Japanese (ISO-2022-JP)' },
    { id: 'GBK', title: 'Chinese Simplified (GBK)' },
    { id: 'gb18030', title: 'Chinese Simplified (gb18030)' },
    { id: 'Big5', title: 'Chinese Traditional (Big5)' },
    { id: 'EUC-KR', title: 'Korean (EUC-KR)' },
    { id: 'windows-1252', title: 'Western (windows-1252)' },
    { id: 'windows-1251', title: 'Cyrillic (windows-1251)' },
    { id: 'KOI8-R', title: 'Cyrillic (KOI8-R)' },
  ];

  const HALF_KANA = '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ';
  const FULL_KANA = '。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜';
  const halfToFull = new Map([...HALF_KANA].map((c, i) => [c, FULL_KANA[i]]));
  const fullToHalf = new Map([...FULL_KANA].map((c, i) => [c, HALF_KANA[i]]));
  // Combining marks, so that NFC/NFD compose and decompose voiced katakana such as ガ and パ.
  const COMBINING = { 'ﾞ': '\u3099', 'ﾟ': '\u309a' };
  const HALF_MARK = { '\u3099': 'ﾞ', '\u309a': 'ﾟ' };

  const FULLWIDTH_OFFSET = 0xfee0;

  // Widens halfwidth katakana before converting each character, so ｶﾞ reaches the converter as ガ.
  function mapChars(text, convert) {
    const chars = [...text];
    let out = '';
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (halfToFull.has(c)) {
        const full = halfToFull.get(c);
        const mark = COMBINING[chars[i + 1]];
        const composed = mark && (full + mark).normalize('NFC');
        if (composed?.length === 1) {
          out += convert(composed);
          i++;
        } else {
          out += convert(full);
        }
      } else {
        out += convert(c);
      }
    }
    return out;
  }

  function toFullwidth(text) {
    return mapChars(text, (c) => {
      const code = c.codePointAt(0);
      if (code === 0x20) return '\u3000';
      if (code >= 0x21 && code <= 0x7e) return String.fromCodePoint(code + FULLWIDTH_OFFSET);
      return c;
    });
  }

  function toHalfwidth(text) {
    let out = '';
    for (const c of text) {
      const code = c.codePointAt(0);
      if (code === 0x3000) {
        out += ' ';
      } else if (code >= 0xff01 && code <= 0xff5e) {
        out += String.fromCodePoint(code - FULLWIDTH_OFFSET);
      } else if (fullToHalf.has(c)) {
        out += fullToHalf.get(c);
      } else {
        const [base, mark, ...rest] = c.normalize('NFD');
        out += fullToHalf.has(base) && HALF_MARK[mark] && rest.length === 0 ? fullToHalf.get(base) + HALF_MARK[mark] : c;
      }
    }
    return out;
  }

  // Covers ぁ-ゖ ↔ ァ-ヶ and the iteration marks ゝゞ ↔ ヽヾ.
  const KANA_OFFSET = 0x60;
  const isHiragana = (code) => (code >= 0x3041 && code <= 0x3096) || code === 0x309d || code === 0x309e;
  const isKatakana = (code) => (code >= 0x30a1 && code <= 0x30f6) || code === 0x30fd || code === 0x30fe;

  function toHiragana(text) {
    return mapChars(text, (c) => {
      const code = c.codePointAt(0);
      return isKatakana(code) ? String.fromCodePoint(code - KANA_OFFSET) : c;
    });
  }

  function toKatakana(text) {
    return mapChars(text, (c) => {
      const code = c.codePointAt(0);
      return isHiragana(code) ? String.fromCodePoint(code + KANA_OFFSET) : c;
    });
  }

  const CONVERSIONS = [
    { id: 'fullwidth', title: 'Convert to fullwidth', convert: toFullwidth },
    { id: 'halfwidth', title: 'Convert to halfwidth', convert: toHalfwidth },
    { id: 'hiragana', title: 'Convert to hiragana', convert: toHiragana },
    { id: 'katakana', title: 'Convert to katakana', convert: toKatakana },
    { id: 'uppercase', title: 'Convert to uppercase', convert: (text) => text.toUpperCase() },
    { id: 'lowercase', title: 'Convert to lowercase', convert: (text) => text.toLowerCase() },
  ];

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function contentTypeWith(mime, charset) {
    return `${mime || 'text/html'}; charset=${charset}`;
  }

  function overrideRule({ tabId, origin, mime, charset }) {
    return {
      id: tabId,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'content-type', operation: 'set', value: contentTypeWith(mime, charset) }],
      },
      condition: {
        tabIds: [tabId],
        resourceTypes: ['main_frame'],
        regexFilter: `^${escapeRegExp(origin)}/`,
      },
    };
  }

  const api = { ENCODINGS, CONVERSIONS, toFullwidth, toHalfwidth, toHiragana, toKatakana, escapeRegExp, contentTypeWith, overrideRule };
  root.CharacterCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
