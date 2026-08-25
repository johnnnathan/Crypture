import { p } from '../../chapter-engine.js';

export const rsaTheoryChapter = {
  id: 'rsa-theory',
  num: '05.1',
  tag: 'Theory & Mechanics',
  tagClass: 'rsa',
  title: 'RSA Cryptosystem — Theory & Walkthrough',
  desc: 'Learn the core mathematical principles behind public key cryptography, Euler’s totient function, and step-by-step RSA execution.',
  concepts: ['Asymmetric Crypto', 'Modular Arithmetic', 'Euler Totient', 'Algorithm Walkthrough'],
  topbarTitle: 'Theory 05.1 — RSA Cryptosystem Mechanics',

  blocks: [
    // ── Block 0: Conceptual Overview ─────────────────────────────────────────
    {
      kind: 'text',
      title: 'Introduction to RSA Cryptography',
      content: [
        p('RSA (Rivest–Shamir–Adleman) is a widely used public-key cryptosystem designed in 1977. Unlike symmetric ciphers that share a single key, RSA relies on an **asymmetric key pair**: a **Public Key** $(n, e)$ for encryption and a **Private Key** $(n, d)$ for decryption or signing.'),
        p('The security of textbook RSA relies on the practical difficulty of **factoring large prime numbers**. Computing Euler\'s totient function $\\varphi(n)$ on a composite modulus $n = p \\cdot q$ is computationally as hard as factoring $n$.')
      ]
    },

    // ── Block 1: Mathematical Foundations ───────────────────────────────────
    {
      kind: 'formula',
      title: 'Core RSA Formulas',
      lines: [
        'Modulus: n = p \\times q \\quad (p, q \\text{ are prime})',
        'Euler Totient: \\varphi(n) = (p - 1)(q - 1)',
        'Private Exponent: e \\cdot d \\equiv 1 \\pmod{\\varphi(n)} \\implies d = e^{-1} \\bmod \\varphi(n)',
        'Encryption: C = M^e \\bmod n',
        'Decryption: M = C^d \\bmod n'
      ],
      note: 'Note: Plaintext $M$ must satisfy $M < n$. Production implementations combine RSA with padding schemes like RSA-OAEP or hybrid encapsulation (RSA-KEM).'
    },

    // ── Block 2: Interactive Graphical RSA Simulation ──────────────────────
    {
      kind: 'custom',
      title: 'Interactive RSA Simulator',
      desc: 'A four-step wizard: choose primes, meet your keys, lock a message, then unlock it — watch the modular exponentiation happen bit by bit.',
      html: `
        <style>
          .rsa-sim { border: 1px solid var(--border-mid, #243040); border-radius: 8px; overflow: hidden; background: #0a0d10; }
          .rsa-stepper { display:flex; align-items:flex-start; justify-content:center; gap:0; padding:18px 12px 14px; background:#0e1318; border-bottom:1px solid var(--border-mid,#243040); flex-wrap:wrap; }
          .rsa-step-wrap { display:flex; flex-direction:column; align-items:center; }
          .rsa-step-dot { width:28px; height:28px; border-radius:50%; background:#18202a; border:1px solid var(--border-mid,#243040); display:flex; align-items:center; justify-content:center; font-size:0.75rem; color:#7090a8; font-weight:bold; transition: all .25s ease; }
          .rsa-step-dot.active { background: var(--text-accent,#00e5aa); color:#060809; border-color: var(--text-accent,#00e5aa); box-shadow: 0 0 12px rgba(0,229,170,.5); }
          .rsa-step-dot.done { background: #123328; color: var(--text-accent,#00e5aa); border-color: var(--text-accent,#00e5aa); }
          .rsa-step-line { width:36px; height:2px; background:var(--border-mid,#243040); margin-top:13px; }
          .rsa-step-line.done { background: var(--text-accent,#00e5aa); }
          .rsa-step-label { font-size:0.65rem; color:#7090a8; text-align:center; margin-top:4px; width:76px; }
          .rsa-panel { padding:22px 20px; display:none; }
          .rsa-panel.active { display:block; animation: rsaFade .3s ease; }
          @keyframes rsaFade { from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }
          .rsa-flex-row { display:flex; gap:18px; align-items:center; flex-wrap:wrap; justify-content:center; margin-top:8px; }
          .rsa-prime-tile { background:#131920; border:2px solid var(--border-mid,#243040); border-radius:8px; padding:14px; text-align:center; min-width:110px; }
          .rsa-prime-tile label { display:block; font-size:0.7rem; color:#7090a8; margin-bottom:6px; }
          .rsa-prime-tile select { width:100%; text-align:center; font-size:1.1rem; font-weight:bold; color: var(--text-accent,#00e5aa); }
          .rsa-op-symbol { font-size:1.6rem; color:#7090a8; }
          .rsa-vault { background: linear-gradient(160deg,#131920,#0a0d10); border:2px solid var(--text-accent,#00e5aa); border-radius:10px; padding:14px 22px; text-align:center; min-width:140px; }
          .rsa-vault .rsa-vault-label { font-size:0.7rem; color:#7090a8; }
          .rsa-vault .rsa-vault-value { font-size:1.4rem; font-weight:bold; color: var(--text-accent,#00e5aa); margin-top:4px; }
          .rsa-phi-line { text-align:center; margin-top:16px; font-size:0.85rem; color:#c8d8e8; opacity:0; transition: opacity .4s ease; line-height:1.5; }
          .rsa-phi-line.show { opacity:1; }
          .rsa-key-cards { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; margin-top:10px; }
          .rsa-key-card { flex:1; min-width:220px; max-width:280px; background:#131920; border:1px solid var(--border-mid,#243040); border-radius:8px; padding:16px; text-align:center; }
          .rsa-key-card.public { border-color:#3aa0ff; }
          .rsa-key-card.private { border-color:#ff9d3a; }
          .rsa-key-icon { font-size:1.8rem; }
          .rsa-key-title { font-weight:bold; margin:8px 0 4px; }
          .rsa-key-card.public .rsa-key-title { color:#3aa0ff; }
          .rsa-key-card.private .rsa-key-title { color:#ff9d3a; }
          .rsa-key-vals { font-family:monospace; font-size:0.9rem; margin:6px 0; color:#c8d8e8; }
          .rsa-key-note { font-size:0.72rem; color:#7090a8; line-height:1.4; }
          .rsa-msg-row { display:flex; gap:10px; align-items:center; justify-content:center; margin-bottom:8px; flex-wrap:wrap; }
          .rsa-hint { text-align:center; font-size:0.72rem; color:#7090a8; margin-bottom:16px; }
          .rsa-box-anim { display:flex; align-items:center; justify-content:center; gap:14px; margin: 14px 0 18px; font-size:1.8rem; }
          .rsa-arrow { color: var(--text-accent,#00e5aa); font-size:1.4rem; }
          .rsa-trace-wrap { max-width:480px; margin:0 auto; }
          .rsa-trace-table { width:100%; border-collapse:collapse; font-family:monospace; font-size:0.8rem; }
          .rsa-trace-table th, .rsa-trace-table td { border:1px solid var(--border-dim,#1a2230); padding:5px 8px; text-align:center; }
          .rsa-trace-table th { background:#131920; color:#7090a8; font-weight:normal; }
          .rsa-trace-row-new { animation: rsaFade .25s ease; }
          .rsa-result-badge { text-align:center; margin-top:14px; font-size:1.05rem; font-weight:bold; color: var(--text-accent,#00e5aa); }
          .rsa-nav-row { display:flex; justify-content:space-between; padding:14px 20px; border-top:1px solid var(--border-mid,#243040); background:#0e1318; }
          .rsa-success { text-align:center; margin-top:14px; padding:12px; border-radius:6px; background:#0f2a1f; border:1px solid #00e5aa; color:#00e5aa; font-weight:bold; }
          .rsa-fail { text-align:center; margin-top:14px; padding:12px; border-radius:6px; background:#2a0f0f; border:1px solid #ff5555; color:#ff7777; font-weight:bold; }
        </style>

        <div class="rsa-sim" id="rsa-sim-root">
          <div class="rsa-stepper">
            <div class="rsa-step-wrap">
              <div class="rsa-step-dot active" id="rsa-dot-1">1</div>
              <div class="rsa-step-label">Choose Primes</div>
            </div>
            <div class="rsa-step-line" id="rsa-line-1"></div>
            <div class="rsa-step-wrap">
              <div class="rsa-step-dot" id="rsa-dot-2">2</div>
              <div class="rsa-step-label">Meet Your Keys</div>
            </div>
            <div class="rsa-step-line" id="rsa-line-2"></div>
            <div class="rsa-step-wrap">
              <div class="rsa-step-dot" id="rsa-dot-3">3</div>
              <div class="rsa-step-label">Lock a Message</div>
            </div>
            <div class="rsa-step-line" id="rsa-line-3"></div>
            <div class="rsa-step-wrap">
              <div class="rsa-step-dot" id="rsa-dot-4">4</div>
              <div class="rsa-step-label">Unlock It</div>
            </div>
          </div>

          <!-- Step 1 -->
          <div class="rsa-panel active" data-panel="1">
            <p class="ex-p" style="text-align:center; margin-bottom:6px;">Every RSA key starts with two secret prime numbers. Pick two below — real systems use primes hundreds of digits long, but small ones let us see every step happen live.</p>
            <div class="rsa-flex-row">
              <div class="rsa-prime-tile">
                <label>Prime p</label>
                <select id="rsa-p-select"></select>
              </div>
              <div class="rsa-op-symbol">×</div>
              <div class="rsa-prime-tile">
                <label>Prime q</label>
                <select id="rsa-q-select"></select>
              </div>
              <div class="rsa-op-symbol">=</div>
              <div class="rsa-vault">
                <div class="rsa-vault-label">Modulus n</div>
                <div class="rsa-vault-value" id="rsa-n-out">—</div>
              </div>
            </div>
            <div class="rsa-phi-line" id="rsa-phi-line">
              φ(n) = (p−1)(q−1) = <strong id="rsa-phi-out">—</strong> — this counts how many numbers below n are coprime to it, and it's the one number an attacker can't compute without first factoring n back into p and q.
            </div>
          </div>

          <!-- Step 2 -->
          <div class="rsa-panel" data-panel="2">
            <p class="ex-p" style="text-align:center; margin-bottom:6px;">From φ(n), we derive two exponents: one public, one private. The public key is an open padlock anyone can snap shut around a message — only the matching private key can open it again.</p>
            <div class="rsa-key-cards">
              <div class="rsa-key-card public">
                <div class="rsa-key-icon">🔓</div>
                <div class="rsa-key-title">Public Key</div>
                <div class="rsa-key-vals">(n = <span id="rsa-pub-n">—</span>, e = <span id="rsa-pub-e">—</span>)</div>
                <div class="rsa-key-note">Shared with the world. Anyone can use it to lock a message meant for you.</div>
              </div>
              <div class="rsa-key-card private">
                <div class="rsa-key-icon">🔑</div>
                <div class="rsa-key-title">Private Key</div>
                <div class="rsa-key-vals">(n = <span id="rsa-priv-n">—</span>, d = <span id="rsa-priv-d">—</span>)</div>
                <div class="rsa-key-note">Kept secret, forever. Because e·d ≡ 1 (mod φ(n)), only this key can undo the lock.</div>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="rsa-panel" data-panel="3">
            <p class="ex-p" style="text-align:center; margin-bottom:10px;">Pick a message — just a number for now — and lock it with the <strong>public</strong> key. Anyone could perform this step, even someone who has never met you.</p>
            <div class="rsa-msg-row">
              <span class="ex-input-label">Message m =</span>
              <input id="rsa-msg-input" class="ex-hex-input" type="number" style="width:110px;" placeholder="e.g. 42" />
              <button id="rsa-encrypt-btn" class="ex-btn btn-check">🔒 Lock Message</button>
            </div>
            <div class="rsa-hint">m must be a whole number smaller than n = <span id="rsa-msg-max">—</span></div>
            <div class="rsa-box-anim" id="rsa-encrypt-anim" style="display:none;">
              <span>✉️</span><span class="rsa-arrow">→</span><span>🔒</span><span class="rsa-arrow">→</span><span>📦</span>
            </div>
            <div class="rsa-trace-wrap" id="rsa-encrypt-trace-wrap" style="display:none;">
              <table class="rsa-trace-table">
                <thead><tr><th>Exponent bit (of e)</th><th>Operation</th><th>Running value mod n</th></tr></thead>
                <tbody id="rsa-encrypt-trace-body"></tbody>
              </table>
              <div class="rsa-result-badge" id="rsa-encrypt-result" style="display:none;"></div>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="rsa-panel" data-panel="4">
            <p class="ex-p" style="text-align:center; margin-bottom:10px;">Now unlock the ciphertext with the <strong>private</strong> key — the one step in this whole process only you can do.</p>
            <div style="text-align:center; margin-bottom:12px; font-family:monospace;">Ciphertext c = <strong id="rsa-decrypt-c-in">—</strong></div>
            <div style="text-align:center;">
              <button id="rsa-decrypt-btn" class="ex-btn btn-check">🔓 Unlock Message</button>
            </div>
            <div class="rsa-box-anim" id="rsa-decrypt-anim" style="display:none;">
              <span>📦</span><span class="rsa-arrow">→</span><span>🔓</span><span class="rsa-arrow">→</span><span>✉️</span>
            </div>
            <div class="rsa-trace-wrap" id="rsa-decrypt-trace-wrap" style="display:none;">
              <table class="rsa-trace-table">
                <thead><tr><th>Exponent bit (of d)</th><th>Operation</th><th>Running value mod n</th></tr></thead>
                <tbody id="rsa-decrypt-trace-body"></tbody>
              </table>
              <div id="rsa-decrypt-result"></div>
            </div>
          </div>

          <div class="rsa-nav-row">
            <button id="rsa-back-btn" class="ex-btn-secondary">← Back</button>
            <button id="rsa-next-btn" class="ex-btn">Next →</button>
          </div>
        </div>
      `,
      init: (page) => {
        const PRIMES = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];

        const state = { step: 1, p: null, q: null, n: null, phi: null, e: null, d: null, m: undefined, c: undefined };

        const pSelect = page.querySelector('#rsa-p-select');
        const qSelect = page.querySelector('#rsa-q-select');
        PRIMES.forEach((prime) => {
          pSelect.appendChild(new Option(String(prime), String(prime)));
          qSelect.appendChild(new Option(String(prime), String(prime)));
        });
        pSelect.value = '17';
        qSelect.value = '23';

        const nOut = page.querySelector('#rsa-n-out');
        const phiLine = page.querySelector('#rsa-phi-line');
        const phiOut = page.querySelector('#rsa-phi-out');
        const msgMaxHint = page.querySelector('#rsa-msg-max');

        const dots = [1, 2, 3, 4].map((i) => page.querySelector(`#rsa-dot-${i}`));
        const lines = [1, 2, 3].map((i) => page.querySelector(`#rsa-line-${i}`));
        const panels = [1, 2, 3, 4].map((i) => page.querySelector(`.rsa-panel[data-panel="${i}"]`));
        const backBtn = page.querySelector('#rsa-back-btn');
        const nextBtn = page.querySelector('#rsa-next-btn');

        // ── Number Theory Helpers ────────────────────────────────────────
        function gcd(a, b) {
          while (b) { [a, b] = [b, a % b]; }
          return a;
        }

        function modInverse(e, phi) {
          let [oldR, r] = [e, phi];
          let [oldS, s] = [1, 0];
          while (r !== 0) {
            const q = Math.floor(oldR / r);
            [oldR, r] = [r, oldR - q * r];
            [oldS, s] = [s, oldS - q * s];
          }
          let result = oldR === 1 ? oldS % phi : NaN;
          if (result < 0) result += phi;
          return result;
        }

        function pickE(phi) {
          for (let cand = 3; cand < phi; cand += 2) {
            if (gcd(cand, phi) === 1) return cand;
          }
          return 3;
        }

        // Left-to-right (MSB-first) square-and-multiply, with a full step trace.
        function modExpTrace(base, exponent, modulus) {
          const bits = exponent.toString(2).split('');
          let result = 1;
          const steps = [];
          bits.forEach((bitChar) => {
            result = (result * result) % modulus;
            steps.push({ bit: bitChar, op: 'square (r² mod n)', value: result });
            if (bitChar === '1') {
              result = (result * base) % modulus;
              steps.push({ bit: bitChar, op: '× base (mod n)', value: result });
            }
          });
          return { result, steps };
        }

        // ── Key Generation (Steps 1 & 2) ─────────────────────────────────
        function computeKeys() {
          const pVal = parseInt(pSelect.value, 10);
          const qVal = parseInt(qSelect.value, 10);
          if (pVal === qVal) {
            alert('p and q need to be two different primes.');
            return false;
          }
          const n = pVal * qVal;
          const phi = (pVal - 1) * (qVal - 1);
          const e = pickE(phi);
          const d = modInverse(e, phi);

          Object.assign(state, { p: pVal, q: qVal, n, phi, e, d });

          nOut.textContent = String(n);
          phiOut.textContent = String(phi);
          phiLine.classList.add('show');
          msgMaxHint.textContent = String(n);

          page.querySelector('#rsa-pub-n').textContent = String(n);
          page.querySelector('#rsa-pub-e').textContent = String(e);
          page.querySelector('#rsa-priv-n').textContent = String(n);
          page.querySelector('#rsa-priv-d').textContent = String(d);

          return true;
        }

        pSelect.addEventListener('change', computeKeys);
        qSelect.addEventListener('change', computeKeys);

        // ── Encrypt (Step 3) ─────────────────────────────────────────────
        const msgInput = page.querySelector('#rsa-msg-input');
        const encryptBtn = page.querySelector('#rsa-encrypt-btn');
        const encryptAnim = page.querySelector('#rsa-encrypt-anim');
        const encryptTraceWrap = page.querySelector('#rsa-encrypt-trace-wrap');
        const encryptTraceBody = page.querySelector('#rsa-encrypt-trace-body');
        const encryptResult = page.querySelector('#rsa-encrypt-result');

        function renderTraceRows(tbody, steps, onDone) {
          tbody.innerHTML = '';
          let i = 0;
          function addRow() {
            if (i >= steps.length) { onDone(); return; }
            const step = steps[i];
            const tr = document.createElement('tr');
            tr.className = 'rsa-trace-row-new';
            tr.innerHTML = `<td>${step.bit}</td><td>${step.op}</td><td>${step.value}</td>`;
            tbody.appendChild(tr);
            i += 1;
            setTimeout(addRow, 220);
          }
          addRow();
        }

        encryptBtn.addEventListener('click', () => {
          const m = parseInt(msgInput.value, 10);
          if (Number.isNaN(m) || m < 0 || m >= state.n) {
            alert(`Enter a whole number smaller than n (${state.n}).`);
            return;
          }
          state.m = m;
          const trace = modExpTrace(m, state.e, state.n);
          state.c = trace.result;

          encryptAnim.style.display = 'flex';
          encryptTraceWrap.style.display = 'block';
          encryptResult.style.display = 'none';
          renderTraceRows(encryptTraceBody, trace.steps, () => {
            encryptResult.textContent = `Ciphertext c = ${state.c}`;
            encryptResult.style.display = 'block';
          });

          page.querySelector('#rsa-decrypt-c-in').textContent = String(state.c);
        });

        // ── Decrypt (Step 4) ─────────────────────────────────────────────
        const decryptBtn = page.querySelector('#rsa-decrypt-btn');
        const decryptAnim = page.querySelector('#rsa-decrypt-anim');
        const decryptTraceWrap = page.querySelector('#rsa-decrypt-trace-wrap');
        const decryptTraceBody = page.querySelector('#rsa-decrypt-trace-body');
        const decryptResultEl = page.querySelector('#rsa-decrypt-result');

        decryptBtn.addEventListener('click', () => {
          if (state.c === undefined) {
            alert('Lock a message first (Step 3).');
            return;
          }
          const trace = modExpTrace(state.c, state.d, state.n);

          decryptAnim.style.display = 'flex';
          decryptTraceWrap.style.display = 'block';
          decryptResultEl.innerHTML = '';
          renderTraceRows(decryptTraceBody, trace.steps, () => {
            const match = trace.result === state.m;
            const div = document.createElement('div');
            div.className = match ? 'rsa-success' : 'rsa-fail';
            div.textContent = match
              ? `Recovered message = ${trace.result} — matches your original! The private key undid exactly what the public key locked.`
              : `❌ Recovered ${trace.result}, expected ${state.m}. Try regenerating keys and locking again.`;
            decryptResultEl.appendChild(div);
          });
        });

        // ── Step Navigation ──────────────────────────────────────────────
        function setStep(n) {
          state.step = n;
          panels.forEach((panel, idx) => panel.classList.toggle('active', idx + 1 === n));
          dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx + 1 === n);
            dot.classList.toggle('done', idx + 1 < n);
          });
          lines.forEach((line, idx) => line.classList.toggle('done', idx + 1 < n));
          backBtn.style.visibility = n === 1 ? 'hidden' : 'visible';
          nextBtn.textContent = n === 4 ? 'Restart ↺' : 'Next →';
        }

        function resetSim() {
          state.m = undefined;
          state.c = undefined;
          msgInput.value = '';
          encryptAnim.style.display = 'none';
          encryptTraceWrap.style.display = 'none';
          encryptTraceBody.innerHTML = '';
          encryptResult.style.display = 'none';
          decryptAnim.style.display = 'none';
          decryptTraceWrap.style.display = 'none';
          decryptTraceBody.innerHTML = '';
          decryptResultEl.innerHTML = '';
          setStep(1);
        }

        nextBtn.addEventListener('click', () => {
          if (state.step === 4) { resetSim(); return; }
          if (state.step === 3 && state.c === undefined) {
            alert('Lock a message first before moving on.');
            return;
          }
          setStep(state.step + 1);
        });

        backBtn.addEventListener('click', () => {
          if (state.step > 1) setStep(state.step - 1);
        });

        // Boot: compute keys for the default primes and show step 1.
        computeKeys();
        setStep(1);
      }
    }
  ]
};
