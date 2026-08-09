use crate::traits::{Challenge, ValidationResult};
use des::cipher::{BlockCipherEncrypt, KeyInit};
use des::Des;
use wasm_bindgen::prelude::*;

const MAX_PREFIX_LEN: usize = 4096;
const BLOCK_SIZE: usize = 8; // DES operates on 64-bit (8-byte) blocks

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String, // DES-ECB(key, flag) with an empty chosen prefix, for macro/codegen compatibility
    pub flag: String,
    key: [u8; 8],
}

impl ChallengeStruct {
    fn derive_key(seed: u64) -> [u8; 8] {
        let mut key = [0u8; 8];
        let mut state = seed ^ 0xA5A5_5A5A_1234_5678u64;
        for byte in key.iter_mut() {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            *byte = (state >> 32) as u8;
        }
        key
    }

    fn des_encrypt_block(key: &[u8; 8], block: &[u8; 8]) -> [u8; 8] {
        let cipher = Des::new(key.into());
        let mut b = (*block).into();
        cipher.encrypt_block(&mut b);
        b.into()
    }

    /// Standard PKCS7 padding to a multiple of the 8-byte DES block size.
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

    fn hex_decode(s: &str) -> Result<Vec<u8>, String> {
        let s = s.trim();
        if s.len() % 2 != 0 {
            return Err("hex string must have even length".to_string());
        }
        let bytes = s.as_bytes();
        let mut out = Vec::with_capacity(bytes.len() / 2);
        for chunk in bytes.chunks(2) {
            let hi = (chunk[0] as char)
                .to_digit(16)
                .ok_or_else(|| "invalid hex character".to_string())?;
            let lo = (chunk[1] as char)
                .to_digit(16)
                .ok_or_else(|| "invalid hex character".to_string())?;
            out.push(((hi << 4) | lo) as u8);
        }
        Ok(out)
    }

    /// Oracle: the player supplies a chosen hex PREFIX. The server appends
    /// the secret flag after it and returns DES-ECB(key, prefix || flag)
    /// in hex. Because ECB is stateless and deterministic per block,
    /// carefully choosing the prefix length lets the player align the
    /// unknown flag one byte at a time against a block boundary and brute
    /// force it byte-by-byte by comparing ciphertext blocks against
    /// self-chosen guesses. This is the classic "byte-at-a-time ECB
    /// decryption" attack (Cryptopals Set 2 / Challenge 12), here against
    /// real DES instead of AES.
    pub fn oracle_encrypt_hex(&self, prefix_hex: &str) -> Result<String, String> {
        let prefix = Self::hex_decode(prefix_hex)?;
        if prefix.len() > MAX_PREFIX_LEN {
            return Err(format!("prefix too long (max {} bytes)", MAX_PREFIX_LEN));
        }
        let mut plaintext = prefix;
        plaintext.extend_from_slice(self.flag.as_bytes());
        let ct = Self::ecb_encrypt(&self.key, &plaintext);
        Ok(Self::hex_encode(&ct))
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let key = Self::derive_key(seed);
        let flag = "CTF{3cb_l34ks_r3p34t3d_bl0ck5!}".to_string();
        let ciphertext = Self::hex_encode(&Self::ecb_encrypt(&key, flag.as_bytes()));

        Self {
            seed,
            ciphertext,
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
                    "🎉 Access Granted! You exploited ECB's deterministic block encryption to leak the flag byte-by-byte."
                        .to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message:
                    "Incorrect flag. Remember: identical plaintext blocks always produce identical ciphertext blocks under ECB — use that to align and guess one byte at a time."
                        .to_string(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn query_baat_oracle(seed: u64, prefix_hex: &str) -> Result<String, JsValue> {
    let challenge = ChallengeStruct::generate(seed);
    challenge.oracle_encrypt_hex(prefix_hex).map_err(|e| JsValue::from_str(&e))
}
