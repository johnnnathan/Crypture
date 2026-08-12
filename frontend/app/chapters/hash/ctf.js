import initWasm, { 
  get_sha1_challenge_data, 
  check_sha1_collision_pair,
  compute_sha1_oracle 
} from '../challenges_pkg/challenge_engine.js';

export const sha1Ctf = {
  id: 'sha1-collision-extension',
  num: '03.3',
  tag: 'CTF Challenge',
  tagClass: 'hash',
  title: 'Challenge — SHA-1 Collision Extension',
  desc: 'Exploit the Merkle–Damgård state extension property to forge matching hashes.',
  concepts: ['SHA-1', 'Merkle-Damgård', 'Collision Extension'],

  onMount: async () => {
    await initWasm();
  },

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Section 1 — Background',
      html: `
        <p class="ex-p">SHA-1 uses the <strong>Merkle–Damgård construction</strong>, processing messages in sequential 512-bit blocks and carrying state forward.</p>
        <p class="ex-p">The supplied collision material below contains two distinct messages <code>(S ∥ M)</code> and <code>(S ∥ M')</code> that reach identical internal SHA-1 states.</p>
      `,
    },
    {
      kind: 'custom',
      init: (page) => {
        const data = get_sha1_challenge_data(1337n); // Seed
        const container = page.querySelector('#collision-materials');
        if (container) {
          container.innerHTML = `
            <div class="ex-data-block">
              <div><strong>S (192 B):</strong> <code class="break-all">${data.s}</code></div>
              <div><strong>M (128 B):</strong> <code class="break-all">${data.m}</code></div>
              <div><strong>M' (128 B):</strong> <code class="break-all">${data.m_prime}</code></div>
              <div><strong>M<sub>a</sub> Target (128 B):</strong> <code class="break-all">${data.ma}</code></div>
            </div>
          `;
        }
      },
      html: `
        <h3 class="ex-h3">Section 2 — Collision Material</h3>
        <div id="collision-materials">Loading challenge material...</div>
      `,
    },
    {
      kind: 'custom',
      init: (page) => {
        const btn = page.querySelector('#oracle-btn');
        const input = page.querySelector('#oracle-input');
        const out = page.querySelector('#oracle-output');
        
        if (btn) {
          btn.addEventListener('click', () => {
            const digest = compute_sha1_oracle(input.value);
            out.textContent = `SHA-1: ${digest}`;
          });
        }
      },
      html: `
        <h3 class="ex-h3">Section 3 — SHA-1 Oracle Tool</h3>
        <div class="ex-input-row">
          <input id="oracle-input" class="ex-text-input" placeholder="Hex string input..." />
          <button id="oracle-btn" class="ex-btn-secondary">Hash Hex</button>
        </div>
        <div id="oracle-output" class="ex-formula-note" style="margin-top:6px;"></div>
      `,
    },
    {
      kind: 'custom',
      init: (page) => {
        const btn = page.querySelector('#submit-ctf-btn');
        const msgA = page.querySelector('#msg-a-input');
        const msgB = page.querySelector('#msg-b-input');
        const fb = page.querySelector('#ctf-feedback');

        if (btn) {
          btn.addEventListener('click', () => {
            const res = check_sha1_collision_pair(1337n, msgA.value, msgB.value);
            fb.style.display = 'block';
            fb.className = `ex-feedback ${res.correct ? 'success' : 'error'}`;
            fb.textContent = res.message;
          });
        }
      },
      html: `
        <h3 class="ex-h3">Section 4 — Submission</h3>
        <p class="ex-p">Construct two distinct 448-byte messages in hex format:</p>
        <div style="margin-bottom:10px;">
          <label><strong>Message A (S ∥ M ∥ M<sub>a</sub>):</strong></label>
          <textarea id="msg-a-input" class="ex-text-input" rows="3" style="width:100%; font-family:monospace;" placeholder="Hex Message A..."></textarea>
        </div>
        <div style="margin-bottom:10px;">
          <label><strong>Message B (S ∥ M' ∥ M<sub>a</sub>):</strong></label>
          <textarea id="msg-b-input" class="ex-text-input" rows="3" style="width:100%; font-family:monospace;" placeholder="Hex Message B..."></textarea>
        </div>
        <button id="submit-ctf-btn" class="ex-btn btn-check">Verify Collision</button>
        <div id="ctf-feedback" class="ex-feedback" style="display:none; margin-top:10px;"></div>
      `,
    },
  ],
};

export default sha1Ctf;
