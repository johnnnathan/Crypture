import { hex, bin } from '../../exercise-kit.js';
import initWasm, { generate_caesar_drift_challenge, check_caesar_drift_challenge } from '../challenges_pkg/challenge_engine.js';

let challengeData = null;
let isWasmReady = false;

export const caesarCtf = {
    id: 'caesar-ctf',
    num: '02.3',
    tag: 'CTF Challenge',
    tagClass: 'caesar',
    title: 'Challenge — The Positional Drift Cipher',
    desc: 'A rogue agent intercepted a stream encrypted with a modified Caesar cipher that shifts dynamically based on character index.',
    concepts: ['Polyalphabetic Shift', 'Positional Drift', 'Modular Arithmetic'],
    topbarTitle: 'Exercise 02 — Caesar CTF',

    onMount: async () => {
        if (!isWasmReady) {
            await initWasm();
            isWasmReady = true;
            
            challengeData = generate_caesar_drift_challenge(0n);
            
            const banner = document.getElementById('caesar-ciphertext-banner');
            if (banner) {
                // Extract using .get() for Map objects
                const ct = challengeData.get('ciphertext');
                banner.textContent = `Ciphertext: ${ct}`;
            }
        }
    },

    blocks: [
      {
        kind: 'text',
        heading: 'h2',
        title: 'Intercepted Intelligence',
        html: `
          <p class="ex-p">
            An intelligence probe intercepted a ciphertext encrypted using a
            <strong>modified Vigenère cipher</strong>. Reverse engineering recovered
            most of the key, but the final character is still unknown.
          </p>

          <p class="ex-p">
            Analysis of the firmware revealed the following encryption process:
          </p>
        `,
      },

      {
        kind: 'formula',
        lines: [
          'Key Letter: &nbsp;&nbsp;&nbsp;&nbsp;k<sub>i</sub> = KEY[i mod 4]',
          'Drift: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;d<sub>i</sub> = i mod 4',
          'Encryption: c<sub>i</sub> = (p<sub>i</sub> + k<sub>i</sub> + d<sub>i</sub>) mod 26',
          'Decryption: p<sub>i</sub> = (c<sub>i</sub> - k<sub>i</sub> - d<sub>i</sub>) mod 26'
        ],
        note:
          'Where p<sub>i</sub> is the plaintext letter (A=0...Z=25), k<sub>i</sub> is the repeating key letter value, and i counts only alphabetic characters.',
      },

      {
        kind: 'text',
        html: `
          <p class="ex-p"><strong>Recovered Intelligence:</strong></p>

          <ul class="ex-list">
            <li>The encryption key has length <strong>4</strong>.</li>
            <li>The first three key characters are constant every iteration. </li>
            <li>The final key character is variable per iteration.</li>
            <li>Non-alphabetic characters (<code>{</code>, <code>_</code>, <code>}</code>) are copied unchanged and do not advance the key index.</li>
            <li>The intercepted plaintext follows the standard flag format <code>FLAG{...}</code>.</li>
          </ul>

          <p class="ex-p">
            Use the known plaintext prefix to recover the missing key character,
            then decrypt the entire message.
          </p>
        `,
      },

      {
        kind: 'exerciseGroup',
        title: 'Flag Submission',
        items: [
          {
            num: '2.CTF',
            title: 'Break the Modified Vigenère Cipher',
            
            renderBody: () => {
                // Extract using .get() if available, fallback gracefully
                const ct = challengeData ? challengeData.get('ciphertext') : 'Loading ciphertext...';

                return `
                  <p class="ex-p">
                    Recover the missing fourth key character and decrypt the intercepted
                    ciphertext.
                  </p>

                  <div id="caesar-ciphertext-banner" class="ex-code-banner">
                    Ciphertext: ${ct}
                  </div>
                `;
            },

            input: {
              type: 'text',
              placeholder: 'FLAG{...}',
              maxlength: 60,
              style: 'width: 100%; max-width: 450px;'
            },

            parse: (raw) => raw.trim().toUpperCase(),

            check: (val) => {
                if (!isWasmReady) {
                    return {
                        correct: false,
                        message: "Challenge engine is still loading. Please try again."
                    };
                }
                return check_caesar_drift_challenge(0n, val);
            },
          },
        ],
      },
    ],
};

export default caesarCtf;
