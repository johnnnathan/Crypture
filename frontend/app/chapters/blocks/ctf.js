import { 
  generate_mini_des_challenge, 
  check_mini_des_challenge, 
  query_mini_des_oracle 
} from '../challenges_pkg/challenge_engine.js';

export const blockCiphersCTF = {
  id: 'pulc256-ctf',
  num: '03.3',
  tag: 'CTF Challenge',
  tagClass: 'ctf',
  title: 'Challenge — PULC-256 Codebook Oracle',
  desc: 'A fictional security firm claims their proprietary PULC-256 cipher is unbreakable due to its 256-bit key. Prove that block size matters more than key length.',
  concepts: ['Codebook Attack', 'Small Block Size', 'ECB Mode Weaknesses', 'Chosen Plaintext Attack'],
  topbarTitle: 'Exercise 03 — PULC-256 CTF',

  blocks: [
    // ── 1. Story & Specification Banner ────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted Intelligence',
      html: `
        <p class="ex-p">An intelligence probe intercepted an admin payload sent across SecureCorp's internal network. SecureCorp's lead engineer boasts that their proprietary cipher <strong>PULC-256</strong> is mathematically impossible to break due to its massive 256-bit key.</p>
        <p class="ex-p">However, reverse-engineering the firm's leaked technical documentation revealed a critical architectural flaw:</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        '[DOCUMENT: PULC_SPEC_v1.0.4]',
        'Algorithm:    Proprietary Ultra-Lightweight Cipher (PULC-256)',
        'Key Length:   256 bits (32 bytes)',
        'Mode:         Electronic Codebook (ECB)',
        'Block Size:   8 bits (1 byte)',
        'Rounds:       8 SPN-style rounds (Substitution & Rotation)',
        'Oracle:       Encrypt arbitrary plaintext bytes'
      ],
      note: 'The target system exposes an active Encryption Oracle using the exact same secret key as the intercepted payload.',
    },

    // ── 2. Terminal & Oracle UI ─────────────────────────────────────────
    {
      kind: 'custom',
      title: 'SecureCorp Admin Interface',
      desc: 'Use the terminal below to interact with the PULC-256 Encryption Oracle.',
      html: `
        <div class="pulc-terminal-wrap" id="pulc-term-root">
          <div class="pulc-term-bar">
            <div class="pulc-term-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="pulc-term-title">sec-corp-tty1 — admin@securecorp.local</div>
            <div class="pulc-seed-display">
              Seed: <span id="pulc-seed-val" class="yellow-text">1337</span>
            </div>
          </div>

          <div class="pulc-term-output" id="pulc-term-log">
            <div class="term-line sys">[SYSTEM] SecureCorp PULC-256 Diagnostic Console v1.0.4</div>
            <div class="term-line sys">[SYSTEM] Connected to remote hardware security module (HSM).</div>
            <div class="term-line sys">[SYSTEM] Type hex strings into the oracle query box below to encrypt data.</div>
          </div>

          <div class="pulc-term-controls">
            <button id="btn-get-ciphertext" class="ex-btn">Get Intercepted Ciphertext</button>
            <button id="btn-reroll-seed" class="ex-btn-secondary">🎲 Reroll Seed</button>
            <button id="btn-clear-term" class="ex-btn-secondary">Clear Terminal</button>
          </div>

          <div class="pulc-oracle-input-row">
            <span class="prompt-label">oracle_query#</span>
            <input id="pulc-oracle-input" type="text" class="ex-hex-input" placeholder="e.g. 414243 (hex bytes)" maxlength="512" />
            <button id="btn-query-oracle" class="ex-btn">Encrypt</button>
          </div>
        </div>
      `,
      init: (page) => {
        let currentSeed = 1337n;
        let interceptedCT = null;

        const seedValEl = page.querySelector('#pulc-seed-val');
        const termLog = page.querySelector('#pulc-term-log');
        const inputOracle = page.querySelector('#pulc-oracle-input');
        const btnGetCT = page.querySelector('#btn-get-ciphertext');
        const btnReroll = page.querySelector('#btn-reroll-seed');
        const btnQuery = page.querySelector('#btn-query-oracle');
        const btnClear = page.querySelector('#btn-clear-term');

        const appendLog = (type, text) => {
          const line = document.createElement('div');
          line.className = `term-line ${type}`;
          line.textContent = text;
          termLog.appendChild(line);
          termLog.scrollTop = termLog.scrollHeight;
        };

        const loadChallengeData = () => {
          try {
            const data = generate_mini_des_challenge(currentSeed);
            
            // Extract value safely depending on Rust Wasm export format (Map vs Object)
            if (data && typeof data.get === 'function') {
              interceptedCT = data.get('ciphertext');
            } else if (data && data.ciphertext) {
              interceptedCT = data.ciphertext;
            } else {
              interceptedCT = data;
            }
          } catch (err) {
            console.error('Failed to generate challenge payload:', err);
            appendLog('error', '[ERROR] Failed to fetch payload from crypto engine.');
          }
        };

        // 1. Get Intercepted Ciphertext
        btnGetCT.addEventListener('click', () => {
          if (!interceptedCT) loadChallengeData();
          if (interceptedCT) {
            appendLog('info', `[INTERCEPT] Target Payload (hex): ${interceptedCT}`);
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
            appendLog('error', '[REJECTED] Invalid input: Must be a valid hexadecimal string.');
            return;
          }
          if (raw.length % 2 !== 0) {
            appendLog('error', '[REJECTED] Invalid length: Hex strings must contain an even number of digits.');
            return;
          }

          const ctResult = query_mini_des_oracle(currentSeed, raw);

          appendLog('query', `> Input:  ${raw}`);
          appendLog('success', `< Output: ${ctResult}`);
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
          interceptedCT = null;
          appendLog('sys', `[SYSTEM] Session reset. New seed generated: ${currentSeed}`);
          loadChallengeData();
        });

        // 4. Clear Terminal Log
        btnClear.addEventListener('click', () => {
          termLog.innerHTML = '<div class="term-line sys">[SYSTEM] Terminal buffer cleared.</div>';
        });

        // Preload initial challenge data
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
            <p class="ex-p">Decrypt the intercepted payload by exploiting the structural properties of PULC-256 and enter the recovered flag string below.</p>
          `,
          input: { type: 'text', placeholder: 'CTF{...}' },
          parse: (raw) => raw.trim(),
          check: (val) => check_mini_des_challenge(1337n, val),
        },
      ],
    },
  ],
};

export default blockCiphersCTF;
