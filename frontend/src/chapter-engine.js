// js/chapter-engine.js
//
// Generic renderer + router for "chapters" (guided exercises).
// A chapter is a plain data object (see chapters/_template.js) describing
// a list of content BLOCKS. This engine knows how to turn that data into
// the same DOM/CSS structure the hand-written pages used to have, and
// wires up the interactive bits generically so individual chapter files
// stay pure data + small callbacks — no DOM bootstrapping boilerplate.
//
// Supported block kinds: 'text', 'formula', 'table', 'tablesRow',
// 'custom', 'exerciseGroup'. See chapters/_template.js for the schema
// of each.

import {
  parseBinaryByte, parseHexByte, parseIntLoose, parseTextExact,
  showFeedback, clearFeedback,
} from './exercise-kit.js';

const DEFAULT_PARSERS = {
  binary: parseBinaryByte,
  hex: parseHexByte,
  number: parseIntLoose,
  text: parseTextExact,
  mc: (v) => (v ? v : null),
};

function el(html) { 
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  return wrap.firstElementChild;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ── Block renderers ──────────────────────────────────────────────────────
// Each returns an HTML string. They only need to agree with style.css's
// existing class names (ex-section, ex-h2, ex-table, etc.) — no new CSS
// is introduced by the engine itself.

function renderTextBlock(b) {
  const H = b.heading === 'h3' ? 'h3' : 'h2';
  const hcls = b.heading === 'h3' ? 'ex-h3' : 'ex-h2';
  const title = b.title ? `<${H} class="${hcls}">${b.title}</${H}>` : '';
  return `<section class="ex-section">${title}${b.html}</section>`;
}

function renderFormulaBlock(b) {
  const title = b.title ? `<h3 class="ex-h3">${b.title}</h3>` : '';
  const lines = b.lines.map(l => `<div class="ex-formula">${l}</div>`).join('');
  const note = b.note ? `<div class="ex-formula-note">${b.note}</div>` : '';
  return `<section class="ex-section">${title}<div class="ex-formula-block">${lines}${note}</div></section>`;
}

function renderTable(t) {
  const head = `<tr>${t.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
  const body = t.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div><div class="ex-table-label">${t.label}</div>
    <table class="ex-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function renderTableBlock(b) {
  const title = b.title ? `<h3 class="ex-h3">${b.title}</h3>` : '';
  const desc = b.desc ? `<p class="ex-p">${b.desc}</p>` : '';
  return `<section class="ex-section">${title}${desc}<div class="ex-table-wrap">${renderTable(b)}</div></section>`;
}

function renderTablesRowBlock(b) {
  const title = b.title ? `<h3 class="ex-h3">${b.title}</h3>` : '';
  const desc = b.desc ? `<p class="ex-p">${b.desc}</p>` : '';
  const tables = b.tables.map(renderTable).join('');
  return `<section class="ex-section">${title}${desc}<div class="ex-tables-row">${tables}</div></section>`;
}

function renderCustomBlock(b) {
  const title = b.title ? `<h3 class="ex-h3">${b.title}</h3>` : '';
  const desc = b.desc ? `<p class="ex-p">${b.desc}</p>` : '';
  return `<section class="ex-section">${title}${desc}${b.html}</section>`;
}

function renderExerciseItem(chapter, blockIdx, item, idx) {
  const uid = `${chapter.id}-b${blockIdx}-e${idx}`;
  const dataRows = item.dataRows
    ? `<div class="ex-data-block">${item.dataRows.map(r =>
        `<div class="ex-data-row"><span>${r.label}</span><span class="accent"${r.id ? ` id="${uid}-${r.id}"` : ''}>${r.value ?? '—'}</span></div>`
      ).join('')}</div>`
    : '';
  const hint = item.hint ? `<p class="ex-p hint">${item.hint}</p>` : '';

  let inputHtml;
  if (item.input.type === 'mc') {
    inputHtml = `<div class="ex-radio-group" id="${uid}-group">
      ${item.input.options.map((o, i) => `
        <label class="ex-radio">
          <input type="radio" name="${uid}" value="${esc(o.value)}" />
          <span>${o.label}</span>
        </label>`).join('')}
      </div>
      <button id="${uid}-btn" class="ex-btn">Check</button>`;
  } else {
    const cls = item.input.type === 'text' ? 'ex-text-input' : 'ex-hex-input';
    const widthStyle = item.input.width ? ` style="width:${item.input.width}"` : '';
    inputHtml = `<div class="ex-input-row">
      <span class="ex-input-label">${item.inputLabel || 'Answer ='}</span>
      <input id="${uid}-input" class="${cls}" type="text" placeholder="${item.input.placeholder || ''}" maxlength="${item.input.maxlength || 32}"${widthStyle} />
      <button id="${uid}-btn" class="ex-btn">Check</button>
    </div>`;
  }

  return `<div class="ex-exercise">
    <div class="ex-ex-num">${item.num}</div>
    <div class="ex-ex-body">
      <div class="ex-ex-title">${item.title}</div>
      ${item.bodyHtml || ''}
      ${hint}
      ${dataRows}
      ${inputHtml}
      <div id="${uid}-fb" class="ex-feedback" style="display:none"></div>
    </div>
  </div>`;
}

function renderExerciseGroupBlock(chapter, blockIdx, b) {
  const items = b.items.map((item, idx) => renderExerciseItem(chapter, blockIdx, item, idx)).join('');
  return `<section class="ex-section ex-exercises-block">
    <h3 class="ex-h3">${b.title}</h3>
    ${items}
  </section>`;
}

// ── Wiring (event listeners) for exercise groups ────────────────────────

function wireExerciseGroup(container, chapter, blockIdx, b, kit) {
  b.items.forEach((item, idx) => {
    const uid = `${chapter.id}-b${blockIdx}-e${idx}`;
    const fb = container.querySelector(`#${uid}-fb`);
    const btn = container.querySelector(`#${uid}-btn`);
    const getRaw = () => {
      if (item.input.type === 'mc') {
        const checked = container.querySelector(`input[name="${uid}"]:checked`);
        return checked ? checked.value : null;
      }
      return container.querySelector(`#${uid}-input`).value;
    };
    const parse = item.parse || DEFAULT_PARSERS[item.input.type] || (v => v);

    btn.addEventListener('click', () => {
      const raw = getRaw();
      if (raw === null || raw === '') {
        showFeedback(fb, false, item.invalidMessage || 'Enter an answer first.');
        return;
      }
      const parsed = parse(raw);
      if (parsed === null || parsed === undefined) {
        showFeedback(fb, false, item.invalidMessage || 'That doesn\'t look like a valid answer — check the format.');
        return;
      }
      const result = item.check(parsed, raw);
      showFeedback(fb, result.correct, result.message);
    });

    if (item.onMount) item.onMount(container, kit, uid);
  });
}

