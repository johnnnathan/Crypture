use crate::traits::{Challenge, ValidationResult};
use wasm_bindgen::prelude::*;

const MAX_ORACLE_LEN: usize = 4096;

pub struct ChallengeStruct {
    pub seed: u64,
    pub ciphertext: String, // Kept for macro/codegen compatibility!
    pub flag: String,
    key: [u8; 16],
    nonce: u64,
    counter_offset: u32,
    target_ciphertext_bytes: Vec<u8>,
}

impl ChallengeStruct {
    fn toy_block_cipher(key: &[u8; 16], nonce: u64, counter: u32) -> [u8; 16] {
        let mut block_input = [0u8; 16];
        block_input[0..8].copy_from_slice(&nonce.to_be_bytes());
        block_input[8..12].copy_from_slice(&counter.to_be_bytes());

        let mut stream_block = block_input;
        for (i, byte) in stream_block.iter_mut().enumerate() {
            *byte ^= key[i % key.len()].wrapping_add(i as u8);
            *byte = byte.wrapping_mul(31).wrapping_add(17);
            // FIXED: Dereferenced *byte on both shift operations
            *byte = (*byte << 3) | (*byte >> 5);
        }
        stream_block
    }

    fn encrypt_ctr(bytes: &[u8], key: &[u8; 16], nonce: u64, start_counter: u32) -> Vec<u8> {
        let mut ciphertext = Vec::with_capacity(bytes.len());
        for (idx, &byte) in bytes.iter().enumerate() {
            let block_idx = start_counter.wrapping_add((idx / 16) as u32);
            let byte_in_block = idx % 16;
            let keystream_block = Self::toy_block_cipher(key, nonce, block_idx);
            ciphertext.push(byte ^ keystream_block[byte_in_block]);
        }
        ciphertext
    }

