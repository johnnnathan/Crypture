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
pub struct BitflipPayload {
    pub ciphertext: String,
    pub iv_hex: String,
}

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String,
    pub iv_hex: String,
    pub prefix: &'static str,
    pub suffix: &'static str,
    pub flag: String,
    key: [u8; 16],
    iv: [u8; 16],
}

impl ChallengeStruct {
    pub fn encrypt_user_input(&self, user_input: &str) -> Result<BitflipPayload, String> {
        if user_input.contains("admin=true") {
            return Err("Forbidden substring 'admin=true' detected in input!".into());
        }

        let mut plaintext = Vec::new();
        plaintext.extend_from_slice(self.prefix.as_bytes());
        plaintext.extend_from_slice(user_input.as_bytes());
        plaintext.extend_from_slice(self.suffix.as_bytes());

        let pt_len = plaintext.len();
        let mut buf = vec![0u8; pt_len + 16];
        buf[..pt_len].copy_from_slice(&plaintext);

        let ct = Aes128CbcEnc::new(&self.key.into(), &self.iv.into())
            .encrypt_padded::<Pkcs7>(&mut buf, pt_len)
            .map_err(|_| "Encryption padding error".to_string())?;

        Ok(BitflipPayload {
            ciphertext: hex::encode(ct),
            iv_hex: hex::encode(self.iv),
        })
    }

    pub fn check_ciphertext(&self, ct_hex: &str, iv_hex: &str) -> ValidationResult {
        let ct_bytes = match hex::decode(ct_hex.trim()) {
            Ok(b) => b,
            Err(_) => return ValidationResult { correct: false, message: "Invalid hex in ciphertext.".into() },
        };
        let iv_bytes = match hex::decode(iv_hex.trim()) {
            Ok(b) => b,
            Err(_) => return ValidationResult { correct: false, message: "Invalid hex in IV.".into() },
        };

        if iv_bytes.len() != 16 {
            return ValidationResult { correct: false, message: "IV must be exactly 16 bytes.".into() };
        }

        let mut buf = ct_bytes;
        let mut iv_arr = [0u8; 16];
        iv_arr.copy_from_slice(&iv_bytes);

        let pt_bytes = match Aes128CbcDec::new(&self.key.into(), &iv_arr.into()).decrypt_padded::<Pkcs7>(&mut buf) {
            Ok(pt) => pt,
            Err(_) => return ValidationResult { correct: false, message: "Decryption failed (bad padding).".into() },
        };

        let pt_str = String::from_utf8_lossy(pt_bytes);
        if pt_str.contains("admin=true") {
            ValidationResult {
                correct: true,
                message: "🎉 Success! You modified the previous block to force 'admin=true' in the decrypted plaintext!".into(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: format!("Decrypted plaintext does not contain 'admin=true'. Decrypted output: {}", pt_str),
            }
        }
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let mut key = [0u8; 16];
        let mut iv = [0u8; 16];
        let mut state = seed ^ 0x9E37_79B9_7F4A_7C15;

        for b in key.iter_mut().chain(iv.iter_mut()) {
            state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            *b = (state >> 32) as u8;
        }

        let prefix = "comment1=cooking%20MCs;userdata=";
        let suffix = ";comment2=%20like%20a%20pound%20of%20bacon";
        let flag = "FLAG{cbc_b17_fl1pp1ng_m4ll34b1l17y}".to_string();

        let initial_pt = format!("{}hello{}", prefix, suffix);
        let pt_len = initial_pt.len();
        let mut buf = vec![0u8; pt_len + 16];
        buf[..pt_len].copy_from_slice(initial_pt.as_bytes());

        let ct = Aes128CbcEnc::new(&key.into(), &iv.into())
            .encrypt_padded::<Pkcs7>(&mut buf, pt_len)
            .unwrap();

        Self {
            seed,
            ciphertext: hex::encode(ct),
            iv_hex: hex::encode(iv),
            prefix,
            suffix,
            flag,
            key,
            iv,
        }
    }

    fn expected_answer(&self) -> String {
        self.flag.clone()
    }

    fn check(&self, input: &str) -> ValidationResult {
        ValidationResult {
            correct: input.trim() == self.flag,
            message: "Validation completed.".into(),
        }
    }
}

#[wasm_bindgen]
pub fn encrypt_aes_bitflip(seed: u64, user_input: &str) -> Result<JsValue, JsValue> {
    let challenge = ChallengeStruct::generate(seed);
    match challenge.encrypt_user_input(user_input) {
        Ok(res) => Ok(serde_wasm_bindgen::to_value(&res).unwrap()),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}

#[wasm_bindgen]
pub fn check_aes_bitflip(seed: u64, ct_hex: &str, iv_hex: &str) -> JsValue {
    let challenge = ChallengeStruct::generate(seed);
    let result = challenge.check_ciphertext(ct_hex, iv_hex);
    serde_wasm_bindgen::to_value(&result).unwrap()
}
