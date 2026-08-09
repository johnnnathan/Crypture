pub mod traits;
pub mod caesar_drift;
pub mod mini_des;
pub mod ctr_ttp;
pub mod baat;
pub mod des_bruteforce;

pub use traits::Challenge;
use wasm_bindgen::prelude::*;

include!(concat!(env!("OUT_DIR"), "/generated_challenges.rs"));

