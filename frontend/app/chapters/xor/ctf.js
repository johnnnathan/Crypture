import { hex, bin } from '../../exercise-kit.js';

export const xorCtf = {
  id: 'xor-ctf',
  num: '01.3',
  tag: 'CTF Challenge',
  tagClass: 'xor',
  title: 'Challenge — Multivariate Masked XOR System',
  desc: 'Intercepted hardware traffic uses population count (popcount) conditional filtering alongside an 8x8 linear bit transformation over GF(2).',
  concepts: ['Popcount / Hamming Weight', 'Multivariate Bit Systems', 'GF(2) Matrix Equations'],
  topbarTitle: 'Exercise 01 — XOR CTF',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: 'Intercepted Binary Stream',
      html: `
        <p class="ex-p">An intelligence probe intercepted a stream of 2-byte telemetry packets formatted as <code>[Mask, Data]</code> from a satellite hardware bus.</p>
        <p class="ex-p">The system filters noisy signal packets before decrypting the payload through an 8-bit linear feedback cipher over GF(2). Reverse-engineering the firmware revealed the two-stage execution sequence:</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Stage 1 (Popcount Filter):   Keep Data if popcount(Mask) % 2 == 1',
      ],
      note: 'Popcount (population count / Hamming weight) counts the total number of set 1-bits in the Mask byte.',
    },
    {
      kind: 'text',
      html: `
        <p class="ex-p"><strong>Detailed Decryption Logic:</strong></p>
        <ul class="ex-list">
          <li><strong>Stage 1 — Signal Masking:</strong> Compute the <code>popcount</code> of the Mask byte <code>M<sub>i</sub></code>. If the bit count is <strong>even</strong> (<code>popcount(M<sub>i</sub>) % 2 == 0</code>), the packet is noise — discard the Data byte <code>D<sub>i</sub></code>. If the bit count is <strong>odd</strong>, keep <code>D<sub>i</sub></code> as ciphertext vector <code>c</code>.</li>
        </ul>
      `,
    },
    {
      kind: 'exerciseGroup',
      title: 'Flag Submission',
      items: [
        {
          num: '1.CTF',
          title: 'Break the Linear System',
          bodyHtml: `
            <p class="ex-p">Calculate the <code>popcount</code> for each mask byte to filter out noise, solve the multivariate bit system over GF(2) for retained bytes, and recover the plaintext flag.</p>
            <div class="ex-code-banner">
              Intercepted Pairs: [10100001, 0x50], [00001111, 0xFF], [11000001, 0x30], [00100011, 0x50], [10001011, 0x3A], [11000011, 0x82], [11100001, 0x00], [11110000, 0xAA], [00000111, 0x43], [11001100, 0x11], [00011111, 0x4E], [01100001, 0x54], [11111111, 0x12]
            </div>
          `,
          input: { type: 'text', placeholder: 'FLAG{...}' },
          parse: (raw) => raw.trim(),
          check: (val) => val === 'FLAG{P0PCNT}'
            ? { 
                correct: true, 
                message: '🎉 Access Granted! You correctly filtered the packet stream using popcount parity.' 
              }
            : { 
                correct: false, 
                message: 'Incorrect flag. Double check your popcount parity for each mask.' 
              },
        },
      ],
    },
  ],
};

export default xorCtf;
