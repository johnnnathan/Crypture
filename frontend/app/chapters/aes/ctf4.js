import {
  callPythonChallengeMethod,
  loadPythonChallenge,
  submitPythonChallenge
} from '../../python-engine.js';

export const aesMaccelijkLab = {
  id: 'aes-maccelijk',
  num: '04.4',
  tag: 'MAC Lab',
  tagClass: 'aes',
  title: 'MACcelijk — MAC & VFY Oracle Lab',
  desc: 'Query a MACcelijk interface to observe tag behavior across inputs and test verification responses via VFY.',
  concepts: ['MAC Modes', 'Existential Unforgeability', 'MAC / VFY Queries'],

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'MACcelijk Oracle Overview',
      html: `
        <p class="ex-p">
          A Message Authentication Code (MAC) mode pairs a tagging routine <code>MAC(m)</code> with a verification routine <code>VFY(m, tag)</code>. In security games, an adversary probes <code>MAC</code> on chosen messages to analyze how structure, length, or state updates affect tags before submitting a candidate pair to <code>VFY</code>.
        </p>
        <p class="ex-p">
          Use the interactive query and verification panels below to compare responses across inputs and test candidate <code>(message, tag)</code> pairs.
        </p>
      `
    },
    {
      kind: 'custom',
      title: 'MACcelijk Query Interface',
      html: `
        <div class="ex-data-block" id="maccelijk-panel">
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
        const challengeId = 'maccelijk';
        const seed = 1337;

        const inputEl = container.querySelector('#mac-query-input');
        const btnEl = container.querySelector('#mac-query-btn');
        const outEl = container.querySelector('#mac-tag-output');
        const countEl = container.querySelector('#mac-query-count');

        let queries = 0;

        btnEl.addEventListener('click', async () => {
          const message = inputEl.value.trim();

          try {
            const tag = await callPythonChallengeMethod(
              challengeId,
              seed,
              'compute_mac',
              message
            );

            queries += 1;
            outEl.value = tag;
            countEl.textContent = `MAC Queries: ${queries}`;
          } catch (err) {
            outEl.value = 'Error computing MAC';
            console.error(err);
          }
        });
      }
    },
    {
      kind: 'custom',
      title: 'VFY(m, tag) Verification Interface',
      html: `
        <div class="ex-data-block" id="maccelijk-vfy-panel">
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
        const challengeId = 'maccelijk';
        const seed = 1337;

        const msgEl = container.querySelector('#vfy-msg-input');
        const tagEl = container.querySelector('#vfy-tag-input');
        const btnEl = container.querySelector('#vfy-check-btn');
        const fbEl = container.querySelector('#vfy-result-fb');

        btnEl.addEventListener('click', async () => {
          const message = msgEl.value.trim();
          const tag = tagEl.value.trim();

          try {
            const valid = await callPythonChallengeMethod(
              challengeId,
              seed,
              'verify_mac',
              message,
              tag
            );

            fbEl.style.display = 'block';
            fbEl.className = valid ? 'ex-feedback success' : 'ex-feedback error';
            fbEl.textContent = valid
              ? 'VFY accepted the tag for the message.'
              : 'VFY rejected the tag for the message.';
          } catch (err) {
            fbEl.style.display = 'block';
            fbEl.className = 'ex-feedback error';
            fbEl.textContent = 'Error verifying tag.';
            console.error(err);
          }
        });
      }
    }
  ]
};

export default aesMaccelijkLab;