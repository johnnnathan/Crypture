export const blockCiphersPractice = {
  id: 'block-ciphers-practice',
  num: '02.2',
  tag: 'Practice',
  tagClass: 'practice',
  title: 'Block Ciphers & Modes — Practice Exercises',
  desc: 'Test your understanding of block modes (ECB, CBC, CTR), pattern analysis, nonce usage, parallelism, and historical attacks.',
  concepts: ['ECB Pattern Recognition', 'IV & Nonce Mechanics', 'Parallelization', 'Meet-in-the-Middle Attack', 'Feistel Networks'],
  topbarTitle: 'Exercise 02 — Block Modes Practice',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Conceptual & Structural Practice',
      html: `
        <p class="ex-p">
          Select the correct answer for each scenario based on block cipher properties, operational modes, and historical cryptanalysis.
        </p>`,
    },
    {
      kind: 'exerciseGroup',
      title: 'Multiple Choice Questions',
      items: [
        // ── Question 1: Mode Recognition from Ciphertext ──────────────────
        {
          num: '2.P1',
          title: 'Mode Identification from Ciphertext Output',
          bodyHtml: `
            <p class="ex-p">
              An intercepted message containing repeating plaintext headers was encrypted using a 64-bit block cipher. Below are the resulting ciphertext blocks:
            </p>
            <div class="ex-code-banner" style="font-family: monospace; font-size: 0.85rem; line-height: 1.6; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
              Block 0: 0xF4A21B89C30198E2<br>
              Block 1: 0x9B1130CF72A1B05C<br>
              Block 2: 0xF4A21B89C30198E2<br>
              Block 3: 0x2287DF019A8C11B4
            </div>
            <p class="ex-p" style="margin-top: 8px;">
              Which mode of operation was used to produce this ciphertext?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'ECB (Electronic Codebook)',
              'CBC (Cipher Block Chaining)',
              'CTR (Counter Mode)',
              'GCM (Galois/Counter Mode)'
            ]
          },
          check: (val) => {
            if (val === 'ECB (Electronic Codebook)') {
              return {
                correct: true,
                message: 'Correct! Block 0 and Block 2 produce identical ciphertext blocks (0xF4A21B89C30198E2). Deterministic block mapping is the signature flaw of ECB mode.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Notice that Block 0 and Block 2 are identical. Modes like CBC and CTR prevent this pattern leakage using chaining or nonces.'
            };
          }
        },

        // ── Question 2: IV / Nonce Variance Across Trials ─────────────────
        {
          num: '2.P2',
          title: 'Ciphertext Variance Across Encryption Trials',
          bodyHtml: `
            <p class="ex-p">
              A developer encrypts the exact string <code>"CONFIDENTIAL_DATA"</code> three separate times using AES-CBC under the same secret key. Each execution generates a completely different ciphertext:
            </p>
            <div class="ex-code-banner" style="font-family: monospace; font-size: 0.8rem; color: #4da6ff; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
              Trial 1: 8f3a90...b24c<br>
              Trial 2: 12c8e4...99a1<br>
              Trial 3: f701a9...44d0
            </div>
            <p class="ex-p" style="margin-top: 8px;">
              Why do identical inputs produce completely different output strings across each trial?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'AES automatically generates a fresh random key for every execution.',
              'A new, random Initialization Vector (IV) is generated for each encryption trial.',
              'CBC mode applies random-length padding to the end of every message.',
              'The block cipher dynamically adjusts its block size per trial.'
            ]
          },
          check: (val) => {
            if (val === 'A new, random Initialization Vector (IV) is generated for each encryption trial.') {
              return {
                correct: true,
                message: 'Correct! The fresh random IV XORs with the first block (P₀ ⊕ IV), causing a randomized cascade throughout all subsequent ciphertext blocks.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The key remains constant; the output varies because a fresh, random Initialization Vector (IV) or Nonce is generated for every trial.'
            };
          }
        },

        // ── Question 3: Parallelization ───────────────────────────────────
        {
          num: '2.P3',
          title: 'Parallel Processing Capability',
          bodyHtml: `
            <p class="ex-p">
              You are building a high-performance system to process terabyte-scale log files. You need a mode that allows multi-core CPUs to compute <strong>both encryption and decryption of arbitrary blocks in parallel</strong>.
            </p>
            <p class="ex-p">
              Which mode supports parallel processing for BOTH encryption and decryption?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'CBC (Cipher Block Chaining)',
              'CTR (Counter Mode)',
              'PCBC (Propagating Cipher Block Chaining)',
              'None — all block modes are strictly sequential'
            ]
          },
          check: (val) => {
            if (val === 'CTR (Counter Mode)') {
              return {
                correct: true,
                message: 'Correct! Because CTR mode computes Sᵢ = Eₖ(Nonce || i) independently for any counter index i, every block can be encrypted or decrypted in parallel.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. CBC encryption is strictly sequential because block Cᵢ requires Cᵢ₋₁. CTR mode allows full parallel processing for both operations.'
            };
          }
        },

        // ── Question 4: Feistel Network Architecture ──────────────────────
        {
          num: '2.P4',
          title: 'Block Cipher Architecture (DES & Feistel Networks)',
          bodyHtml: `
            <p class="ex-p">
              The Data Encryption Standard (DES) uses a 16-round <strong>Feistel Network</strong> architecture.
            </p>
            <p class="ex-p">
              What is the primary operational advantage of a Feistel structure in cipher design?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'The round function F does not need to be invertible for the overall cipher to be reversible.',
              'It guarantees absolute resistance against differential cryptanalysis.',
              'It eliminates the need for round keys during encryption.',
              'It allows DES to operate on arbitrary block lengths without padding.'
            ]
          },
          check: (val) => {
            if (val === 'The round function F does not need to be invertible for the overall cipher to be reversible.') {
              return {
                correct: true,
                message: 'Correct! A Feistel network splits data into L and R halves and uses XOR to invert rounds, allowing non-invertible round functions F to be used.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The key property of a Feistel network is that decryption uses the exact same circuit as encryption, regardless of whether round function F is invertible.'
            };
          }
        },

        // ── Question 5: Meet-in-the-Middle Attack ─────────────────────────
        {
          num: '2.P5',
          title: 'Double-DES Vulnerability (Meet-in-the-Middle)',
          bodyHtml: `
            <p class="ex-p">
              Double-DES (2DES) encrypts data twice with two 56-bit keys: <code>C = E_K2(E_K1(P))</code>, giving a key space of 112 bits.
            </p>
            <p class="ex-p">
              Despite the 112-bit key length, 2DES provides only effective <strong>57-bit security</strong> due to which classic attack?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Meet-in-the-Middle Attack',
              'Man-in-the-Middle Attack',
              'Length Extension Attack',
              'Replay Attack'
            ]
          },
          check: (val) => {
            if (val === 'Meet-in-the-Middle Attack') {
              return {
                correct: true,
                message: 'Correct! An attacker computes forward values E_K1(P) and backward values D_K2(C) into a table, breaking 2DES in O(2⁵⁶) time and space.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The Meet-in-the-Middle attack targets the intermediate state between key 1 and key 2, reducing the security level from 112 bits down to 57 bits.'
            };
          }
        }
      ]
    }
  ]
};

export default blockCiphersPractice;
