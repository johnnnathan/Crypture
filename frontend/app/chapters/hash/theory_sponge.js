export const spongeTheory = {
  id: 'sponge-theory',
  num: '05.2',
  tag: 'Theory',
  tagClass: 'hash',
  title: '05.2 — Sponge Functions & SHA-3',
  desc: 'An exploration of permutation-based hashing, the sponge construction (absorbing and squeezing phases), Keccak, and Extendable Output Functions (XOFs).',
  concepts: [
    'Sponge Construction (Absorb & Squeezing)',
    'Rate ($r$) vs. Capacity ($c$)',
    'Keccak & FIPS 202 (SHA-3 Standard)',
    'Extendable Output Functions (XOFs / SHAKE)',
    'Duplexing & Keyed Sponges',
  ],
  topbarTitle: 'Chapter 05.2 — Sponge Functions',

  blocks: [
    // ── 1. Introduction & Context ─────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Beyond Merkle–Damgård: The Sponge Construction',
      html: `
        <p class="ex-p">Following cryptanalytic breakthroughs against MD5 and SHA-1 in the mid-2000s, NIST launched the <strong>SHA-3 competition</strong> in 2007 to select a next-generation standard.</p>
        <p class="ex-p">The winner, <strong>Keccak</strong> (standardized in 2015 as FIPS 202), introduced a fundamental design shift: moving away from block ciphers and Merkle–Damgård structures to a <strong>permutation-based sponge construction</strong>.</p>
      `,
    },
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <ul class="ex-list">
            <li>
              <strong>No Compression Function:</strong> Instead of compressing $n+k$ bits down to $n$ bits via key schedules, a sponge applies an unkeyed $b$-bit internal permutation $P$.
            </li>
            <li>
              <strong>Decoupled Security:</strong> Traditional hashes produce fixed-size outputs ($n$ bits). Sponges decouple output length from internal security parameters, enabling arbitrary-length outputs (Extendable Output Functions, or XOFs).
            </li>
          </ul>
        </div>
      `,
    },

    // ── 2. Mechanics of a Sponge ──────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Anatomy of a Sponge: Rate ($r$) and Capacity ($c$)',
      html: `
        <p class="ex-p">A sponge operates on an internal state of total width $b = r + c$ bits, initialized to all zeros:</p>
      `,
    },
    {
      kind: 'formula',
      title: 'Sponge Parameters & Security Bounds',
      lines: [
        'Permutation State Width:  b = r + c',
        'Rate (r):                 Bits absorbed/squeezed per permutation call',
        'Capacity (c):             Hidden internal state (Security parameter)',
        'Collision Security:       min(c / 2, n / 2)',
        'Preimage Security:        min(c / 2, n)',
      ],
      note: 'The capacity c is hidden from the outer world. Attacking the sponge requires roughly 2^(c/2) operations to force a collision in the inner state.',
    },
    {
      kind: 'text',
      html: `
        <p class="ex-p">Sponge execution consists of two distinct phases:</p>
        <ol class="ex-list">
          <li><strong>Absorbing Phase:</strong> The padded message is divided into $r$-bit blocks. Each block is XORed into the outer state (first $r$ bits), followed by applying the permutation $P$.</li>
          <li><strong>Squeezing Phase:</strong> The outer state (first $r$ bits) is read out as digest output. If more output bits are needed, the permutation $P$ is applied again to squeeze out the next $r$ bits.</li>
        </ol>
      `,
    },

    // ── 3. SHA-3 Standard & Keccak ────────────────────────────────────────
    {
      kind: 'table',
      label: 'FIPS 202 Variants (b = 1600-bit state)',
      columns: ['Variant', 'Type', 'Rate ($r$)', 'Capacity ($c$)', 'Output Size ($n$)'],
      rows: [
        ['<strong>SHA3-224</strong>', 'Hash', '1152 bits', '448 bits', '224 bits'],
        ['<strong>SHA3-256</strong>', 'Hash', '1088 bits', '512 bits', '256 bits'],
        ['<strong>SHA3-384</strong>', 'Hash', '832 bits', '768 bits', '384 bits'],
        ['<strong>SHA3-512</strong>', 'Hash', '576 bits', '1024 bits', '512 bits'],
        ['<strong>SHAKE128</strong>', 'XOF', '1344 bits', '256 bits', 'Variable ($\infty$)'],
        ['<strong>SHAKE256</strong>', 'XOF', '1088 bits', '512 bits', 'Variable ($\infty$)'],
      ],
    },

    // ── 4. Keyed Sponges & Authenticated Encryption ────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Keyed Sponges & The Duplex Construction',
      html: `
        <p class="ex-p">By injecting a secret key $K$ during initialization, sponges easily transform into Message Authentication Codes (MACs) and Pseudorandom Functions (PRFs): $\text{MAC}(K, M) = \text{Sponge}(K \parallel M)$.</p>
        <p class="ex-p">By alternating between absorbing and squeezing at each step (the <strong>Duplex Construction</strong>), sponge designs support single-pass <strong>Authenticated Encryption with Associated Data (AEAD)</strong>—such as in <strong>Ascon</strong> (NIST Lightweight Cryptography Winner).</p>
      `,
    },

    // ── 5. Exercises ──────────────────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Check Your Understanding',
      items: [
        {
          num: '5.2.1',
          title: 'Sponge Security Level',
          bodyHtml: `<p class="ex-p">If a sponge function uses a capacity $c = 512$ bits, what is its maximum generic security against collision attacks (in bits)?</p>`,
          input: { type: 'number', placeholder: 'e.g. 256' },
          parse: (val) => parseInt(val, 10),
          check: (val) => val === 256
            ? { correct: true, message: 'Correct! Generic collision security of a sponge is capped at c / 2 = 256 bits.' }
            : { correct: false, message: 'Incorrect. Collision security bound for capacity c is min(c / 2, n / 2).' },
        },
        {
          num: '5.2.2',
          title: 'Sponge Terminology',
          bodyHtml: `<p class="ex-p">What is the parameter $r$ called in a sponge construction?</p>`,
          input: {
            type: 'mc',
            options: [
              { value: 'capacity', label: 'Capacity' },
              { value: 'rate', label: 'Rate' },
              { value: 'width', label: 'State Width' },
              { value: 'round', label: 'Round Constant' },
            ],
          },
          check: (val) => val === 'rate'
            ? { correct: true, message: 'Correct! The rate (r) defines how many message bits are absorbed or squeezed per permutation call.' }
            : { correct: false, message: 'Incorrect. $r$ represents the Rate, while $c$ represents the Capacity.' },
        },
        {
          num: '5.2.3',
          title: 'XOF Definition',
          bodyHtml: `<p class="ex-p">What does <strong>XOF</strong> stand for in modern hashing standards like SHAKE128?</p>`,
          input: {
            type: 'mc',
            options: [
              { value: 'xof_1', label: 'eXtra Output Format' },
              { value: 'xof_2', label: 'eXtendable Output Function' },
              { value: 'xof_3', label: 'XOR Outer Function' },
              { value: 'xof_4', label: 'eXternal Operation Offset' },
            ],
          },
          check: (val) => val === 'xof_2'
            ? { correct: true, message: 'Correct! XOFs produce arbitrary-length output digests on demand.' }
            : { correct: false, message: 'Incorrect. XOF stands for eXtendable Output Function.' },
        },
      ],
    },
  ],
};

export default spongeTheory;
