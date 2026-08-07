import { 
  generate_ctr_ttp_challenge, 
  check_ctr_ttp_challenge, 
  query_ctr_ttp_oracle 
} from '../challenges_pkg/challenge_engine.js';

export const ctrCtf = {
  id: 'ctr-alignment-ctf',
  num: '03.4',
  tag: 'CTF Challenge',
  tagClass: 'ctf',
  title: 'Challenge — HELIOS CTR Nonce & Counter Alignment',
  desc: 'A compromised satellite subsystem uses CTR mode with a fixed nonce and counter offset. Recover the floating keystream and slide it across the target document to reveal the flag.',
  concepts: ['CTR Mode', 'Nonce Reuse', 'Two-Time Pad', 'Counter Offset Alignment', 'Chosen Plaintext Attack'],
  topbarTitle: 'Exercise 03.4 — CTR Nonce Alignment CTF',

  blocks: [
    // ── 1. Story & Specification Banner ────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted Satellite Telemetry',
      html: `
        <p class="ex-p">During an orbital pass, your team intercepted an encrypted internal memorandum from Project <strong>HELIOS</strong>. The communications module uses CTR mode encryption.</p>
        <p class="ex-p">Security analysis reveals that the target system reuses a fixed static <code>Nonce</code> across all telemetry operations. Furthermore, the telemetry encryption oracle generates keystream starting from a secret static <code>counter_offset</code>, whereas the captured target memo was encrypted starting at counter <code>0</code>.</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        '[SYSTEM SPECIFICATION: HELIOS-CTR-v2]',
        'Cipher Mode:   Counter Mode (CTR)',
        'Key & Nonce:   Fixed & Reused across all communications',
        'Target Payload: Encrypted starting at Counter = 0',
        'Oracle Input:   Encrypted starting at Counter = counter_offset'
      ],
      note: 'XOR your chosen plaintext with oracle output to recover the floating keystream, then slide it across the target ciphertext until readable text appears.',
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
            <div class="pulc-seed-display">
              Seed: <span id="ctr-seed-val" class="yellow-text">1337</span>
            </div>
          </div>

          <div class="pulc-term-output" id="ctr-term-log">
            <div class="term-line sys">[SYSTEM] HELIOS Satellite Telemetry Console v2.1.0</div>
            <div class="term-line sys">[SYSTEM] Static Nonce detected in hardware keystream generator.</div>
            <div class="term-line sys">[SYSTEM] Type hex strings into the oracle box below to query the oracle.</div>
          </div>

          <div class="pulc-term-controls">
            <button id="btn-get-ctr-ciphertext" class="ex-btn">Get Target Ciphertext</button>
            <button id="btn-reroll-ctr-seed" class="ex-btn-secondary">🎲 Reroll Seed</button>
            <button id="btn-clear-ctr-term" class="ex-btn-secondary">Clear Terminal</button>
          </div>

          <div class="pulc-oracle-input-row">
            <span class="prompt-label">telemetry_query#</span>
            <input id="ctr-oracle-input" type="text" class="ex-hex-input" placeholder="e.g. 41414141... (hex plaintext)" maxlength="8192" />
            <button id="btn-query-ctr-oracle" class="ex-btn">Encrypt</button>
          </div>
        </div>
      `,
      init: (page) => {
        let currentSeed = 1337n;
        let targetCT = null;

        const seedValEl = page.querySelector('#ctr-seed-val');
        const termLog = page.querySelector('#ctr-term-log');
        const inputOracle = page.querySelector('#ctr-oracle-input');
        const btnGetCT = page.querySelector('#btn-get-ctr-ciphertext');
        const btnReroll = page.querySelector('#btn-reroll-ctr-seed');
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
            const data = generate_ctr_ttp_challenge(currentSeed);
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

        // 1. Fetch Target Payload
        btnGetCT.addEventListener('click', () => {
          if (!targetCT) loadChallengeData();
          if (targetCT) {
            appendLog('info', `[CAPTURED PAYLOAD] Length: ${targetCT.length / 2} bytes`);
            appendLog('info', `[HEX]: ${targetCT.substring(0, 128)}...`);
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
            appendLog('error', '[REJECTED] Hex string must have an even length.');
            return;
          }

          try {
            const ctResult = query_ctr_ttp_oracle(currentSeed, raw);
            appendLog('query', `> Input (${raw.length / 2} B): ${raw.substring(0, 64)}${raw.length > 64 ? '...' : ''}`);
            appendLog('success', `< Output: ${ctResult.substring(0, 64)}${ctResult.length > 64 ? '...' : ''}`);
          } catch (e) {
            appendLog('error', `[ERROR] Oracle call failed: ${e}`);
          }
          inputOracle.value = '';
        };

        btnQuery.addEventListener('click', runQuery);
        inputOracle.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') runQuery();
        });

        // 3. Reroll Seed
        btnReroll.addEventListener('click', () => {
          currentSeed = BigInt(Math.floor(Math.random() * 899999) + 100000);
          seedValEl.textContent = currentSeed.toString();
          targetCT = null;
          appendLog('sys', `[SYSTEM] Session reset. New seed: ${currentSeed}`);
          loadChallengeData();
        });

        // 4. Clear Terminal Log
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
            <p class="ex-p">Align the floating keystream fragment against the target payload to decrypt the memo and recover the flag.</p>
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
