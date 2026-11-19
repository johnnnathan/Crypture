import { p } from '../../chapter-engine.js';

/**
 * Extended Modular Inverse Helper (Extended Euclidean Algorithm)
 */
function modInverse(a, m) {
  let m0 = m;
  let y = 0, x = 1;
  if (m === 1) return 0;
  a = ((a % m) + m) % m;
  while (a > 1) {
    let q = Math.floor(a / m);
    let t = m;
    m = a % m;
    a = t;
    t = y;
    y = x - q * y;
    x = t;
  }
  if (x < 0) x += m0;
  return x;
}

/**
 * Modular Exponentiation Helper (Square-and-Multiply)
 */
function modPow(base, exp, mod) {
  let result = 1n;
  let b = BigInt(((base % mod) + mod) % mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return Number(result);
}

/**
 * Helper to construct a dynamic, re-rollable exercise item
 */
function createDynamicExercise({ num, title, generateData, hint, inputLabel }) {
  let currentData = generateData();

  return {
    num,
    title,
    renderBody() {
      return currentData.bodyHtml;
    },
    hint,
    input: { type: 'text', maxlength: 12 },
    inputLabel,
    check: (val) => currentData.check(val),

    reroll(cardContainer) {
      currentData = generateData();
      const bodyEl = cardContainer.querySelector('.ex-ex-body-content');
      if (bodyEl) {
        bodyEl.innerHTML = currentData.bodyHtml;
      }
      const inputEl = cardContainer.querySelector('input');
      const feedbackEl = cardContainer.querySelector('.ex-feedback');
      if (inputEl) inputEl.value = '';
      if (feedbackEl) {
        feedbackEl.className = 'ex-feedback';
        feedbackEl.textContent = '';
      }
    }
  };
}

export const dlogBsgsPracticeChapter = {
  id: 'dlog-bsgs-practice',
  num: '08.1',
  tag: 'Asymmetric Crypto',
  tagClass: 'dlog',
  category: 'Practice',
  title: 'DLP & BSGS — Step & Logarithm Drills',
  desc: 'Practice choosing BSGS step sizes, computing giant-step multipliers, and solving small discrete logarithm instances.',
  concepts: ['BSGS Step Bound', 'Giant-Step Multiplier', 'Discrete Logarithm', 'Modular Inverse'],
  topbarTitle: 'Exercise 08.1 — DLP & BSGS Drills',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Baby-Step Giant-Step & Discrete Log Drills',
      html: p('Work through each drill using randomized parameters. Click <strong>Re-roll</strong> on any card to generate a fresh instance.')
    },
    {
      kind: 'exerciseGroup',
      title: 'Drills',
      items: [
        /* -----------------------------------------------------------------
         * Drill 1: Optimal Baby-Step Bound m = ceil(sqrt(n))
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P8.1',
          title: 'Choosing the Step Bound m',
          hint: 'Compute m = ⌈√n⌉ (the smallest integer m such that m² ≥ n).',
          inputLabel: 'm =',
          generateData: () => {
            const candidates = [53, 89, 127, 211, 307, 509, 751, 1009];
            const n = candidates[Math.floor(Math.random() * candidates.length)];
            const expectedM = Math.ceil(Math.sqrt(n));

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">For a cyclic group of order <code>n = ${n}</code>, what is the standard baby-step table size <code>m = ⌈√n⌉</code>?</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Group Order (n)</span><span class="mono">${n}</span></div>
                    <div class="ex-data-row"><span>√${n}</span><span class="accent">${Math.sqrt(n).toFixed(4)}</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === expectedM
                ? { correct: true, message: `Correct! ⌈√${n}⌉ = ${expectedM} (since (${expectedM - 1})² < ${n} ≤ ${expectedM}²).` }
                : { correct: false, message: `Incorrect. Round √${n} (${Math.sqrt(n).toFixed(2)}) up to the next integer.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Drill 2: Giant-Step Multiplier g^(-m) mod p
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P8.2',
          title: 'Giant-Step Multiplier g⁻ᵐ mod p',
          hint: 'First compute g^m mod p, then find its modular inverse modulo p using the Extended Euclidean Algorithm.',
          inputLabel: 'g⁻ᵐ mod p =',
          generateData: () => {
            const instances = [
              { p: 29, g: 2, m: 4 },
              { p: 31, g: 3, m: 4 },
              { p: 37, g: 2, m: 5 },
              { p: 41, g: 6, m: 4 },
              { p: 43, g: 3, m: 5 }
            ];
            const { p, g, m } = instances[Math.floor(Math.random() * instances.length)];
            const gm = modPow(g, m, p);
            const expectedMult = modInverse(gm, p);

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">In $\\mathbb{F}_{${p}}^\\times$ with generator <code>g = ${g}</code> and step size <code>m = ${m}</code>, compute the giant-step multiplier <code>g⁻ᵐ mod ${p}</code>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Modulus (p)</span><span class="mono">${p}</span></div>
                    <div class="ex-data-row"><span>Generator (g)</span><span class="mono">${g}</span></div>
                    <div class="ex-data-row"><span>Step Size (m)</span><span class="accent">${m}</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === expectedMult
                ? { correct: true, message: `Correct! ${g}^${m} ≡ ${gm} (mod ${p}), and ${gm}⁻¹ ≡ ${expectedMult} (mod ${p}).` }
                : { correct: false, message: `Incorrect. First find ${g}^${m} mod ${p} = ${gm}, then invert ${gm} mod ${p}.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Drill 3: Solve Discrete Logarithm x = log_g(h) mod n
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P8.3',
          title: 'Recover Discrete Logarithm x',
          hint: 'Use x = i·m + j with m = ⌈√n⌉: build baby steps g^j mod p for j < m, then step h · (g⁻ᵐ)^i mod p.',
          inputLabel: 'x =',
          generateData: () => {
            const problems = [
              { p: 29, g: 2, order: 28, x: 19 },
              { p: 31, g: 3, order: 30, x: 23 },
              { p: 37, g: 2, order: 36, x: 27 },
              { p: 41, g: 6, order: 40, x: 31 },
              { p: 43, g: 3, order: 42, x: 29 }
            ];
            const item = problems[Math.floor(Math.random() * problems.length)];
            const h = modPow(item.g, item.x, item.p);
            const m = Math.ceil(Math.sqrt(item.order));

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Find the discrete logarithm <code>x ∈ {0, …, ${item.order - 1}}</code> such that <code>${item.g}ˣ ≡ ${h} (mod ${item.p})</code> (subgroup order <code>n = ${item.order}</code>, suggested <code>m = ${m}</code>):</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Generator (g)</span><span class="mono">${item.g}</span></div>
                    <div class="ex-data-row"><span>Target (h)</span><span class="accent">${h}</span></div>
                    <div class="ex-data-row"><span>Modulus / Order</span><span class="mono">p = ${item.p}, n = ${item.order}</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === item.x
                ? { correct: true, message: `Correct! ${item.g}^${item.x} ≡ ${h} (mod ${item.p}).` }
                : { correct: false, message: `Incorrect. Check candidate exponents x such that ${item.g}^x mod ${item.p} = ${h}.` }
            };
          }
        })
      ]
    }
  ]
};

export default dlogBsgsPracticeChapter;
