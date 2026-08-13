from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class ValidationResult:
    correct: bool
    message: str


class BaseChallenge(ABC):
    """
    Superclass for all Python CTF challenges.
    """
    challenge_id: str
    seed: int
    flag: str

    @classmethod
    @abstractmethod
    def generate(cls, seed: int) -> "BaseChallenge":
        """Factory method to generate a challenge instance from a seed."""
        pass

    @abstractmethod
    def expected_answer(self) -> str:
        """Returns canonical expected answer string."""
        pass

    def check(self, submission: str) -> ValidationResult:
        """
        Default check routine for standard single-input challenges.
        Override this in subclasses for multi-part structural checks.
        """
        clean_sub = submission.strip()
        expected = self.expected_answer()

        if clean_sub.lower() == expected.lower() or clean_sub == expected:
            return ValidationResult(
                correct=True,
                message=f"🎉 Correct! Flag: {self.flag}"
            )
        
        return ValidationResult(
            correct=False,
            message="Incorrect answer. Try again!"
        )

    def to_payload(self) -> Dict[str, Any]:
        """Converts instance attributes to a frontend-safe dictionary (stripping flags)."""
        data = self.__dict__.copy()
        data.pop("flag", None)
        return data
