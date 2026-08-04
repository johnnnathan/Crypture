use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ValidationResult {
    pub correct: bool,
    pub message: String,
}

pub trait Challenge {
    /// Performs the technical processes of the given exercise. 
    fn generate(seed: u64) -> Self;

    /// Returns the raw expected solution string for standard checking.
    fn expected_answer(&self) -> String;

    fn check(&self, input: &str) -> ValidationResult {
        let clean_input = input.trim();
        let expected = self.expected_answer();

        if clean_input.eq_ignore_ascii_case(&expected) || clean_input == expected {
            ValidationResult {
                correct: true,
                message: "🎉 Correct! Flag validated successfully.".to_string(),
            }
        } else {
            ValidationResult {
                correct: false,
                message: "Incorrect answer. Check your calculations and try again.".to_string(),
            }
        }
    }
}
