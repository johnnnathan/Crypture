import initWasm, { encrypt_aes_bitflip, check_aes_bitflip } from '../challenges_pkg/challenge_engine.js';

export const aesBitflipCtf = {
  id: 'aes-bitflip',
  num: '04.2',
  tag: 'CTF Challenge',
  tagClass: 'aes',
  title: 'Challenge — AES-CBC Bit Flipping',
  desc: 'Exploit CBC mode malleability to inject admin=true into the plaintext without knowing the key.',
  concepts: ['AES-CBC', 'Malleability', 'Bit-Flipping Attack', 'Block Alignment'],

  onMount: async () => { await initWasm(); },

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Target Encryption Function',
      html: `
        <p class="ex-p">The server constructs plaintext as <code>prefix || user_input || suffix</code>. It sanitizes input by refusing any string containing <code>admin=true</code>.</p>
        <p class="ex-p">Because CBC mode satisfies <code>P<sub>i</sub> = D(C<sub>i</sub>) &oplus; C<sub>i-1</sub></code>, flipping bits in ciphertext block <code>C<sub>i-1</sub></code> directly flips the corresponding bits in plaintext block <code>P<sub>i</sub></code>!</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Prefix Length:  32 Bytes (Exactly 2 Blocks)',
        'Target Input:   "adminXtrue" (Flip byte X at offset 5)',
        'Bitflip Rule:   C_{i-1}[k] ^= ( X ^ = )'
      ],
      note: 'Flipping bit k in ciphertext block N corrupts block N plaintext, but cleanly modifies block N+1 plaintext.',
    },
    {
      kind: 'custom',
      title: 'Encryption Oracle & Tester',
      html: `
        <div class="ex-data-block">
          <div class="ex-input-row" style="margin-bottom: 12px;">
            <span class="ex-input-label">User Input:</span>
            <input id="bf-input" class="ex-text-input" type="text" value="adminXtrue" style="width:250px;" />
            <button id="bf-encrypt-btn" class="ex-btn btn-check">Encrypt Input</button>
          </div>
          <div class="ex-formula-block">
            <div style="font-size:12px; color:#94a3b8;">Generated IV (Hex):</div>
            <input id="bf-iv-output" class="ex-hex-input" style="width:100%; margin-bottom:8px;" />
            <div style="font-size:12px; color:#94a3b8;">Generated Ciphertext (Hex):</div>
            <textarea id="bf-ct-output" class="ex-hex-input" style="width:100%; height:60px; font-family:monospace;"></textarea>
          </div>
        </div>
      `,
      init: (container) => {
        const btn = container.querySelector('#bf-encrypt-btn');
        const input = container.querySelector('#bf-input');
        const ivOut = container.querySelector('#bf-iv-output');
        const ctOut = container.querySelector('#bf-ct-output');

        btn.addEventListener('click', () => {
          try {
            // Fixed function name to match your import:
            const res = encrypt_aes_bitflip(1337n, input.value);
            ivOut.value = res.iv_hex;
            ctOut.value = res.ciphertext;
          } catch (err) {
            alert(err);
          }
        });
      },
    },
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '4.BITFLIP',
          title: 'Submit Modified Ciphertext',
          bodyHtml: `<p class="ex-p">Paste your modified Ciphertext and IV. The server will decrypt and check for <code>admin=true</code>.</p>`,
          
          // ✅ FIX 1: Add input configuration so chapter-engine doesn't crash
          input: { type: 'custom' },

          renderBody: () => `
            <div style="margin-bottom:8px;">
              <label class="ex-input-label">IV (Hex):</label>
              <input id="sub-iv" class="ex-hex-input" style="width:100%;" placeholder="16-byte hex IV" />
            </div>
            <div style="margin-bottom:8px;">
              <label class="ex-input-label">Ciphertext (Hex):</label>
              <textarea id="sub-ct" class="ex-hex-input" style="width:100%; height:60px;" placeholder="Modified Ciphertext Hex"></textarea>
            </div>
          `,
          check: () => {
            const iv = document.querySelector('#sub-iv').value.trim();
            const ct = document.querySelector('#sub-ct').value.trim();
            // ✅ FIX 2: Fixed function name to match import
            return check_aes_bitflip(1337n, ct, iv);
          },
        },
      ],
    },
  ],
};

export default aesBitflipCtf;
