use crate::traits::{Challenge, ValidationResult};
use aes::Aes128;
use cbc::cipher::{
    block_padding::Pkcs7,
    BlockCipherDecrypt,
    BlockModeEncrypt,
    KeyInit,
    KeyIvInit,
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

type Aes128CbcEnc = cbc::Encryptor<Aes128>;

#[derive(Serialize, Deserialize)]
pub struct IvKeyTarget {
    pub ciphertext: String,
}

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String,
    pub flag: String,
    key: [u8; 16],
}

impl ChallengeStruct {
    pub fn get_target(&self) -> IvKeyTarget {
        IvKeyTarget {
            ciphertext: self.ciphertext.clone(),
        }
    }

    pub fn oracle_encrypt(&self, plaintext_hex: &str) -> Result<String, String> {
        let pt_bytes = hex::decode(plaintext_hex.trim()).map_err(|_| "Invalid hex input")?;
        let pt_len = pt_bytes.len();
        let mut buf = vec![0u8; pt_len + 16];
        buf[..pt_len].copy_from_slice(&pt_bytes);

        let ct = Aes128CbcEnc::new(&self.key.into(), &self.key.into())
            .encrypt_padded::<Pkcs7>(&mut buf, pt_len)
            .map_err(|_| "Encryption error")?;

        Ok(hex::encode(ct))
    }

    pub fn oracle_decrypt(&self, ct_hex: &str) -> Result<String, String> {
        let ct_bytes = hex::decode(ct_hex.trim()).map_err(|_| "Invalid hex input")?;
        if ct_bytes.is_empty() || ct_bytes.len() % 16 != 0 {
            return Err("Ciphertext length must be a multiple of 16 bytes".into());
        }

        let cipher = Aes128::new(&self.key.into());
        let mut out = vec![0u8; ct_bytes.len()];

        for (i, chunk) in ct_bytes.chunks(16).enumerate() {
            let mut block = cbc::cipher::Array::default();
            block.copy_from_slice(chunk);

            cipher.decrypt_block(&mut block);

            if i == 0 {
                // P1 = D(C1) XOR IV (since IV=KEY, P1 = D(C1) XOR KEY)
                for j in 0..16 {
                    out[j] = block[j] ^ self.key[j];
                }
            } else {
                let prev = &ct_bytes[(i - 1) * 16..i * 16];
                for j in 0..16 {
                    out[i * 16 + j] = block[j] ^ prev[j];
                }
            }
        }

        Ok(hex::encode(out))
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let mut key = [0u8; 16];
        let mut state = seed ^ 0xFEED_FACE_CAFE_BABE;

        for b in key.iter_mut() {
            state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            *b = (state >> 32) as u8;
        }

        let flag = "FLAG{iv_3qu4ls_k3y_1s_4_c474s7r0ph1c_f41lur3}".to_string();
        let pt = flag.as_bytes();
        let pt_len = pt.len();
        let mut buf = vec![0u8; pt_len + 16];
        buf[..pt_len].copy_from_slice(pt);

        let ct = Aes128CbcEnc::new(&key.into(), &key.into())
            .encrypt_padded::<Pkcs7>(&mut buf, pt_len)
            .unwrap();

        Self {
            seed,
            ciphertext: hex::encode(ct),
            flag,
            key,
        }
    }

    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    fn check(&self, input: &str) -> ValidationResult {
        if input.trim() == self.flag {
            ValidationResult {
                correct: true,
                message: "🎉 Access Granted! You recovered the KEY by exploiting P1 ⊕ P3 = KEY.".into(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect flag. Construct C1 || 0 || C1 to recover KEY = P1 ⊕ P3.".into(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn get_iv_key_target(seed: u64) -> JsValue {
    let ch = ChallengeStruct::generate(seed);
    serde_wasm_bindgen::to_value(&ch.get_target()).unwrap()
}

#[wasm_bindgen]
pub fn oracle_encrypt_iv_key(seed: u64, pt_hex: &str) -> Result<String, JsValue> {
    let ch = ChallengeStruct::generate(seed);
    ch.oracle_encrypt(pt_hex).map_err(|e| JsValue::from_str(&e))
}

#[wasm_bindgen]
pub fn oracle_decrypt_iv_key(seed: u64, ct_hex: &str) -> Result<String, JsValue> {
    let ch = ChallengeStruct::generate(seed);
    ch.oracle_decrypt(ct_hex).map_err(|e| JsValue::from_str(&e))
}

#[wasm_bindgen]
pub fn check_iv_key_flag(seed: u64, input: &str) -> JsValue {
    let ch = ChallengeStruct::generate(seed);
    serde_wasm_bindgen::to_value(&ch.check(input)).unwrap()
}
