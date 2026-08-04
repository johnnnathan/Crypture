use crate::traits::{Challenge, ValidationResult};

pub struct ChallengeStruct {
    pub seed: u64,
    pub key: String,
    pub ciphertext: String,
    pub flag: String,
}

impl ChallengeStruct {
    /// Internal helper to encrypt text using the modified Vigenère algorithm
    fn encrypt_modified_vigenere(text: &str, key: &str) -> String {
        let mut result = String::new();
        let key_bytes = key.as_bytes();
        let key_len = key_bytes.len();
        let mut alpha_index = 0usize;

        for ch in text.chars() {
            if ch.is_ascii_uppercase() {
                let p = (ch as u8) - b'A';
                let k = key_bytes[alpha_index % key_len] - b'A';
                let drift = (alpha_index % 4) as u8;
                
                let enc = (p + k + drift) % 26;
                result.push((enc + b'A') as char);
                
                alpha_index += 1;
            } else {
                result.push(ch); // Leave non-alphabetic characters unchanged
            }
        }
        
        result
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        // Derive the 4th unknown key character based on the seed ('A' to 'Z')
        let unknown_char = ((seed % 26) as u8 + b'A') as char;
        
        // Base key with prefix "CRY" + dynamically derived 4th letter
        let key = format!("CRY{}", unknown_char);
        let flag = "FLAG{MODIFIED_VIGENERE_IS_BREAKABLE}".to_string();
        
        let ciphertext = Self::encrypt_modified_vigenere(&flag, &key);

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

    // Optional manual check override to ensure clean parsing/whitespace handling
    fn check(&self, input: &str) -> ValidationResult {
        let clean_input = input.trim().to_uppercase();

        if clean_input == self.flag {
            ValidationResult {
                correct: true,
                message: format!(
                    "🎉 Access Granted! You recovered key '{}' and decrypted the flag.",
                    self.key
                ),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect flag. Make sure you subtract both key[i % 4] and drift (i % 4) mod 26.".to_string(),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vigenere_drift_decryption() {
        // Updated from CaesarDriftChallenge -> ChallengeStruct
        let challenge = ChallengeStruct {
            seed: 0,
            key: "CRYP".to_string(),
            ciphertext: "HDAY{OGDAHAEV_XAGWPWRW_KK_BJGSKSDDE}".to_string(),
            flag: "FLAG{MODIFIED_VIGENERE_IS_BREAKABLE}".to_string(),
        };

        let generated_ct = ChallengeStruct::encrypt_modified_vigenere(&challenge.flag, &challenge.key);
        assert_eq!(generated_ct, challenge.ciphertext);

        let check_res = challenge.check("FLAG{MODIFIED_VIGENERE_IS_BREAKABLE}");
        assert!(check_res.correct);
    }
}
