// js/chapter-engine.js

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
      <button id="${uid}-btn" class="ex-btn btn-check">Check</button>`;
  } else {
    const cls = item.input.type === 'text' ? 'ex-text-input' : 'ex-hex-input';
    const widthStyle = item.input.width ? ` style="width:${item.input.width}"` : '';
    const rerollBtn = typeof item.reroll === 'function'
      ? `<button id="${uid}-reroll" class="ex-btn-secondary btn-reroll">🎲 Randomize Values</button>`
      : '';

    inputHtml = `<div class="ex-input-row">
      <span class="ex-input-label">${item.inputLabel || 'Answer ='}</span>
      <input id="${uid}-input" class="${cls}" type="text" placeholder="${item.input.placeholder || ''}" maxlength="${item.input.maxlength || 32}"${widthStyle} />
      <button id="${uid}-btn" class="ex-btn btn-check">Check</button>
      ${rerollBtn}
    </div>`;
  }

  // Support dynamic renderBody function alongside static bodyHtml
  const bodyContent = typeof item.renderBody === 'function' ? item.renderBody() : (item.bodyHtml || '');

  return `<div class="ex-exercise" id="${uid}-card">
    <div class="ex-ex-num">${item.num}</div>
    <div class="ex-ex-body">
      <div class="ex-ex-title">${item.title}</div>
      <div class="ex-body-target">${bodyContent}</div>
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

// ── Media & Slideshow Block Renderers ────────────────────────────────────

function renderMediaBlock(b, blockIdx, chapterId) {
  const title = b.title ? `<h3 class="ex-h3">${b.title}</h3>` : '';
  const desc = b.desc ? `<p class="ex-p">${b.desc}</p>` : '';
  
  // Single Image or Video
  if (b.mediaType === 'video') {
    return `
      <section class="ex-section">
        ${title}${desc}
        <div class="ex-media-wrap">
          <video controls class="ex-media-video" src="${b.src}" poster="${b.poster || ''}"></video>
          ${b.caption ? `<div class="ex-media-caption">${b.caption}</div>` : ''}
        </div>
      </section>`;
  }

  // Slideshow / Carousel
  if (b.items && Array.isArray(b.items)) {
    const uid = `${chapterId}-b${blockIdx}-slideshow`;
    const slides = b.items.map((item, idx) => `
      <div class="ex-slide ${idx === 0 ? 'active' : ''}" data-slide-idx="${idx}">
        <img src="${item.src}" alt="${item.alt || ''}" class="ex-slide-img" />
        ${item.caption ? `<div class="ex-media-caption">${item.caption}</div>` : ''}
      </div>
    `).join('');

    return `
      <section class="ex-section">
        ${title}${desc}
        <div class="ex-slideshow-wrap" id="${uid}">
          <div class="ex-slides-container">${slides}</div>
          <div class="ex-slideshow-controls">
            <button class="ex-btn-secondary btn-prev" aria-label="Previous Slide">❮ Prev</button>
            <span class="ex-slide-counter"><span class="current-slide">1</span> / ${b.items.length}</span>
            <button class="ex-btn-secondary btn-next" aria-label="Next Slide">Next ❯</button>
          </div>
        </div>
      </section>`;
  }

  // Fallback: Single Image
  return `
    <section class="ex-section">
      ${title}${desc}
      <div class="ex-media-wrap">
        <img src="${b.src}" alt="${b.alt || ''}" class="ex-media-img" />
        ${b.caption ? `<div class="ex-media-caption">${b.caption}</div>` : ''}
      </div>
    </section>`;
}

// ── Wiring (event listeners) for exercise groups ────────────────────────

function wireExerciseGroup(container, chapter, blockIdx, b, kit) {
  b.items.forEach((item, idx) => {
    const uid = `${chapter.id}-b${blockIdx}-e${idx}`;
    const cardEl = container.querySelector(`#${uid}-card`);
    const fb = container.querySelector(`#${uid}-fb`);
    const btn = container.querySelector(`#${uid}-btn`);
    const rerollBtn = container.querySelector(`#${uid}-reroll`);

    const getRaw = () => {
      if (item.input.type === 'mc') {
        const checked = container.querySelector(`input[name="${uid}"]:checked`);
        return checked ? checked.value : null;
      }
      return container.querySelector(`#${uid}-input`).value;
    };
    const parse = item.parse || DEFAULT_PARSERS[item.input.type] || (v => v);

    // Bind check button handler
    if (btn) {
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
    }

    // Bind randomize/reroll button handler
    if (rerollBtn && typeof item.reroll === 'function') {
      rerollBtn.addEventListener('click', () => {
        item.reroll(cardEl);
      });
    }

    if (item.onMount) item.onMount(container, kit, uid);
  });
}

function wireSlideshowBlock(container, blockIdx, chapterId, b) {
  if (!b.items || !Array.isArray(b.items)) return;

  const uid = `${chapterId}-b${blockIdx}-slideshow`;
  const wrap = container.querySelector(`#${uid}`);
  if (!wrap) return;

  const slides = wrap.querySelectorAll('.ex-slide');
  const counter = wrap.querySelector('.current-slide');
  const btnPrev = wrap.querySelector('.btn-prev');
  const btnNext = wrap.querySelector('.btn-next');
  let currentIdx = 0;

  const showSlide = (idx) => {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    currentIdx = idx;
    if (counter) counter.textContent = currentIdx + 1;
  };

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      const newIdx = (currentIdx - 1 + slides.length) % slides.length;
      showSlide(newIdx);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const newIdx = (currentIdx + 1) % slides.length;
      showSlide(newIdx);
    });
  }
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
    case 'media': return renderMediaBlock(block, idx, chapter.id);
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

  chapter.blocks.forEach((block, idx) => {
    if (block.kind === 'exerciseGroup') wireExerciseGroup(page, chapter, idx, block, kit);
    if (block.kind === 'media') wireSlideshowBlock(page, idx, chapter.id, block);
    if (block.kind === 'custom' && typeof block.init === 'function') block.init(page, kit);
  });

  if (typeof chapter.onMount === 'function') chapter.onMount(page, kit);

  return screen;
}

// ── Public API ────────────────────────────────────────────────────────────

export function initChapterSystem({ chapters, listContainer, screenRoot, showScreen, kit = {} }) {
  const built = new Map();

  listContainer.innerHTML = chapters.map((ch) => `
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

  screenRoot.addEventListener('click', (e) => {
    const back = e.target.closest('[data-nav="exercises"]');
    if (back) showScreen('screen-exercises');
  });

  return { openChapter };
}
