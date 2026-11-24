import {
  generate_maccelijk_challenge,
  compute_maccelijk_mac,
  verify_maccelijk_mac
} from '../../chapters/challenges_pkg/maccelijk.js';

export const aesMaccelijkLab = {
  id: 'aes-maccelijk',
  num: '04.4',
  tag: 'MAC Lab',
  tagClass: 'aes',
  title: 'MACcelijk — MAC & VFY Oracle Lab',
  desc: 'Query a MACcelijk interface to observe tag behavior across inputs and test verification responses via VFY.',
  concepts: ['MAC Modes', 'Existential Unforgeability', 'MAC / VFY Queries'],
  topbarTitle: 'Exercise 04.4 — MACcelijk Lab',

  blocks: [
    {
      kind: 'custom',
      title: 'MACcelijk Query Interface',
      init: async (page) => {
        const seed = 1337;
        const inputEl = page.querySelector('#mac-query-input');
        const btnEl = page.querySelector('#mac-query-btn');
        const outEl = page.querySelector('#mac-tag-output');
        const countEl = page.querySelector('#mac-query-count');

        let queries = 0;

        btnEl.addEventListener('click', async () => {
          const message = inputEl.value.trim();
          const tag = compute_maccelijk_mac(seed, message);
          queries += 1;
          outEl.value = tag;
          countEl.textContent = `MAC Queries: ${queries}`;
        });
      }
    },
    {
      kind: 'custom',
      title: 'VFY(m, tag) Verification Interface',
      init: async (page) => {
        const seed = 1337;
        const msgEl = page.querySelector('#vfy-msg-input');
        const tagEl = page.querySelector('#vfy-tag-input');
        const btnEl = page.querySelector('#vfy-check-btn');
        const fbEl = page.querySelector('#vfy-result-fb');

        btnEl.addEventListener('click', async () => {
          const message = msgEl.value.trim();
          const tag = tagEl.value.trim();
          const valid = verify_maccelijk_mac(seed, message, tag);
          fbEl.style.display = 'block';
          fbEl.className = valid ? 'ex-feedback success' : 'ex-feedback error';
          fbEl.textContent = valid
            ? 'VFY accepted the tag for the message.'
            : 'VFY rejected the tag for the message.';
        });
      }
    }
  ]
};