// ── Chapter screen assembly ──────────────────────────────────────────────

function renderBlock(chapter, idx, block) {
  switch (block.kind) {
    case 'text': return renderTextBlock(block);
    case 'formula': return renderFormulaBlock(block);
    case 'table': return renderTableBlock(block);
    case 'tablesRow': return renderTablesRowBlock(block);
    case 'custom': return renderCustomBlock(block);
    case 'exerciseGroup': return renderExerciseGroupBlock(chapter, idx, block);
    default:
      console.warn('Unknown block kind:', block.kind);
      return '';
  }
}

function buildChapterScreen(chapter, kit) {
  const screen = el(`<div id="screen-ch-${chapter.id}" class="screen">
    <nav class="topbar">
      <button class="tb-back" data-nav="exercises">
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Exercises
      </button>
      <div class="tb-divider"></div>
      <div class="tb-title">${chapter.topbarTitle || chapter.title}</div>
      <div class="tb-spacer"></div>
      <div class="ex-tag ${chapter.tagClass}">${chapter.tag}</div>
    </nav>
    <div class="ex-page"></div>
  </div>`);

  const page = screen.querySelector('.ex-page');
  chapter.blocks.forEach((block, idx) => {
    const html = renderBlock(chapter, idx, block);
    if (html) page.insertAdjacentHTML('beforeend', html);
  });

  // Wire interactivity after the whole chapter is in the DOM.
  chapter.blocks.forEach((block, idx) => {
    if (block.kind === 'exerciseGroup') wireExerciseGroup(page, chapter, idx, block, kit);
    if (block.kind === 'custom' && typeof block.init === 'function') block.init(page, kit);
  });

  if (typeof chapter.onMount === 'function') chapter.onMount(page, kit);

  return screen;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Builds the exercise-list cards and lazily-rendered chapter screens.
 *
 * @param {Object} opts
 * @param {Array}  opts.chapters       ordered chapter definitions
 * @param {Element} opts.listContainer element to fill with .ex-list-card entries
 * @param {Element} opts.screenRoot    element chapter <div class="screen"> nodes get appended to
 * @param {Function} opts.showScreen   showScreen(id) — same router used by the rest of the app
 * @param {Object} opts.kit            helpers passed through to custom block init()/onMount()
 */
export function initChapterSystem({ chapters, listContainer, screenRoot, showScreen, kit = {} }) {
  const built = new Map(); // chapter.id -> screen element (lazy)

  listContainer.innerHTML = chapters.map((ch, i) => `
    <div class="ex-list-card" data-chapter-id="${ch.id}">
      <div class="ex-card-num">${ch.num}</div>
      <div class="ex-card-color ${ch.tagClass}"></div>
      <div class="ex-card-body">
        <div class="ex-card-tag ${ch.tagClass}">${ch.tag}</div>
        <div class="ex-card-title">${ch.title}</div>
        <div class="ex-card-desc">${ch.desc}</div>
        <div class="ex-card-concepts">${ch.concepts.map(c => `<span>${c}</span>`).join('')}</div>
      </div>
      <div class="ex-card-arrow">→</div>
    </div>`).join('');

  function openChapter(id) {
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;
    if (!built.has(id)) {
      const screen = buildChapterScreen(chapter, kit);
      screenRoot.appendChild(screen);
      built.set(id, screen);
    }
    showScreen(`screen-ch-${id}`);
  }

  listContainer.querySelectorAll('.ex-list-card').forEach(card => {
    card.addEventListener('click', () => openChapter(card.dataset.chapterId));
  });

  // Event delegation for every chapter's back button (screens are added
  // dynamically, so we bind once on the root rather than per-screen).
  screenRoot.addEventListener('click', (e) => {
    const back = e.target.closest('[data-nav="exercises"]');
    if (back) showScreen('screen-exercises');
  });

  return { openChapter };
}
// Inside chapter-engine.js when rendering exercise items:
const cardEl = document.createElement('div');
cardEl.className = 'ex-exercise';

cardEl.innerHTML = `
  <div class="ex-ex-num">${item.num}</div>
  <div class="ex-ex-body">
    <div class="ex-ex-title">${item.title}</div>
    <div class="ex-body-target">${item.renderBody ? item.renderBody() : item.bodyHtml}</div>
    
    <div class="ex-input-row">
      <span class="ex-input-label">${item.inputLabel}</span>
      <input type="text" class="ex-hex-input" maxlength="${item.input.maxlength}">
      <button class="ex-btn btn-check">Check</button>
      ${item.reroll ? '<button class="ex-btn-secondary btn-reroll">🎲 Randomize Values</button>' : ''}
    </div>
    <div class="ex-feedback"></div>
  </div>
`;

// Attach reroll event handler
const rerollBtn = cardEl.querySelector('.btn-reroll');
if (rerollBtn && item.reroll) {
  rerollBtn.addEventListener('click', () => {
    item.reroll(cardEl);
  });
}
