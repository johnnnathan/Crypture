import random
from dataclasses import dataclass
from base import BaseChallenge, ValidationResult


def pkcs7_unpad(data: bytes) -> bool:
    """Validates PKCS#7 padding on decrypted bytes."""
    if not data or len(data) % 16 != 0:
        return False
    pad_len = data[-1]
    if pad_len < 1 or pad_len > 16:
        return False
    return data[-pad_len:] == bytes([pad_len]) * pad_len


@dataclass
class PaddingOracleChallenge(BaseChallenge):
    challenge_id = "aes-padding-oracle"
    seed: int
    ciphertext: str
    iv_hex: str
    flag: str
    key: bytes

    @classmethod
    def generate(cls, seed: int) -> "PaddingOracleChallenge":
        rng = random.Random(seed)
        
        # 16-byte secret key derived from seed
        key = rng.randbytes(16)
        iv = rng.randbytes(16)
        
        flag = f"FLAG{{p4dd1ng_0r4cl3_l34k_{seed:x}}}"
        pt_bytes = flag.encode("utf-8")
        
        # PKCS#7 Pad the flag payload to 16-byte block size
        pad_len = 16 - (len(pt_bytes) % 16)
        padded_pt = pt_bytes + bytes([pad_len]) * pad_len
        
        # Simple XOR-CBC stream simulator for block decryption verification
        # (Emulates CBC block decryption behavior for oracle testing)
        ct_blocks = []
        prev_block = iv
        for i in range(0, len(padded_pt), 16):
            block = padded_pt[i : i + 16]
            # Encrypt block: (PT XOR Prev) XOR Key
            enc_block = bytes([b ^ p ^ k for b, p, k in zip(block, prev_block, key)])
            ct_blocks.append(enc_block)
            prev_block = enc_block

        ct_bytes = b"".join(ct_blocks)

        return cls(
            seed=seed,
            ciphertext=ct_bytes.hex(),
            iv_hex=iv.hex(),
            flag=flag,
            key=key,
        )

    def oracle_check_padding(self, ct_hex: str, iv_hex: str) -> bool:
        """
        Side-channel oracle route invoked repeatedly by JS scripts.
        Decrypts CBC blocks and validates PKCS#7 padding.
        """
        try:
            ct_bytes = bytes.fromhex(ct_hex.strip())
            iv_bytes = bytes.fromhex(iv_hex.strip())

            if len(iv_bytes) != 16 or not ct_bytes or len(ct_bytes) % 16 != 0:
                return False

            # Decrypt CBC blocks: PT_block = Decrypt(CT_block) XOR Prev_CT_block
            decrypted_pt = bytearray()
            prev_block = iv_bytes

            for i in range(0, len(ct_bytes), 16):
                block = ct_bytes[i : i + 16]
                # Decrypt block: (CT XOR Key) XOR Prev_CT
                pt_block = bytes([b ^ k ^ p for b, k, p in zip(block, self.key, prev_block)])
                decrypted_pt.extend(pt_block)
                prev_block = block

            # Verify PKCS#7 padding structure
            return pkcs7_unpad(bytes(decrypted_pt))
        except Exception:
            return False

    def expected_answer(self) -> str:
        return self.flag

    def check(self, submission: str) -> ValidationResult:
        clean_sub = submission.strip()
        
        if clean_sub == self.flag:
            return ValidationResult(
                correct=True,
                message=f"🎉 Correct! You decrypted the flag using the side-channel padding oracle: {self.flag}"
            )

        return ValidationResult(
            correct=False,
            message="Incorrect flag. Keep querying the padding oracle block-by-block!"
        )
