import initWasm, {
  generate_maccelijk_challenge,
  compute_maccelijk_mac,
  verify_maccelijk_mac
} from '../challenges_pkg/challenge_engine.js';

export const aesMaccelijkLab = {
  id: 'aes-maccelijk',
  num: '04.4',
  tag: 'MAC Lab',
  tagClass: 'aes',
  title: 'MACcelijk — MAC & VFY Oracle Lab',
  desc: 'Query a MACcelijk interface to observe tag behavior across inputs and test verification responses via VFY.',
  concepts: ['MAC Modes', 'Existential Unforgeability', 'MAC / VFY Queries'],
  topbarTitle: 'Exercise 04.4 — MACcelijk Lab',

  onMount: async () => {
    await initWasm();
  },

  blocks: [
    {
      kind: 'custom',
      title: 'MACcelijk Query Interface',
      html: `
        <div class="ex-data-block">
          <div style="margin-bottom: 8px;">
            <span class="ex-input-label" style="display:block; margin-bottom:4px;">Message m:</span>
            <input
              id="mac-query-input"
              class="ex-text-input"
              type="text"
              maxlength="256"
              style="width:100%; font-family:monospace;"
              placeholder="Enter test message..."
            />
          </div>
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <span id="mac-query-count" style="font-size:12px; color:#94a3b8;">MAC Queries: 0</span>
            <button id="mac-query-btn" type="button" class="ex-btn">Run MAC(m)</button>
          </div>
          <div class="ex-formula-block">
            <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Returned Tag:</div>
            <input
              id="mac-tag-output"
              class="ex-text-input"
              type="text"
              style="width:100%; font-family:monospace;"
              readonly
              placeholder="—"
            />
          </div>
        </div>
      `,
      init: async (container) => {
        const seed = 1337n;

        const inputEl = container.querySelector('#mac-query-input');
        const btnEl = container.querySelector('#mac-query-btn');
        const outEl = container.querySelector('#mac-tag-output');
        const countEl = container.querySelector('#mac-query-count');

        if (!inputEl || !btnEl || !outEl || !countEl) {
          console.error('One or more DOM elements are missing in the MACcelijk Query Interface.');
          return;
        }

        if (typeof generate_maccelijk_challenge === 'function') {
          generate_maccelijk_challenge(seed);
        }

        let queries = 0;

        btnEl.addEventListener('click', async () => {
          try {
            const message = inputEl.value.trim();
            const tag = await compute_maccelijk_mac(seed, message);
            queries += 1;
            outEl.value = tag;
            countEl.textContent = `MAC Queries: ${queries}`;
          } catch (err) {
            console.error('Error computing MAC:', err);
            outEl.value = 'Error computing MAC';
          }
        });
      }
    },
    {
      kind: 'custom',
      title: 'VFY(m, tag) Verification Interface',
      html: `
        <div class="ex-data-block">
          <div style="margin-bottom: 8px;">
            <span class="ex-input-label" style="display:block; margin-bottom:4px;">Candidate Message m:</span>
            <input
              id="vfy-msg-input"
              class="ex-text-input"
              type="text"
              maxlength="256"
              style="width:100%; font-family:monospace;"
              placeholder="Candidate message..."
            />
          </div>
          <div style="margin-bottom: 8px;">
            <span class="ex-input-label" style="display:block; margin-bottom:4px;">Candidate Tag:</span>
            <input
              id="vfy-tag-input"
              class="ex-text-input"
              type="text"
              maxlength="128"
              style="width:100%; font-family:monospace;"
              placeholder="Candidate tag..."
            />
          </div>
          <div style="margin-bottom: 10px; text-align: right;">
            <button id="vfy-check-btn" type="button" class="ex-btn btn-check">Submit VFY(m, tag)</button>
          </div>
          <div id="vfy-result-fb" class="ex-feedback" style="display:none;"></div>
        </div>
      `,
      init: async (container) => {
        const seed = 1337;

        const msgEl = container.querySelector('#vfy-msg-input');
        const tagEl = container.querySelector('#vfy-tag-input');
        const btnEl = container.querySelector('#vfy-check-btn');
        const fbEl = container.querySelector('#vfy-result-fb');

        if (!msgEl || !tagEl || !btnEl || !fbEl) {
          console.error('One or more DOM elements are missing in the VFY Interface.');
          return;
        }

        btnEl.addEventListener('click', async () => {
          try {
            const message = msgEl.value.trim();
            const tag = tagEl.value.trim();
            const valid = await verify_maccelijk_mac(seed, message, tag);
            fbEl.style.display = 'block';
            fbEl.className = valid ? 'ex-feedback success' : 'ex-feedback error';
            fbEl.textContent = valid
              ? 'VFY accepted the tag for the message.'
              : 'VFY rejected the tag for the message.';
          } catch (err) {
            console.error('Error verifying MAC:', err);
            fbEl.style.display = 'block';
            fbEl.className = 'ex-feedback error';
            fbEl.textContent = 'Error verifying MAC.';
          }
        });
      }
    }
  ]
};

export default aesMaccelijkLab;