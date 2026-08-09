// ── AES field arithmetic & S-Box construction ────────────────────────────
// Every value below is *derived*, not hard-coded from a textbook table:
// GF(2^8) multiplication, the multiplicative inverse, and the fixed affine
// transformation are implemented directly from the FIPS-197 definition.
// The same functions drive both the static S-Box table further down and
// the live round visualizer, so there's exactly one source of truth for
// "what SubBytes/MixColumns actually do."

function gmul(a, b) {
  // Multiplication in GF(2^8), reduced modulo the AES field polynomial
  // x^8 + x^4 + x^3 + x + 1 (0x11B).
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hiBitSet = a & 0x80;
    a = (a << 1) & 0xff;
    if (hiBitSet) a ^= 0x1b;
    b >>= 1;
  }
  return p;
}

function gfInverse(a) {
  if (a === 0) return 0; // 0 has no inverse; AES defines S(0) via this special case
  for (let x = 1; x < 256; x++) {
    if (gmul(a, x) === 1) return x;
  }
  return 0; // unreachable for a != 0
}

function affineTransform(byte) {
  // s'_i = s_i XOR s_(i+4) XOR s_(i+5) XOR s_(i+6) XOR s_(i+7) XOR c_i,
  // indices mod 8, where c = 0x63 (01100011).
  let out = 0;
  for (let i = 0; i < 8; i++) {
    const bit =
      ((byte >> i) & 1) ^
      ((byte >> ((i + 4) % 8)) & 1) ^
      ((byte >> ((i + 5) % 8)) & 1) ^
      ((byte >> ((i + 6) % 8)) & 1) ^
      ((byte >> ((i + 7) % 8)) & 1) ^
      ((0x63 >> i) & 1);
    out |= bit << i;
  }
  return out;
}

const SBOX = (() => {
  const table = new Array(256);
  for (let b = 0; b < 256; b++) table[b] = affineTransform(gfInverse(b));
  return table;
})();

const RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

function hex2(n) {
  return n.toString(16).padStart(2, '0');
}

