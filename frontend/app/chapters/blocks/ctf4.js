import initWasm, {
  generate_des_bruteforce_challenge,
  check_des_bruteforce_challenge,
} from '../challenges_pkg/challenge_engine.js';

export const desBruteforceCtf = {
  id: 'des-bruteforce-ctf',
  num: '03.4',
  tag: 'CTF Challenge',
  tagClass: 'des',
  title: 'Challenge — Export-Grade DES Key Search',
  desc: 'Perform an offline known-plaintext key search attack against a restricted 20-bit DES keyspace. You build the cracker — no starter solver is provided.',
  concepts: ['Brute-Force Attack', 'Restricted Keyspace', 'Known-Plaintext Attack', 'Export-Grade Cryptography'],
  topbarTitle: 'Exercise 03 — DES Key Exhaustion',

  onMount: async () => {
    await initWasm();
  },

  blocks: [
    // ── 1. Intercepted Transmission Story ─────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted Military Memo',
      html: `
        <p class="ex-p">An intelligence receiver logged an encrypted transmission sent with legacy export-grade hardware. To meet historical export regulations, the device forces all higher-order bits of its 64-bit DES key register to zero, leaving only a fraction of the key actually variable.</p>
        <p class="ex-p">Below is the full cryptographic specification for the hardware, the intercepted ciphertext, and a short fragment of plaintext recovered independently. You'll need to write your own offline key-search tool — no starter script is provided this time.</p>
      `,
    },

    // ── 2. Technical Specifications ──────────────────────────────────────
    {
      kind: 'formula',
      lines: [
        'HELIOS LEGACY CRYPTOGRAPHIC SPECIFICATION',
        '------------------------------------------',
        'Cipher:                 DES',
        'Mode:                   ECB',
        'Block size:             64 bits',
        'Key register width:     64 bits',
        '',
        'Key construction:',
        '   The hardware stores its effective key as a 20-bit unsigned',
        '   configuration value K.',
        '   The DES key register is 64 bits wide.',
        '   Bits 63..20 are permanently zero.',
        '   Bits 19..0 contain K.',
        '   The DES library expects the key register serialized',
        '   most-significant byte first.',
        '',
        'Ciphertext encoding:    ASCII hexadecimal, big-endian byte order',
        '',
        'Verification condition:',
        '   A candidate key is correct if decrypting the FIRST',
        '   ciphertext block with it reproduces the known plaintext',
        '   bytes given below.',
        '',
        'Performance requirement:',
        '   Candidate keys must be verified using only the first',
        '   ciphertext block. Only decrypt the full message once a',
        '   candidate key has been confirmed — decrypting the whole',
        '   transmission on every candidate is unnecessarily slow.',
      ],
      note: 'Do not attempt to derive or repair DES parity bits for this challenge — the 64-bit key register value is passed directly to the DES implementation as-is.',
    },

    // ── 3. Intercept Download & Known Plaintext Fragment ──────────────────
    {
      kind: 'custom',
      title: 'Intercept & Recovered Fragment',
      desc: 'Download the intercepted ciphertext. A short plaintext fragment was separately recovered from a metadata side-channel.',
      html: `
        <div class="ex-data-block" id="bruteforce-toolkit">
          <p class="ex-p"><strong>Intercept analysis — recovered plaintext bytes:</strong></p>
          <div class="ex-code-banner" id="known-plaintext-banner">
            Loading Wasm...
          </div>
          <div class="ex-input-row" style="margin: 16px 0;">
            <button id="dl-ciphertext-btn" class="ex-btn btn-check">⬇️ Download intercept.enc</button>
            <button id="dl-spec-btn" class="ex-btn-secondary btn-reroll">📄 Download Specification (.txt)</button>
          </div>
          <p class="ex-p" style="font-size: 0.9em; opacity: 0.8;">
            Dependency you'll likely want: <code>pip install pycryptodome</code> (or any DES-ECB capable library in your language of choice).
          </p>
        </div>
      `,
      init: (container) => {
        const dlCipherBtn = container.querySelector('#dl-ciphertext-btn');
        const dlSpecBtn = container.querySelector('#dl-spec-btn');
        const banner = container.querySelector('#known-plaintext-banner');

        if (!dlCipherBtn || !dlSpecBtn) return;

        // wasm-bindgen may hand back a Map (via serde-wasm-bindgen) rather
        // than a plain object, depending on how the Rust struct is
        // exposed -- so support both instead of assuming direct property
        // access always works (see the CTR challenge for the same issue).
        const getField = (data, key) => {
          if (data && typeof data.get === 'function') {
            return data.get(key);
          }
          if (data && key in data) {
            return data[key];
          }
          return undefined;
        };

        // The known-plaintext prefix is a fixed constant of the challenge
        // design, not something derived from the seed -- so rather than
        // depend on the wasm binding exposing it (it currently doesn't),
        // just encode it here directly.
        const asciiToHex = (str) =>
          Array.from(str)
            .map((ch) => ch.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');

        const KNOWN_PLAINTEXT_PREFIX = 'MEMO:';

        // Fetch challenge state from Rust (Seed: 1337n)
        const rawChallenge = generate_des_bruteforce_challenge(1337n);
        const challenge = {
          ciphertext: getField(rawChallenge, 'ciphertext'),
          known_plaintext_hex: asciiToHex(KNOWN_PLAINTEXT_PREFIX),
        };

        if (!challenge.ciphertext) {
          console.error('Failed to read challenge fields from wasm response:', rawChallenge);
          if (banner) banner.textContent = '[ERROR] Failed to load challenge data.';
          return;
        }

        if (banner) {
          banner.textContent = `Recovered bytes (hex): ${challenge.known_plaintext_hex}`;
        }

        // 1. Trigger Download of raw ciphertext only — no starter code
        dlCipherBtn.addEventListener('click', () => {
          const blob = new Blob([challenge.ciphertext], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'intercept.enc';
          a.click();
          URL.revokeObjectURL(url);
        });

        // 2. Trigger Download of the written specification (no code inside)
        dlSpecBtn.addEventListener('click', () => {
          const spec = `HELIOS LEGACY CRYPTOGRAPHIC SPECIFICATION
------------------------------------------

Cipher:                 DES
Mode:                   ECB
Block size:             64 bits
Key register width:     64 bits

Key construction:
    The hardware stores its effective key as a 20-bit unsigned
    configuration value K.

    K is in the range [0, 2^20).

    The DES key register is 64 bits wide.
    Bits 63..20 are permanently zero.
    Bits 19..0 contain K.

    The DES library expects the key register serialized
    most-significant byte first.

Ciphertext encoding:
    ASCII hexadecimal
    Big-endian byte order

Intercept analysis:
    The communications team recovered the first plaintext bytes
    of the transmission from an independent metadata channel:

        ${challenge.known_plaintext_hex}

    The remainder of the transmission is unavailable except via
    the ciphertext itself.

Verification condition:
    A candidate key is correct if decrypting the FIRST ciphertext
    block with it reproduces the recovered plaintext bytes above.

Performance requirement:
    Candidate keys must be verified using only the first
    ciphertext block. Only decrypt the full message once a
    candidate key has been confirmed.

Notes:
    Do not attempt to derive or repair DES parity bits for this
    challenge. The 64-bit key register value is passed directly
    to the DES implementation as-is.
`;
          const blob = new Blob([spec], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'HELIOS_spec.txt';
          a.click();
          URL.revokeObjectURL(url);
        });
      },
    },

    // ── 4. Submission Exercise ──────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '3.KEY',
          title: 'Submit Recovered Flag',

          renderBody: () => `
            <p class="ex-p">Write your own offline tool to search the key candidates against <code>intercept.enc</code>, confirm the correct key using the recovered plaintext bytes, then decrypt the full memo to find the flag.</p>
          `,

          hint: 'The recovered bytes are ASCII — decode the hex to see what string you should be matching against. Think about how a 20-bit value maps onto a 64-bit, big-endian key register before you start iterating.',
          input: { type: 'text', placeholder: 'CTF{...}', width: '340px' },
          parse: (raw) => raw.trim(),

          // Delegate check directly to Rust
          check: (val) => {
            return check_des_bruteforce_challenge(1337n, val);
          },
        },
      ],
    },
  ],
};

export default desBruteforceCtf;
