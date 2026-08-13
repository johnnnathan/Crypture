import random
from dataclasses import dataclass
from base import BaseChallenge, ValidationResult


@dataclass
class TestXorChallenge(BaseChallenge):
    challenge_id = "test-xor-challenge"
    seed: int
    hex_ciphertext: str
    key: int
    flag: str

    @classmethod
    def generate(cls, seed: int) -> "TestXorChallenge":
        rng = random.Random(seed)
        
        # Simple plaintext test secret
        plaintext = f"hello_world_{seed}"
        key = rng.randint(1, 255)
        
        # XOR encrypt each character
        encrypted_bytes = bytes([ord(c) ^ key for c in plaintext])
        hex_ciphertext = encrypted_bytes.hex()
        
        flag = f"FLAG{{xor_test_pass_{seed:x}}}"

        return cls(
            seed=seed,
            hex_ciphertext=hex_ciphertext,
            key=key,
            flag=flag,
        )

    def expected_answer(self) -> str:
        # Reconstruct expected plaintext to check against
        rng = random.Random(self.seed)
        return f"hello_world_{self.seed}"

    def check(self, submission: str) -> ValidationResult:
        clean_sub = submission.strip()
        
        if clean_sub == self.expected_answer():
            return ValidationResult(
                correct=True,
                message=f"🎉 Test Passed! Flag: {self.flag}"
            )

        return ValidationResult(
            correct=False,
            message="Incorrect plaintext decrypted. Check your XOR logic!"
        )
