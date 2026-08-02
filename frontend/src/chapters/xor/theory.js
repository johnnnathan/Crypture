import { bin, hex, ascii, parseBinaryByte } from '../../exercise-kit.js';

export const xorTheory = {
  id: 'xor-theory',
  num: '01.1',
  tag: 'XOR Gate',
  tagClass: 'xor',
  title: 'XOR — The Fundamental Cipher Primitive',
  desc: 'Truth table, bit-level mechanics, known-plaintext key recovery, and the devastating consequences of one-time pad key reuse.',
  concepts: ['Bit operations', 'Key recovery', 'Key-reuse attack'],
  topbarTitle: 'Exercise 01 — XOR',

  blocks: [
    // ── 1. Conceptual Intro ───────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'The XOR Operation',
      html: `
        <p class="ex-p">XOR (exclusive-or, written <strong>⊕</strong>) operates on individual bits. The output is <strong>1</strong> when the two input bits differ, and <strong>0</strong> when they match. Applied to bytes, it works column by column across all 8 bit positions simultaneously.</p>
        <p class="ex-p">Two properties make XOR central to cryptography:</p>
        <ul class="ex-list">
          <li><strong>Self-inverse:</strong> <code>A ⊕ B ⊕ B = A</code>. Applying XOR with the same value twice restores the original — so the same operation encrypts and decrypts.</li>
          <li><strong>Commutativity and associativity:</strong> <code>A ⊕ B = B ⊕ A</code>, and grouping doesn't matter. This lets us rearrange equations to recover unknowns.</li>
        </ul>`,
    },

    // ── 2. Formula ────────────────────────────────────────────────────────
    {
      kind: 'formula',
      lines: ['Encrypt:  C = P ⊕ K', 'Decrypt:  P = C ⊕ K'],
      note: 'If C = P ⊕ K, then C ⊕ K = P ⊕ K ⊕ K = P ⊕ 0 = P.',
    },

    // ── 3. Tables ─────────────────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h3',
      title: 'Bit Interaction Table',
      html: `<p class="ex-p">How every combination of two input bits produces an output. The defining rule: output is 1 only when inputs differ.</p>`,
    },
    {
      kind: 'tablesRow',
      tables: [
        {
          label: 'XOR Truth Table',
          columns: ['A', 'B', 'A ⊕ B'],
          rows: [
            ['0', '0', '<span class="bit-0">0</span>'],
            ['0', '1', '<span class="bit-1">1</span>'],
            ['1', '0', '<span class="bit-1">1</span>'],
            ['1', '1', '<span class="bit-0">0</span>'],
          ],
        },
        {
          label: 'XOR vs AND vs OR',
          columns: ['A', 'B', 'A AND B', 'A OR B', 'A XOR B'],
          rows: [
            ['0', '0', '0', '0', '<span class="bit-0">0</span>'],
            ['0', '1', '0', '1', '<span class="bit-1">1</span>'],
            ['1', '0', '0', '1', '<span class="bit-1">1</span>'],
            ['1', '1', '1', '1', '<span class="bit-0">0</span>'],
          ],
        },
      ],
    },

    // ── 4. Worked Examples ────────────────────────────────────────────────
    {
      kind: 'custom',
      html: `
        <div class="ex-examples-grid">
          <div class="ex-example">
            <div class="ex-example-label">Example 1 — 11111111 ⊕ 00001111</div>
            <div class="ex-bitrow"><span class="ex-bit-label">A</span><span class="xor-bits">1 1 1 1 1 1 1 1</span></div>
            <div class="ex-bitrow"><span class="ex-bit-label">B</span><span class="xor-bits">0 0 0 0 1 1 1 1</span></div>
            <div class="ex-bitrow-sep">⊕</div>
            <div class="ex-bitrow result"><span class="ex-bit-label">R</span><span class="xor-bits">1 1 1 1 0 0 0 0</span></div>
            <div class="ex-example-note">XOR with 00001111 flips the low nibble, preserves the high nibble.</div>
          </div>
          <div class="ex-example">
            <div class="ex-example-label">Example 2 — 10101011 ⊕ 10101011</div>
            <div class="ex-bitrow"><span class="ex-bit-label">A</span><span class="xor-bits">1 0 1 0 1 0 1 1</span></div>
            <div class="ex-bitrow"><span class="ex-bit-label">B</span><span class="xor-bits">1 0 1 0 1 0 1 1</span></div>
            <div class="ex-bitrow-sep">⊕</div>
            <div class="ex-bitrow result"><span class="ex-bit-label">R</span><span class="xor-bits">0 0 0 0 0 0 0 0</span></div>
            <div class="ex-example-note">A value XOR'd with itself is always 0. This is the self-inverse property.</div>
          </div>
          <div class="ex-example">
            <div class="ex-example-label">Example 3 — 01001000 ⊕ 00000000</div>
            <div class="ex-bitrow"><span class="ex-bit-label">A</span><span class="xor-bits">0 1 0 0 1 0 0 0</span></div>
            <div class="ex-bitrow"><span class="ex-bit-label">B</span><span class="xor-bits">0 0 0 0 0 0 0 0</span></div>
            <div class="ex-bitrow-sep">⊕</div>
            <div class="ex-bitrow result"><span class="ex-bit-label">R</span><span class="xor-bits">0 1 0 0 1 0 0 0</span></div>
            <div class="ex-example-note">XOR with 0 is the identity — output equals input. A zero key provides no encryption.</div>
          </div>
        </div>`,
    },

    // ── 5. Interactive Demo ───────────────────────────────────────────────
    {
      kind: 'custom',
      title: 'Interactive XOR',
      desc: 'Enter two 8-bit binary values to see the XOR computed bit by bit.',
      html: `
        <div class="ex-live-grid">
          <div class="ex-live-inputs">
            <div class="ex-live-row">
              <span class="ex-live-label">A</span>
              <input id="xor-live-a" class="ex-hex-input" type="text" value="10101010" maxlength="8" />
              <span class="ex-live-bin" id="xor-live-a-hex">0xAA</span>
            </div>
            <div class="ex-live-op">⊕</div>
            <div class="ex-live-row">
              <span class="ex-live-label">B</span>
              <input id="xor-live-b" class="ex-hex-input" type="text" value="01010101" maxlength="8" />
              <span class="ex-live-bin" id="xor-live-b-hex">0x55</span>
            </div>
            <div class="ex-live-sep"></div>
            <div class="ex-live-row result-row">
              <span class="ex-live-label">R</span>
              <span class="ex-live-result-hex" id="xor-live-r-hex">0xFF</span>
              <span class="ex-live-bin" id="xor-live-r-bin">11111111</span>
            </div>
          </div>
          <div class="ex-live-bits-panel">
            <div class="ex-bits-label">Output bits</div>
            <div id="xor-live-bits" class="ex-bits-display"></div>
            <div class="ex-bits-meta"><span>Dec: <span id="xor-live-r-dec">—</span></span></div>
          </div>
        </div>`,
      init(container) {
        const aInput = container.querySelector('#xor-live-a');
        const bInput = container.querySelector('#xor-live-b');

        function update() {
          const a = parseBinaryByte(aInput.value);
          const b = parseBinaryByte(bInput.value);
          if (a === null || b === null) return;
          const result = a ^ b;

          container.querySelector('#xor-live-a-hex').textContent = hex(a);
          container.querySelector('#xor-live-b-hex').textContent = hex(b);
          container.querySelector('#xor-live-r-hex').textContent = hex(result);
          container.querySelector('#xor-live-r-bin').textContent = bin(result);
          container.querySelector('#xor-live-r-dec').textContent = result;

          let bitsHtml = '';
          for (let i = 7; i >= 0; i--) {
            const bit = (result >> i) & 1;
            bitsHtml += `<span class="xor-bit ${bit ? 'bit-1' : 'bit-0'}">${bit}</span>`;
          }
          container.querySelector('#xor-live-bits').innerHTML = bitsHtml;
        }
        aInput.addEventListener('input', update);
        bInput.addEventListener('input', update);
        update();
      },
    },
  ],
};

export default xorTheory;
