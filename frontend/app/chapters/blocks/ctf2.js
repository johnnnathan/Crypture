import { 
  generate_ctr_ttp_challenge, 
  check_ctr_ttp_challenge, 
  query_ctr_ttp_oracle 
} from '../challenges_pkg/challenge_engine.js';

export const ctrCtf = {
  id: 'ctr-nonce-reuse-ctf',
  num: '03.4',
  tag: 'CTF Challenge',
  tagClass: 'ctf',
  title: 'Challenge — HELIOS: The Reused Nonce',
  desc: 'A compromised satellite subsystem uses CTR mode with a reused static nonce. Recover the keystream using the chosen-plaintext encryption oracle to decrypt the intercepted memorandum.',
  concepts: [
    'CTR Mode',
    'Nonce Reuse',
    'Two-Time Pad',
    'Chosen Plaintext Attack',
    'Keystream Recovery'
  ],
  topbarTitle: 'Exercise 03.4 — CTR Nonce Reuse CTF',

  blocks: [
    // ── 1. Story & Specification Banner ────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted Satellite Telemetry',
      html: `
        <p class="ex-p">During an orbital pass, your team intercepted an encrypted internal memorandum from Project <strong>HELIOS</strong>. The communications module uses CTR mode encryption.</p>
        <p class="ex-p">Reverse-engineering the diagnostic console reveals that the system generates keystream blocks starting at counter <code>0</code> using a static <code>Nonce</code> that never changes between transmissions.</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        '[SYSTEM SPECIFICATION: HELIOS-CTR-v2]',
        'Cipher Mode:   Counter Mode (CTR)',
        'Key Length:    128 bits',
        'Nonce:         Fixed & Reused',
        'Target:        Encrypted from Counter = 0',
        'Oracle:        Chosen-Plaintext Encryption'
      ],
      note: 'Inspect the relationship between the oracle output and the intercepted ciphertext.',
    },

    // ── 2. Terminal & Oracle UI ─────────────────────────────────────────
    {
      kind: 'custom',
      title: 'HELIOS Telemetry Terminal',
      desc: 'Use the terminal below to query the telemetry oracle and inspect the captured payload.',
      html: `
        <div class="pulc-terminal-wrap" id="ctr-term-root">
          <div class="pulc-term-bar">
            <div class="pulc-term-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="pulc-term-title">helios-tty2 — telemetry@satcom.local</div>
          </div>

          <div class="pulc-term-output" id="ctr-term-log">
            <div class="term-line sys">[SYSTEM] HELIOS Satellite Telemetry Console v2.1.0</div>
            <div class="term-line sys">[SYSTEM] Static Nonce detected in hardware keystream generator.</div>
            <div class="term-line sys">[SYSTEM] Type hex strings into the oracle box below to query the oracle.</div>
          </div>

          <div class="pulc-term-controls">
            <button id="btn-get-ctr-ciphertext" class="ex-btn">Get Target Ciphertext</button>
            <button id="btn-clear-ctr-term" class="ex-btn-secondary">Clear Terminal</button>
          </div>

          <div class="pulc-oracle-input-row">
            <span class="prompt-label">telemetry_query#</span>
            <input id="ctr-oracle-input" type="text" class="ex-hex-input" placeholder="e.g. 00000000... or 41414141... (hex plaintext)" maxlength="8192" />
            <button id="btn-query-ctr-oracle" class="ex-btn">Encrypt</button>
          </div>
        </div>
      `,
      init: (page) => {
        const CURRENT_SEED = 1337n;
        let targetCT = null;

        const termLog = page.querySelector('#ctr-term-log');
        const inputOracle = page.querySelector('#ctr-oracle-input');
        const btnGetCT = page.querySelector('#btn-get-ctr-ciphertext');
        const btnQuery = page.querySelector('#btn-query-ctr-oracle');
        const btnClear = page.querySelector('#btn-clear-ctr-term');

        const appendLog = (type, text) => {
          const line = document.createElement('div');
          line.className = `term-line ${type}`;
          line.textContent = text;
          termLog.appendChild(line);
          termLog.scrollTop = termLog.scrollHeight;
        };

        const loadChallengeData = () => {
          try {
            const data = generate_ctr_ttp_challenge(CURRENT_SEED);
            if (data && typeof data.get === 'function') {
              targetCT = data.get('ciphertext');
            } else if (data && data.ciphertext) {
              targetCT = data.ciphertext;
            } else {
              targetCT = data;
            }
          } catch (err) {
            console.error('Failed to generate challenge payload:', err);
            appendLog('error', '[ERROR] Failed to fetch payload from crypto engine.');
          }
        };

        // 1. Fetch Full Target Payload
        btnGetCT.addEventListener('click', () => {
          if (!targetCT) loadChallengeData();
          if (targetCT) {
            appendLog('info', `[CAPTURED PAYLOAD] Total Length: ${targetCT.length / 2} bytes`);
            appendLog('success', `[FULL TARGET HEX]:\n${targetCT}`);
          }
        });

        // 2. Query Oracle
        const runQuery = () => {
          const raw = inputOracle.value.trim().toLowerCase();
          if (!raw) {
            appendLog('error', '[ERROR] Query string cannot be empty.');
            return;
          }
          if (!/^[0-9a-f]+$/i.test(raw)) {
            appendLog('error', '[REJECTED] Invalid input: Must be a hexadecimal string.');
            return;
          }
          if (raw.length % 2 !== 0) {
            appendLog('error', '[REJECTED] Hex string must have an even number of characters.');
            return;
          }

          try {
            const ctResult = query_ctr_ttp_oracle(CURRENT_SEED, raw);
            
            appendLog('query', `> Input (${raw.length / 2} bytes): ${raw}`);
            appendLog('success', `< Output (${ctResult.length / 2} bytes):\n${ctResult}`);
          } catch (e) {
            appendLog('error', `[ERROR] Oracle call failed: ${e}`);
          }
          inputOracle.value = '';
        };

        btnQuery.addEventListener('click', runQuery);
        inputOracle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') runQuery();
        });

        // 3. Clear Terminal Log
        btnClear.addEventListener('click', () => {
          termLog.innerHTML = '<div class="term-line sys">[SYSTEM] Terminal buffer cleared.</div>';
        });

        loadChallengeData();
      },
    },

    // ── 3. Flag Submission Block ────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '4.CTF',
          title: 'Recover the Plaintext Flag',
          bodyHtml: `
            <p class="ex-p">Recover the keystream from the encryption oracle output, decrypt the target memorandum, and enter the recovered flag string below.</p>
          `,
          input: { type: 'text', placeholder: 'CTF{...}' },
          parse: (raw) => raw.trim(),
          check: (val) => check_ctr_ttp_challenge(1337n, val),
        },
      ],
    },
  ],
};

export default ctrCtf;
