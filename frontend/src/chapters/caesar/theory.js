// chapters/caesar.js
import { hex, parseDecByte } from '../../exercise-kit.js';

export const caesarTheory = {
  id: 'caesar',
  num: '02',
  tag: 'Caesar',
  tagClass: 'caesar',
  title: 'Shift Ciphers — Caesar',
  desc: 'Modular arithmetic encryption and brute-force key search.',
  concepts: ['Modular arithmetic', 'Brute-force', 'Kasiski test'],
  topbarTitle: 'Exercise 02 — Shift Ciphers',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Caesar Cipher',
      html: `<p class="ex-p">The Caesar cipher is one of the oldest encryption methods. Each letter is shifted forward through the alphabet by a fixed amount.</p>`,
    },
    {
      kind: 'formula',
      lines: ['A→D, B→E, C→F', '(shift = 3)', 'X→A, Y→B, Z→C'],
      note: 'Only alphabetic characters are shifted. Spaces and punctuation remain unchanged.',
    },
    {
      kind: 'custom',
      title: 'Interactive Demo',
      html: `
        <div class="ex-control-bar">
          <label>Plaintext <input id="cae-demo-p" class="ex-text-input" type="text" value="HELLO WORLD" /></label>
          <label>Key K <input id="cae-demo-k" class="ex-hex-input" type="range" min="0" max="25" value="13" style="width:120px;vertical-align:middle" /> <span id="cae-demo-k-val" class="accent">13</span></label>
        </div>
        <div class="ex-demo-box">
          <div class="ex-demo-row"><span class="ex-demo-key">Encrypted</span><span id="cae-demo-enc" class="ex-demo-val accent mono">—</span></div>
          <div class="ex-demo-row"><span class="ex-demo-key">Decrypted</span><span id="cae-demo-dec" class="ex-demo-val correct mono">—</span></div>
        </div>
        <div class="ex-table-wrap" style="margin-top:12px">
          <div class="ex-table-label">Byte trace (first 8 chars)</div>
          <table class="ex-table">
            <thead><tr><th>Plain hex</th><th>Char</th><th>Operation</th><th>Cipher hex</th><th>Char</th></tr></thead>
            <tbody id="cae-demo-tbody"></tbody>
          </table>
        </div>`,
      init(container) {
        const pIn = container.querySelector('#cae-demo-p');
        const kIn = container.querySelector('#cae-demo-k');

        function update() {
          const p = pIn.value.toUpperCase();
          const k = parseInt(kIn.value) || 0;
          container.querySelector('#cae-demo-k-val').textContent = k;

          const shiftChar = (ch, amount) => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90) {
              return String.fromCharCode(((code - 65 + amount + 26) % 26) + 65);
            }
            return ch;
          };
          const encrypted = [...p].map(ch => shiftChar(ch, k)).join('');
          const decrypted = [...encrypted].map(ch => shiftChar(ch, -k)).join('');

          container.querySelector('#cae-demo-enc').textContent = encrypted;
          container.querySelector('#cae-demo-dec').textContent = decrypted;

          let rows = '';
          [...p].slice(0, 8).forEach(ch => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90) {
              const shifted = ((code - 65 + k) % 26) + 65;
              rows += `<tr><td>${ch}</td><td>${code - 65}</td><td>+ ${k} mod 26</td><td>${String.fromCharCode(shifted)}</td><td>${shifted - 65}</td></tr>`;
            } else {
              rows += `<tr><td>${ch}</td><td>-</td><td>unchanged</td><td>${ch}</td><td>-</td></tr>`;
            }
          });
          container.querySelector('#cae-demo-tbody').innerHTML = rows;
        }
        pIn.addEventListener('input', update);
        kIn.addEventListener('input', update);
        update();
      },
    },
    {
      kind: 'exerciseGroup',
      title: 'Caesar Exercises',
      items: [
        (() => {
          const P = 'ATTACK', K = 3, ANS = 'DWWDFN';
          return {
            num: '2.1',
            title: 'Encrypt a word',
            bodyHtml: `<p class="ex-p">Apply the Caesar cipher formula to encrypt the following:<br>
              <strong>Plaintext P = ${P}&nbsp; </strong><br>
              <strong>Shift = ${K}</strong></p>`,
            hint: 'Compute the shift for each individual letter and then append to create the final answer.',
            input: { type: 'text', maxlength: 6 },
            inputLabel: 'C =',
            parse: (raw) => raw, // exact string, case-sensitive like the original
            check: (val) => val === ANS
              ? { correct: true, message: `Caesar adds the key value to the plaintext byte with modular wrap-around.` }
              : { correct: false, message: `Got ${val}. Formula: (${P} + ${K}) mod 26 = ${ANS} = ${hex(0)}.` },
          };
        })(),
        {
          num: '2.2',
          title: 'Brute-Force Key Recovery',
          bodyHtml: `<p class="ex-p">An intercepted ciphertext byte is <strong>KHOOR</strong>. You know the plaintext is the string <strong>'HELLO'</strong>. Find the shift K that produces this encryption.</p>`,
          input: { type: 'number', placeholder: '0–25', maxlength: 2, width: '70px' },
          inputLabel: 'K =',
          parse: (raw) => parseDecByte(raw),
          check: (val) => val === 3
            ? { correct: true, message: `With only 25 possible shifts, brute-force is trivial — a computer tries all of them in nanoseconds. This is why keyspace size is a foundational security requirement.` }
            : { correct: false, message: `Shift ${val} does not result in the target 'HELLO'. Try each shift 0–25 until you get it.` },
        },
      ],
    },
  ],
};

export default caesarTheory;
