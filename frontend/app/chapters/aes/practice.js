export const aesPractice = {
  id: 'aes-practice',
  num: '04.2',
  tag: 'Practice',
  tagClass: 'practice',
  title: 'AES — Practice Exercises',
  desc: 'Test your understanding of the AES round structure, the S-Box and GF(2⁸) arithmetic, the key schedule, and why AES resists attacks that break DES.',
  concepts: ['SPN Structure', 'S-Box Properties', 'Key Schedule', 'Diffusion', 'Practical AES Attacks'],
  topbarTitle: 'Exercise 04 — AES Practice',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Conceptual & Structural Practice',
      html: `
        <p class="ex-p">
          Select the correct answer for each scenario based on AES's internal structure, the mathematics behind its transformations, and how it differs from ciphers like DES.
        </p>`,
    },
    {
      kind: 'exerciseGroup',
      title: 'Multiple Choice Questions',
      items: [
        // ── Question 1: SPN vs Feistel ─────────────────────────────────────
        {
          num: '4.P1',
          title: 'Structural Design: SPN vs. Feistel',
          bodyHtml: `
            <p class="ex-p">
              DES processes only half of its 64-bit block through the round function <code>F</code> in any given round, relying on a Feistel structure to remain invertible. AES processes the <strong>entire</strong> 128-bit block every round instead.
            </p>
            <p class="ex-p">
              What property of AES's individual transformations (SubBytes, ShiftRows, MixColumns, AddRoundKey) is what actually makes this possible?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Each transformation is individually invertible on its own.',
              'AES uses a larger block size than DES, which removes the need for invertibility.',
              'AES only needs to be invertible during decryption, not encryption.',
              'The AES key schedule generates a self-inverse key for every round.'
            ]
          },
          check: (val) => {
            if (val === 'Each transformation is individually invertible on its own.') {
              return {
                correct: true,
                message: 'Correct! The S-Box is a bijection, ShiftRows is a rotation, MixColumns is an invertible GF(2⁸) matrix, and AddRoundKey is its own inverse — so the whole cipher can be run in reverse without needing a Feistel structure to hide non-invertible components.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Block size is unrelated to this; the key reason is that every AES transformation is invertible by construction, unlike a Feistel round function F.'
            };
          }
        },

        // ── Question 2: State matrix fill order ────────────────────────────
        {
          num: '4.P2',
          title: 'State Matrix Byte Ordering',
          bodyHtml: `
            <p class="ex-p">
              You're given the 16-byte input <code>b₀ b₁ b₂ ... b₁₅</code>. In the AES State matrix, which byte occupies row 1, column 2 (0-indexed)?
            </p>
          `,
          input: {
            type: 'choice',
            options: ['b₆', 'b₉', 'b₁₀', 'b₃']
          },
          check: (val) => {
            if (val === 'b₉') {
              return {
                correct: true,
                message: 'Correct! AES fills the state column by column, so column 2 holds bytes b₈, b₉, b₁₀, b₁₁ — and row 1 of that column is b₉.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Remember the state fills column by column, not row by row: column c holds bytes [4c, 4c+1, 4c+2, 4c+3].'
            };
          }
        },

        // ── Question 3: SubBytes purpose ───────────────────────────────────
        {
          num: '4.P3',
          title: 'The Purpose of SubBytes',
          bodyHtml: `
            <p class="ex-p">
              The S-Box is built from a byte's multiplicative inverse in <code>GF(2⁸)</code>, followed by a fixed affine transformation. Why go through the trouble of a field inversion instead of a simpler bit-shuffling substitution?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Field inversion is faster to compute in hardware than a lookup table.',
              'It introduces strong non-linearity, which resists linear and differential cryptanalysis.',
              'It guarantees the S-Box output is always larger than the input.',
              'It allows the S-Box to double as the key schedule.'
            ]
          },
          check: (val) => {
            if (val === 'It introduces strong non-linearity, which resists linear and differential cryptanalysis.') {
              return {
                correct: true,
                message: 'Correct! A purely linear substitution could be approximated (and broken) using linear algebra over the whole cipher. The nonlinearity of field inversion is specifically what gives AES its resistance to these classic attack families.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The point of using field inversion (rather than, say, a simple XOR or bit permutation) is nonlinearity — resistance to linear and differential cryptanalysis.'
            };
          }
        },

        // ── Question 4: MixColumns / diffusion ─────────────────────────────
        {
          num: '4.P4',
          title: 'Diffusion and the Avalanche Effect',
          bodyHtml: `
            <p class="ex-p">
              Suppose you flip a single bit in one byte of the AES State, then apply SubBytes → ShiftRows → MixColumns.
            </p>
            <p class="ex-p">
              How many bytes of the resulting state are affected after this single round?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Only the one byte that was changed.',
              'All 4 bytes in that byte\'s column, and no others.',
              'Up to all 4 bytes of one column after MixColumns; ShiftRows then spreads that column into 4 different columns for the next round.',
              'All 16 bytes of the state immediately, in every case.'
            ]
          },
          check: (val) => {
            if (val === 'Up to all 4 bytes of one column after MixColumns; ShiftRows then spreads that column into 4 different columns for the next round.') {
              return {
                correct: true,
                message: 'Correct! MixColumns mixes within a single column (up to 4 bytes), but ShiftRows in the following round moves each of those 4 bytes into a different column — which is exactly how AES achieves full-state diffusion within just a couple of rounds (the avalanche effect).'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. MixColumns only mixes within one column per round — but because ShiftRows repositions bytes between rows before the next MixColumns, the effect spreads across the whole state within a few rounds, not instantly and not just within one column forever.'
            };
          }
        },

        // ── Question 5: Key schedule / Rcon ────────────────────────────────
        {
          num: '4.P5',
          title: 'Purpose of the Round Constant (Rcon)',
          bodyHtml: `
            <p class="ex-p">
              In the AES key schedule, <code>Rcon[i]</code> is XORed into the first byte of certain expanded key words. Without it, what weakness would the key schedule have?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Every round key would be identical to the original cipher key.',
              'The expansion would produce a slidable, symmetric pattern across rounds, making some structural attacks easier.',
              'The key schedule would fail to produce enough key material for AES-256.',
              'SubBytes would not be invertible during decryption.'
            ]
          },
          check: (val) => {
            if (val === 'The expansion would produce a slidable, symmetric pattern across rounds, making some structural attacks easier.') {
              return {
                correct: true,
                message: 'Correct! Rcon breaks the otherwise-repetitive structure of the expansion formula, which is important for resisting slide attacks and related-key attacks that exploit self-similarity between rounds.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. Rcon\'s role is to break symmetry between rounds in the key expansion — without it, the schedule would have an exploitable repeating structure.'
            };
          }
        },

        // ── Question 6: Real-world AES attack surface ──────────────────────
        {
          num: '4.P6',
          title: 'Where AES Actually Gets Broken in Practice',
          bodyHtml: `
            <p class="ex-p">
              AES-128 has a keyspace of <code>2¹²⁸</code> — far too large for brute force with any known or foreseeable hardware, unlike DES's 56-bit keyspace. Given that, which of these is the realistic way AES deployments actually get compromised?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'Directly brute-forcing the 128-bit key with a fast GPU cluster.',
              'Reversing the S-Box construction to recover the affine constant.',
              'Exploiting implementation flaws — timing side-channels, power analysis, or weak surrounding protocol/padding logic — rather than attacking the cipher\'s math directly.',
              'Waiting for MixColumns to eventually produce a repeated ciphertext block.'
            ]
          },
          check: (val) => {
            if (val.startsWith('Exploiting implementation flaws')) {
              return {
                correct: true,
                message: 'Correct! AES\'s mathematical security margin is enormous — real-world breaks almost always come from how AES is implemented or used (cache-timing leaks, power/EM side-channels, poor IV handling, padding oracles), not from brute-forcing the key or reversing the S-Box.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. AES\'s keyspace makes brute force infeasible, and the S-Box is public and not a secret to "reverse." Real compromises come from implementation-level side-channels and protocol misuse, not the core algorithm.'
            };
          }
        },

        // ── Question 7: Round count reasoning ──────────────────────────────
        {
          num: '4.P7',
          title: 'Why AES-256 Uses More Rounds Than AES-128',
          bodyHtml: `
            <p class="ex-p">
              AES-128 uses 10 rounds; AES-256 uses 14, despite both operating on the same 128-bit block size. Why does the larger key size require more rounds?
            </p>
          `,
          input: {
            type: 'choice',
            options: [
              'A larger key needs more rounds just to fully mix into the state at least once, and to preserve a safety margin against attacks that improve with more known key bits.',
              'AES-256 processes a 256-bit block, so it needs proportionally more rounds.',
              'More rounds are required so the S-Box can be recomputed for the larger key.',
              'It is an arbitrary NIST convention with no cryptographic justification.'
            ]
          },
          check: (val) => {
            if (val.startsWith('A larger key needs more rounds')) {
              return {
                correct: true,
                message: 'Correct! The extra rounds exist to maintain a security margin: more key material theoretically gives an attacker more to work with (e.g. in related-key attack settings), so NIST specified extra rounds to keep the margin against best-known attacks comfortable.'
              };
            }
            return {
              correct: false,
              message: 'Incorrect. The block size is 128 bits for all three AES variants — it\'s the larger key size that motivates extra rounds, to preserve an adequate security margin.'
            };
          }
        },
      ]
    }
  ]
};

export default aesPractice;
