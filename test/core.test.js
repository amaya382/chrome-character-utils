const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('toFullwidth converts ASCII and spaces', () => {
  assert.equal(core.toFullwidth('Hello, World! 123 ~'), 'Ｈｅｌｌｏ，　Ｗｏｒｌｄ！　１２３　～');
});

test('toHalfwidth converts fullwidth ASCII and ideographic spaces', () => {
  assert.equal(core.toHalfwidth('Ｈｅｌｌｏ，　Ｗｏｒｌｄ！　１２３　～'), 'Hello, World! 123 ~');
});

test('toFullwidth combines voiced marks into katakana', () => {
  assert.equal(core.toFullwidth('ｶﾞｷﾞｸﾞ ﾊﾟﾋﾟ ｳﾞ ﾜﾞ ｦﾞ'), 'ガギグ　パピ　ヴ　ヷ　ヺ');
  assert.equal(core.toFullwidth('｢ｱｲｳｴｵ｣､ｰ｡'), '「アイウエオ」、ー。');
});

test('toFullwidth keeps marks that cannot combine as standalone marks', () => {
  assert.equal(core.toFullwidth('ｱﾞﾟ'), 'ア゛゜');
  assert.equal(core.toFullwidth('ﾞ'), '゛');
});

test('toHalfwidth splits voiced katakana into a base and a mark', () => {
  assert.equal(core.toHalfwidth('ガギグ　パピ　ヴ　ヷ　ヺ'), 'ｶﾞｷﾞｸﾞ ﾊﾟﾋﾟ ｳﾞ ﾜﾞ ｦﾞ');
  assert.equal(core.toHalfwidth('「アイウエオ」、ー。゛゜'), '｢ｱｲｳｴｵ｣､ｰ｡ﾞﾟ');
});

test('characters without a counterpart stay unchanged', () => {
  const text = 'ひらがな漢字ヵヶヮ€é😀';
  assert.equal(core.toFullwidth(text), text);
  assert.equal(core.toHalfwidth(text), text);
});

test('every halfwidth katakana round-trips', () => {
  const half = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
  assert.equal(core.toHalfwidth(core.toFullwidth(half)), half);
});

test('toHiragana converts fullwidth and halfwidth katakana', () => {
  assert.equal(core.toHiragana('カタカナ ヴァ ヽヾ ｶﾞﾅﾊﾟ'), 'かたかな ゔぁ ゝゞ がなぱ');
  assert.equal(core.toHiragana('ヷヸヹヺー ABC'), 'ヷヸヹヺー ABC');
});

test('toKatakana converts hiragana and widens halfwidth katakana', () => {
  assert.equal(core.toKatakana('ひらがな ゔぁ ゝゞ ｶﾞﾅ'), 'ヒラガナ ヴァ ヽヾ ガナ');
  assert.equal(core.toKatakana('漢字 abc'), '漢字 abc');
});

test('kana conversions round-trip over the whole hiragana block', () => {
  const hiragana = Array.from({ length: 0x3096 - 0x3041 + 1 }, (_, i) => String.fromCodePoint(0x3041 + i)).join('');
  assert.equal(core.toHiragana(core.toKatakana(hiragana)), hiragana);
});

test('case conversions cover fullwidth letters', () => {
  const convert = (id, text) => core.CONVERSIONS.find((c) => c.id === id).convert(text);
  assert.equal(convert('uppercase', 'abc ａｂｃ'), 'ABC ＡＢＣ');
  assert.equal(convert('lowercase', 'ABC ＡＢＣ'), 'abc ａｂｃ');
});

test('overrideRule sets the charset on the main frame of one tab and origin', () => {
  const rule = core.overrideRule({ tabId: 7, origin: 'https://example.co.jp', mime: 'text/plain', charset: 'Shift_JIS' });
  assert.equal(rule.id, 7);
  assert.deepEqual(rule.action.responseHeaders, [{ header: 'content-type', operation: 'set', value: 'text/plain; charset=Shift_JIS' }]);
  assert.deepEqual(rule.condition, {
    tabIds: [7],
    resourceTypes: ['main_frame'],
    regexFilter: '^https://example\\.co\\.jp/',
  });
});

test('contentTypeWith falls back to text/html', () => {
  assert.equal(core.contentTypeWith('', 'EUC-JP'), 'text/html; charset=EUC-JP');
});

test('ENCODINGS are labels TextDecoder accepts', () => {
  for (const { id } of core.ENCODINGS) assert.doesNotThrow(() => new TextDecoder(id), id);
});
