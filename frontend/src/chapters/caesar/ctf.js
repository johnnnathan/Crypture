import { hex, bin } from '../../exercise-kit.js';

export const caesarCtf = {
    id: 'caesar-ctf',
    num: '02.3',
    tag: 'CTF Challenge',
    tagClass: 'caesar', // Make sure you have styling for .caesar tag class
    title: 'Challenge — The Positional Drift Cipher',
    desc: 'A rogue agent intercepted a stream encrypted with a modified Caesar cipher that shifts dynamically based on character index.',
    concepts: ['Polyalphabetic Shift', 'Positional Drift', 'Modular Arithmetic'],
    topbarTitle: 'Exercise 02 — Caesar CTF',

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
            <li>The first three key characters are constant.</li>
            <li>The final key character is variable, and shifts by a set amount every repetition of the key.</li>
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
            bodyHtml: `
              <p class="ex-p">
                Recover the missing fourth key character and decrypt the intercepted
                ciphertext.
              </p>

              <div class="ex-code-banner">
                Ciphertext: HDAY{OGDAHAEV_XAGWPWRW_KK_BJGSKSDDE}
              </div>
            `,
            input: {
              type: 'text',
              placeholder: 'FLAG{...}'
            },

            parse: (raw) => raw.trim().toUpperCase(),

            check: (val) =>
              val === 'FLAG{MODIFIED_VIGENERE_IS_BREAKABLE}'
                ? {
                    correct: true,
                    message:
                      '🎉 Access Granted! You recovered the missing key letter and successfully decrypted the modified Vigenère ciphertext.'
                  }
                : {
                    correct: false,
                    message:
                      'Incorrect flag. Remember to subtract both the repeating key value and the positional drift (i mod 4) during decryption.'
                  },
          },
        ],
      },
    ],
};

export default caesarCtf;

