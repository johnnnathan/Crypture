export const aesTheory = {
  id: 'aes-theory',
  num: '04.1',
  tag: 'Theory',
  tagClass: 'aes', // Add styling for .aes in your main CSS if needed
  title: '04 — Advanced Encryption Standard (AES)',
  desc: 'Learn the inner workings of AES-128: Substitution-Permutation Networks, the 4x4 State Matrix, and key schedule expansion.',
  concepts: ['Block Ciphers', 'State Matrix', 'SubBytes & S-Box', 'ShiftRows', 'MixColumns', 'AddRoundKey'],
  topbarTitle: 'Chapter 04 — AES Theory',

  blocks: [
    // ── 1. Introduction ──────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'What is AES?',
      html: `
        <p class="ex-p">The <strong>Advanced Encryption Standard (AES)</strong> is a symmetric block cipher established by NIST in 2001 to replace DES. It operates on fixed <strong>128-bit blocks (16 bytes)</strong> of data and supports key sizes of 128, 192, or 256 bits.</p>
        <p class="ex-p">Unlike Feistel networks (like DES), AES is a <strong>Substitution-Permutation Network (SPN)</strong> where every round processes all 128 bits in parallel.</p>
      `,
    },

    // ── 2. The 4x4 State Matrix ──────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The 4 × 4 State Matrix',
      html: `
        <p class="ex-p">AES organizes its 16-byte block into a <strong>4 &times; 4 matrix of bytes</strong> called the <em>State Matrix</em>. Input bytes fill the matrix column by column:</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Input Bytes: [b₀, b₁, b₂, b₃, b₄, b₅, b₆, b₇, b₈, b₉, b₁₀, b₁₁, b₁₂, b₁₃, b₁₄, b₁₅]',
        '',
        'State Matrix:',
        '┌──────┬──────┬──────┬──────┐',
        '│  b₀  │  b₄  │  b₈  │ b₁₂  │',
        '│  b₁  │  b₅  │  b₉  │ b₁₃  │',
        '│  b₂  │  b₆  │ b₁₀  │ b₁₄  │',
        '│  b₃  │  b₇  │ b₁₁  │ b₁₅  │',
        '└──────┴──────┴──────┴──────┘'
      ],
      note: 'Notice how bytes fill vertically (column by column), NOT row by row.',
    },

    // ── 3. Round Structure Summary ───────────────────────────────────────
    {
      kind: 'table',
      label: 'AES Round Configuration',
      columns: ['AES Variant', 'Key Size', 'Block Size', 'Number of Rounds'],
      rows: [
        ['<strong>AES-128</strong>', '128 bits (16 bytes)', '128 bits (16 bytes)', '10 rounds'],
        ['<strong>AES-192</strong>', '192 bits (24 bytes)', '128 bits (16 bytes)', '12 rounds'],
        ['<strong>AES-256</strong>', '256 bits (32 bytes)', '128 bits (16 bytes)', '14 rounds'],
      ],
    },

    // ── 4. The 4 Round Operations ────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The Four Transformation Steps',
      html: `
        <p class="ex-p">Each standard round of AES consists of four distinct layer operations performed on the State Matrix:</p>
      `,
    },
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <ul class="ex-list">
            <li>
              <strong>1. SubBytes (Non-linear Substitution):</strong> 
              Each byte in the State Matrix is independently replaced using a fixed lookup table called the <code>S-Box</code>. This provides non-linearity (confusion) to resist differential analysis.
            </li>
            <li>
              <strong>2. ShiftRows (Permutation):</strong> 
              The bytes in each row of the State Matrix are cyclically shifted to the left by an offset equal to the row index:
              <br>• Row 0: Shifted <strong>0</strong> positions left
              <br>• Row 1: Shifted <strong>1</strong> position left
              <br>• Row 2: Shifted <strong>2</strong> positions left
              <br>• Row 3: Shifted <strong>3</strong> positions left
            </li>
            <li>
              <strong>3. MixColumns (Diffusion):</strong> 
              Each column of 4 bytes is multiplied by a fixed matrix over Galois Field <code>GF(2⁸)</code>. This ensures that changing a single byte in input affects all 4 bytes of that column after 1 round!
            </li>
            <li>
              <strong>4. AddRoundKey (Key Injection):</strong> 
              A 128-bit Round Key (derived from the main key using the Key Schedule) is combined with the State Matrix using bitwise XOR (<code>&oplus;</code>).
            </li>
          </ul>
        </div>
      `,
    },

    // ── 5. Standard Round Execution Order ────────────────────────────────
    {
      kind: 'formula',
      lines: [
        'Initial State:   AddRoundKey(State, Key₀)',
        'Rounds 1 to 9:   SubBytes → ShiftRows → MixColumns → AddRoundKey',
        'Final Round 10:  SubBytes → ShiftRows → AddRoundKey  (MixColumns is omitted!)'
      ],
      note: 'The final round omits MixColumns so that encryption and decryption hardware structures stay symmetric.',
    },

    // ── 6. Check Your Understanding Exercises ─────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Check Your Understanding',
      items: [
        {
          num: '4.1',
          title: 'AES-128 Round Count',
          bodyHtml: `<p class="ex-p">How many transformation rounds does <strong>AES-128</strong> execute in total?</p>`,
          input: { type: 'number', placeholder: 'e.g. 10' },
          parse: (val) => parseInt(val, 10),
          check: (val) => val === 10
            ? { correct: true, message: 'Correct! AES-128 consists of an initial AddRoundKey step followed by 10 rounds.' }
            : { correct: false, message: 'Incorrect. Remember: AES-128 uses 10 rounds, AES-192 uses 12, and AES-256 uses 14.' },
        },
        {
          num: '4.2',
          title: 'Final Round Exception',
          bodyHtml: `<p class="ex-p">Which of the 4 transformation steps is <strong>omitted</strong> during the final round of AES?</p>`,
          input: {
            type: 'mc',
            options: [
              { value: 'subbytes', label: 'SubBytes' },
              { value: 'shiftrows', label: 'ShiftRows' },
              { value: 'mixcolumns', label: 'MixColumns' },
              { value: 'addroundkey', label: 'AddRoundKey' },
            ],
          },
          check: (val) => val === 'mixcolumns'
            ? { correct: true, message: 'Correct! MixColumns is skipped in the final round to streamline inverse decryption.' }
            : { correct: false, message: 'Incorrect. Look closely at the round execution sequence above.' },
        },
      ],
    },
  ],
};

export default aesTheory;
