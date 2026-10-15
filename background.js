importScripts('core.js', 'inject.js');

const { ENCODINGS, CONVERSIONS, overrideRule } = CharacterCore;

const ENCODING_PREFIX = 'encoding:';
const DEFAULT_ENCODING = 'default';

const stateKey = (tabId) => `tab:${tabId}`;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'encoding', title: 'Text encoding', contexts: ['page'] });
  const items = [{ id: DEFAULT_ENCODING, title: 'Page default' }, ...ENCODINGS];
  for (const { id, title } of items) {
    chrome.contextMenus.create({ id: ENCODING_PREFIX + id, parentId: 'encoding', title, type: 'radio', contexts: ['page'] });
  }
  for (const { id, title } of CONVERSIONS) {
    chrome.contextMenus.create({ id, title, contexts: ['editable'] });
  }
});

async function loadOverride(tabId) {
  const key = stateKey(tabId);
  return (await chrome.storage.session.get(key))[key] ?? null;
}

async function clearOverride(tabId) {
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] });
  await chrome.storage.session.remove(stateKey(tabId));
}

function readDocument(tabId) {
  return chrome.scripting
    .executeScript({ target: { tabId }, func: () => ({ contentType: document.contentType, characterSet: document.characterSet }) })
    .then(([injection]) => injection?.result ?? null, () => null);
}

// While an override is in effect the page reports the overridden charset, so the default is only known from before the override.
async function pageDefault(tab, override) {
  if (override) return override.url === tab.url ? override.defaultCharset : null;
  return (await readDocument(tab.id))?.characterSet ?? null;
}

let syncCount = 0;

// Menu items have no per-tab state, so the checked item and the default label follow the active tab.
async function syncMenu(tabId) {
  const count = ++syncCount;
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return;
  const override = await loadOverride(tabId);
  const defaultCharset = await pageDefault(tab, override);
  if (count !== syncCount) return;
  const title = defaultCharset ? `Page default (${defaultCharset})` : 'Page default';
  await chrome.contextMenus.update(ENCODING_PREFIX + DEFAULT_ENCODING, { title }).catch(() => {});
  await chrome.contextMenus.update(ENCODING_PREFIX + (override?.charset ?? DEFAULT_ENCODING), { checked: true }).catch(() => {});
}

function originOf(url) {
  try {
    const { protocol, origin } = new URL(url);
    return /^https?:$/.test(protocol) ? origin : null;
  } catch {
    return null;
  }
}

async function setEncoding(tab, charset) {
  if (charset === DEFAULT_ENCODING) {
    await clearOverride(tab.id);
    await chrome.tabs.reload(tab.id);
    return;
  }
  const origin = originOf(tab.url);
  const page = await readDocument(tab.id);
  if (!origin || !page) {
    await syncMenu(tab.id);
    return;
  }
  const defaultCharset = await pageDefault(tab, await loadOverride(tab.id));
  // Keeping the page's own MIME type stops a text/plain page from being rendered as HTML.
  const override = { origin, mime: page.contentType, charset, url: tab.url, defaultCharset };
  await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tab.id], addRules: [overrideRule({ tabId: tab.id, ...override })] });
  await chrome.storage.session.set({ [stateKey(tab.id)]: override });
  await chrome.tabs.reload(tab.id);
}

function convertField(tabId, frameId, conversionId) {
  const target = { tabId, frameIds: [frameId] };
  return chrome.scripting
    .executeScript({ target, files: ['core.js'] })
    .then(() => chrome.scripting.executeScript({ target, func: convertActiveField, args: [conversionId] }));
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || tab.id < 0) return;
  const id = String(info.menuItemId);
  if (id.startsWith(ENCODING_PREFIX)) {
    setEncoding(tab, id.slice(ENCODING_PREFIX.length)).catch((e) => console.warn('Character Utils: encoding override failed', e));
  } else if (CONVERSIONS.some((conversion) => conversion.id === id)) {
    convertField(tab.id, info.frameId ?? 0, id).catch((e) => console.warn('Character Utils: conversion failed', e));
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const override = await loadOverride(tabId);
    if (override && originOf(changeInfo.url) !== override.origin) await clearOverride(tabId);
  }
  // The charset of a page is settled once it has loaded.
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) await syncMenu(tabId);
});

chrome.tabs.onActivated.addListener(({ tabId }) => syncMenu(tabId));

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab) await syncMenu(tab.id);
});

chrome.tabs.onRemoved.addListener((tabId) => clearOverride(tabId));
