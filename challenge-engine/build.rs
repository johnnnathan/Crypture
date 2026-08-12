use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated_challenges.rs");
    
    // Clean string—no duplicate `use crate::traits::Challenge;` needed here!
    let mut generated_code = String::new();
    
    let entries = fs::read_dir("src").expect("Could not read src directory");

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("rs") {
            let filename = path.file_stem().unwrap().to_str().unwrap();
            
            // Skip lib, traits, and any files starting with "h_"
            if filename == "lib" || filename == "traits" || filename.starts_with("h_") {
                continue;
            }

            let mod_name = filename; // e.g. "caesar_drift"

            generated_code.push_str(&format!(
                r#"
                #[wasm_bindgen]
                pub fn generate_{mod_name}_challenge(seed: u64) -> JsValue {{
                    let instance = crate::{mod_name}::ChallengeStruct::generate(seed);
                    let payload = serde_json::json!({{
                        "ciphertext": instance.ciphertext,
                    }});
                    serde_wasm_bindgen::to_value(&payload).unwrap()
                }}

                #[wasm_bindgen]
                pub fn check_{mod_name}_challenge(seed: u64, submission: &str) -> JsValue {{
                    let instance = crate::{mod_name}::ChallengeStruct::generate(seed);
                    let result = instance.check(submission);
                    serde_wasm_bindgen::to_value(&result).unwrap()
                }}
                "#
            ));

        }
    }

    fs::write(dest_path, generated_code).unwrap();
    println!("cargo:rerun-if-changed=src");
}
