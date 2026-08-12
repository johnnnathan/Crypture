// ── Hash Function Math & Dynamic Constant Derivation ───────────────────────
// Every initial hash value (IV) and round constant below is *derived*, not 
// hard-coded from a textbook table:
// SHA-256 uses fractional parts of square roots and cube roots of primes.
// MD5 uses binary integer parts of sines of integers.

// --- SHA-256 Math Helper ---
function isPrime(n) {
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return n > 1;
}

function getPrimes(count) {
  const primes = [];
  let num = 2;
  while (primes.length < count) {
    if (isPrime(num)) primes.push(num);
    num++;
  }
  return primes;
}

// Derive SHA-256 Initial Hash Values (First 32 bits of fractional parts of sqrt of first 8 primes)
const SHA256_H0 = getPrimes(8).map((p) => {
  const frac = Math.sqrt(p) % 1;
  return Math.floor(frac * 0x100000000) >>> 0;
});

// Derive SHA-256 Round Constants K (First 32 bits of fractional parts of cbrt of first 64 primes)
const SHA256_K = getPrimes(64).map((p) => {
  const frac = Math.cbrt(p) % 1;
  return Math.floor(frac * 0x100000000) >>> 0;
});

// Derive MD5 Constants T (floor(4294967296 * |sin(i)|))
const MD5_K = Array.from({ length: 64 }, (_, i) => 
  Math.floor(4294967296 * Math.abs(Math.sin(i + 1))) >>> 0
);

const MD5_IV = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

// Helper Functions
function hex8(n) {
  return (n >>> 0).toString(16).padStart(8, '0');
}

