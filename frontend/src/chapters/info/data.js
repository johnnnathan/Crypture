import { bin, hex, ascii } from '../../exercise-kit.js';

export const dataFoundations = {
  id: 'data-foundations',
  num: '00',
  tag: 'Foundations',
  tagClass: 'foundations',
  title: '00 — Data Representations & Encodings',
  desc: 'Understanding how raw information is represented in computer memory: Bits, Bytes, Binary, Hexadecimal, ASCII, and Base64.',
  concepts: ['Binary & Bits', 'Hexadecimal Notation', 'ASCII Encoding', 'Format Conversions'],
  topbarTitle: 'Chapter 00 — Data Foundations',

  blocks: [
    // ── 1. The Core Concept ───────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Data vs. Representation',
      html: `
        <p class="ex-p">In cryptography, everything is fundamentally a sequence of <strong>raw bits (0s and 1s)</strong>. However, humans and protocols view those same bits in different formats depending on the context.</p>
        <p class="ex-p">It is crucial to understand that <em>changing the representation does not change the underlying data</em>—it only changes how we display it.</p>
      `,
    },
    // Add this block to dataFoundations.blocks array:

    {
      kind: 'text',
      heading: 'h2',
      title: 'Universal Base Conversion Formula',
      html: `
        <p class="ex-p">To convert a number from any arbitrary <strong>Base b<sub>1</sub></strong> to <strong>Base b<sub>2</sub></strong>, convert through Base 10 (Decimal) as a bridge:</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Step 1 (b₁ → Base 10):  N = ∑ (digit × b₁ⁱ)',
        'Step 2 (Base 10 → b₂):  Repeatedly divide N by b₂ & record remainders'
      ],
      note: 'Step 1 uses positional power expansion. Step 2 uses modulo remainders read in reverse order.',
    },
    {
      kind: 'text',
      html: `
        <div class="ex-data-block">
          <p><strong>Worked Example: Convert 35 in Octal (Base 8) to Binary (Base 2)</strong></p>
          <ul class="ex-list">
            <li><strong>Step 1 (Base 8 → Base 10):</strong> <code>(3 × 8¹) + (5 × 8⁰) = 24 + 5 = 29</code></li>
            <li><strong>Step 2 (Base 10 → Base 2):</strong>
              <br><code>29 ÷ 2 = 14 r 1</code>
              <br><code>14 ÷ 2 = 7  r 0</code>
              <br><code>7  ÷ 2 = 3  r 1</code>
              <br><code>3  ÷ 2 = 1  r 1</code>
              <br><code>1  ÷ 2 = 0  r 1</code>
            </li>
            <li><strong>Result (read remainders upward):</strong> <code>11101₂</code></li>
          </ul>
        </div>
      `,
    },

    // ── 2. Format Breakdown Table ─────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Common Data Formats',
      html: `<p class="ex-p">How the letter <strong>'A'</strong> is viewed across different encodings:</p>`,
    },
    {
      kind: 'table',
      label: 'Encoding Table',
      columns: ['Format', 'Representation', 'Description'],
      rows: [
        ['<strong>ASCII / Text</strong>', '<code>"A"</code>', 'Human-readable character encoding.'],
        ['<strong>Decimal</strong>', '<code>65</code>', 'Base-10 integer representation.'],
        ['<strong>Hexadecimal</strong>', '<code>0x41</code>', 'Base-16 format (2 hex digits = 1 byte).'],
        ['<strong>Binary</strong>', '<code>01000001</code>', 'Base-2 raw bit sequence (8 bits = 1 byte).'],
        ['<strong>Base64</strong>', '<code>QQ==</code>', 'Safely encodes binary data into printable ASCII text.'],
      ],
    },

    // ── 3. Quick Conversion Formula/Rules ────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Hexadecimal to Binary Mapping',
      html: `
        <p class="ex-p">Because 1 byte equals 8 bits, and 1 hexadecimal character represents 4 bits (a <em>nibble</em>), Hex is the universal shorthand for binary in reverse engineering and cryptography.</p>
      `,
    },
    {
      kind: 'formula',
      lines: [
        'Hex Nibble:  0x4      0x1',
        'Binary:      0100     0001',
        'Combined:    0x41  =  01000001  =  65 (Decimal)  =  "A"'
      ],
      note: 'Every 2 hex digits represent exactly 1 byte (8 bits).',
    },

    // ── 4. Practice Questions ─────────────────────────────────────────────
    {
      kind: 'exerciseGroup',
      title: 'Check Your Understanding',
      items: [
        {
          num: '0.1',
          title: 'Hex to Binary Conversion',
          bodyHtml: `<p class="ex-p">Convert the hex byte <code>0x3F</code> into an 8-bit binary string.</p>`,
          hint: 'Convert each hex digit separately: 3 -> 0011, F -> 1111.',
          input: { type: 'binary', maxlength: 8 },
          inputLabel: '0x3F =',
          check: (val) => val === 0b00111111
            ? { correct: true, message: 'Correct! 0x3 = 0011 and 0xF = 1111, giving 00111111.' }
            : { correct: false, message: 'Incorrect. Remember: 3 in 4-bit binary is 0011, and F (15) is 1111.' },
        },
        {
          num: '0.2',
          title: 'ASCII to Hex Encoding',
          bodyHtml: `<p class="ex-p">The ASCII character <code>'B'</code> has a decimal value of <code>66</code>. What is its representation in Hexadecimal?</p>`,
          input: { type: 'text', placeholder: '0x..' },
          parse: (raw) => raw.trim().toLowerCase(),
          check: (val) => (val === '0x42' || val === '42')
            ? { correct: true, message: 'Correct! 66 in decimal equals 0x42 in hexadecimal (4*16 + 2).' }
            : { correct: false, message: 'Not quite. Convert 66 into base-16: 66 / 16 = 4 remainder 2 → 0x42.' },
        },
      ],
    },
  ],
};

export default dataFoundations;
