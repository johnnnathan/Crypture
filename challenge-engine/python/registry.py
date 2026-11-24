import importlib.util
from pathlib import Path
from typing import Dict, Type
from base import BaseChallenge

REGISTRY: Dict[str, Type[BaseChallenge]] = {}


def discover_challenges():
    """Scans the virtual filesystem challenges directory and imports subclasses."""
    REGISTRY.clear()
    challenges_dir = Path(__file__).parent / "challenges"
    print(f"[DISCOVERY] Scanning challenges directory: {challenges_dir}")

    if not challenges_dir.exists():
        print("[DISCOVERY] Challenges directory does not exist.")
        return

    for file_path in challenges_dir.glob("*.py"):
        print(f"[DISCOVERY] Found file: {file_path.name}")
        if file_path.name.startswith("_"):
            print(f"[DISCOVERY] Skipping internal module: {file_path.name}")
            continue  # Skip __init__.py and internal modules

        module_name = file_path.stem
        print(f"[DISCOVERY] Loading module: {module_name}")
        spec = importlib.util.spec_from_file_location(module_name, file_path)

        if spec and spec.loader:
            try:
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                print(f"[DISCOVERY] Successfully loaded module: {module_name}")

                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (
                        isinstance(attr, type)
                        and issubclass(attr, BaseChallenge)
                        and attr is not BaseChallenge
                    ):
                        c_id = getattr(attr, "challenge_id", module_name)
                        REGISTRY[c_id] = attr
                        print(f"[DISCOVERY] Registered challenge: {c_id}")
            except Exception as e:
                print(f"[ERROR] Failed to load module {module_name}: {e}")
        else:
            print(f"[ERROR] Could not create spec for module: {module_name}")


def get_challenge_instance(challenge_id: str, seed: int) -> BaseChallenge:
    """Retrieves a challenge instance by its ID and seed."""
    print(f"[CHALLENGE] Retrieving challenge instance for ID: {challenge_id}, Seed: {seed}")
    discover_challenges()

    if challenge_id not in REGISTRY:
        print(f"[ERROR] Unknown challenge '{challenge_id}'. Registered challenges: {list(REGISTRY.keys())}")
        raise ValueError(f"Unknown challenge '{challenge_id}'. Registered: {list(REGISTRY.keys())}")

    print(f"[CHALLENGE] Found challenge '{challenge_id}' in registry.")
    return REGISTRY[challenge_id].generate(seed)