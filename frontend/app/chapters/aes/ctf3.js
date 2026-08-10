import initWasm, {
  get_iv_key_target,
  oracle_encrypt_iv_key,
  oracle_decrypt_iv_key,
  check_iv_key_flag,
} from '../challenges_pkg/challenge_engine.js';

export const aesIvKeyCtf = {
  id: 'aes-iv-key',
  num: '04.4',
  tag: 'CTF Challenge',
  tagClass: 'aes',
  title: 'Challenge — AES-CBC IV = Key Reuse',
  desc: 'Exploit IV=Key reuse in CBC mode to extract the secret key and decrypt the target flag.',
  concepts: ['AES-CBC', 'IV=Key Vulnerability', 'Key Recovery', 'Block Algebra'],

  onMount: async () => { await initWasm(); },

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Catastrophic Vulnerability: IV = Key',
      html: `
        <p class="ex-p">The server uses the secret AES key directly as the Initialization Vector (<code>IV = Key</code>).</p>
        <p class="ex-p"><strong>Vulnerability Concept:</strong></p>
        <p class="ex-p">Construct a 3-block ciphertext: <code>C' = C<sub>1</sub> || 0<sub>16</sub> || C<sub>1</sub></code> and pass it to the decryption endpoint.</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'P1 = D(C1) ⊕ IV = D(C1) ⊕ KEY',
        'P2 = D(0)  ⊕ C1',
        'P3 = D(C1) ⊕ 0  = D(C1)',
        '---------------------------------------',
        'KEY = P1 ⊕ P3 !'
      ],
      note: 'XORing decrypted block 1 with decrypted block 3 directly yields the secret AES KEY!',
    },
    {
      kind: 'custom',
      title: 'Target & Oracles',
      html: `
        <div class="ex-data-block">
          <div id="ivkey-target-banner" class="ex-code-banner">Loading Wasm target...</div>
          <hr style="border-color:#1e293b; margin:12px 0;">
          <div style="margin-bottom:8px;">
            <label class="ex-input-label">1. Encryption Oracle (Hex Plaintext Input):</label>
            <div class="ex-input-row">
              <input id="ivk-enc-in" class="ex-hex-input" placeholder="e.g. 00000000000000000000000000000000" style="width:280px;" />
              <button id="ivk-enc-btn" class="ex-btn btn-check">Encrypt</button>
            </div>
            <input id="ivk-enc-out" class="ex-hex-input" readonly style="width:100%; margin-top:4px;" placeholder="Ciphertext Output" />
          </div>
          <div style="margin-top:12px;">
            <label class="ex-input-label">2. Decryption Endpoint (Hex Ciphertext Input):</label>
            <div class="ex-input-row">
              <input id="ivk-dec-in" class="ex-hex-input" placeholder="e.g. C1 || 00...00 || C1" style="width:280px;" />
              <button id="ivk-dec-btn" class="ex-btn btn-check">Decrypt</button>
            </div>
            <input id="ivk-dec-out" class="ex-hex-input" readonly style="width:100%; margin-top:4px;" placeholder="Plaintext Output" />
          </div>
        </div>
      `,
      init: (container) => {
        const target = get_iv_key_target(1337n);
        container.querySelector('#ivkey-target-banner').textContent = `Target Flag Ciphertext: ${target.ciphertext}`;

        container.querySelector('#ivk-enc-btn').addEventListener('click', () => {
          try {
            const ct = oracle_encrypt_iv_key(1337n, container.querySelector('#ivk-enc-in').value);
            container.querySelector('#ivk-enc-out').value = ct;
          } catch (e) { alert(e); }
        });

        container.querySelector('#ivk-dec-btn').addEventListener('click', () => {
          try {
            const pt = oracle_decrypt_iv_key(1337n, container.querySelector('#ivk-dec-in').value);
            container.querySelector('#ivk-dec-out').value = pt;
          } catch (e) { alert(e); }
        });
      },
    },
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '4.IVKEY',
          title: 'Submit Recovered Flag',
          input: { type: 'text', placeholder: 'FLAG{...}', width: '320px' },
          parse: (raw) => raw.trim(),
          check: (val) => check_iv_key_flag(1337n, val),
        },
      ],
    },
  ],
};

export default aesIvKeyCtf;
