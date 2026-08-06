use crate::traits::{Challenge, ValidationResult};
use wasm_bindgen::prelude::*;

pub struct ChallengeStruct {
    pub seed: u64,
    pub key: Vec<u8>,
    pub ciphertext: String,
    pub flag: String,
}

impl ChallengeStruct {
    /// Internal helper: 1-byte block cipher (8-bit state, 8 rounds of non-linear substitution & rotation)
    fn encrypt_byte(byte_val: u8, key: &[u8]) -> u8 {
        let mut state = byte_val;
        for i in 0..8 {
            let k_i = key[i % key.len()];
            state ^= k_i;
            // S-box non-linear transformation
            state = state.wrapping_mul(31).wrapping_add(17);
            // 3-bit left rotation
            state = (state << 3) | (state >> 5);
        }
        state
    }

    /// Helper to encrypt arbitrary text under 1-byte ECB mode, outputting hex
    pub fn encrypt_ecb(text: &str, key: &[u8]) -> String {
        let hex_bytes: Vec<u8> = text
            .bytes()
            .map(|b| Self::encrypt_byte(b, key))
            .collect();

        hex::encode(hex_bytes)
    }

    /// Helper to generate a deterministic 32-byte (256-bit) key from a 64-bit seed
    fn derive_key(seed: u64) -> Vec<u8> {
        let mut key = Vec::with_capacity(32);
        let mut state = seed;
        for _ in 0..32 {
            // Linear Congruential Generator step for deterministic key expansion
            state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            key.push((state >> 32) as u8);
        }
        key
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let key = Self::derive_key(seed);
        let flag = "CTF{b1ock_s1z3_m4tt3rs_m0r3_th4n_k3y_l3ngth!}".to_string();
        let ciphertext = Self::encrypt_ecb(&flag, &key);

        Self {
            seed,
            key,
            ciphertext,
            flag,
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
                message: "🎉 Access Granted! You exploited the 1-byte block size using a codebook attack!".to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect flag. Remember: You don't need the 256-bit key! Build a 256-entry codebook mapping (0x00..0xFF -> CT).".to_string(),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_byte_cipher_codebook_inversion() {
        let challenge = ChallengeStruct::generate(1337);
        
        // --- Simulate Student's Solvers: Codebook Attack ---
        // 1. Query ciphertext for all 256 byte values (0x00 through 0xFF)
        let mut codebook = [0u8; 256];
        for pt_val in 0..=255u8 {
            let ct_val = ChallengeStruct::encrypt_byte(pt_val, &challenge.key);
            codebook[ct_val as usize] = pt_val;
        }

        // 2. Decrypt the flag hex string byte-by-byte using codebook lookup
        let ct_bytes = hex::decode(&challenge.ciphertext).unwrap();
        let decrypted_bytes: Vec<u8> = ct_bytes
            .iter()
            .map(|&ct_b| codebook[ct_b as usize])
            .collect();
        
        let recovered_flag = String::from_utf8(decrypted_bytes).unwrap();

        // 3. Verify recovered flag matches
        assert_eq!(recovered_flag, challenge.flag);

        // 4. Test validation method
        let check_res = challenge.check(&recovered_flag);
        assert!(check_res.correct);
    }
}

#[wasm_bindgen]
pub fn query_pulc_oracle(seed: u64, hex_input: &str) -> String {
    let challenge = ChallengeStruct::generate(seed);
    if let Ok(raw_bytes) = hex::decode(hex_input) {
        if let Ok(text) = String::from_utf8(raw_bytes) {
            return ChallengeStruct::encrypt_ecb(&text, &challenge.key);
        }
    }
    "ERROR".to_string()
}
