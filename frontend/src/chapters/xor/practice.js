import { bin, hex, ascii, getRandomByte } from '../../exercise-kit.js';

// Inject page-specific styles safely
const style = document.createElement('style');
style.textContent = `
  .ex-practice-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  .ex-btn-secondary {
    background: transparent;
    border: 1px solid var(--border-mid, #222834);
    color: var(--text-dim, #64748b);
    border-radius: 3px;
    padding: 4px 10px;
    font-family: var(--font-mono, monospace);
    font-size: 10px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .ex-btn-secondary:hover {
    color: var(--text-primary, #e2e8f0);
    border-color: var(--border-hi, #334155);
  }
`;
document.head.appendChild(style);

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
    input: { type: 'binary', maxlength: 8 },
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

export const xorPractice = {
  id: 'xor-practice',
  num: '01.2',
  tag: 'XOR Gate',
  tagClass: 'xor',
  category: 'Practice',
  title: 'XOR — Calculation Drills',
  desc: 'Master manual bitwise calculations with randomized 8-bit byte exercises.',
  concepts: ['Randomized Drills', 'Arithmetic Speed', 'Muscle Memory'],
  topbarTitle: 'Exercise 01.2 — XOR Practice',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Randomized Calculation Drills',
      html: `
        <p class="ex-p">Practice calculating XOR outcomes by hand until the bitwise operations become automatic.</p>`
    },
    {
      kind: 'exerciseGroup',
      title: 'Drills',
      items: [
        createDynamicExercise({
          num: 'P1.1',
          title: 'Random Byte XOR Drill',
          hint: 'Work bit-by-bit from left to right. Outputs are 1 where bits differ.',
          inputLabel: 'A ⊕ B =',
          generateData: () => {
            const A = getRandomByte();
            const B = getRandomByte();
            const ANS = A ^ B;
            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Compute the XOR of the following randomized bytes:<br>
                    <strong>A = ${bin(A)}</strong> &nbsp; <strong>B = ${bin(B)}</strong>
                  </p>
                </div>`,
              check: (val) => val === ANS
                ? { correct: true, message: `Correct! ${bin(A)} ⊕ ${bin(B)} = ${bin(ANS)}.\nHex: ${hex(A)} ⊕ ${hex(B)} = ${hex(ANS)}.` }
                : { correct: false, message: `Incorrect. Expected ${bin(ANS)} (${hex(ANS)}).\nCalculated: ${bin(A)} XOR ${bin(B)}.` }
            };
          }
        }),

        createDynamicExercise({
          num: 'P1.2',
          title: 'Random Key Recovery Drill',
          hint: 'Remember the self-inverse property: K = P ⊕ C.',
          inputLabel: 'K =',
          generateData: () => {
            const P = getRandomByte();
            const C = getRandomByte();
            const K = P ^ C;
            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Recover the unknown 8-bit key <code>K</code> from this intercepted pair:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Plaintext P</span><span class="accent">${bin(P)}</span></div>
                    <div class="ex-data-row"><span>Ciphertext C</span><span class="accent">${bin(C)}</span></div>
                  </div>
                </div>`,
              check: (val) => val === K
                ? { correct: true, message: `Key Recovered! K = P ⊕ C = ${bin(P)} ⊕ ${bin(C)} = ${bin(K)}.` }
                : { correct: false, message: `Incorrect key. K = ${bin(P)} ⊕ ${bin(C)} should yield ${bin(K)}.` }
            };
          }
        }),

        createDynamicExercise({
          num: 'P1.3',
          title: 'Key-Reuse Cancellation Drill',
          hint: 'Step 1: Compute C₁ ⊕ C₂ = P₁ ⊕ P₂. Step 2: XOR that result with P₁ to reveal P₂.',
          inputLabel: 'P₂ =',
          generateData: () => {
            const K = getRandomByte();
            const P1 = getRandomByte();
            const P2 = getRandomByte();
            const C1 = P1 ^ K;
            const C2 = P2 ^ K;
            const XORR = C1 ^ C2;

            return {
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">Two messages were encrypted using the same key <code>K</code>. Find <code>P₂</code> using <code>P₁</code> and the ciphertexts:</p>
                  <div class="ex-data-block">
                    <div class="ex-data-row"><span>Ciphertext C₁</span><span class="accent">${bin(C1)}</span></div>
                    <div class="ex-data-row"><span>Ciphertext C₂</span><span class="accent">${bin(C2)}</span></div>
                    <div class="ex-data-row"><span>Known Plaintext P₁</span><span class="mono">${bin(P1)}</span></div>
                  </div>
                </div>`,
              check: (val) => val === P2
                ? { correct: true, message: `Success! P₂ = ${bin(P2)}.\nC₁ ⊕ C₂ = ${bin(XORR)} (P₁ ⊕ P₂).\n${bin(P1)} ⊕ ${bin(XORR)} = ${bin(P2)}.` }
                : { correct: false, message: `Incorrect. Expected P₂ = ${bin(P2)}.\nC₁ ⊕ C₂ = ${bin(XORR)}, then XOR with P₁ (${bin(P1)}).` }
            };
          }
        })
      ]
    }
  ]
};

export default xorPractice;
