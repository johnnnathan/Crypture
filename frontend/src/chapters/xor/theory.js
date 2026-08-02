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

          // Update secondary formatting
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
