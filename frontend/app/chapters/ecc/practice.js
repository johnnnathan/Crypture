import { bin, hex, ascii, getRandomByte } from '../../exercise-kit.js';

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
    input: { type: 'text', maxlength: 8 },
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

export const eccPractice = {
  id: 'ecc-practice',
  num: '03.2',
  tag: 'Elliptic Curves',
  tagClass: 'ecc',
  category: 'Practice',
  title: 'ECC — Point Math Drills',
  desc: 'Practice point doubling, point decompression, and ECDH key exchange over small finite fields.',
  concepts: ['Point Doubling', 'Point Decompression', 'ECDH Key Agreement'],
  topbarTitle: 'Exercise 03.2 — ECC Practice',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Finite Field Arithmetic Drills',
      html: `
        <p class="ex-p">
          Practice evaluating point operations, point decompression, and ECDH secrets using curve $y^2 = x^3 + 5x + 4 \\pmod{13}$.
        </p>`
    },
    {
      kind: 'exerciseGroup',
      title: 'Drills',
      items: [
        /* -----------------------------------------------------------------
         * Drill 1: Point Doubling [2]G
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P3.1',
          title: 'Point Doubling: Compute [2]G',
          hint: 'Calculate λ = (3x² + a)/(2y) mod 13. Then x₃ = λ² - 2x mod 13.',
          inputLabel: '[2]G x-coord =',
          generateData: () => {
            const p = 13, a = 5, b = 4;
            // Point G = (2, 3)
            const G = { x: 2, y: 3 };

            const num = (3 * G.x * G.x + a) % p;
            const den = (2 * G.y) % p;
            const lam = (num * modInverse(den, p)) % p;

            const x3 = ((lam * lam - 2 * G.x) % p + p) % p;
            const y3 = ((lam * (G.x - x3) - G.y) % p + p) % p;

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">On curve <code>y² = x³ + 5x + 4 mod 13</code>, compute the <strong>x-coordinate</strong> of <code>[2]G</code> for point <strong>G = (2, 3)</strong>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Base Point G</span><span class="mono">(2, 3)</span></div>
                    <div class="ex-data-row"><span>Formula</span><span class="accent">λ = (3x₁² + 5) / (2y₁) mod 13</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === x3
                ? { correct: true, message: `Correct! λ = ${lam}, [2]G = (${x3}, ${y3}).` }
                : { correct: false, message: `Incorrect. Hints: λ = 5, x₃ = 5² - 4 = 21 ≡ 8 mod 13.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Drill 2: Point Decompression
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P3.2',
          title: 'Point Decompression',
          hint: 'Evaluate y² = x³ + 5x + 4 mod 13. Test candidates for y and pick the one matching the parity bit.',
          inputLabel: 'y =',
          generateData: () => {
            const p = 13, a = 5, b = 4;
            const x = 6; // y^2 = 216 + 30 + 4 = 250 = 3 mod 13 -> y = 4 (even) or 9 (odd)
            const parity = 0; // Even parity requested
            const expectedY = 4;

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Decompress Bob's public key given compressed pair <code>(x, parity) = (${x}, ${parity})</code> on curve <code>y² = x³ + 5x + 4 mod 13</code>:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Compressed x</span><span class="mono">${x}</span></div>
                    <div class="ex-data-row"><span>Parity (y mod 2)</span><span class="accent">${parity} (Even)</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === expectedY
                ? { correct: true, message: `Decompressed! y² = 3 mod 13. Possible y ∈ {4, 9}. Since parity is 0, y = 4.` }
                : { correct: false, message: `Incorrect. Find y such that y² ≡ 3 mod 13 and y is even.` }
            };
          }
        }),

        /* -----------------------------------------------------------------
         * Drill 3: ECDH Shared Secret
         * ----------------------------------------------------------------- */
        createDynamicExercise({
          num: 'P3.3',
          title: 'ECDH Shared Secret Agreement',
          hint: 'The shared secret point is P = [a]B = [3](6, 4). Extract the x-coordinate.',
          inputLabel: 'Shared Secret x =',
          generateData: () => {
            const expectedSecretX = 8; // [3](6,4) = (8,6) -> x = 8

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Alice has private key <code>a = 3</code> and receives Bob's public key <code>B = (6, 4)</code>. Compute the shared secret x-coordinate (<code>x_P</code> where <code>P = [3]B</code>):</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Alice Private Key (a)</span><span class="mono">3</span></div>
                    <div class="ex-data-row"><span>Bob Public Key (B)</span><span class="accent">(6, 4)</span></div>
                  </div>
                </div>`,
              check: (val) => parseInt(val, 10) === expectedSecretX
                ? { correct: true, message: `Key Agreed! [3]B = (8, 6), so the shared secret x-coordinate is 8.` }
                : { correct: false, message: `Incorrect. Compute [2]B = (11, 5), then B + [2]B = (8, 6).` }
            };
          }
        })
      ]
    }
  ]
};

export default eccPractice;
