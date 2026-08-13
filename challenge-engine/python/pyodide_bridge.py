import json
from registry import get_challenge_instance


def get_challenge_payload(challenge_id: str, seed: int) -> str:
    """Instantiates challenge and returns a JSON payload string."""
    try:
        challenge = get_challenge_instance(challenge_id, seed)
        return json.dumps(challenge.to_payload())
    except Exception as e:
        return json.dumps({"error": str(e)})


def check_challenge_submission(challenge_id: str, seed: int, submission: str) -> str:
    """Evaluates submission and returns a JSON result string."""
    try:
        challenge = get_challenge_instance(challenge_id, seed)
        result = challenge.check(submission)
        return json.dumps({
            "correct": result.correct,
            "message": result.message
        })
    except Exception as e:
        return json.dumps({
            "correct": False,
            "message": f"Execution error: {str(e)}"
        })
