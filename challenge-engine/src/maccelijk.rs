use serde::{Serialize, Deserialize};
use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};
use hmac::{Hmac, Mac};
use crate::traits::{Challenge, ValidationResult};

type HmacSha256 = Hmac<Sha256>;

#[derive(Serialize, Deserialize)]
pub struct ChallengeStruct {
    pub seed: u64,
    pub key: Vec<u8>,
    pub flag: String,
    pub ciphertext: String,
}

impl ChallengeStruct {
    /// Generate a new challenge instance based on the seed
    pub fn generate(seed: u64) -> Self {
        let key = Self::derive_key(seed);
        let flag = format!("FLAG{{maccelijk_{:08x}}}", seed);
        let ciphertext = "example_ciphertext".to_string(); // Replace with actual ciphertext logic
        Self { seed, key, flag, ciphertext }
    }

    /// Derive a deterministic key from the seed
    fn derive_key(seed: u64) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(seed.to_le_bytes());
        hasher.finalize().to_vec()
    }

    /// Compute the MAC for a given message
    pub fn compute_mac(&self, message: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(&self.key).expect("HMAC can take a key of any size");
        mac.update(message.as_bytes());
        let result = mac.finalize();
        hex::encode(result.into_bytes())[..16].to_string() // Truncate to 16 hex chars
    }

    /// Verify if the provided tag matches the computed MAC for the message
    pub fn verify_mac(&self, message: &str, tag: &str) -> bool {
        let expected_tag = self.compute_mac(message);
        expected_tag.eq_ignore_ascii_case(tag)
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        Self::generate(seed)
    }

    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    fn check(&self, submission: &str) -> ValidationResult {
        if submission.trim() == self.flag {
            ValidationResult {
                correct: true,
                message: "Correct!".to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect.".to_string(),
            }
        }
    }
}

// #[wasm_bindgen]
// pub fn generate_maccelijk_challenge(seed: u64) -> JsValue {
//     let instance = ChallengeStruct::generate(seed);
//     let payload = serde_json::json!({
//         "seed": instance.seed,
//         "flag": instance.flag,
//         "ciphertext": instance.ciphertext,
//     });
//     serde_wasm_bindgen::to_value(&payload).unwrap()
// }

#[wasm_bindgen]
pub fn compute_maccelijk_mac(seed: u64, message: &str) -> JsValue {
    let instance = ChallengeStruct::generate(seed);
    let tag = instance.compute_mac(message);
    serde_wasm_bindgen::to_value(&tag).unwrap()
}

#[wasm_bindgen]
pub fn verify_maccelijk_mac(seed: u64, message: &str, tag: &str) -> JsValue {
    let instance = ChallengeStruct::generate(seed);
    let valid = instance.verify_mac(message, tag);
    serde_wasm_bindgen::to_value(&valid).unwrap()
}