use crate::traits::{Challenge, ValidationResult};
use des::cipher::{BlockCipherEncrypt, KeyInit};
use des::Des;
use wasm_bindgen::prelude::*;

const BLOCK_SIZE: usize = 8; // DES operates on 64-bit (8-byte) blocks
const MIN_PLAINTEXT_LEN: usize = 1536; // ~1.5 KB, so the "only decrypt block 0" optimization actually matters

/// Only this many low-order bits of the 64-bit DES key are actually
/// randomized; every other bit is forced to zero. This simulates the kind
/// of artificially restricted keyspace that made early export-grade
/// ciphers (40-bit RC4, etc.) trivially brute-forceable, and gives an
/// approachable, offline-brute-forceable taste of why DES's full 56-bit
/// keyspace is already considered too small by modern standards.
const RANDOM_KEY_BITS: u32 = 20; // ~1,048,576 keys to try

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String,
    /// The first bytes of plaintext, given as hex — framed to the player
    /// as recovered via an independent channel, so they have to recognize
    /// it decodes to ASCII "MEMO:" themselves rather than being told.
    pub known_plaintext_hex: String,
    pub keyspace_bits: u32,
    pub flag: String,
    key: [u8; 8],
}

impl ChallengeStruct {
    fn derive_key(seed: u64) -> [u8; 8] {
        let mut state = seed ^ 0x0BAD_C0DE_F00D_BEEFu64;
        state = state
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        let mask: u64 = (1u64 << RANDOM_KEY_BITS) - 1;
        // Big-endian bytes of a value with only the low RANDOM_KEY_BITS
        // set means every byte above that range is naturally zero.
        (state & mask).to_be_bytes()
    }
    fn des_encrypt_block(key: &[u8; 8], block: &[u8; 8]) -> [u8; 8] {
        let cipher = Des::new(key.into());
        let mut b = (*block).into();
        cipher.encrypt_block(&mut b);
        b.into()
    }

    fn pkcs7_pad(data: &[u8]) -> Vec<u8> {
        let pad_len = BLOCK_SIZE - (data.len() % BLOCK_SIZE);
        let mut out = data.to_vec();
        out.extend(std::iter::repeat(pad_len as u8).take(pad_len));
        out
    }

    fn ecb_encrypt(key: &[u8; 8], data: &[u8]) -> Vec<u8> {
        let padded = Self::pkcs7_pad(data);
        let mut out = Vec::with_capacity(padded.len());
        for chunk in padded.chunks(BLOCK_SIZE) {
            let mut block = [0u8; 8];
            block.copy_from_slice(chunk);
            out.extend_from_slice(&Self::des_encrypt_block(key, &block));
        }
        out
    }

    fn hex_encode(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }

    /// Builds a memo of at least MIN_PLAINTEXT_LEN bytes, always starting
    /// with `known_prefix` and containing the flag somewhere in the body
    /// (not at a fixed, guessable offset). This means finding the key is
    /// only step one — the player still has to decrypt the full message
    /// and read it to actually recover the flag.
    fn build_plaintext(known_prefix: &str, flag: &str, seed: u64) -> String {
        let mut state = seed ^ 0x1EAF_BEEF_1EAF_BEEFu64;
        let mut next = move || {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            state
        };

        let filler_lines = [
            "This channel is authorized for HELIOS ground-station traffic only.",
            "Relay confirmation was received at the secondary listening post.",
            "Signal strength during acquisition was within nominal parameters.",
            "Cross-reference this transmission against log entries HX-14 through HX-18.",
            "Further instructions will follow on the next scheduled pass.",
            "This channel uses legacy export-grade hardware pending replacement.",
            "Analyst annotations should be appended to the case file, not this memo.",
            "Transmission integrity was verified via the standard checksum procedure.",
        ];

        let mut doc = String::new();
        doc.push_str(known_prefix);
        doc.push_str(" classified transmission follows.\n");
        doc.push_str("Reference: HX-19\n");
        doc.push_str("Priority: HIGH\n\n");

        let pre_lines = 2 + (next() % 3) as usize;
        for i in 0..pre_lines {
            doc.push_str(filler_lines[(next() as usize + i) % filler_lines.len()]);
            doc.push('\n');
        }

        doc.push('\n');
        doc.push_str(&format!("Flag: {}\n", flag));
        doc.push('\n');

        let post_lines = 2 + (next() % 3) as usize;
        for i in 0..post_lines {
            doc.push_str(filler_lines[(next() as usize + i + 3) % filler_lines.len()]);
            doc.push('\n');
        }

        doc.push_str("\nEnd of memo.\n");

        while doc.len() < MIN_PLAINTEXT_LEN {
            let idx = (next() as usize) % filler_lines.len();
            doc.push_str(filler_lines[idx]);
            doc.push('\n');
        }

        doc
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let key = Self::derive_key(seed);
        let flag = "CTF{sm4ll_k3ysp4c3_1s_n0_k3ysp4c3}".to_string();
        let known_prefix = "MEMO:";

        let plaintext = Self::build_plaintext(known_prefix, &flag, seed);
        let ciphertext = Self::hex_encode(&Self::ecb_encrypt(&key, plaintext.as_bytes()));
        let known_plaintext_hex = Self::hex_encode(known_prefix.as_bytes());

        Self {
            seed,
            ciphertext,
            known_plaintext_hex,
            keyspace_bits: RANDOM_KEY_BITS,
            flag,
            key,
        }
    }


    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    fn check(&self, input: &str) -> ValidationResult {
        let clean_input = input.trim();

        if clean_input == self.flag {
            ValidationResult {
                correct: true,
                message:
                    "🎉 Key recovered and memo decrypted! A 20-bit keyspace falls in seconds — even on top of otherwise-real 56-bit DES."
                        .to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message:
                    "Incorrect flag. Re-check your candidate key construction and your known-plaintext verification condition."
                        .to_string(),
            }
        }
    }
}