function rotr(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function rotl(x, n) {
  return (x << n) | (x >>> (32 - n));
}

// ── SHA-256 Core Step Functions ───────────────────────────────────────────
function sha256CompressStep(state, w, r) {
  const [a, b, c, d, e, f, g, h] = state;
  
  const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
  const ch = (e & f) ^ (~e & g);
  const temp1 = (h + S1 + ch + SHA256_K[r] + w[r]) >>> 0;
  
  const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
  const maj = (a & b) ^ (a & c) ^ (b & c);
  const temp2 = (S0 + maj) >>> 0;

  return [
    (temp1 + temp2) >>> 0, // new A
    a,                     // new B
    b,                     // new C
    c,                     // new D
    (d + temp1) >>> 0,     // new E
    e,                     // new F
    f,                     // new G
    g                      // new H
  ];
}

// Format 32-bit state registers into grid HTML
function renderRegisterGrid(regs, labels) {
  let html = '<div class="hash-state-grid">';
  for (let i = 0; i < regs.length; i++) {
    html += `
      <div class="hash-state-cell-wrap">
        <span class="hash-reg-label">${labels[i]}</span>
        <div class="hash-state-cell">${hex8(regs[i]).toUpperCase()}</div>
      </div>`;
  }
  html += '</div>';
  return html;
}

export const hashTheory = {
  id: 'hash-theory',
  num: '05.1',
  tag: 'Theory',
  tagClass: 'hash',
  title: '05 — Cryptographic Hash Functions',
  desc: 'An exploration of cryptographic hash functions: properties, Merkle–Damgård construction, collision resistance, and the inner mechanics of MD5 and SHA-256.',
  concepts: [
    'One-Way Functions & Preimage Resistance',
    'Collision & Second Preimage Resistance',
    'The Avalanche Effect',
    'Merkle–Damgård Construction',
    'MD5 & SHA-256 Architecture',
  ],
  topbarTitle: 'Chapter 05 — Hash Functions',

  blocks: [
    // ── 1. Abstract Overview ──────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'What is a Cryptographic Hash Function?',
      html: `
        <p class="ex-p">A <strong>cryptographic hash function</strong> is a deterministic algorithm that takes an arbitrary block of data (a text message, an executable file, or a full disk image) and returns a fixed-size bit string known as the <strong>hash value</strong>, <strong>digest</strong>, or <strong>fingerprint</strong>.</p>
        <p class="ex-p">Unlike encryption algorithms (such as AES), which are design-engineered to be reversible given a secret key, hash functions are strictly <strong>one-way functions</strong>. There is no decryption key because information is deliberately compressed and destroyed during hashing.</p>
        <p class="ex-p">To be suitable for cryptographic applications (such as digital signatures, password verification, and message integrity checks), a hash function must satisfy three essential security properties:</p>
      `,
    },
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <ul class="ex-list">
            <li>
              <strong>1. Preimage Resistance (One-Way Property):</strong>
              Given a hash output $H$, it is computationally infeasible to find any original input $M$ such that $\text{Hash}(M) = H$.
            </li>
            <li>
              <strong>2. Second Preimage Resistance (Weak Collision Resistance):</strong>
              Given an input $M_1$, it is computationally infeasible to find a different input $M_2 \neq M_1$ such that $\text{Hash}(M_1) = \text{Hash}(M_2)$.
            </li>
            <li>
              <strong>3. Collision Resistance (Strong Collision Resistance):</strong>
              It is computationally infeasible to find <em>any</em> two distinct inputs $M_1$ and $M_2$ such that $\text{Hash}(M_1) = \text{Hash}(M_2)$.
            </li>
          </ul>
        </div>
      `,
    },

    // ── 2. The Avalanche Effect & Birthday Attack ─────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The Avalanche Effect & The Birthday Paradox',
      html: `
        <p class="ex-p">A key indicator of hash quality is the <strong>avalanche effect</strong>: changing even a single bit in the input message should flip roughly 50% of the output bits in an unpredictable pattern. This prevents attackers from making small, structural tweaks to a file without drastically altering its digest.</p>
        <p class="ex-p">When evaluating collision resistance, cryptanalysts rely on the <strong>Birthday Paradox</strong>. Due to probability theory, finding <em>any</em> collision among random inputs requires significantly fewer attempts than finding an input that matches a specific, pre-determined digest.</p>
      `,
    },
    {
      kind: 'formula',
      title: 'Collision Complexity (Birthday Bound)',
      lines: [
        'Digest length in bits:    n',
        'Preimage Attack Search:   2ⁿ operations',
        'Collision Attack Search:  2ⁿ/² operations',
      ],
      note: 'For a 128-bit hash like MD5, finding a collision requires only roughly 2⁶⁴ operations—a threshold easily surpassed by modern parallel hardware.',
    },

    // ── 3. Merkle-Damgård Construction ──────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Iterative Hashing: The Merkle–Damgård Construction',
      html: `
        <p class="ex-p">Most classic hash functions (including MD5, SHA-1, and the SHA-2 family) process arbitrary-length messages using the <strong>Merkle–Damgård construction</strong>:</p>
        <ol class="ex-list">
          <li><strong>Padding:</strong> The message is appended with padding bits and a binary representation of its original length, ensuring the total length is a multiple of a fixed block size (e.g., 512 bits).</li>
          <li><strong>Block Splitting:</strong> The padded message is divided into sequential blocks: $M_1, M_2, \dots, M_k$.</li>
          <li><strong>Compression Function:</strong> An initial internal state (Initialization Vector, $IV$) is updated sequentially by a compression function $f$: $H_i = f(H_{i-1}, M_i)$.</li>
        </ol>
      `,
    },

    // ── 4. Popular Implementations: MD5 vs SHA ───────────────────────────
    {
      kind: 'table',
      label: 'Comparison of Popular Cryptographic Hashes',
      columns: ['Algorithm', 'Digest Size', 'Block Size', 'Round Operations', 'Current Security Status'],
      rows: [
        ['<strong>MD5</strong>', '128 bits (16 B)', '512 bits (64 B)', '64 rounds (4 operations: F, G, H, I)', '<strong>Cryptographically Broken</strong> (collisions in seconds)'],
        ['<strong>SHA-1</strong>', '160 bits (20 B)', '512 bits (64 B)', '80 rounds', '<strong>Broken</strong> (practical collision attacks demonstrated)'],
        ['<strong>SHA-256</strong>', '256 bits (32 B)', '512 bits (64 B)', '64 rounds ($\Sigma, \sigma$, Ch, Maj)', '<strong>Secure</strong> (standard industrial default)'],
        ['<strong>SHA-512</strong>', '512 bits (64 B)', '1024 bits (128 B)', '80 rounds (64-bit words)', '<strong>Secure</strong> (high-performance on 64-bit platforms)'],
      ],
    },

    // ── 5. Specifics: MD5 Mechanics ───────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'MD5 (Message-Digest Algorithm 5)',
      html: `
        <p class="ex-p">Designed by Ronald Rivest in 1991, MD5 processes messages in 512-bit blocks using a 128-bit state split across four 32-bit registers ($A, B, C, D$). It operates in 4 rounds of 16 steps each, using four non-linear functions:</p>
      `,
    },
    {
      kind: 'formula',
      title: 'MD5 Bitwise Non-linear Functions',
      lines: [
        'F(X, Y, Z) = (X ∧ Y) ∨ (¬X ∧ Z)',
        'G(X, Y, Z) = (X ∧ Z) ∨ (Y ∧ ¬Z)',
        'H(X, Y, Z) = X ⊕ Y ⊕ Z',
        'I(X, Y, Z) = Y ⊕ (X ∨ ¬Z)',
      ],
      note: 'Why MD5 Failed: Its compression function lacks sufficient differential cryptanalysis protection, enabling full collision generation on standard hardware in fractions of a second.',
    },

    // ── 6. Specifics: SHA-256 Mechanics ────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'SHA-256 (Secure Hash Algorithm 256-bit)',
      html: `
        <p class="ex-p">Published by the NSA under NIST standards in 2001, SHA-256 uses an 8-word state ($A, B, C, D, E, F, G, H$) initialized from mathematical constants derived from prime numbers:</p>
      `,
    },
    {
      kind: 'formula',
      title: 'Mathematical Derivation of SHA-256 Constants',
      lines: [
        'IV (H₀..H₇): First 32 bits of fractional parts of √(first 8 primes [2..19])',
        'K₀..K₆₃:     First 32 bits of fractional parts of ∛(first 64 primes [2..311])',
      ],
      note: 'This "nothing-up-my-sleeve" derivation guarantees that no intentional mathematical backdoors were inserted into the constants.',
    },

    // ── 7. Interactive Visualizer ─────────────────────────────────────────
    {
      kind: 'custom',
      title: 'Interactive SHA-256 Round Visualizer',
      desc: 'Step through the 64 compression rounds of SHA-256 for a single message block. Observe how the 8 internal registers (A–H) mutate under bitwise rotations, Ch (Choose), and Maj (Majority) functions.',
      html: `
        <style>
          .hash-sim-wrap { display: flex; flex-direction: column; gap: 14px; }
          .hash-sim-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
          .hash-state-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
          .hash-state-cell-wrap { display: flex; flex-direction: column; gap: 2px; }
          .hash-reg-label { font-size: 0.75rem; color: #888; font-weight: bold; text-align: center; }
          .hash-state-cell {
            height: 38px; display: flex; align-items: center; justify-content: center;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: var(--accent-color, #4da6ff);
            font-weight: 600;
          }
          #hash-step-note { font-size: 0.85rem; color: #a0a0a0; min-height: 1.4em; margin-top: 4px; }
        </style>
        <div class="hash-sim-wrap">
          <div class="hash-sim-controls">
            <button id="hash-btn-reset" class="ex-btn-secondary btn-reroll">↺ Reset (Round 0)</button>
            <button id="hash-btn-step" class="ex-btn btn-check">Step 1 Round ➔</button>
            <button id="hash-btn-run" class="ex-btn btn-check">Fast Forward All 64 Rounds</button>
          </div>
          <div id="hash-step-note">Initialized state with H₀..H₇ constants. Ready to compress.</div>
          <div id="hash-state-display"></div>
        </div>
      `,
      init(container) {
        const grid = container.querySelector('#hash-state-display');
        const stepNote = container.querySelector('#hash-step-note');

        let currentRound = 0;
        let state = [...SHA256_H0];
        
        // Mock message schedule (64 x 32-bit words derived for "abc")
        const W = Array.from({ length: 64 }, (_, i) => (0x61626300 + i) >>> 0);

        function draw(note) {
          const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
          grid.innerHTML = renderRegisterGrid(state, labels);
          if (note) stepNote.textContent = note;
        }

        function step() {
          if (currentRound >= 64) {
            stepNote.textContent = 'Already reached round 64. Click Reset to start over.';
            return;
          }
          state = sha256CompressStep(state, W, currentRound);
          currentRound++;
          draw(`Applied SHA-256 Compression Round ${currentRound}/64 with K[${currentRound - 1}] = 0x${hex8(SHA256_K[currentRound - 1])}.`);
        }

        container.querySelector('#hash-btn-step').addEventListener('click', step);
        container.querySelector('#hash-btn-run').addEventListener('click', () => {
          while (currentRound < 64) {
            state = sha256CompressStep(state, W, currentRound);
            currentRound++;
          }
          draw('Completed all 64 rounds. Final state ready for addition to IV.');
        });
        container.querySelector('#hash-btn-reset').addEventListener('click', () => {
          currentRound = 0;
          state = [...SHA256_H0];
          draw('Reset state back to initial constants (Round 0).');
        });

        draw();
      },
    },

    // ── 8. Check Your Understanding Exercises ────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Check Your Understanding',
      items: [
        {
          num: '5.1',
          title: 'SHA-256 Digest Length',
          bodyHtml: `<p class="ex-p">What is the output length of a <strong>SHA-256</strong> digest in bits?</p>`,
          input: { type: 'number', placeholder: 'e.g. 256' },
          parse: (val) => parseInt(val, 10),
          check: (val) => val === 256
            ? { correct: true, message: 'Correct! SHA-256 outputs exactly 256 bits (32 bytes).' }
            : { correct: false, message: 'Incorrect. Remember: SHA-256 produces a 256-bit hash, whereas MD5 produces 128 bits.' },
        },
        {
          num: '5.2',
          title: 'Hash Property Identification',
          bodyHtml: `<p class="ex-p">Which security property specifies that it should be practically impossible to find <em>any two distinct inputs</em> $M_1 \neq M_2$ that yield the exact same digest?</p>`,
          input: {
            type: 'mc',
            options: [
              { value: 'preimage', label: 'Preimage Resistance' },
              { value: 'second_preimage', label: 'Second Preimage Resistance' },
              { value: 'collision', label: 'Collision Resistance' },
              { value: 'avalanche', label: 'Avalanche Resistance' },
            ],
          },
          check: (val) => val === 'collision'
            ? { correct: true, message: 'Correct! Collision Resistance ensures no two arbitrary inputs share a common hash.' }
            : { correct: false, message: 'Incorrect. Finding *any* arbitrary pair of colliding inputs is governed by Collision Resistance.' },
        },
        {
          num: '5.3',
          title: 'Constant Derivation',
          bodyHtml: `<p class="ex-p">From what mathematical sequence are the round constants ($K$) of SHA-256 derived?</p>`,
          input: {
            type: 'mc',
            options: [
              { value: 'pi', label: 'Fractional bits of Pi (π)' },
              { value: 'cbrt_primes', label: 'Cube roots of the first 64 prime numbers' },
              { value: 'sqrt_primes', label: 'Square roots of the first 8 prime numbers' },
              { value: 'sine', label: 'Binary sine function values' },
            ],
          },
          check: (val) => val === 'cbrt_primes'
            ? { correct: true, message: 'Correct! SHA-256 $K$ constants are derived from the fractional parts of the cube roots of the first 64 primes.' }
            : { correct: false, message: 'Incorrect. Check the "Mathematical Derivation of SHA-256 Constants" formula block above.' },
        },
      ],
    },
  ],
};

export default hashTheory;
