// Runs in the page's ISOLATED world after core.js through chrome.scripting.executeScript, so it must not reference anything else.
function convertActiveField(conversionId) {
  const { convert } = CharacterCore.CONVERSIONS.find(({ id }) => id === conversionId);

  let el = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  if (!el) return;

  // insertText keeps the undo history and fires the input events that frameworks such as React listen to.
  const insert = (text) => document.execCommand('insertText', false, text);

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    // Inputs such as email and number have no selection API, so their whole value is converted.
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const hasRange = start !== null && start !== end;
    const from = hasRange ? start : 0;
    const to = hasRange ? end : el.value.length;
    const source = el.value.slice(from, to);
    const converted = convert(source);
    if (converted === source) return;
    if (hasRange) el.setSelectionRange(from, to);
    else el.select();
    if (!insert(converted)) {
      if (start === null) el.value = converted;
      else el.setRangeText(converted, from, to, 'select');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: converted }));
    }
    if (start !== null) el.setSelectionRange(from, from + converted.length);
    return;
  }

  if (el.isContentEditable) {
    const selection = el.getRootNode().getSelection?.() ?? document.getSelection();
    if (selection.isCollapsed) selection.selectAllChildren(el);
    const source = selection.toString();
    const converted = convert(source);
    if (converted !== source) insert(converted);
  }
}
