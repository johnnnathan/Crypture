import json
from registry import get_challenge_instance

def call_challenge_method(challenge_id: str, seed: int, method_name: str, args_json: str = "[]") -> str:
    """
    Generic RPC dispatcher.
    Dynamically calls any public method on a challenge instance with JSON arguments.
    """
    try:
        challenge = get_challenge_instance(challenge_id, seed)
        
        # Prevent calling private/protected methods starting with '_'
        if method_name.startswith("_") or not hasattr(challenge, method_name):
            return json.dumps({"error": f"Method '{method_name}' not found on challenge '{challenge_id}'."})

        method = getattr(challenge, method_name)
        if not callable(method):
            return json.dumps({"error": f"Attribute '{method_name}' is not callable."})

        # Parse arguments list passed from JavaScript
        args = json.loads(args_json)
        
        # Execute method dynamically
        result = method(*args)

        # Format ValidationResult objects or plain return types into JSON
        if hasattr(result, "correct") and hasattr(result, "message"):
            return json.dumps({"correct": result.correct, "message": result.message})
        elif isinstance(result, (dict, list, str, int, float, bool)):
            return json.dumps({"result": result})
        else:
            return json.dumps({"result": str(result)})

    except Exception as e:
        return json.dumps({"error": f"Execution error: {str(e)}"})


# Core wrappers can still delegate to call_challenge_method
def get_challenge_payload(challenge_id: str, seed: int) -> str:
    return call_challenge_method(challenge_id, seed, "to_payload")

def check_challenge_submission(challenge_id: str, seed: int, submission: str) -> str:
    return call_challenge_method(challenge_id, seed, "check", json.dumps([submission]))
