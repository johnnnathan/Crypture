import { p } from '../../chapter-engine.js';

export const dlogBsgsTheoryChapter = {
  id: 'dlog-bsgs-theory',
  num: '08',
  tag: 'Asymmetric Crypto',
  tagClass: 'dlog',
  category: 'Theory',
  title: 'Discrete Logarithm Problem & Baby-Step Giant-Step',
  desc: 'Understand cyclic groups, the hardness of the Discrete Logarithm Problem (DLP), and how Baby-Step Giant-Step trades memory for a square-root speedup.',
  concepts: ['Cyclic Groups', 'DLP', 'Baby-Step Giant-Step', 'Time–Memory Tradeoff'],
  topbarTitle: 'Chapter 08 — DLP & Baby-Step Giant-Step',

  blocks: [
    // ── Block 0: DLP Theory ────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '1. The Discrete Logarithm Problem (DLP)',
      html: `
        ${p('Let $\\mathbb{G}$ be a finite cyclic group of order $n$ written multiplicatively, with generator $g \\in \\mathbb{G}$. Given a target element $h \\in \\mathbb{G}$, the <strong>Discrete Logarithm Problem</strong> asks for an integer $x \\in \\{0, 1, \\dots, n-1\\}$ such that:')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Group Equation</span><span class="accent">gˣ ≡ h (mod n / in G)</span></div>
          <div class="ex-data-row"><span>Notation</span><span class="mono">x = log_g(h)</span></div>
        </div>
        ${p('In elliptic curve notation (additive group $\\mathbb{E}(\\mathbb{F}_p)$ with base point $P$ and public key $Q$), this corresponds to finding scalar $k$ such that $Q = [k]P$.')}
        ${p('While computing $g^x$ via <em>square-and-multiply</em> takes only $O(\\log x)$ operations, reversing the process to recover $x$ from $h$ appears computationally hard for suitably chosen groups—forming the backbone of Diffie–Hellman, ElGamal, DSA, and ECC.')}
      `
    },

    // ── Block 1: Brute Force vs BSGS ───────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '2. Baby-Step Giant-Step (BSGS) Algorithm',
      html: `
        ${p('A naive brute-force search tests $x = 0, 1, 2, \\dots$ until $g^x = h$, taking up to $O(n)$ steps. <strong>Shanks’ Baby-Step Giant-Step</strong> algorithm improves this to $O(\\sqrt{n})$ time by storing $O(\\sqrt{n})$ group elements in a lookup table.')}
        ${p('Choose a step parameter $m \\ge \\lceil\\sqrt{n}\\rceil$ and write any exponent $x$ in base $m$ as:')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Decomposition</span><span class="accent">x = i·m + j</span></div>
          <div class="ex-data-row"><span>Index Bounds</span><span class="mono">0 ≤ j &lt; m, &nbsp; 0 ≤ i ≤ ⌊n/m⌋</span></div>
          <div class="ex-data-row"><span>Rearranged</span><span class="accent">g^(i·m + j) = h  ⇔  g^j = h · (g⁻¹)^(i·m)</span></div>
        </div>
        ${p('<strong>Baby Steps:</strong> Compute $g^j$ for $j = 0, 1, \\dots, m-1$ and store pairs $(g^j, j)$ in a hash/lookup table.')}
        ${p('<strong>Giant Steps:</strong> Compute giant-step multiplier $u = (g^{-1})^m$ (or $g^{-m}$), set $cur = h$, and for $i = 0, 1, \\dots, \\lfloor n/m \\rfloor$ check if $cur$ is in the baby-step table. If $cur = g^j$, return $x = i \\cdot m + j$.')}
      `
    },

    // ── Block 2: Interactive BSGS Time–Memory Calculator ─────────────────────
    {
      kind: 'custom',
      title: '3. Interactive BSGS Time–Memory & Step Calculator',
      desc: 'Tune the group order n and baby-step table size m to inspect baby steps, giant steps, total worst-case operations, and memory usage.',
      html: `
        <div class="ex-exercise" id="bsgs-calc-card">
          <div class="ex-ex-body">
            <div class="ex-data-block" style="margin-bottom: 14px;">
              <div class="ex-data-row">
                <label for="bsgs-n-input"><span>Group Order (n):</span></label>
                <input id="bsgs-n-input" class="ex-text-input" type="number" min="2" max="1000000000" value="1009" style="width: 160px;" />
              </div>
              <div class="ex-data-row">
                <label for="bsgs-m-slider"><span>Baby-Step Table Size (m):</span></label>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <input id="bsgs-m-slider" type="range" min="1" max="100" value="32" />
                  <input id="bsgs-m-input" class="ex-text-input" type="number" min="1" max="1000000000" value="32" style="width: 100px;" />
                </div>
              </div>
            </div>

            <div class="ex-data-block" id="bsgs-metrics">
              <div class="ex-data-row"><span>Optimal √n Bound:</span><span class="mono" id="bsgs-sqrt-n">—</span></div>
              <div class="ex-data-row"><span>Baby Steps (Table Entries):</span><span class="accent" id="bsgs-baby-steps">—</span></div>
              <div class="ex-data-row"><span>Max Giant Steps (⌊n / m⌋ + 1):</span><span class="accent" id="bsgs-giant-steps">—</span></div>
              <div class="ex-data-row"><span>Worst-Case Total Operations:</span><span class="mono" id="bsgs-total-ops">—</span></div>
              <div class="ex-data-row"><span>Brute-Force Worst-Case (n):</span><span class="mono" id="bsgs-bf-ops">—</span></div>
              <div class="ex-data-row"><span>Speedup vs. Brute Force:</span><span class="accent" id="bsgs-speedup">—</span></div>
              <div class="ex-data-row"><span>Est. Table Memory (~64B/entry):</span><span class="mono" id="bsgs-mem">—</span></div>
            </div>

            <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="ex-btn" id="bsgs-optimal-btn">Set Optimal m = ⌈√n⌉</button>
              <button type="button" class="ex-btn" id="bsgs-small-m-btn">Tiny Table (m = 8)</button>
              <button type="button" class="ex-btn" id="bsgs-large-m-btn">Large Table (m = ⌈2√n⌉)</button>
            </div>

            <div id="bsgs-note" class="ex-feedback" style="display: block; margin-top: 12px;"></div>
          </div>
        </div>
      `,
      init: (page) => {
        const nInput = page.querySelector('#bsgs-n-input');
        const mSlider = page.querySelector('#bsgs-m-slider');
        const mInput = page.querySelector('#bsgs-m-input');

        const sqrtEl = page.querySelector('#bsgs-sqrt-n');
        const babyEl = page.querySelector('#bsgs-baby-steps');
        const giantEl = page.querySelector('#bsgs-giant-steps');
        const totalEl = page.querySelector('#bsgs-total-ops');
        const bfEl = page.querySelector('#bsgs-bf-ops');
        const speedupEl = page.querySelector('#bsgs-speedup');
        const memEl = page.querySelector('#bsgs-mem');
        const noteEl = page.querySelector('#bsgs-note');

        const optBtn = page.querySelector('#bsgs-optimal-btn');
        const smallBtn = page.querySelector('#bsgs-small-m-btn');
        const largeBtn = page.querySelector('#bsgs-large-m-btn');

        function formatBytes(bytes) {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
          if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
          return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
        }

        function updateCalc(source = 'all') {
          const n = Math.max(2, Math.floor(Number(nInput.value) || 2));
          const ceilSqrt = Math.ceil(Math.sqrt(n));

          // Keep slider range responsive to n
          const sliderMax = Math.max(100, Math.min(ceilSqrt * 2, 100000));
          mSlider.max = String(sliderMax);

          let m = Math.max(1, Math.floor(Number(mInput.value) || 1));
          if (source === 'slider') {
            m = Math.max(1, Math.floor(Number(mSlider.value) || 1));
            mInput.value = String(m);
          } else if (source === 'n') {
            m = ceilSqrt;
            mInput.value = String(m);
            mSlider.value = String(Math.min(m, sliderMax));
          } else {
            mSlider.value = String(Math.min(m, sliderMax));
          }

          const babySteps = m;
          const giantSteps = Math.floor(n / m) + 1;
          const totalOps = babySteps + giantSteps;
          const speedup = (n / totalOps).toFixed(2);
          const estBytes = babySteps * 64;

          sqrtEl.textContent = `${Math.sqrt(n).toFixed(2)} (⌈√n⌉ = ${ceilSqrt})`;
          babyEl.textContent = babySteps.toLocaleString();
          giantEl.textContent = giantSteps.toLocaleString();
          totalEl.textContent = totalOps.toLocaleString();
          bfEl.textContent = n.toLocaleString();
          speedupEl.textContent = `${speedup}× fewer steps`;
          memEl.textContent = formatBytes(estBytes);

          noteEl.className = 'ex-feedback';
          if (m < ceilSqrt * 0.5) {
            noteEl.textContent = `Small table (m < √n): Saves RAM (${formatBytes(estBytes)}), but giant steps increase to ${giantSteps.toLocaleString()} because each step covers a smaller span.`;
          } else if (m > ceilSqrt * 1.5) {
            noteEl.textContent = `Large table (m > √n): Fewer giant steps (${giantSteps.toLocaleString()}), but baby-step table grows to ${babySteps.toLocaleString()} entries (${formatBytes(estBytes)}).`;
          } else {
            noteEl.className = 'ex-feedback success';
            noteEl.textContent = `Balanced trade-off near m ≈ √n: Baby steps (${babySteps.toLocaleString()}) and giant steps (${giantSteps.toLocaleString()}) are well-balanced, minimizing total work (~${totalOps.toLocaleString()} ops).`;
          }
        }

        nInput.addEventListener('input', () => updateCalc('n'));
        mSlider.addEventListener('input', () => updateCalc('slider'));
        mInput.addEventListener('input', () => updateCalc('m'));

        optBtn.addEventListener('click', () => {
          const n = Math.max(2, Math.floor(Number(nInput.value) || 2));
          mInput.value = String(Math.ceil(Math.sqrt(n)));
          updateCalc('m');
        });

        smallBtn.addEventListener('click', () => {
          mInput.value = '8';
          updateCalc('m');
        });

        largeBtn.addEventListener('click', () => {
          const n = Math.max(2, Math.floor(Number(nInput.value) || 2));
          mInput.value = String(Math.max(1, Math.ceil(2 * Math.sqrt(n))));
          updateCalc('m');
        });

        updateCalc('m');
      }
    }
  ]
};

export default dlogBsgsTheoryChapter;
