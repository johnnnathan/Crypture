import {
  callPythonChallengeMethod,
  loadPythonChallenge,
  submitPythonChallenge
} from '../../python-engine.js';

export const aesPaddingOracleCtf = {
  id: 'aes-padding-oracle',
  num: '05.1',
  tag: 'Side-Channel',
  tagClass: 'hash',
  title: 'AES-CBC Padding Oracle Attack',
  desc: 'Exploit PKCS#7 padding error side-channels to decrypt AES-CBC ciphertexts byte-by-byte.',
  concepts: ['AES-CBC', 'PKCS#7 Padding', 'Side-Channel Leak'],
  topbarTitle: 'Exercise 05.1 — Padding Oracle',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'The Padding Oracle Leak',
      html: `
        <p class="ex-p">
          When an application decrypts an AES-CBC ciphertext, it validates and strips the 
          <strong>PKCS#7 padding</strong> at the end. If the server reveals whether the padding 
          was valid (even through error codes), an attacker can abuse this side-channel to decrypt 
          the entire message byte-by-byte—without ever knowing the secret key!
        </p>
      `
    },
    {
      kind: 'custom',
      title: 'Padding Oracle Interface',
      desc: 'Interact with the Python WebAssembly runtime to query the side-channel and recover the flag.',
      html: `
        <div class="ex-exercise" id="oracle-card">
          <div class="ex-ex-body">
            
            <div id="oracle-loading" style="color: #888; padding: 12px 0;">
              🌀 Booting Python WebAssembly Engine...
            </div>
            
            <div id="oracle-content" style="display: none;">
              
              <div class="ex-data-block" style="margin-bottom: 16px;">
                <div class="ex-data-row">
                  <span>Target IV (Hex):</span>
                  <span class="accent" id="target-iv" style="font-family: monospace;">—</span>
                </div>
                <div class="ex-data-row">
                  <span>Target Ciphertext (Hex):</span>
                  <span class="accent" id="target-ct" style="font-family: monospace; word-break: break-all;">—</span>
                </div>
              </div>

              <h3 class="ex-h3" style="margin-top: 20px; margin-bottom: 8px;">1. Query Padding Oracle</h3>
              <p class="ex-p" style="margin-bottom: 12px; font-size: 0.9em; color: #a0a0a0;">
                Send candidate IV and Ciphertext blocks to Python's decryption pipeline.
              </p>

              <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="ex-input-label" style="width: 60px;">IV =</span>
                  <input id="input-oracle-iv" class="ex-text-input" type="text" placeholder="32 hex chars" style="flex: 1;" />
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="ex-input-label" style="width: 60px;">CT =</span>
                  <input id="input-oracle-ct" class="ex-text-input" type="text" placeholder="Ciphertext hex" style="flex: 1;" />
                </div>
                
                <div style="margin-top: 4px;">
                  <button id="btn-query-oracle" class="ex-btn-secondary btn-reroll">⚡ Query Oracle</button>
                </div>
                <div id="oracle-feedback" class="ex-feedback" style="display: none; margin-top: 6px;"></div>
              </div>

              <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;" />

              <h3 class="ex-h3" style="margin-bottom: 8px;">2. Submit Recovered Flag</h3>
              <div class="ex-input-row">
                <span class="ex-input-label">Flag =</span>
                <input id="input-flag" class="ex-text-input" type="text" placeholder="FLAG{...}" style="width: 280px;" />
                <button id="btn-submit-flag" class="ex-btn btn-check">Submit Answer</button>
              </div>
              <div id="submit-feedback" class="ex-feedback" style="display: none; margin-top: 12px;"></div>

            </div>
          </div>
        </div>
      `,
      
      init: async (page) => {
        const seed = 1337;
        const challengeId = 'aes-padding-oracle';

        const loadingEl = page.querySelector('#oracle-loading');
        const contentEl = page.querySelector('#oracle-content');
        const ivDisplay = page.querySelector('#target-iv');
        const ctDisplay = page.querySelector('#target-ct');

        const inputOracleIv = page.querySelector('#input-oracle-iv');
        const inputOracleCt = page.querySelector('#input-oracle-ct');
        const btnQuery = page.querySelector('#btn-query-oracle');
        const fbOracle = page.querySelector('#oracle-feedback');

        const inputFlag = page.querySelector('#input-flag');
        const btnSubmit = page.querySelector('#btn-submit-flag');
        const fbSubmit = page.querySelector('#submit-feedback');

        try {
          const payload = await loadPythonChallenge(challengeId, seed);

          if (ivDisplay) ivDisplay.textContent = payload.iv_hex;
          if (ctDisplay) ctDisplay.textContent = payload.ciphertext;

          if (inputOracleIv) inputOracleIv.value = payload.iv_hex;
          if (inputOracleCt) inputOracleCt.value = payload.ciphertext;

          if (loadingEl) loadingEl.style.display = 'none';
          if (contentEl) contentEl.style.display = 'block';

          btnQuery.addEventListener('click', async () => {
            const testIv = inputOracleIv.value.trim();
            const testCt = inputOracleCt.value.trim();

            fbOracle.style.display = 'block';
            fbOracle.className = 'ex-feedback';
            fbOracle.textContent = 'Querying Python oracle...';

            const isValid = await callPythonChallengeMethod(
              challengeId,
              seed,
              'oracle_check_padding',
              testCt,
              testIv
            );

            if (isValid) {
              fbOracle.className = 'ex-feedback success';
              fbOracle.textContent = '✅ VALID PADDING (HTTP 200 OK)';
            } else {
              fbOracle.className = 'ex-feedback error';
              fbOracle.textContent = '❌ INVALID PADDING (HTTP 500 Internal Error)';
            }
          });

          btnSubmit.addEventListener('click', async () => {
            const userFlag = inputFlag.value.trim();

            fbSubmit.style.display = 'block';
            fbSubmit.className = 'ex-feedback';
            fbSubmit.textContent = 'Verifying flag...';

            const result = await submitPythonChallenge(challengeId, seed, userFlag);

            fbSubmit.textContent = result.message;
            fbSubmit.className = result.correct ? 'ex-feedback success' : 'ex-feedback error';
          });

        } catch (err) {
          if (loadingEl) {
            loadingEl.textContent = `❌ Initialization Error: ${err.message}`;
            loadingEl.style.color = '#ff4d4d';
          }
        }
      }
    }
  ]
};
