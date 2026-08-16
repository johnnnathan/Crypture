import initWasm, { encrypt_aes_bitflip, check_aes_bitflip } from '../challenges_pkg/challenge_engine.js';

export const aesBitflipCtf = {
  id: 'aes-bitflip',
  num: '04.3',
  tag: 'CTF Challenge',
  tagClass: 'aes',
  title: 'Challenge — AES-CBC Bit Flipping',
  desc: 'Exploit CBC mode malleability to inject "admin=true" into the plaintext without knowing the secret key.',
  concepts: ['AES-CBC', 'Malleability', 'Bit-Flipping Attack', 'Block Alignment'],

  onMount: async () => { 
    await initWasm(); 
  },

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Target System Overview',
      html: `
        <p class="ex-p">The system encrypts payloads using AES-128-CBC. Direct user input containing <code>admin=true</code> is rejected prior to encryption.</p>
        <p class="ex-p">The static prefix is <code>comment1=cooking%20MCs;userdata=</code> (exactly 32 bytes / 2 full blocks). Encrypt a target string using the oracle, then modify the returned ciphertext to force <code>admin=true</code> upon decryption.</p>
        <blockquote class="ex-p" style="border-left: 3px solid #f59e0b; padding-left: 12px; margin-top: 12px; color: #cbd5e1;">
          <strong>Note on Block Corruption:</strong> Modifying byte index <i>j</i> in ciphertext block <code>C₁</code> will completely randomize plaintext block <code>P₁</code>, but will precisely flip the targeted bit at index <i>j</i> in plaintext block <code>P₂</code>. This partial corruption is expected behavior in CBC bit-flipping attacks!
        </blockquote>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Prefix Length : 32 Bytes (Block 0 & Block 1)',
        'Payload Start : Byte Index 32 (Start of Block 2)',
        'Target Input  : "adminXtrue" (X is at payload offset 5 → byte index 37)',
        'Bitflip Target: Modify C_1[5] (Byte 21) via C_1[5] ⊕= (\'X\' ⊕ \'=\')'
      ],
      note: 'Decryption formula: P_i = D(C_i) ⊕ C_{i-1}',
    },
    {
      kind: 'custom',
      title: '1. Encryption Oracle',
      html: `
        <div class="ex-data-block">
          <div style="margin-bottom: 8px;">
            <span class="ex-input-label" style="display:block; margin-bottom:4px;">Payload (up to 256 characters):</span>
            <input 
              id="bf-input" 
              class="ex-text-input" 
              type="text"
              maxlength="256" 
              style="width:100%; font-family:monospace;" 
              value="adminXtrue"
            />
          </div>
          <div style="margin-bottom: 12px; text-align: right;">
            <button id="bf-encrypt-btn" class="ex-btn btn-check">Encrypt Payload</button>
          </div>
          <div class="ex-formula-block">
            <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Ciphertext Output (Hex):</div>
            <textarea id="bf-ct-output" class="ex-hex-input" style="width:100%; height:70px; font-family:monospace;" readonly></textarea>
          </div>
        </div>
      `,
      init: (container) => {
        const btn = container.querySelector('#bf-encrypt-btn');
        const input = container.querySelector('#bf-input');
        const ctOut = container.querySelector('#bf-ct-output');

        btn.addEventListener('click', () => {
          try {
            const res = encrypt_aes_bitflip(1337n, input.value);
            ctOut.value = res.ciphertext;
          } catch (err) {
            alert('Encryption Error: ' + err);
          }
        });
      },
    },
    {
      kind: 'exerciseGroup',
      title: '2. Flag Submission',
      items: [
        {
          num: '4.BITFLIP',
          title: 'Submit Forged Ciphertext',
          bodyHtml: `<p class="ex-p">Submit your modified hex ciphertext. The engine will decrypt it using the session key and check if <code>admin=true</code> exists in the resulting plaintext.</p>`,
          
          inputLabel: 'Ciphertext Hex =',
          input: { 
            type: 'text', 
            placeholder: 'Paste modified ciphertext hex here...', 
            maxlength: 256 
          },

          parse: (raw) => raw.trim(),

          check: (ct) => {
            if (!ct) {
              return { correct: false, message: 'Please enter a ciphertext hex string.' };
            }

            try {
              // Engine decrypts ct using target session state internally
              const res = check_aes_bitflip(1337n, ct);
              return {
                correct: res.correct,
                message: res.message
              };
            } catch (err) {
              return {
                correct: false,
                message: 'Error during validation: ' + err
              };
            }
          },
        },
      ],
    },
  ],
};

export default aesBitflipCtf;
