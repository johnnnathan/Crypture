export const hashPractice = {
  id: 'hash-practice',
  num: '05.2',
  tag: 'Practice',
  tagClass: 'practice',
  title: 'Cryptographic Hash Functions — Practice Exercises',
  desc: 'Test your understanding of preimage resistance, collision attacks, the Birthday Paradox, Merkle–Damgård construction, and real-world hash security.',
  concepts: ['Preimage & Second Preimage Resistance', 'Collision Resistance', 'Birthday Paradox', 'Merkle–Damgård Construction', 'Length Extension Attacks'],
  topbarTitle: 'Exercise 05 — Hash Practice',

  blocks: [
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
        // ── Question 1: Security Property Identification ──────────────────
        {
          num: '5.P1',
          title: 'Password Storage Security Property',
          bodyHtml: `
            <p class="ex-p">
              A authentication database stores user passwords as hashed digests $H = \text{Hash}(P)$. When a user logs in, the system hashes the input password and checks if it matches $H$.
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
              message: 'Incorrect. Collision resistance involves finding any two colliding inputs. Reversing a specific output back to its input depends on Preimage Resistance.'
            };
          }
        },

        // ── Question 2: Birthday Paradox / Collision Attack Complexity ────
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
              message: 'Incorrect. Remember the Birthday Bound: finding an arbitrary pair collision requires 2^(n/2) operations, not 2^n (which is the preimage bound).'
            };
          }
        },

        // ── Question 3: Second Preimage vs Collision Resistance ──────────
        {
          num: '5.P3',
          title: 'Targeted Document Forgery (Second Preimage)',
          bodyHtml: `
            <p class="ex-p">
              An attacker intercepts a legally binding PDF contract $M_1$ and its published SHA-256 digest $H_1$. The attacker wants to generate a fraudulent contract $M_2$ ($M_2 \neq M_1$) such that $\text{Hash}(M_2) = H_1$.
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
                message: 'Correct! Finding a new message M₂ that collides with a *specific, existing* message M₁ is a Second Preimage attack. (Requires ~2ⁿ operations).'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Because the attacker is given a specific fixed message M₁ and must match its hash with M₂, this targets Second Preimage Resistance (not general Collision Resistance).'
            };
          }
        },

        // ── Question 4: Merkle-Damgård Structural Weakness ───────────────
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
                message: 'Correct! Merkle–Damgård outputs its raw internal state as the final digest. An attacker can use Hash(Key || Data) as the initial state to append extra malicious data without knowing Secret_Key.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Merkle–Damgård construction allows an attacker to append data to an existing hash output via a Length Extension Attack. HMAC is designed specifically to prevent this.'
            };
          }
        },

        // ── Question 5: Avalanche Effect ─────────────────────────────────
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
                message: 'Correct! This is the Avalanche Effect. A strict requirement for cryptographic hashes is that any small input change propagates unpredictably through roughly half the output bits.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Good cryptographic hash functions exhibit the Avalanche Effect: changing a single input bit flips approximately 50% of output bits randomly.'
            };
          }
        }
      ]
    }
  ]
};

export default hashPractice;
