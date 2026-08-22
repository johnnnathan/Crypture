import { bin, hex, ascii, getRandomByte } from '../../exercise-kit.js';

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
    input: { type: 'text', maxlength: 6 },
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

/**
 * Modular exponentiation helper: (base^exp) % mod
 */
function modPow(base, exp, mod) {
  let res = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return res;
}

export const schnorrPractice = {
  id: 'schnorr-practice',
  num: '02.1',
  tag: 'Schnorr Signatures',
  tagClass: 'schnorr',
  category: 'Practice',
  title: 'Schnorr — Mathematical Step-Through',
  desc: 'Master the core algorithms of Schnorr signing and verification through randomized step-by-step calculations.',
  concepts: ['Commitment Phase', 'Challenge Hash', 'Signature Scalar', 'Verification Math'],
  topbarTitle: 'Exercise 02.1 — Schnorr Practice',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Randomized Algorithm Walkthrough',
      html: `
        <p class="ex-p">
          Practice calculating each step of a finite-field Schnorr signature scheme ($p=23, n=22, g=5$) by hand to build intuitive understanding.
        </p>`
    },
    {
      kind: 'exerciseGroup',
      title: 'Drills',
      items: [
        /* -----------------------------------------------------------------
         * Step 1: Compute Commitment (R = g^k mod p)
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P1.1',
          title: 'Step 1: Public Nonce Commitment (R)',
          hint: 'Calculate R = (g^k) mod p. Recall g = 5 and p = 23.',
          inputLabel: 'R =',
          generateData: () => {
            const p = 23;
            const g = 5;
            // Secret nonce k between 1 and 10
            const k = Math.floor(Math.random() * 10) + 1;
            const R = modPow(g, k, p);

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Given generator <code>g = 5</code>, prime <code>p = 23</code>, and secret nonce <code>k = ${k}</code>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Formula</span><span class="mono">R = g<sup>k</sup> mod p</span></div>
                    <div class="ex-data-row"><span>Secret Nonce (k)</span><span class="accent">${k}</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === R
                ? { correct: true, message: `Correct! R = 5^${k} mod 23 = ${R}.` }
                : { correct: false, message: `Incorrect. Remember: (5^${k}) mod 23.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Step 2: Compute Challenge Hash (e = (R + m) mod n)
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P1.2',
          title: 'Step 2: Challenge Calculation (e)',
          hint: 'Compute e = (R + m) mod n. The group order n = 22.',
          inputLabel: 'e =',
          generateData: () => {
            const n = 22;
            const R = Math.floor(Math.random() * 20) + 1;
            const m = Math.floor(Math.random() * 20) + 1;
            const e = (R + m) % n;

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Compute the challenge scalar <code>e</code> given commitment <code>R</code> and message hash integer <code>m</code>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Commitment (R)</span><span class="mono">${R}</span></div>
                    <div class="ex-data-row"><span>Message Hash (m)</span><span class="mono">${m}</span></div>
                    <div class="ex-data-row"><span>Group Order (n)</span><span class="accent">22</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === e
                ? { correct: true, message: `Correct! e = (${R} + ${m}) mod 22 = ${e}.` }
                : { correct: false, message: `Incorrect. Try: (${R} + ${m}) mod 22.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Step 3: Compute Signature Scalar (s = (k + e * x) mod n)
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P1.3',
          title: 'Step 3: Signature Scalar Assembly (s)',
          hint: 'Compute s = (k + e * x) mod n. Perform multiplication before addition, then apply mod 22.',
          inputLabel: 's =',
          generateData: () => {
            const n = 22;
            const k = Math.floor(Math.random() * 10) + 1;
            const e = Math.floor(Math.random() * 15) + 1;
            const x = Math.floor(Math.random() * 10) + 1;
            const s = (k + e * x) % n;

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Assemble the signature scalar <code>s</code> using the nonce <code>k</code>, challenge <code>e</code>, and private key <code>x</code>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Nonce (k)</span><span class="mono">${k}</span></div>
                    <div class="ex-data-row"><span>Challenge (e)</span><span class="mono">${e}</span></div>
                    <div class="ex-data-row"><span>Private Key (x)</span><span class="accent">${x}</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === s
                ? { correct: true, message: `Signature Complete! s = (${k} + ${e} * ${x}) mod 22 = ${s}.` }
                : { correct: false, message: `Incorrect. Equation: (${k} + ${e} × ${x}) mod 22.` }
            };
          }
        })
      ]
    }
  ]
};

export default schnorrPractice;
