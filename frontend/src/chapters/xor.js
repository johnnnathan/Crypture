// chapters/xor.js
import { bin, hex, ascii, parseBinaryByte } from '../exercise-kit.js';

export const chapter = {
  id: 'xor',
  num: '01',
  tag: 'XOR Gate',
  tagClass: 'xor',
  title: 'XOR — The Fundamental Cipher Primitive',
  desc: 'Truth table, bit-level mechanics, known-plaintext key recovery, and the devastating consequences of one-time pad key reuse.',
  concepts: ['Bit operations', 'Key recovery', 'Key-reuse attack'],
  topbarTitle: 'Exercise 01 — XOR',

  blocks: [
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
    {
      kind: 'formula',
      lines: ['Encrypt:  C = P ⊕ K', 'Decrypt:  P = C ⊕ K'],
      note: 'If C = P ⊕ K, then C ⊕ K = P ⊕ K ⊕ K = P ⊕ 0 = P.',
    },
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
    // ── Interactive demo (simulate the cipher) ──────────────────────────
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
              <span class="ex-live-bin" id="xor-live-a-bin">—</span>
            </div>
            <div class="ex-live-op">⊕</div>
            <div class="ex-live-row">
              <span class="ex-live-label">B</span>
              <input id="xor-live-b" class="ex-hex-input" type="text" value="01010101" maxlength="8" />
              <span class="ex-live-bin" id="xor-live-b-bin">—</span>
            </div>
            <div class="ex-live-sep"></div>
            <div class="ex-live-row result-row">
              <span class="ex-live-label">R</span>
              <span class="ex-live-result-hex"><span id="xor-live-r-hex">—</span></span>
              <span class="ex-live-bin" id="xor-live-r-bin">—</span>
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

          container.querySelector('#xor-live-a-bin').textContent = bin(a);
          container.querySelector('#xor-live-b-bin').textContent = bin(b);
          container.querySelector('#xor-live-r-bin').textContent = bin(result);
          container.querySelector('#xor-live-r-hex').textContent = bin(result);
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
    // ── Exercises ────────────────────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Exercises',
      items: [
        (() => {
          const A = 0b01001101, B = 0b01110001, ANS = A ^ B;
          return {
            num: '1.1',
            title: 'Byte XOR Computation',
            bodyHtml: `<p class="ex-p">Compute the XOR of the following two bytes by hand, then verify.<br>
              <strong>A = 01001101</strong> &nbsp; <strong>B = 01110001</strong></p>`,
            hint: 'Work bit by bit. Write your answer in 8-bit binary.',
            input: { type: 'binary', maxlength: 8 },
            inputLabel: 'A ⊕ B =',
            check: (val) => val === ANS
              ? { correct: true, message: `${hex(A)} ⊕ ${hex(B)} = ${hex(ANS)}.\n  ${bin(A)}  \n⊕ ${bin(B)}  \n= ${bin(ANS)}\nEach output bit is 1 where the input bits differ, 0 where they match.` }
              : { correct: false, message: `Got ${hex(val)}, expected ${hex(ANS)}. Work column by column: ${bin(A)} XOR ${bin(B)}.` },
          };
        })(),
        (() => {
          const P = 0x52, C = 0xBE, K = P ^ C;
          return {
            num: '1.2',
            title: 'Known-Plaintext Key Recovery',
            bodyHtml: `
              <p class="ex-p">An analyst captures a single plaintext/ciphertext pair from a system using XOR with a static key:</p>
              <div class="ex-data-block">
                <div class="ex-data-row"><span>Plaintext P</span><span class="accent">01010010</span></div>
                <div class="ex-data-row"><span>Ciphertext C</span><span class="accent">10111110</span></div>
              </div>
              <p class="ex-p">Using the self-inverse property <code>K = P ⊕ C</code>, recover the key K. With K known, every message ever sent with this system is decryptable.</p>`,
            input: { type: 'binary', maxlength: 8 },
            inputLabel: 'K =',
            check: (val) => val === K
              ? { correct: true, message: `K = P ⊕ C = ${bin(P)} ⊕ ${bin(C)} = ${bin(K)}.\nThis works because XOR is self-inverse: if C = P ⊕ K, then P ⊕ C = P ⊕ (P ⊕ K) = K.\nThis is called a "known-plaintext attack" — observing even one plaintext/ciphertext pair leaks the key entirely when XOR is used with a static key.` }
              : { correct: false, message: `Got ${bin(val)}. K = P ⊕ C = ${bin(P)} ⊕ ${bin(C)}. XOR both values together: ${bin(P)} XOR ${bin(C)}.` },
          };
        })(),
        (() => {
          const K = 0x3F, P1 = 0x48, P2 = 0x7E;
          const C1 = P1 ^ K, C2 = P2 ^ K, XORR = C1 ^ C2;
          return {
            num: '1.3',
            title: 'Key-Reuse Attack (Crib Dragging)',
            bodyHtml: `
              <p class="ex-p">Two plaintexts were encrypted with the <strong>same key K</strong> (a serious mistake). The key is unknown. The analyst has only:</p>`,
            dataRows: [
              { label: 'C₁', id: 'c1', value: bin(C1) },
              { label: 'C₂', id: 'c2', value: bin(C2) },
              { label: 'P₁ (known)', value: '01001000' },
            ],
            hint: 'Because C₁ ⊕ C₂ = (P₁ ⊕ K) ⊕ (P₂ ⊕ K) = P₁ ⊕ P₂, the key cancels out. Use this to find P₂.',
            input: { type: 'binary', maxlength: 8 },
            inputLabel: 'P₂ =',
            check: (val) => val === P2
              ? { correct: true, message: `P₂ = ${bin(P2)} ('${ascii(P2)}').\nStep 1: C₁ ⊕ C₂ = ${bin(C1)} ⊕ ${bin(C2)} = ${bin(XORR)} = P₁ ⊕ P₂ (key cancels).\nStep 2: P₁ ⊕ (P₁ ⊕ P₂) = P₂ → ${bin(P1)} ⊕ ${bin(XORR)} = ${bin(P2)}.\nThis is why reusing a one-time pad key is catastrophic — the key vanishes and plaintexts directly reveal each other.` }
              : { correct: false, message: `Got ${hex(val)}. Step 1: C₁ ⊕ C₂ = ${bin(C1)} ⊕ ${bin(C2)} = ${bin(XORR)} = P₁ ⊕ P₂. Step 2: XOR that with P₁ = ${bin(P1)} to isolate P₂.` },
          };
        })(),
      ],
    },
  ],
};

export default chapter;
