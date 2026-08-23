import { p } from '../../chapter-engine.js';
import { loadPythonChallenge, submitPythonChallenge } from '../../python-engine.js';

export const rsaPracticeChapter = {
  id: 'rsa-practice',
  num: '05.2',
  tag: 'Lab Exercises',
  tagClass: 'rsa',
  title: 'RSA Cryptosystem — Practice & Engine Challenges',
  desc: 'Apply your knowledge to factor numbers, calculate totients, decrypt ciphers, and test Python WebAssembly verifiers.',
  concepts: ['Key Generation', 'Decryption Challenge', 'Pyodide Wasm'],
  topbarTitle: 'Exercise 05.2 — RSA Practice Lab',

  blocks: [
    // ── Block 0: Standard Exercise Group ──────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Exercise Group 1 — Manual Computations',
      items: [
        {
          num: '1.1',
          title: 'Computing Euler\'s Totient Function',
          bodyHtml: p('Given primes $p = 19$ and $q = 23$, calculate the value of $\\varphi(n)$ for $n = p \\cdot q$.'),
          hint: 'Use the property φ(n) = (p - 1)(q - 1).',
          input: {
            type: 'number',
            placeholder: 'e.g. 396',
            width: '180px'
          },
          check: (parsedValue) => ({
            correct: parsedValue === 396,
            message: parsedValue === 396
              ? '🎉 Correct! φ(437) = (18)(22) = 396.'
              : 'Incorrect. Remember φ(n) = (19-1)*(23-1).'
          })
        },
        {
          num: '1.2',
          title: 'Manual RSA Decryption',
          bodyHtml: p('Alice receives ciphertext $C\' = 384$. Given her public modulus $n = 437$ and private key exponent $d = 283$, decrypt $C\'$ to recover $m$.'),
          hint: 'Compute m = 384²⁸³ mod 437.',
          input: {
            type: 'number',
            placeholder: 'Plaintext integer...',
            width: '180px'
          },
          check: (parsedValue) => ({
            correct: parsedValue === 104,
            message: parsedValue === 104
              ? '🎉 Correct! 384²⁸³ ≡ 104 (mod 437).'
              : 'Incorrect. Evaluate 384²⁸³ mod 437.'
          })
        },
        {
          num: '1.3',
          title: 'Textbook RSA Vulnerability',
          bodyHtml: p('Which property of textbook RSA allows an attacker to forge a signature $s_3$ for message $m_3 = m_1 \\cdot m_2 \\pmod n$ from valid signatures $s_1$ and $s_2$?'),
          input: {
            type: 'mc',
            options: [
              { label: 'Non-determinism', value: 'non_det' },
              { label: 'Malleability (Homomorphic property)', value: 'malleability' },
              { label: 'Full-Domain Hashing', value: 'fdh' },
              { label: 'Euler Redundancy', value: 'redundancy' }
            ]
          },
          check: (parsedValue) => ({
            correct: parsedValue === 'malleability',
            message: parsedValue === 'malleability'
              ? '🎉 Correct! Textbook RSA is multiplicative malleable: (m₁m₂)^d = m₁^d * m₂^d mod n.'
              : 'Incorrect. Consider how multiplication inside the exponent behaves.'
          })
        }
      ]
    },

    // ── Block 1: Python Engine Interactive Challenge ─────────────────────────
    {
      kind: 'custom',
      title: 'Exercise Group 2 — Dynamic Python RSA Bridge',
      desc: 'Verify key inverse properties dynamically through Pyodide/Python environment integration.',
      html: `
        <div class="ex-exercise" id="py-rsa-card">
          <div class="ex-ex-body">
            <div id="py-rsa-loading" style="color: #888;">🌀 Initializing Pyodide Engine...</div>
            <div id="py-rsa-content" style="display: none;">
              <div class="ex-data-block">
                <div class="ex-data-row"><span>Prime p:</span><span class="accent" id="py-rsa-p">—</span></div>
                <div class="ex-data-row"><span>Prime q:</span><span class="accent" id="py-rsa-q">—</span></div>
                <div class="ex-data-row"><span>Public Exponent (e):</span><span class="accent" id="py-rsa-e">—</span></div>
              </div>
              <p class="ex-p hint" style="margin-top: 8px;">Calculate the private decryption exponent d = e⁻¹ mod φ(n).</p>
              <div class="ex-input-row" style="margin-top: 12px;">
                <span class="ex-input-label">d =</span>
                <input id="py-rsa-input" class="ex-text-input" type="text" placeholder="Private exponent..." style="width: 200px;" />
                <button id="py-rsa-submit" class="ex-btn btn-check">Verify d with Python</button>
              </div>
              <div id="py-rsa-fb" class="ex-feedback" style="display:none; margin-top: 12px;"></div>
            </div>
          </div>
        </div>
      `,
      init: async (page) => {
        const loadingEl = page.querySelector('#py-rsa-loading');
        const contentEl = page.querySelector('#py-rsa-content');
        const pEl = page.querySelector('#py-rsa-p');
        const qEl = page.querySelector('#py-rsa-q');
        const eEl = page.querySelector('#py-rsa-e');
        const inputEl = page.querySelector('#py-rsa-input');
        const btnEl = page.querySelector('#py-rsa-submit');
        const fbEl = page.querySelector('#py-rsa-fb');

        const seed = 437;
        const challengeId = 'rsa-private-key-challenge';

        try {
          const payload = await loadPythonChallenge(challengeId, seed);
          pEl.textContent = payload.p || '19';
          qEl.textContent = payload.q || '23';
          eEl.textContent = payload.e || '7';

          loadingEl.style.display = 'none';
          contentEl.style.display = 'block';

          btnEl.addEventListener('click', async () => {
            const userAnswer = inputEl.value;
            fbEl.style.display = 'block';
            fbEl.className = 'ex-feedback';
            fbEl.textContent = 'Evaluating in Python engine...';

            const result = await submitPythonChallenge(challengeId, seed, userAnswer);
            fbEl.textContent = result.message;
            fbEl.className = result.correct ? 'ex-feedback success' : 'ex-feedback error';
          });
        } catch (err) {
          pEl.textContent = '19';
          qEl.textContent = '23';
          eEl.textContent = '7';
          loadingEl.style.display = 'none';
          contentEl.style.display = 'block';

          btnEl.addEventListener('click', () => {
            const val = parseInt(inputEl.value, 10);
            fbEl.style.display = 'block';
            if (val === 283) {
              fbEl.className = 'ex-feedback success';
              fbEl.textContent = '🎉 Correct! 7⁻¹ mod 396 = 283 (via Extended Euclidean Algorithm).';
            } else {
              fbEl.className = 'ex-feedback error';
              fbEl.textContent = '❌ Incorrect. Hint: Compute inverse of 7 mod (18 * 22).';
            }
          });
        }
      }
    }
  ]
};
