// js/exercise-kit.js
// Small, dependency-free toolkit shared by every chapter module.
// Chapters import only what they need from here — nothing here knows
// about any specific cipher, so it never has to change when a new
// chapter is added.

export function parseHexByte(str) {
  const clean = String(str).trim().replace(/^0x/i, '').replace(/\s/g, '');
  if (!/^[0-9a-fA-F]{1,2}$/.test(clean)) return null;
  return parseInt(clean, 16);
}

export function parseBinaryByte(str) {
  const clean = String(str).trim().replace(/\s/g, '');
  if (!/^[01]{1,8}$/.test(clean)) return null;
  return parseInt(clean, 2);
}

export function parseDecByte(str) {
  const v = parseInt(String(str).trim(), 10);
  return (!isNaN(v) && v >= 0 && v <= 255) ? v : null;
}

export function parseIntLoose(str) {
  const v = parseInt(String(str).trim(), 10);
  return isNaN(v) ? null : v;
}

export function parseTextExact(str) {
  const v = String(str).trim();
  return v.length ? v : null;
}

export const hex   = b => '0x' + b.toString(16).padStart(2, '0').toUpperCase();
export const bin   = b => b.toString(2).padStart(8, '0');
export const ascii = b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '·';

// Case/whitespace-insensitive string compare, used by 'text' exercises.
export function textMatches(raw, expected) {
  return String(raw).trim().toUpperCase() === String(expected).trim().toUpperCase();
}

// Keyword-match, used by free-response exercises (e.g. "explain what happens").
export function keywordMatch(raw, keywords, minLength = 8) {
  const clean = String(raw).trim().toLowerCase();
  return clean.length >= minLength && keywords.some(kw => clean.includes(kw));
}

// Feedback box helpers — operate on any element carrying the
// `.ex-feedback` class produced by the chapter engine.
export function showFeedback(el, correct, message) {
  if (!el) return;
  el.textContent = (correct ? '✓ ' : '✗ ') + message;
  el.className = 'ex-feedback ' + (correct ? 'ok' : 'err');
  el.style.display = 'block';
}

export function clearFeedback(el) {
  if (!el) return;
  el.style.display = 'none';
  el.textContent = '';
}

// A tiny scoped-query helper so chapter `init()` functions never
// have to worry about colliding IDs across chapters — every chapter
// gets its own detached container and queries *within* it.
export function scoped(container) {
  return (sel) => container.querySelector(sel);
}
