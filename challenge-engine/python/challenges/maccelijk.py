import hashlib
import hmac
import random
from dataclasses import dataclass
from base import BaseChallenge, ValidationResult


@dataclass
class MaccelijkChallenge(BaseChallenge):
    challenge_id = "maccelijk"
    seed: int
    key: bytes
    flag: str

    @classmethod
    def generate(cls, seed: int) -> "MaccelijkChallenge":
        rng = random.Random(seed)
        key = rng.randbytes(16)
        flag = f"FLAG{{m4cc3l1jk_{seed:x}}}"
        return cls(seed=seed, key=key, flag=flag)

    def _compute_tag(self, msg: str) -> str:
        # Replace with your specific MACcelijk variant logic
        return hmac.new(self.key, msg.encode("utf-8"), hashlib.sha256).hexdigest()[:16]

    def mac(self, msg: str) -> str:
        return self._compute_tag(str(msg))

    def vfy(self, msg: str, tag: str) -> bool:
        expected = self._compute_tag(str(msg))
        return hmac.compare_digest(expected, str(tag).strip().lower())

    def to_payload(self) -> dict:
        return {
            "challenge_id": self.challenge_id,
            "seed": self.seed,
        }

    def expected_answer(self) -> str:
        return self.flag