function renderStateGrid(bytes) {
  // AES fills its state column by column: index = col * 4 + row.
  let html = '<div class="aes-state-grid">';
  for (let r = 0; r < 4; r++) {
    html += '<div class="aes-state-row">';
    for (let c = 0; c < 4; c++) {
      const idx = c * 4 + r;
      html += `<div class="aes-state-cell">${hex2(bytes[idx]).toUpperCase()}</div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

function hexToBytes16(hex) {
  const clean = String(hex).trim().replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(clean)) return null;
  const bytes = [];
  for (let i = 0; i < 32; i += 2) bytes.push(parseInt(clean.substr(i, 2), 16));
  return bytes;
}

// ── Static S-Box table content (16x16 grid) ───────────────────────────────

const sboxColumns = ['', ...Array.from({ length: 16 }, (_, i) => i.toString(16).toUpperCase())];
const sboxRows = Array.from({ length: 16 }, (_, row) => {
  const cells = [`<strong>${row.toString(16).toUpperCase()}_</strong>`];
  for (let col = 0; col < 16; col++) {
    cells.push(hex2(SBOX[row * 16 + col]).toUpperCase());
  }
  return cells;
});

// FIPS-197 Appendix B worked example values, used as the visualizer's
// defaults so learners can cross-check every intermediate value against
// the published standard.
const FIPS_PLAINTEXT = '3243f6a8885a308d313198a2e0370734';
const FIPS_KEY = '2b7e151628aed2a6abf7158809cf4f3c';

export const aesTheory = {
  id: 'aes-theory',
  num: '04.1',
  tag: 'Theory',
  tagClass: 'aes',
  title: '04 — Advanced Encryption Standard (AES)',
  desc: 'The inner workings of AES: Substitution-Permutation Networks, the state matrix, the real S-Box and MixColumns math, the key schedule, and a live round-by-round visualizer.',
  concepts: [
    'Substitution-Permutation Network',
    'GF(2⁸) Field Arithmetic',
    'S-Box Construction',
    'Key Schedule & Rcon',
    'Diffusion & Avalanche Effect',
  ],
  topbarTitle: 'Chapter 04 — AES Theory',

  blocks: [
    // ── 1. Introduction & History ────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'What is AES?',
      html: `
        <p class="ex-p">The <strong>Advanced Encryption Standard (AES)</strong> is a symmetric block cipher established by NIST in 2001, following an open, multi-year public competition. The winning design, submitted by Belgian cryptographers Joan Daemen and Vincent Rijmen under the name <strong>Rijndael</strong>, was selected specifically for its combination of strong security margins, efficiency, and resistance to the kinds of structural attacks that had accumulated against older ciphers.</p>
        <p class="ex-p">AES directly replaced <strong>DES</strong> as the US federal standard. If you worked through the DES key-search challenges earlier in this course, you already have a concrete feel for <em>why</em> a replacement was needed: DES's 56-bit effective keyspace is small enough to exhaust with modern hardware, and even a deliberately shrunken 20-bit toy version fell in under a second. AES-128 alone offers a keyspace of <code>2<sup>128</sup></code> — brute force is not a realistic attack surface here, which is precisely why real-world attacks on AES target implementation weaknesses (timing, power analysis, faulty padding checks) rather than the key search itself.</p>
        <p class="ex-p">AES operates on fixed <strong>128-bit blocks (16 bytes)</strong> and supports key sizes of 128, 192, or 256 bits. Structurally, it is a <strong>Substitution-Permutation Network (SPN)</strong>: unlike a Feistel network (DES's structure), which only transforms half the block per round, AES processes the <em>entire</em> 128-bit block in every round.</p>
      `,
    },

    // ── 2. SPN vs Feistel ─────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Substitution-Permutation Networks vs. Feistel Networks',
      html: `
        <p class="ex-p">DES's Feistel structure exists to solve a specific engineering problem: it lets the same circuit perform both encryption and decryption even when the round function <code>F</code> isn't invertible, because only half the block is ever passed through <code>F</code> directly — the other half is recovered by XOR.</p>
        <p class="ex-p">AES doesn't need that trick, because every transformation it uses <em>is</em> individually invertible by construction: the S-Box is a bijection (a permutation of all 256 byte values), ShiftRows is just a rotation, MixColumns is an invertible matrix over <code>GF(2⁸)</code>, and AddRoundKey is its own inverse (XOR twice with the same key returns the original value). This lets AES process the full block every round instead of only half of it, which is a major reason SPNs like AES tend to achieve strong diffusion in fewer rounds than comparably-sized Feistel ciphers.</p>
      `,
    },

    // ── 3. The 4x4 State Matrix ──────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The 4 × 4 State Matrix',
      html: `
        <p class="ex-p">AES organizes its 16-byte block into a <strong>4 &times; 4 matrix of bytes</strong> called the <em>State</em>. Input bytes fill the matrix column by column, not row by row — this ordering matters for every operation that follows, especially ShiftRows.</p>
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

    // ── 4. Round Structure Summary ───────────────────────────────────────
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

    // ── 5. The 4 Round Operations ────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The Four Transformation Steps',
      html: `<p class="ex-p">Each standard round of AES consists of four distinct layer operations performed on the State Matrix:</p>`,
    },
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <ul class="ex-list">
            <li>
              <strong>1. SubBytes (Non-linear Substitution):</strong>
              Each byte in the State is independently replaced using a fixed lookup table called the <code>S-Box</code>. This provides non-linearity ("confusion" in Shannon's terminology) so that the relationship between key bits and ciphertext bits can't be approximated by simple linear algebra.
            </li>
            <li>
              <strong>2. ShiftRows (Permutation):</strong>
              The bytes in each row of the State are cyclically shifted left by an offset equal to the row index:
              <br>• Row 0: shifted <strong>0</strong> positions
              <br>• Row 1: shifted <strong>1</strong> position
              <br>• Row 2: shifted <strong>2</strong> positions
              <br>• Row 3: shifted <strong>3</strong> positions
            </li>
            <li>
              <strong>3. MixColumns (Diffusion):</strong>
              Each column of 4 bytes is treated as a polynomial and multiplied by a fixed polynomial over <code>GF(2⁸)</code>, implemented as a matrix multiplication. This is what produces the <strong>avalanche effect</strong>: changing a single input byte changes every byte of its column after just one round, and — combined with ShiftRows moving bytes between columns — eventually affects the entire state within a couple of rounds.
            </li>
            <li>
              <strong>4. AddRoundKey (Key Injection):</strong>
              A 128-bit round key, derived from the main key via the <strong>key schedule</strong>, is combined with the State using bitwise XOR (<code>&oplus;</code>). This is the only step that actually depends on the secret key — every other step is a fixed, public transformation.
            </li>
          </ul>
        </div>
      `,
    },

    // ── 6. GF(2^8) Arithmetic ─────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Why "GF(2⁸)"? The Arithmetic Behind SubBytes and MixColumns',
      html: `
        <p class="ex-p">AES bytes aren't manipulated with ordinary integer arithmetic — addition is bitwise XOR, and multiplication is done modulo the irreducible polynomial <code>x⁸ + x⁴ + x³ + x + 1</code> (0x11B in hex). Working in this finite field, <strong>every non-zero byte has a unique multiplicative inverse</strong>, and the S-Box is built directly from that fact:</p>
      `,
    },
    {
      kind: 'formula',
      title: 'S-Box Construction',
      lines: [
        'Step 1 — Multiplicative inverse:   b⁻¹ in GF(2⁸), with 0⁻¹ defined as 0',
        'Step 2 — Affine transformation:',
        '   sᵢ′ = sᵢ ⊕ s₍ᵢ₊₄₎ ⊕ s₍ᵢ₊₅₎ ⊕ s₍ᵢ₊₆₎ ⊕ s₍ᵢ₊₇₎ ⊕ cᵢ   (indices mod 8, c = 0x63)',
      ],
      note: 'This nonlinear inversion step is exactly what makes the S-Box resistant to linear and differential cryptanalysis — a simple XOR or lookup table alone would not have this property.',
    },
    {
      kind: 'table',
      title: 'The AES S-Box (computed directly from the definition above)',
      desc: 'Look up a byte using its high nibble (row) and low nibble (column). For example, byte 0x53 maps to row 5, column 3 → 0xED.',
      label: 'S-Box[row][col]',
      columns: sboxColumns,
      rows: sboxRows,
    },

    // ── 7. Key Schedule ───────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The Key Schedule',
      html: `
        <p class="ex-p">AES doesn't reuse the same key for every round — it expands the original cipher key into a series of <strong>round keys</strong>, one 128-bit key per round plus one extra for the initial AddRoundKey. For AES-128, the key is treated as four 32-bit words <code>w₀..w₃</code>, and every subsequent word is generated from the one before it:</p>
        <ul class="ex-list">
          <li><strong>RotWord:</strong> cyclically rotate a 4-byte word left by one byte, e.g. <code>[a,b,c,d] → [b,c,d,a]</code>.</li>
          <li><strong>SubWord:</strong> apply the S-Box to each of the 4 bytes independently.</li>
          <li><strong>Rcon:</strong> a round constant that XORs into the first byte only, preventing the schedule from having any exploitable symmetry between rounds.</li>
        </ul>
      `,
    },
    {
      kind: 'formula',
      title: 'Key Expansion (every 4th word)',
      lines: [
        'wᵢ = w₍ᵢ₋₄₎ ⊕ SubWord(RotWord(w₍ᵢ₋₁₎)) ⊕ Rcon[i/4]    when i is a multiple of 4',
        'wᵢ = w₍ᵢ₋₄₎ ⊕ w₍ᵢ₋₁₎                                   otherwise',
      ],
      note: `Rcon values (hex): ${RCON.slice(1, 8).map((v) => `0x${hex2(v)}`).join(', ')}, ... — successive powers of x in GF(2⁸).`,
    },
    {
      kind: 'formula',
      title: 'Worked Example (FIPS-197 Appendix A test vector)',
      lines: [
        `Cipher Key:  ${FIPS_KEY}`,
        'w₀=00010203  w₁=04050607  w₂=08090a0b  w₃=0c0d0e0f',
        '',
        'RotWord(w₃) = 0d0e0f0c',
        'SubWord(0d0e0f0c) = d7ab76fe   (S-Box lookups: d→d7, e→ab, f→76, c→fe)',
        'Rcon[1] = 01000000',
        '',
        'w₄ = w₀ ⊕ d7ab76fe ⊕ 01000000 = d6aa74fd',
      ],
      note: 'This exact result (d6aa74fd) is the published value in FIPS-197 — a good way to sanity-check any AES implementation you write yourself.',
    },

    // ── 8. Standard Round Execution Order ────────────────────────────────
    {
      kind: 'formula',
      title: 'Full Round Sequence',
      lines: [
        'Initial State:   AddRoundKey(State, w[0..3])',
        'Rounds 1 to N-1: SubBytes → ShiftRows → MixColumns → AddRoundKey',
        'Final Round N:   SubBytes → ShiftRows → AddRoundKey  (MixColumns is omitted!)'
      ],
      note: 'The final round omits MixColumns so that encryption and decryption hardware structures stay symmetric — otherwise the inverse cipher would need an extra, asymmetric final step.',
    },

    // ── 9. Interactive Round Visualizer ──────────────────────────────────
    {
      kind: 'custom',
      title: 'Interactive AES Round Visualizer',
      desc: 'Step through SubBytes, ShiftRows, MixColumns, and AddRoundKey on a real 16-byte state, using the exact GF(2⁸) arithmetic defined above. Defaults are the FIPS-197 Appendix B example values, so you can check every intermediate result against the published standard.',
      html: `
        <style>
          .aes-sim-wrap { display: flex; flex-direction: column; gap: 14px; }
          .aes-sim-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
          .aes-sim-row label { min-width: 100px; font-size: 0.85rem; color: #aaa; }
          .aes-step-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
          .aes-state-grid { display: flex; flex-direction: column; gap: 4px; margin-top: 10px; width: fit-content; }
          .aes-state-row { display: flex; gap: 4px; }
          .aes-state-cell {
            width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 4px; font-family: monospace; font-size: 0.95rem; color: var(--accent-color, #4da6ff);
            font-weight: 600;
          }
          #aes-step-note { font-size: 0.85rem; color: #a0a0a0; min-height: 1.4em; margin-top: 4px; }
        </style>
        <div class="aes-sim-wrap">
          <div class="aes-sim-row">
            <label for="aes-state-input">State (hex):</label>
            <input id="aes-state-input" class="ex-hex-input" type="text" value="${FIPS_PLAINTEXT}" maxlength="32" style="flex:1; min-width:260px; font-family:monospace;" />
          </div>
          <div class="aes-sim-row">
            <label for="aes-key-input">Round Key (hex):</label>
            <input id="aes-key-input" class="ex-hex-input" type="text" value="${FIPS_KEY}" maxlength="32" style="flex:1; min-width:260px; font-family:monospace;" />
          </div>
          <div class="aes-step-buttons">
            <button id="aes-btn-reset" class="ex-btn-secondary btn-reroll">↺ Reset State</button>
            <button id="aes-btn-subbytes" class="ex-btn btn-check">SubBytes</button>
            <button id="aes-btn-shiftrows" class="ex-btn btn-check">ShiftRows</button>
            <button id="aes-btn-mixcolumns" class="ex-btn btn-check">MixColumns</button>
            <button id="aes-btn-addroundkey" class="ex-btn btn-check">AddRoundKey</button>
          </div>
          <div id="aes-step-note">Loaded initial state. Click a transformation to apply it.</div>
          <div id="aes-state-display"></div>
        </div>
      `,
      init(container) {
        const stateInput = container.querySelector('#aes-state-input');
        const keyInput = container.querySelector('#aes-key-input');
        const grid = container.querySelector('#aes-state-display');
        const stepNote = container.querySelector('#aes-step-note');

        let state = hexToBytes16(stateInput.value) || hexToBytes16(FIPS_PLAINTEXT);

        function draw(note) {
          grid.innerHTML = renderStateGrid(state);
          if (note) stepNote.textContent = note;
        }

        function subBytes() {
          state = state.map((b) => SBOX[b]);
          draw('SubBytes applied: each byte replaced via the S-Box (non-linear substitution).');
        }

        function shiftRows() {
          const rows = [[], [], [], []];
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) rows[r][c] = state[c * 4 + r];
          for (let r = 1; r < 4; r++) rows[r] = rows[r].slice(r).concat(rows[r].slice(0, r));
          const next = new Array(16);
          for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) next[c * 4 + r] = rows[r][c];
          state = next;
          draw('ShiftRows applied: row r cyclically shifted left by r positions.');
        }

        function mixColumns() {
          const next = new Array(16);
          for (let c = 0; c < 4; c++) {
            const a = [state[c * 4], state[c * 4 + 1], state[c * 4 + 2], state[c * 4 + 3]];
            next[c * 4 + 0] = gmul(a[0], 2) ^ gmul(a[1], 3) ^ a[2] ^ a[3];
            next[c * 4 + 1] = a[0] ^ gmul(a[1], 2) ^ gmul(a[2], 3) ^ a[3];
            next[c * 4 + 2] = a[0] ^ a[1] ^ gmul(a[2], 2) ^ gmul(a[3], 3);
            next[c * 4 + 3] = gmul(a[0], 3) ^ a[1] ^ a[2] ^ gmul(a[3], 2);
          }
          state = next;
          draw('MixColumns applied: each column mixed via GF(2⁸) matrix multiplication (diffusion).');
        }

        function addRoundKey() {
          const key = hexToBytes16(keyInput.value);
          if (!key) {
            stepNote.textContent = 'Round key must be exactly 32 hex characters (16 bytes).';
            return;
          }
          state = state.map((b, i) => b ^ key[i]);
          draw('AddRoundKey applied: state XORed with the round key.');
        }

        container.querySelector('#aes-btn-subbytes').addEventListener('click', subBytes);
        container.querySelector('#aes-btn-shiftrows').addEventListener('click', shiftRows);
        container.querySelector('#aes-btn-mixcolumns').addEventListener('click', mixColumns);
        container.querySelector('#aes-btn-addroundkey').addEventListener('click', addRoundKey);
        container.querySelector('#aes-btn-reset').addEventListener('click', () => {
          const parsed = hexToBytes16(stateInput.value);
          if (!parsed) {
            stepNote.textContent = 'State must be exactly 32 hex characters (16 bytes).';
            return;
          }
          state = parsed;
          draw('State reset from input.');
        });

        draw();
      },
    },

    // ── 10. Check Your Understanding Exercises ────────────────────────────
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
        {
          num: '4.3',
          title: 'S-Box Lookup',
          bodyHtml: `<p class="ex-p">Using the S-Box table above, what does byte <code>0x9A</code> map to? (Enter as 2 hex digits, e.g. <code>ab</code>)</p>`,
          input: { type: 'hex', placeholder: 'e.g. b8' },
          parse: (raw) => {
            const clean = String(raw).trim().replace(/^0x/i, '');
            if (!/^[0-9a-fA-F]{1,2}$/.test(clean)) return null;
            return parseInt(clean, 16);
          },
          check: (val) => {
            const expected = SBOX[0x9a];
            return val === expected
              ? { correct: true, message: `Correct! S-Box[0x9A] = 0x${hex2(expected)}.` }
              : { correct: false, message: 'Incorrect. Find row 9, column A in the S-Box table above.' };
          },
        },
      ],
    },
  ],
};

export default aesTheory;
