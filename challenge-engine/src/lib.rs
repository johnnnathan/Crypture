pub mod traits;
pub mod caesar_drift;
pub mod mini_des;
pub mod ctr_ttp;
pub mod baat;
pub mod des_bruteforce;
pub mod aes_bitflip;
pub mod aes_iv_key;
pub mod aes_padding_oracle;
pub mod sha1_collision;
pub mod h_sha1_materials;

pub use traits::Challenge;
use wasm_bindgen::prelude::*;

include!(concat!(env!("OUT_DIR"), "/generated_challenges.rs"));

