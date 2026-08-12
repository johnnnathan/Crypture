use crate::h_sha1_materials::{M_BYTES, M_PRIME_BYTES, S_BYTES};
use crate::traits::{Challenge, ValidationResult}; // Adjust path to traits if different
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct ChallengeStruct {
    pub seed: u64,
    pub s_hex: String,
    pub m_hex: String,
    pub m_prime_hex: String,
    
    // Use Vec<u8> so Serde can derive Serialize/Deserialize smoothly
    pub ma_bytes: Vec<u8>,
    pub ma_hex: String,
    pub ciphertext: String, // Required by build script macro
    pub flag: String,
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let mut ma = [0u8; 128];
        let mut state = if seed == 0 { 0xDEADBEEF } else { seed };
        
        for chunk in ma.chunks_mut(8) {
            state ^= state << 13;
            state ^= state >> 7;
            state ^= state << 17;
            let bytes = state.to_le_bytes();
            let len = chunk.len();
            chunk.copy_from_slice(&bytes[..len]);
        }

        let ma_hex = hex::encode(ma);
        let flag = format!("FLAG{{m3rkl3_d4mg4rd_c0ll1s10n_3xt3ns10n_{:x}}}", seed);

        Self {
            seed,
            s_hex: hex::encode(S_BYTES),
            m_hex: hex::encode(M_BYTES),
            m_prime_hex: hex::encode(M_PRIME_BYTES),
            ma_bytes: ma.to_vec(),
            ma_hex: ma_hex.clone(),
            ciphertext: ma_hex, // Populates required field
            flag,
        }
    }

    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    // Generic check implementation called by generated_challenges.rs
    fn check(&self, input: &str) -> ValidationResult {
        // Expects "msgA|msgB" format if submitted through standard interface
        let parts: Vec<&str> = input.split('|').collect();
        if parts.len() == 2 {
            self.validate_pair(parts[0], parts[1])
        } else {
            ValidationResult {
                correct: false,
                message: "Invalid submission format. Expected 'MessageA|MessageB'.".into(),
            }
        }
    }
}

impl ChallengeStruct {
    pub fn validate_pair(&self, msg_a_hex: &str, msg_b_hex: &str) -> ValidationResult {
        let bytes_a = match hex::decode(msg_a_hex.trim()) {
            Ok(b) => b,
            Err(_) => return ValidationResult { correct: false, message: "Message A is malformed hexadecimal.".into() },
        };

        let bytes_b = match hex::decode(msg_b_hex.trim()) {
            Ok(b) => b,
            Err(_) => return ValidationResult { correct: false, message: "Message B is malformed hexadecimal.".into() },
        };

        if bytes_a.is_empty() || bytes_b.is_empty() {
            return ValidationResult { correct: false, message: "Messages cannot be empty.".into() };
        }

        if bytes_a == bytes_b {
            return ValidationResult { correct: false, message: "Messages must be different.".into() };
        }

        if bytes_a.len() != bytes_b.len() {
            return ValidationResult { correct: false, message: "Messages must have equal length.".into() };
        }

        let expected_len = S_BYTES.len() + M_BYTES.len() + self.ma_bytes.len();
        if bytes_a.len() != expected_len {
            return ValidationResult { 
                correct: false, 
                message: format!("Messages must be exactly {} bytes long.", expected_len) 
            };
        }

        let expected_a = [S_BYTES.as_slice(), M_BYTES.as_slice(), self.ma_bytes.as_slice()].concat();
        if bytes_a != expected_a {
            return ValidationResult { 
                correct: false, 
                message: "Message A does not match required structure (S ∥ M ∥ Ma).".into() 
            };
        }

        let expected_b = [S_BYTES.as_slice(), M_PRIME_BYTES.as_slice(), self.ma_bytes.as_slice()].concat();
        if bytes_b != expected_b {
            return ValidationResult { 
                correct: false, 
                message: "Message B does not match required structure (S ∥ M' ∥ Ma).".into() 
            };
        }

        let digest_a = Sha1::digest(&bytes_a);
        let digest_b = Sha1::digest(&bytes_b);

        if digest_a != digest_b {
            return ValidationResult { correct: false, message: "Messages do not produce matching SHA-1 digests.".into() };
        }

        ValidationResult {
            correct: true,
            message: format!("🎉 Collision demonstrated! You extended the SHA-1 collision. Flag: {}", self.flag),
        }
    }
}

// ── Wasm Exports ─────────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct Sha1ChallengePayload {
    #[wasm_bindgen(skip)]
    pub s_hex: String,
    #[wasm_bindgen(skip)]
    pub m_hex: String,
    #[wasm_bindgen(skip)]
    pub m_prime_hex: String,
    #[wasm_bindgen(skip)]
    pub ma_hex: String,
}

#[wasm_bindgen]
impl Sha1ChallengePayload {
    #[wasm_bindgen(getter)]
    pub fn s(&self) -> String { self.s_hex.clone() }
    #[wasm_bindgen(getter)]
    pub fn m(&self) -> String { self.m_hex.clone() }
    #[wasm_bindgen(getter)]
    pub fn m_prime(&self) -> String { self.m_prime_hex.clone() }
    #[wasm_bindgen(getter)]
    pub fn ma(&self) -> String { self.ma_hex.clone() }
}

#[wasm_bindgen]
pub fn get_sha1_challenge_data(seed: u64) -> Sha1ChallengePayload {
    let ch = ChallengeStruct::generate(seed);
    Sha1ChallengePayload {
        s_hex: ch.s_hex,
        m_hex: ch.m_hex,
        m_prime_hex: ch.m_prime_hex,
        ma_hex: ch.ma_hex,
    }
}

#[wasm_bindgen]
pub fn check_sha1_collision_pair(seed: u64, msg_a_hex: &str, msg_b_hex: &str) -> JsValue {
    let challenge = ChallengeStruct::generate(seed);
    let result = challenge.validate_pair(msg_a_hex, msg_b_hex);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[wasm_bindgen]
pub fn compute_sha1_oracle(hex_input: &str) -> String {
    match hex::decode(hex_input.trim()) {
        Ok(bytes) => format!("{:x}", Sha1::digest(&bytes)),
        Err(_) => "Error: Invalid Hex Input".into(),
    }
}
