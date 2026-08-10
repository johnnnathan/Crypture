import initWasm, {
  get_padding_oracle_target,
  query_padding_oracle,
  check_padding_oracle_flag,
} from '../challenges_pkg/challenge_engine.js';

export const aesPaddingOracleCtf = {
  id: 'aes-padding-oracle',
  num: '04.3',
  tag: 'CTF Challenge',
  tagClass: 'aes',
  title: 'Challenge — CBC Padding Oracle',
  desc: 'Decrypt a secret flag by using a padding validity oracle (Vaudenay attack).',
  concepts: ['AES-CBC', 'PKCS#7', 'Padding Oracle', 'Side-Channel Attack'],

  onMount: async () => { await initWasm(); },

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Target Challenge Ciphertext',
      html: `
        <p class="ex-p">An encrypted flag has been intercepted. The server exposes an endpoint that decrypts submitted ciphertexts and reveals <strong>only</strong> whether PKCS#7 padding is valid or invalid.</p>
      `,
    },
    {
      kind: 'custom',
      title: 'Intercepted Data & Oracle Sandbox',
      html: `
        <div class="ex-data-block">
          <div id="po-target-banner" class="ex-code-banner">Loading Wasm target...</div>
          <hr style="border-color:#1e293b; margin:12px 0;">
          <p class="ex-p"><strong>Query Oracle Sandbox:</strong></p>
          <div style="margin-bottom:8px;">
            <span class="ex-input-label">IV (Hex):</span>
            <input id="po-iv-input" class="ex-hex-input" style="width:100%;" />
          </div>
          <div style="margin-bottom:8px;">
            <span class="ex-input-label">Ciphertext (Hex):</span>
            <textarea id="po-ct-input" class="ex-hex-input" style="width:100%; height:50px;"></textarea>
          </div>
          <button id="po-query-btn" class="ex-btn btn-check">Send to Oracle</button>
          <span id="po-oracle-result" style="margin-left:12px; font-weight:bold;"></span>
        </div>
      `,
      init: (container) => {
        const target = get_padding_oracle_target(1337n);
        const banner = container.querySelector('#po-target-banner');
        const ivIn = container.querySelector('#po-iv-input');
        const ctIn = container.querySelector('#po-ct-input');
        const btn = container.querySelector('#po-query-btn');
        const resSpan = container.querySelector('#po-oracle-result');

        banner.textContent = `Target IV: ${target.iv_hex}\nTarget CT: ${target.ciphertext}`;
        ivIn.value = target.iv_hex;
        ctIn.value = target.ciphertext;

        btn.addEventListener('click', () => {
          const status = query_padding_oracle(1337n, ctIn.value, ivIn.value);
          resSpan.textContent = status;
          resSpan.style.color = status === 'VALID' ? '#00f0ff' : '#ff4a4a';
        });
      },
    },
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '4.PAD',
          title: 'Submit Recovered Flag',
          input: { type: 'text', placeholder: 'FLAG{...}', width: '320px' },
          parse: (raw) => raw.trim(),
          check: (val) => check_padding_oracle_flag(1337n, val),
        },
      ],
    },
  ],
};

export default aesPaddingOracleCtf;
