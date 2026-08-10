use crate::traits::{Challenge, ValidationResult};
use aes::Aes128;
use cbc::cipher::{
    block_padding::Pkcs7,
    BlockModeDecrypt,
    BlockModeEncrypt,
    KeyIvInit,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

type Aes128CbcEnc = cbc::Encryptor<Aes128>;
type Aes128CbcDec = cbc::Decryptor<Aes128>;

#[derive(Serialize, Deserialize)]
pub struct PaddingOracleTarget {
    pub ciphertext: String,
    pub iv_hex: String,
}

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String,
    pub iv_hex: String,
    pub flag: String,
    key: [u8; 16],
    iv: [u8; 16],
}

impl ChallengeStruct {
    pub fn get_target(&self) -> PaddingOracleTarget {
        PaddingOracleTarget {
            ciphertext: self.ciphertext.clone(),
            iv_hex: self.iv_hex.clone(),
        }
    }

    pub fn oracle_check_padding(&self, ct_hex: &str, iv_hex: &str) -> bool {
        let ct_bytes = match hex::decode(ct_hex.trim()) {
            Ok(b) => b,
            Err(_) => return false,
        };
        let iv_bytes = match hex::decode(iv_hex.trim()) {
            Ok(b) => b,
            Err(_) => return false,
        };

        if iv_bytes.len() != 16 || ct_bytes.is_empty() || ct_bytes.len() % 16 != 0 {
            return false;
        }

        let mut buf = ct_bytes;
        let mut iv_arr = [0u8; 16];
        iv_arr.copy_from_slice(&iv_bytes);

        Aes128CbcDec::new(&self.key.into(), &iv_arr.into())
            .decrypt_padded::<Pkcs7>(&mut buf)
            .is_ok()
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let mut key = [0u8; 16];
        let mut iv = [0u8; 16];
        let mut state = seed ^ 0x1234_5678_9ABC_DEF0;

        for b in key.iter_mut().chain(iv.iter_mut()) {
            state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            *b = (state >> 32) as u8;
        }

        let flag = "FLAG{p4dd1ng_0r4cl3_c4n_d3cryp7_3v3ry7h1ng}".to_string();
        let pt = flag.as_bytes();
        let pt_len = pt.len();
        let mut buf = vec![0u8; pt_len + 16];
        buf[..pt_len].copy_from_slice(pt);

        let ct = Aes128CbcEnc::new(&key.into(), &iv.into())
            .encrypt_padded::<Pkcs7>(&mut buf, pt_len)
            .unwrap();

        Self {
            seed,
            ciphertext: hex::encode(ct),
            iv_hex: hex::encode(iv),
            flag,
            key,
            iv,
        }
    }

    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    fn check(&self, input: &str) -> ValidationResult {
        if input.trim() == self.flag {
            ValidationResult {
                correct: true,
                message: "🎉 Correct! You leaked the entire plaintext using the side-channel padding oracle.".into(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect flag. Keep querying the padding oracle byte-by-byte.".into(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn get_padding_oracle_target(seed: u64) -> JsValue {
    let challenge = ChallengeStruct::generate(seed);
    serde_wasm_bindgen::to_value(&challenge.get_target()).unwrap()
}

#[wasm_bindgen]
pub fn query_padding_oracle(seed: u64, ct_hex: &str, iv_hex: &str) -> String {
    let challenge = ChallengeStruct::generate(seed);
    if challenge.oracle_check_padding(ct_hex, iv_hex) {
        "VALID".to_string()
    } else {
        "INVALID".to_string()
    }
}

#[wasm_bindgen]
pub fn check_padding_oracle_flag(seed: u64, input: &str) -> JsValue {
    let challenge = ChallengeStruct::generate(seed);
    let result = challenge.check(input);
    serde_wasm_bindgen::to_value(&result).unwrap()
}
