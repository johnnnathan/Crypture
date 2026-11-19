import { p } from '../../chapter-engine.js';

export const dlogCryptanalysisTheoryChapter = {
  id: 'dlog-cryptanalysis-theory',
  num: '08',
  tag: 'Asymmetric Crypto',
  tagClass: 'dlog',
  category: 'Theory',
  title: 'Discrete Logarithm Problem & Cryptanalysis Algorithms',
  desc: 'Explore the Discrete Logarithm Problem (DLP), Baby-Step Giant-Step time–memory tradeoffs, Pohlig–Hellman subgroup decomposition via CRT, and Index Calculus over finite fields.',
  concepts: [
    'Cyclic Groups & DLP',
    'Baby-Step Giant-Step',
    'Pohlig–Hellman & CRT',
    'Index Calculus'
  ],
  topbarTitle: 'Chapter 08 — DLOG & Cryptanalysis Theory',

  blocks: [
    // ── Block 0: DLP Theory ────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '1. The Discrete Logarithm Problem (DLP)',
      html: `
        ${p('Let $\\mathbb{G}$ be a finite cyclic group of order $n$ with generator $g \\in \\mathbb{G}$. Given a target element $h \\in \\mathbb{G}$, the <strong>Discrete Logarithm Problem</strong> asks for an integer $x \\in \\{0, 1, \\dots, n-1\\}$ such that:')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Group Equation</span><span class="accent">gˣ ≡ h (mod n / in G)</span></div>
          <div class="ex-data-row"><span>Notation</span><span class="mono">x = log_g(h)</span></div>
        </div>
        ${p('In additive elliptic curve notation $\\mathbb{E}(\\mathbb{F}_p)$ with base point $P$ and public key $Q$, this corresponds to finding scalar $k$ such that $Q = [k]P$. While forward exponentiation or scalar multiplication is efficient, inverting it drives key sizes in Diffie–Hellman, ElGamal, DSA, and ECC.')}
      `
    },

    // ── Block 1: BSGS Theory ───────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '2. Baby-Step Giant-Step (BSGS) Algorithm',
      html: `
        ${p('Naive brute force checks up to $O(n)$ candidates. <strong>Shanks’ Baby-Step Giant-Step</strong> algorithm lowers time complexity to $O(\\sqrt{n})$ by storing $O(\\sqrt{n})$ entries in a lookup table with step bound $m \\ge \\lceil\\sqrt{n}\\rceil$.')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Index Decomposition</span><span class="accent">x = i·m + j</span></div>
          <div class="ex-data-row"><span>Index Bounds</span><span class="mono">0 ≤ j &lt; m, &nbsp; 0 ≤ i ≤ ⌊n/m⌋</span></div>
          <div class="ex-data-row"><span>Collision Equation</span><span class="accent">g^j = h · (g⁻¹)^(i·m)</span></div>
        </div>
        ${p('<strong>Baby Steps:</strong> Precompute $g^j$ for $0 \\le j < m$ and store $(g^j, j)$.')}
        ${p('<strong>Giant Steps:</strong> Compute multiplier $u = (g^{-1})^m$, initialize $cur = h$, and step $cur \\leftarrow cur \\cdot u$ for $i = 0, 1, \\dots, \\lfloor n/m \\rfloor$ until $cur$ matches a stored baby step $g^j$, returning $x = i \\cdot m + j$.')}
      `
    },

    // ── Block 2: Interactive BSGS Time–Memory Calculator ─────────────────────
    {
      kind: 'custom',
      title: '3. Interactive BSGS Time–Memory & Step Calculator',
      desc: 'Adjust the group order n and baby-step table size m to observe baby steps, giant steps, total worst-case operations, and estimated memory.',
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
    },

    // ── Block 3: Pohlig–Hellman Theory ─────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '4. Pohlig–Hellman Algorithm (Composite Group Orders)',
      html: `
        ${p('When a cyclic group order factors into prime powers $n = \\prod_{i=1}^{r} q_i^{e_i}$, <strong>Pohlig–Hellman</strong> decomposes the discrete logarithm modulo $n$ into smaller prime-power congruences $x \\equiv x_i \\pmod{q_i^{e_i}}$ and recombines them via the <strong>Chinese Remainder Theorem (CRT)</strong>.')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Order Factorization</span><span class="accent">n = Π qᵢ^eᵢ</span></div>
          <div class="ex-data-row"><span>Subgroup Congruences</span><span class="mono">x ≡ xᵢ (mod qᵢ^eᵢ)</span></div>
        </div>
        ${p('Because runtime is governed by the largest prime factor rather than $n$ itself, groups with smooth orders are vulnerable—which is why cryptographic curves choose prime orders.')}
      `
    },

    // ── Block 4: Index Calculus Theory ─────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: '5. Index Calculus Method (Finite-Field Multiplicative Groups)',
      html: `
        ${p('<strong>Index Calculus</strong> targets multiplicative groups $\\mathbb{F}_p^\\times$ by selecting a factor base $\\mathcal{B} = \\{p_1, p_2, \\dots, p_k\\}$ of small primes, collecting smooth relations where $g^s \\bmod p$ factors completely over $\\mathcal{B}$, solving linear congruences for $\\log_g(p_j)$, and reducing $h \\cdot g^r \\bmod p$ over $\\mathcal{B}$.')}
        <div class="ex-data-block">
          <div class="ex-data-row"><span>Smooth Relation</span><span class="accent">g^s ≡ Π pⱼ^eⱼ (mod p)</span></div>
          <div class="ex-data-row"><span>Linear Equation</span><span class="mono">s ≡ Σ eⱼ·log_g(pⱼ) (mod φ(p))</span></div>
        </div>
        ${p('Because integer smoothness relies on factoring lifted integers in $\\mathbb{Z}$, Index Calculus applies to finite-field multiplicative groups rather than elliptic curve groups.')}
      `
    }
  ]
};

export default dlogCryptanalysisTheoryChapter;
