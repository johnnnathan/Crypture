/**
 * Helper to construct a dynamic, re-rollable exercise item for hash practice
 */
function createDynamicExercise({ num, title, generateData, hint, inputType = 'text', inputLabel }) {
  let currentData = generateData();

  return {
    num,
    title,
    renderBody() {
      return currentData.bodyHtml;
    },
    hint,
    input: { type: inputType, placeholder: currentData.placeholder || '' },
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

export const hashPractice = {
  id: 'hash-practice',
  num: '05.2',
  tag: 'Practice',
  tagClass: 'practice',
  title: 'Cryptographic Hash Functions — Practice Exercises',
  desc: 'Test your understanding of preimage resistance, collision attacks, the Birthday Paradox, Merkle–Damgård construction, and dynamic sponge parameter calculations.',
  concepts: [
    'Preimage & Second Preimage Resistance',
    'Collision Resistance',
    'Birthday Paradox',
    'Merkle–Damgård Construction',
    'Dynamic Sponge Calculations (Rate, Capacity, Permutation Calls)',
  ],
  topbarTitle: 'Exercise 05 — Hash Practice',

  blocks: [
    // ── 1. Conceptual & Structural Practice (Static MCQs) ─────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Conceptual & Structural Practice',
      html: `
        <p class="ex-p">
          Select the correct answer for each scenario based on hash function security properties, structural constructions, and historical cryptanalysis.
        </p>`,
    },
    {
      kind: 'exerciseGroup',
      title: 'Multiple Choice Questions',
      items: [
        // ── Question 1 ───────────────────────────────────────────────────
        {
          num: '5.P1',
          title: 'Password Storage Security Property',
          bodyHtml: `
            <p class="ex-p">
              An authentication database stores user passwords as hashed digests $H = \\text{Hash}(P)$. When a user logs in, the system hashes the input password and checks if it matches $H$.
            </p>
            <p class="ex-p">
              Which core cryptographic hash property ensures an attacker who steals the database cannot easily recover the original plaintext password $P$ from the stored digest $H$?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Collision Resistance',
              'Preimage Resistance (One-Wayness)',
              'Second Preimage Resistance',
              'Length Extension Resistance'
            ]
          },
          check: (val) => {
            if (val === 'Preimage Resistance (One-Wayness)') {
              return {
                correct: true,
                message: 'Correct! Preimage resistance guarantees that given a hash digest H, it is computationally infeasible to invert the function and recover the original message P.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Reversing a specific output back to its input depends on Preimage Resistance.'
            };
          }
        },

        // ── Question 2 ───────────────────────────────────────────────────
        {
          num: '5.P2',
          title: 'Collision Attack Search Complexity',
          bodyHtml: `
            <p class="ex-p">
              An engineer designs a custom, non-standard hash function that outputs a <strong>64-bit digest</strong>.
            </p>
            <p class="ex-p">
              Based on the <strong>Birthday Paradox</strong>, approximately how many random messages must an attacker hash before having a ~50% chance of finding <em>any</em> two messages that produce the exact same digest (a collision)?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              '2⁶⁴ operations',
              '2³² operations',
              '2¹²⁸ operations',
              '64² (4,096) operations'
            ]
          },
          check: (val) => {
            if (val === '2³² operations') {
              return {
                correct: true,
                message: 'Correct! Due to the Birthday Paradox, finding a collision in an n-bit hash requires approximately 2^(n/2) evaluation steps. For 64 bits, 2^(64/2) = 2³² operations.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Remember the Birthday Bound: finding an arbitrary pair collision requires 2^(n/2) operations.'
            };
          }
        },

        // ── Question 3 ───────────────────────────────────────────────────
        {
          num: '5.P3',
          title: 'Targeted Document Forgery (Second Preimage)',
          bodyHtml: `
            <p class="ex-p">
              An attacker intercepts a legally binding PDF contract $M_1$ and its published SHA-256 digest $H_1$. The attacker wants to generate a fraudulent contract $M_2$ ($M_2 \\neq M_1$) such that $\\text{Hash}(M_2) = H_1$.
            </p>
            <p class="ex-p">
              Which hash function property is the attacker attempting to break?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Preimage Resistance',
              'Second Preimage Resistance',
              'Collision Resistance',
              'Avalanche Resistance'
            ]
          },
          check: (val) => {
            if (val === 'Second Preimage Resistance') {
              return {
                correct: true,
                message: 'Correct! Finding a new message M₂ that collides with a *specific, existing* message M₁ is a Second Preimage attack.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Matching a hash of a specific fixed message M₁ targets Second Preimage Resistance.'
            };
          }
        },

        // ── Question 4 ───────────────────────────────────────────────────
        {
          num: '5.P4',
          title: 'Length Extension Vulnerability',
          bodyHtml: `
            <p class="ex-p">
              A legacy web application calculates API request authentication signatures using naive concatenation:
            </p>
            <div class="ex-code-banner" style="font-family: monospace; font-size: 0.85rem; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; color: #4da6ff;">
              Signature = Hash(Secret_Key || User_Data)
            </div>
            <p class="ex-p" style="margin-top: 8px;">
              Because algorithms like MD5, SHA-1, and SHA-256 use the <strong>Merkle–Damgård construction</strong>, this construction is vulnerable to which classic attack?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Length Extension Attack',
              'Meet-in-the-Middle Attack',
              'Padding Oracle Attack',
              'Birthday Attack'
            ]
          },
          check: (val) => {
            if (val === 'Length Extension Attack') {
              return {
                correct: true,
                message: 'Correct! Merkle–Damgård outputs its raw internal state as the final digest, enabling Length Extension Attacks.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Merkle–Damgård construction allows an attacker to append data to an existing hash output via a Length Extension Attack.'
            };
          }
        },

        // ── Question 5 ───────────────────────────────────────────────────
        {
          num: '5.P5',
          title: 'The Avalanche Effect Property',
          bodyHtml: `
            <p class="ex-p">
              You change a single bit in a 1-gigabyte file (flipping a <code>0</code> to a <code>1</code>) and recompute its SHA-256 digest.
            </p>
            <p class="ex-p">
              What behavior should you expect from a cryptographically secure hash function?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Exactly 1 bit in the output digest will flip.',
              'Roughly 50% of the output bits will flip in an unpredictable pattern.',
              'Only the final block digest bits will change.',
              'The digest will remain identical except for the padding bits.'
            ]
          },
          check: (val) => {
            if (val === 'Roughly 50% of the output bits will flip in an unpredictable pattern.') {
              return {
                correct: true,
                message: 'Correct! Changing a single input bit flips approximately 50% of output bits randomly due to the Avalanche Effect.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Cryptographic hash functions exhibit the Avalanche Effect.'
            };
          }
        }
      ]
    },

    // ── 2. Randomized Sponge Construction Computations ───────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Randomized Sponge Calculation Drills',
      html: `
        <p class="ex-p">
          Practice solving sponge parameter calculations through randomized variations. Re-roll the questions to practice calculating rates, capacities, block counts, and search spaces.
        </p>
      `
    },
    {
      kind: 'exerciseGroup',
      title: 'Dynamic Drills',
      items: [
        // ── Question 6: Dynamic Rate Calculation ──────────────────────────
        createDynamicExercise({
          num: '5.P6',
          title: 'Optimizing Bit Rate for Target Collision Security',
          hint: 'Collision security = min(c/2, n/2). Maximum rate r = b - c.',
          inputLabel: 'r =',
          inputType: 'number',
          generateData: () => {
            // Pick a randomized state width b (e.g., 400, 800, 1600)
            const widths = [400, 800, 1600];
            const b = widths[Math.floor(Math.random() * widths.length)];

            // Target collision security level (s = c/2 = n/2)
            const secLevels = [80, 128, 160, 224, 256];
            const s = secLevels[Math.floor(Math.random() * secLevels.length)];

            const c = 2 * s;
            const n = 2 * s;
            const r = b - c;

            return {
              placeholder: 'Enter rate r (in bits)',
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">
                    Consider a sponge construction with a permutation width of <strong>b = ${b} bits</strong>.
                    We wish to process messages <strong>as efficiently as possible</strong> (maximizing rate $r$) while guaranteeing at least <strong>${s} bits of security</strong> against collision attacks (assuming $c = n$).
                  </p>
                  <p class="ex-p">Calculate the maximum achievable bit rate <code>r</code> in bits.</p>
                </div>`,
              check: (val) => {
                const parsed = parseInt(val, 10);
                if (parsed === r) {
                  return {
                    correct: true,
                    message: `Correct! For ${s} bits of collision security, c = n = 2 × ${s} = ${c} bits. Thus r = ${b} - ${c} = ${r} bits.`
                  };
                }
                return {
                  correct: false,
                  message: `Incorrect. Target security ${s} bits requires c = ${2 * s}. Then r = ${b} - ${2 * s}.`
                };
              }
            };
          }
        }),

        // ── Question 7: Dynamic Second Preimage Bounds ────────────────────
        createDynamicExercise({
          num: '5.P7',
          title: 'Maximum Theoretical Second Preimage Security',
          hint: 'Second preimage security = min(c/2, n). Max capacity is c = b - 1.',
          inputLabel: 'Security =',
          inputType: 'number',
          generateData: () => {
            const widths = [200, 400, 800, 1600];
            const b = widths[Math.floor(Math.random() * widths.length)];
            const maxC = b - 1;
            const maxSec = maxC / 2; // e.g. 199.5 for b = 400

            return {
              placeholder: 'Enter security strength in bits',
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">
                    Using a sponge with permutation state width <strong>b = ${b} bits</strong> (where rate $r \\ge 1$), what is the maximum theoretical security level (in bits) against <strong>second preimage attacks</strong> that can be guaranteed?
                  </p>
                </div>`,
              check: (val) => {
                const parsed = parseFloat(val);
                if (parsed === maxSec || parsed === Math.floor(maxSec) || parsed === Math.ceil(maxSec)) {
                  return {
                    correct: true,
                    message: `Correct! With r ≥ 1, max capacity c = ${b} - 1 = ${maxC}. The bound min(c/2, n) yields at most ${maxSec} bits.`
                  };
                }
                return {
                  correct: false,
                  message: `Incorrect. Maximum capacity is b - 1 = ${maxC}. Second preimage bound is c / 2 = ${maxSec} bits.`
                };
              }
            };
          }
        }),

        // ── Question 8: Dynamic Permutation Calls ─────────────────────────
        createDynamicExercise({
          num: '5.P8',
          title: 'Total Permutation Calls (Absorbing + Squeezing)',
          hint: 'Absorbing calls = ceil((|M| + 1) / r). Squeezing blocks = ceil(n / r).',
          inputLabel: 'Total Calls =',
          inputType: 'number',
          generateData: () => {
            const r = [64, 100, 128, 256][Math.floor(Math.random() * 4)];
            const msgBits = Math.floor(Math.random() * 800) + 500; // e.g. 500 - 1300 bits
            const n = [128, 256, 300, 512][Math.floor(Math.random() * 4)];

            // Absorbing calls with 10*-padding:
            const absCalls = Math.ceil((msgBits + 1) / r);
            
            // Squeezing calls: ceil(n / r)
            const squeezeBlocks = Math.ceil(n / r);
            
            // Total evaluations can be calculated as absCalls + (squeezeBlocks - 1) or absCalls + squeezeBlocks
            const ans1 = absCalls + Math.max(0, squeezeBlocks - 1);
            const ans2 = absCalls + squeezeBlocks;

            return {
              placeholder: 'Enter total permutation calls',
              bodyHtml: `
                <div class="ex-ex-body-content">
                  <p class="ex-p">
                    A sponge configuration uses a bit rate <strong>r = ${r} bits</strong> and produces a digest of length <strong>n = ${n} bits</strong>.
                    We wish to hash a message $M$ of length <strong>${msgBits} bits</strong> using standard $10^*$-padding.
                  </p>
                  <p class="ex-p">How many total evaluation calls of the permutation function $P$ are required?</p>
                </div>`,
              check: (val) => {
                const parsed = parseInt(val, 10);
                if (parsed === ans1 || parsed === ans2) {
                  return {
                    correct: true,
                    message: `Correct! Absorbing takes ⌈(${msgBits} + 1)/${r}⌉ = ${absCalls} calls. Squeezing ${n} bits at rate ${r} requires ${squeezeBlocks} output blocks.`
                  };
                }
                return {
                  correct: false,
                  message: `Incorrect. Absorbing calls: ⌈(${msgBits} + 1)/${r}⌉ = ${absCalls}. Squeezing calls: ⌈${n}/${r}⌉ = ${squeezeBlocks}.`
                };
              }
            };
          }
        }),

        // ── Question 9: Dynamic Password Entropy ─────────────────────────
        {
          num: '5.P9',
          title: 'Exhaustive Search Complexity for Short Passwords',
          bodyHtml: `
            <p class="ex-p">
              Suppose $c = n = 128$ bits. An attacker gains possession of a hash digest $h = \\text{Sponge}(P)$ where $P$ is known to be a uniformly random <strong>64-bit secret password</strong>.
            </p>
            <p class="ex-p">
              What is the expected number of sponge evaluations required for the attacker to recover $P$ via a brute-force attack?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              '2⁶³ evaluations',
              '2⁶⁴ evaluations',
              '2¹²⁸ evaluations',
              '2³² evaluations'
            ]
          },
          check: (val) => {
            if (val === '2⁶³ evaluations') {
              return {
                correct: true,
                message: 'Correct! The password space is 2⁶⁴. Searching through a uniformly random space of size N takes N/2 steps on average, which equals 2⁶³ evaluations.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The capacity and digest length (128 bits) are larger than the password space (64 bits), so the search bound is governed by the password space size (2⁶⁴ total, 2⁶³ on average).'
            };
          }
        }
      ]
    }
  ]
};

export default hashPractice;
