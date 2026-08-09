import initWasm, {
  generate_baat_challenge,
  check_baat_challenge,
  query_baat_oracle,
} from '../challenges_pkg/challenge_engine.js';

export const baatCtf = {
  id: 'des-ctf',
  num: '03.3',
  tag: 'CTF Challenge',
  tagClass: 'des',
  title: 'Challenge — ECB Byte-at-a-Time Oracle',
  desc: 'Exploit the deterministic block encryption of DES in ECB mode to leak the flag one byte at a time.',
  concepts: ['DES-ECB', 'Chosen-Prefix Attack', 'Block Alignment', 'Byte-at-a-Time Decryption'],
  topbarTitle: 'Exercise 03 — DES CTF',

  // Ensure WebAssembly module is loaded before user interaction
  onMount: async () => {
    await initWasm();
  },

  blocks: [
    // ── 1. Scenario Description ──────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted DES Oracle Interface',
      html: `
        <p class="ex-p">An active hardware probe connected to an isolated DES encryption chip gives us access to a <strong>Chosen-Prefix Encryption Oracle</strong>.</p>
        <p class="ex-p">The server takes any hex-encoded prefix you supply, appends the secret flag right after it (<code>prefix || flag</code>), pads the result using PKCS7, and encrypts it with <strong>DES in ECB mode</strong>.</p>
      `,
    },

    // ── 2. Attack Math & Mechanics ───────────────────────────────────────
    {
      kind: 'formula',
      lines: [
        'Oracle Behavior:   C = DES-ECB( Key, Prefix || Flag )',
        'DES Block Size:    8 Bytes (64 bits)',
        'ECB Property:      If Block_A == Block_B, then Ciphertext_A == Ciphertext_B'
      ],
      note: 'Because ECB encrypts each 8-byte block independently, identical 8-byte input blocks yield identical 8-byte ciphertext blocks!',
    },

    // ── 3. Strategy Guide ────────────────────────────────────────────────
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <p><strong>How to execute the Byte-at-a-Time Attack:</strong></p>
          <ul class="ex-list">
            <li><strong>Step 1 (Block Alignment):</strong> Send a 7-byte prefix (e.g., <code>"AAAAAAA"</code>). The 8th byte in the first block will be pushed to become the <strong>1st character of the secret flag</strong>. Note down the resulting 16-character hex output for Block 1.</li>
            <li><strong>Step 2 (Dictionary Lookup):</strong> Loop through all 256 possible printable characters for the 8th byte: <code>"AAAAAAA" + guess</code>. Compare the first ciphertext block of your guess with the target ciphertext block from Step 1.</li>
            <li><strong>Step 3 (Iterate):</strong> Once the 1st byte is found, shrink your prefix to 6 bytes (<code>"AAAAAA"</code>) to pull the 2nd byte into Block 1, and repeat!</li>
          </ul>
        </div>
      `,
    },

    // ── 4. Interactive Oracle Tester Sandbox ─────────────────────────────
    {
      kind: 'custom',
      title: 'Interactive Encryption Oracle',
      desc: 'Use the interactive interface below to query the DES-ECB oracle with your own prefix.',
      html: `
        <div class="ex-data-block" id="des-oracle-sandbox">
          <div class="ex-input-row" style="margin-bottom: 12px;">
            <span class="ex-input-label">Chosen Prefix (Hex):</span>
            <input id="des-prefix-input" class="ex-hex-input" type="text" placeholder="e.g. 41414141414141 (7 bytes)" style="width: 280px;" maxlength="256" />
            <button id="des-oracle-btn" class="ex-btn btn-check">Query Oracle</button>
          </div>
          <div class="ex-formula-block" style="margin-top: 10px;">
            <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Returned Ciphertext (DES-ECB in Hex):</div>
            <div id="des-oracle-output" class="ex-formula" style="word-break: break-all; font-family: monospace;">
              [ Enter prefix hex and press 'Query Oracle' ]
            </div>
          </div>
        </div>
      `,
      init: (container) => {
        const btn = container.querySelector('#des-oracle-btn');
        const input = container.querySelector('#des-prefix-input');
        const output = container.querySelector('#des-oracle-output');

        if (!btn || !input || !output) return;

        btn.addEventListener('click', () => {
          const prefixHex = input.value.trim();
          try {
            // Call Rust oracle function (seed = 1337)
            const result = query_baat_oracle(1337n, prefixHex);
            
            // Format output into 16-hex-char (8-byte DES) blocks for readability
            const formattedBlocks = result.match(/.{1,16}/g)?.join(' | ') || result;
            output.textContent = formattedBlocks;
            output.style.color = '#00f0ff';
          } catch (err) {
            output.textContent = `Error: ${err}`;
            output.style.color = '#ff4a4a';
          }
        });
      },
    },

    // ── 5. Flag Submission Exercise ─────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '3.CTF',
          title: 'Recover the Full Flag',
          
          renderBody: () => {
            // Generate challenge data from Rust using seed 1337
            const challengeData = generate_baat_challenge(1337n);
            return `
              <p class="ex-p">Exploit the DES-ECB oracle to recover the full flag character by character.</p>
              <div class="ex-code-banner">
                Base Target Ciphertext (Prefix = ""): ${challengeData.ciphertext}
              </div>
            `;
          },

          hint: 'Start by querying 7 bytes of padding: "41414141414141". The first 16 hex chars (8 bytes) of output represent "AAAAAAA" + Flag[0]. Query "41414141414141" + guess to brute-force Flag[0]!',
          input: { type: 'text', placeholder: 'CTF{...}', width: '320px' },
          parse: (raw) => raw.trim(),
          
          // Delegate submission checking straight to Rust!
          check: (val) => {
            return check_baat_challenge(1337n, val);
          },
        },
      ],
    },
  ],
};

export default baatCtf;
