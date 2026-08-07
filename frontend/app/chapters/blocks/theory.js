import { hex, bin } from '../../exercise-kit.js';

export const blockCiphersTheory = {
  id: 'block-ciphers',
  num: '02.1',
  tag: 'Block Ciphers',
  tagClass: 'block-cipher',
  title: 'Block Ciphers & Modes of Operation',
  desc: 'Pseudorandom permutations, fixed-size block processing, pattern leakage in ECB mode, and chaining via CBC and CTR modes.',
  concepts: ['Block Ciphers', 'ECB Pattern Leakage', 'CBC Chaining & IVs', 'CTR Mode Keystreams'],
  topbarTitle: 'Exercise 02 — Block Ciphers & Modes',

  blocks: [
    // ── 1. Conceptual Intro ───────────────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'What is a Block Cipher?',
      html: `
        <p class="ex-p">
          Unlike stream ciphers, which encrypt data bit-by-bit or byte-by-byte, a <strong>Block Cipher</strong> operates on fixed-size chunks of data called <em>blocks</em> (typically 64 or 128 bits wide).
        </p>
        <p class="ex-p">
          Mathematically, a block cipher is a <strong>Keyed Pseudorandom Permutation (PRP)</strong>:
        </p>
        <ul class="ex-list">
          <li>For any fixed key <code>K</code>, the encryption function <code>E<sub>K</sub>(P)</code> forms a unique, bijective (one-to-one) mapping between an <code>n</code>-bit plaintext block and an <code>n</code>-bit ciphertext block.</li>
          <li>Without knowledge of key <code>K</code>, the mapping should be indistinguishable from a completely random permutation.</li>
        </ul>`,
    },

    // ── 2. Formula ────────────────────────────────────────────────────────
    {
      kind: 'formula',
      lines: [
        'Block Encryption:   C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)',
        'Block Decryption:   P<sub>i</sub> = D<sub>K</sub>(C<sub>i</sub>)'
      ],
      note: 'Where P_i and C_i are fixed-size n-bit blocks (e.g., 128 bits for AES).',
    },

    // ── 3. Modes of Operation Section ─────────────────────────────────────
    {
      kind: 'text',
      heading: 'h2',
      title: 'Modes of Operation',
      html: `
        <p class="ex-p">
          Because real messages are usually much longer than a single 128-bit block, block ciphers require a <strong>Mode of Operation</strong> to process multi-block plaintexts securely.
        </p>`,
    },

    // --- ECB Mode ---
    {
      kind: 'text',
      heading: 'h3',
      title: '1. Electronic Codebook (ECB) — Do Not Use',
      html: `
        <p class="ex-p">
          ECB is the simplest mode: every block of plaintext is encrypted independently with the exact same key.
        </p>
        <p class="ex-p">
          <strong>The Vulnerability:</strong> Identical plaintext blocks produce identical ciphertext blocks (<code>P<sub>a</sub> = P<sub>b</sub> ⇒ C<sub>a</sub> = C<sub>b</sub></code>). This reveals underlying structural patterns in encrypted images or structured data.
        </p>`,
    },
    {
      kind: 'formula',
      lines: [
        'ECB Encrypt:  C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub>)',
        'ECB Decrypt:  P<sub>i</sub> = D<sub>K</sub>(C<sub>i</sub>)'
      ],
      note: 'Deterministic and independent block processing leads to severe pattern leakage.',
    },

    // --- CBC Mode ---
    {
      kind: 'text',
      heading: 'h3',
      title: '2. Cipher Block Chaining (CBC)',
      html: `
        <p class="ex-p">
          To hide repeating plaintext patterns, CBC mode XORs each plaintext block with the <em>previous ciphertext block</em> before passing it to the block cipher engine.
        </p>
        <p class="ex-p">
          The first block is XOR\'d with a random <strong>Initialization Vector (IV)</strong> to ensure that encrypting the same message twice produces completely different ciphertexts.
        </p>`,
    },
    {
      kind: 'formula',
      lines: [
        'CBC Encrypt:  C<sub>0</sub> = E<sub>K</sub>(P<sub>0</sub> ⊕ IV),   C<sub>i</sub> = E<sub>K</sub>(P<sub>i</sub> ⊕ C<sub>i-1</sub>)',
        'CBC Decrypt:  P<sub>0</sub> = D<sub>K</sub>(C<sub>0</sub>) ⊕ IV,   P<sub>i</sub> = D<sub>K</sub>(C<sub>i</sub>) ⊕ C<sub>i-1</sub>'
      ],
      note: 'Requires padding (e.g., PKCS#7) if the total message length is not a multiple of the block size.',
    },

    // --- CTR Mode ---
    {
      kind: 'text',
      heading: 'h3',
      title: '3. Counter (CTR) Mode — Turning Blocks into Streams',
      html: `
        <p class="ex-p">
          CTR mode turns a block cipher into a <strong>stream cipher</strong>. Instead of encrypting plaintext directly, the block cipher encrypts a sequence of unique counter blocks (e.g., <code>Nonce || Counter</code>) to produce a pseudorandom keystream.
        </p>
        <p class="ex-p">
          The keystream is then XOR\'d with the plaintext. CTR mode supports parallel processing and does not require padding.
        </p>`,
    },
    {
      kind: 'formula',
      lines: [
        'CTR Keystream:  S<sub>i</sub> = E<sub>K</sub>(Nonce ∥ i)',
        'CTR Encrypt:    C<sub>i</sub> = P<sub>i</sub> ⊕ S<sub>i</sub>',
        'CTR Decrypt:    P<sub>i</sub> = C<sub>i</sub> ⊕ S<sub>i</sub>'
      ],
      note: 'Never reuse a Nonce with the same Key under CTR mode, as it leads to a Two-Time Pad key-reuse vulnerability.',
    },

    // ── 4. Multi-Mode Simulator ───────────────────────────────────────────
    {
      kind: 'custom',
      title: 'Interactive Multi-Mode Block Simulator',
      desc: 'Switch between ECB, CBC, and CTR modes to see how repeating block inputs behave under different operational modes.',
      html: `
        <style>
          .sim-mode-tab {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #aaa;
            padding: 6px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.85rem;
            transition: all 0.2s ease;
          }
          .sim-mode-tab:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
          }
          .sim-mode-tab.active {
            background: var(--accent-color, #4da6ff);
            border-color: var(--accent-color, #4da6ff);
            color: #fff;
            font-weight: 600;
          }
        </style>

        <div class="ex-block-sim-container" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; gap: 8px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
            <span style="font-size: 0.85rem; color: #888; font-weight: 600; margin-right: 6px;">Mode:</span>
            <button class="sim-mode-tab active" data-mode="ECB">ECB</button>
            <button class="sim-mode-tab" data-mode="CBC">CBC</button>
            <button class="sim-mode-tab" data-mode="CTR">CTR</button>
          </div>

          <div class="ex-live-inputs">
            <div class="ex-live-row" style="flex-wrap: wrap;">
              <span class="ex-live-label" style="min-width: 90px;">Input Text:</span>
              <input id="block-sim-text" class="ex-hex-input" type="text" value="AAAAAAAABBBBBBBBAAAAAAAA" maxlength="32" style="flex: 1; min-width: 240px; font-family: monospace;" />
              <span id="char-count" style="font-size: 0.8rem; color: #888; margin-left: 8px;">24/32</span>
            </div>
            <p id="mode-desc-note" class="ex-p" style="font-size: 0.82rem; color: #a0a0a0; margin-top: 6px;">
              <strong>ECB Mode:</strong> Identical inputs yield identical ciphertext blocks (Notice Block 0 and Block 2 match).
            </p>
          </div>

          <div class="ex-live-bits-panel" style="width: 100%; box-sizing: border-box;">
            <div class="ex-bits-label">Segmented Blocks (8-Byte Chunks)</div>
            <div id="block-slices-display" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;"></div>
          </div>
        </div>`,
      init(container) {
        const textInput = container.querySelector('#block-sim-text');
        const display = container.querySelector('#block-slices-display');
        const charCount = container.querySelector('#char-count');
        const modeNote = container.querySelector('#mode-desc-note');
        const tabs = container.querySelectorAll('.sim-mode-tab');

        let currentMode = 'ECB';

        // Helper mock block cipher E_k(input_bytes) -> hex string
        function mockBlockEncrypt(inputStr) {
          let hash = 0x811c9dc5; // FNV-1a hash seed
          for (let i = 0; i < inputStr.length; i++) {
            hash ^= inputStr.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
          }
          const hex1 = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
          const hex2 = (Math.imul(hash, 31) >>> 0).toString(16).padStart(8, '0').toUpperCase();
          return `0x${hex1}${hex2}`;
        }

        // Helper XOR function for string blocks
        function xorStrings(str1, str2) {
          let result = '';
          for (let i = 0; i < Math.max(str1.length, str2.length); i++) {
            const code1 = str1.charCodeAt(i) || 0;
            const code2 = str2.charCodeAt(i) || 0;
            result += String.fromCharCode(code1 ^ code2);
          }
          return result;
        }

        function update() {
          const raw = textInput.value;
          charCount.textContent = `${raw.length}/32`;
          const blockSize = 8;
          let html = '';

          if (raw.length === 0) {
            display.innerHTML = '<div style="color: #888; padding: 8px; font-size: 0.9rem;">Enter text above to slice into blocks...</div>';
            return;
          }

          let prevCiphertextBlock = "IV_INIT_"; // Initial IV for CBC mode
          const fixedNonce = "NONCE_00";         // Fixed Nonce for CTR mode

          for (let i = 0; i < raw.length; i += blockSize) {
            const chunk = raw.slice(i, i + blockSize).padEnd(blockSize, ' ');
            const blockNum = Math.floor(i / blockSize);
            let mockCiphertext = '';
            let metaInfo = '';

            if (currentMode === 'ECB') {
              mockCiphertext = mockBlockEncrypt(chunk);
              metaInfo = 'Direct Encrypt';
            } else if (currentMode === 'CBC') {
              // P_i XOR Prev_C
              const xord = xorStrings(chunk, prevCiphertextBlock);
              mockCiphertext = mockBlockEncrypt(xord);
              metaInfo = blockNum === 0 ? 'XOR with IV' : `XOR with Block ${blockNum - 1} C`;
              prevCiphertextBlock = mockCiphertext.slice(2, 10); // Use bytes of CT for next round
            } else if (currentMode === 'CTR') {
              // Keystream = E_k(Nonce || Counter)
              const counterBlock = `${fixedNonce}${blockNum}`;
              const keystream = mockBlockEncrypt(counterBlock);
              
              // C_i = P_i XOR Keystream
              const ctXor = xorStrings(chunk, keystream.slice(2, 10));
              let hexRes = '';
              for (let c = 0; c < ctXor.length; c++) {
                hexRes += ctXor.charCodeAt(c).toString(16).padStart(2, '0').toUpperCase();
              }
              mockCiphertext = `0x${hexRes.slice(0, 16)}`;
              metaInfo = `XOR Keystream #${blockNum}`;
            }

            const formattedChunk = chunk.replace(/ /g, '␣');

            html += `
              <div style="display: grid; grid-template-columns: 75px 120px 1fr auto; gap: 12px; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 0.88rem;">
                <span style="color: #888;">Block ${blockNum}</span>
                <span style="color: #e0e0e0;">"${formattedChunk}"</span>
                <span style="color: #888; font-size: 0.78rem;">(${metaInfo})</span>
                <span style="color: var(--accent-color, #4da6ff); font-weight: 600; text-align: right;">${mockCiphertext}</span>
              </div>
            `;
          }

          display.innerHTML = html;
        }

        // Mode Switching Listener
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.getAttribute('data-mode');

            if (currentMode === 'ECB') {
              modeNote.innerHTML = '<strong>ECB Mode:</strong> Identical inputs yield identical ciphertext blocks (Notice Block 0 and Block 2 match).';
            } else if (currentMode === 'CBC') {
              modeNote.innerHTML = '<strong>CBC Mode:</strong> Each block is XOR\'d with the previous ciphertext block (or IV). Identical blocks now yield completely different ciphertexts!';
            } else if (currentMode === 'CTR') {
              modeNote.innerHTML = '<strong>CTR Mode:</strong> The block cipher encrypts incrementing counter values to form a unique keystream for each block.';
            }

            update();
          });
        });

        textInput.addEventListener('input', update);
        update();
      },
    },
  ],
};

export default blockCiphersTheory;
