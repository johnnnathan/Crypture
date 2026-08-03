import { hex, ascii } from '../../exercise-kit.js';

export const cryptoFoundations = {
  id: 'foundations',
  num: '00',
  tag: 'Foundations',
  tagClass: 'foundations', // Make sure to add styling for .foundations if needed
  title: '00 — Cryptographic Terminology & Notation',
  desc: 'Core definitions: Plaintext, Ciphertext, Keys, and the fundamental model of Symmetric Encryption.',
  concepts: ['Plaintext & Ciphertext', 'Symmetric Encryption', 'Basic Notation'],
  topbarTitle: 'Chapter 00 — Foundations',

  blocks: [
    // ── 1. Core Terminology ───────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Core Terminology',
      html: `
        <p class="ex-p">Before diving into mathematical primitives and bit operations, we must establish standard terminology used across modern cryptography:</p>
        <ul class="ex-list">
          <li><strong>Plaintext ($P$ or $M$):</strong> The original, unencrypted message or data in readable form.</li>
          <li><strong>Ciphertext ($C$):</strong> The encrypted message produced by an algorithm. It should look indistinguishable from random noise to an eavesdropper.</li>
          <li><strong>Key ($K$):</strong> A secret value (a number, string, or byte array) that controls the encryption and decryption processes.</li>
          <li><strong>Cipher:</strong> The algorithm or mathematical function used to perform encryption and decryption.</li>
        </ul>`,
    },

    // ── 2. The Symmetric Model ────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Symmetric Encryption Model',
      html: `
        <p class="ex-p">In <strong>symmetric encryption</strong>, the <em>same secret key</em> is used for both encryption and decryption. Both sender (Alice) and receiver (Bob) must securely share this key beforehand.</p>
        <p class="ex-p">According to <strong>Kerckhoffs's Principle</strong>, a cryptographic system should be secure even if everything about the system (including the algorithm itself) is public knowledge—except for the key.</p>`,
    },
    {
      kind: 'formula',
      lines: [
        'Encryption:  C = E(K, P)',
        'Decryption:  P = D(K, C)'
      ],
      note: 'E represents the encryption function, D represents decryption, K is the secret key.',
    },

    // ── 3. Notation Reference Table ───────────────────────────────────────
    {
      kind: 'text',
      heading: 'h3',
      title: 'Standard Notation Reference',
      html: `<p class="ex-p">Symbols you will see throughout these exercises:</p>`,
    },
    {
      kind: 'table',
      label: 'Notation Table',
      columns: ['Symbol', 'Meaning', 'Example'],
      rows: [
        ['<code>P</code> or <code>M</code>', 'Plaintext / Message', '<code>"HELLO"</code> or <code>0x48 0x45</code>'],
        ['<code>C</code>', 'Ciphertext', '<code>0xA3 0x1F</code>'],
        ['<code>K</code>', 'Secret Key', '<code>0x3F</code>'],
        ['<code>E_K(P)</code>', 'Encrypt P using key K', '<code>E_K("HELLO")</code>'],
        ['<code>D_K(C)</code>', 'Decrypt C using key K', '<code>D_K(C) = P</code>'],
        ['<code>⊕</code>', 'Bitwise XOR operation', '<code>1 ⊕ 0 = 1</code>'],
        ['<code>||</code>', 'Concatenation', '<code>"A" || "B" = "AB"</code>'],
      ],
    },

    // ── 4. Quick Check Exercises ──────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Check Your Understanding',
      items: [
        {
          num: '0.1',
          title: 'Encryption Inverse Property',
          bodyHtml: `<p class="ex-p">If Alice encrypts plaintext $P$ with key $K$ to get $C = E_K(P)$, what operation must Bob perform on $C$ to recover $P$?</p>`,
          input: { type: 'mc', options: [
            { label: 'E_K(C)', value: 'enc' },
            { label: 'D_K(C)', value: 'dec' },
            { label: 'C ⊕ P', value: 'xor' },
          ]},
          check: (val) => val === 'dec'
            ? { correct: true, message: 'Correct! Decrypting the ciphertext with the same key restores the original plaintext: D_K(C) = P.' }
            : { correct: false, message: 'Not quite. Decryption D using key K is the inverse function of encryption E.' },
        },
        {
          num: '0.2',
          title: 'Kerckhoffs\'s Principle',
          bodyHtml: `<p class="ex-p">According to Kerckhoffs's Principle, where does the security of a modern cipher reside?</p>`,
          input: { type: 'mc', options: [
            { label: 'In keeping the cipher algorithm secret', value: 'algo' },
            { label: 'In keeping the key secret', value: 'key' },
            { label: 'In making the plaintext hard to guess', value: 'plain' },
          ]},
          check: (val) => val === 'key'
            ? { correct: true, message: 'Correct! Security relies solely on keeping the key secret, even if the algorithm is publicly known.' }
            : { correct: false, message: 'Remember: "Security through obscurity" (hiding the algorithm) fails. Security must reside strictly in the key.' },
        },
      ],
    },
  ],
};

export default cryptoFoundations;
