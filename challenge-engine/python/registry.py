import importlib.util
from pathlib import Path
from typing import Dict, Type
from base import BaseChallenge

REGISTRY: Dict[str, Type[BaseChallenge]] = {}


def discover_challenges():
    """Scans the virtual filesystem challenges directory and imports subclasses."""
    REGISTRY.clear()
    challenges_dir = Path(__file__).parent / "challenges"

    if not challenges_dir.exists():
        return

    for file_path in challenges_dir.glob("*.py"):
        if file_path.name.startswith("_"):
            continue  # Skip __init__.py and internal modules

        module_name = file_path.stem
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (
                    isinstance(attr, type)
                    and issubclass(attr, BaseChallenge)
                    and attr is not BaseChallenge
                ):
                    c_id = getattr(attr, "challenge_id", module_name)
                    REGISTRY[c_id] = attr


def get_challenge_instance(challenge_id: str, seed: int) -> BaseChallenge:
    if not REGISTRY:
        discover_challenges()

    if challenge_id not in REGISTRY:
        raise ValueError(f"Unknown challenge '{challenge_id}'. Registered: {list(REGISTRY.keys())}")

    return REGISTRY[challenge_id].generate(seed)