    fn derive_params(seed: u64) -> ([u8; 16], u64, u32) {
        let mut key = [0u8; 16];
        let mut state = seed;
        for byte in key.iter_mut() {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            *byte = (state >> 32) as u8;
        }

        let nonce = state ^ 0xDEADBEEFCAFEBABEu64;
        let counter_offset = ((state >> 16) % 512) as u32 + 32;

        (key, nonce, counter_offset)
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

    pub fn oracle_encrypt_hex(&self, hex: &str) -> Result<String, String> {
        let plaintext = Self::hex_decode(hex)?;
        if plaintext.is_empty() {
            return Err("plaintext must not be empty".to_string());
        }
        if plaintext.len() > MAX_ORACLE_LEN {
            return Err(format!("plaintext too long (max {} bytes)", MAX_ORACLE_LEN));
        }
        let ciphertext = Self::encrypt_ctr(&plaintext, &self.key, self.nonce, self.counter_offset);
        Ok(Self::hex_encode(&ciphertext))
    }

    fn build_target_plaintext(seed: u64, flag: &str) -> String {
        let mut state = seed ^ 0x9E37_79B9_7F4A_7C15;
        let mut next = move || {
            state = state
                .wrapping_mul(6364136223846793005)
                .wrapping_add(1442695040888963407);
            state
        };

        let filler_lines = [
            "This memorandum is intended solely for the use of the recipient named above.",
            "Distribution outside the Helios working group is strictly prohibited.",
            "All figures referenced in Section 4 remain provisional pending audit review.",
            "Please route any questions regarding scheduling to the program office.",
            "Historical revisions of this document are archived under record group HX-19.",
            "The steering committee will reconvene following the quarterly assessment.",
            "Personnel rotations for the next cycle are detailed in the attached roster.",
            "Facilities access badges must be renewed prior to the compliance deadline.",
        ];

        let prefix_lines = 2 + (next() % 4) as usize;
        let suffix_lines = 2 + (next() % 4) as usize;

        let mut doc = String::new();
        doc.push_str("COMPANY INTERNAL MEMORANDUM\n");
        doc.push_str("Project: HELIOS\n");
        doc.push_str("Classification: Internal Use Only\n\n");

        for i in 0..prefix_lines {
            doc.push_str(filler_lines[(next() as usize + i) % filler_lines.len()]);
            doc.push('\n');
        }

        doc.push('\n');
        doc.push_str(&format!("Reference token: {}\n", flag));
        doc.push('\n');

        for i in 0..suffix_lines {
            doc.push_str(filler_lines[(next() as usize + i + 3) % filler_lines.len()]);
            doc.push('\n');
        }

        doc.push_str("\nCopyright SecureCorp. All rights reserved.\n");
        doc.push_str("END OF TRANSMISSION\n");

        while doc.len() < 2048 {
            let idx = (next() as usize) % filler_lines.len();
            doc.push_str(filler_lines[idx]);
            doc.push('\n');
        }

        doc
    }
}

impl Challenge for ChallengeStruct {
    fn generate(seed: u64) -> Self {
        let (key, nonce, counter_offset) = Self::derive_params(seed);
        let flag = "CTF{c1ph3r_t3xt_dr4gg1ng_4nd_c0unt3r_1n_sync!}".to_string();

        let target_plaintext = Self::build_target_plaintext(seed, &flag);
        let target_ciphertext_bytes =
            Self::encrypt_ctr(target_plaintext.as_bytes(), &key, nonce, 0);

        // Convert to hex so the macro can automatically pick up `instance.ciphertext`
        let ciphertext = Self::hex_encode(&target_ciphertext_bytes);

        Self {
            seed,
            key,
            nonce,
            counter_offset,
            target_ciphertext_bytes,
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
                message:
                    "🎉 Access Granted! You sliding-window aligned the keystream offset and recovered the flag!"
                        .to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect flag. Remember to slide the recovered keystream across the target ciphertext looking for readable English.".to_string(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn query_ctr_ttp_oracle(seed: u64, hex_input: &str) -> String {
    let challenge = ChallengeStruct::generate(seed);
    match challenge.oracle_encrypt_hex(hex_input) {
        Ok(ct_hex) => ct_hex,
        Err(err) => format!("ERROR: {}", err),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ctr_keystream_alignment_solver() {
        let challenge = ChallengeStruct::generate(1337);

        // 1. Student requests 512 bytes of known plaintext 'A' from Oracle
        let known_plaintext = vec![b'A'; 512];
        let known_hex = ChallengeStruct::hex_encode(&known_plaintext);
        let oracle_ct_hex = challenge
            .oracle_encrypt_hex(&known_hex)
            .expect("oracle call should succeed");
        let oracle_ct = ChallengeStruct::hex_decode(&oracle_ct_hex).expect("valid hex");

        // 2. Recover floating keystream fragment: K_oracle = C ^ P
        let oracle_keystream: Vec<u8> = oracle_ct
            .iter()
            .zip(known_plaintext.iter())
            .map(|(&c, &p)| c ^ p)
            .collect();

        let target_ct =
            ChallengeStruct::hex_decode(&challenge.target_ciphertext_hex()).expect("valid hex");

        // 3. SLIDING WINDOW ATTACK:
        // Slide the recovered 512-byte keystream across the target ciphertext (block offsets 0..1024)
        let mut recovered_flag = String::new();

        for byte_offset in (0..target_ct.len().saturating_sub(oracle_keystream.len())).step_by(16) {
            let target_slice = &target_ct[byte_offset..byte_offset + oracle_keystream.len()];
            
            // Decrypt slice with floating keystream
            let decrypted_bytes: Vec<u8> = target_slice
                .iter()
                .zip(oracle_keystream.iter())
                .map(|(&c, &k)| c ^ k)
                .collect();

            let decrypted_text = String::from_utf8_lossy(&decrypted_bytes);

            // Look for readable markers / flag pattern
            if decrypted_text.contains("FLAG:") || decrypted_text.contains("CTF{") {
                if let Some(start) = decrypted_text.find("CTF{") {
                    if let Some(end) = decrypted_text[start..].find('}') {
                        recovered_flag = decrypted_text[start..=start + end].to_string();
                        break;
                    }
                }
            }
        }

        assert_eq!(recovered_flag, challenge.flag);

        // 4. Verify answer checking
        let check_res = challenge.check(&recovered_flag);
        assert!(check_res.correct);
    }
}
