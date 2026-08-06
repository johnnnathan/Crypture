pub mod traits;
pub mod caesar_drift;
pub mod mini_des;

pub use traits::Challenge;
use wasm_bindgen::prelude::*;

include!(concat!(env!("OUT_DIR"), "/generated_challenges.rs"));

