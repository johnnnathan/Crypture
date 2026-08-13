import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs";

let pyodideInstance = null;


export async function initPythonEngine() {
  if (pyodideInstance) return pyodideInstance;

  console.log("🌀 Initializing Python Engine...");
  pyodideInstance = await loadPyodide();

  pyodideInstance.FS.mkdirTree('/python_engine/challenges');

  const loadFile = async (path, virtualPath) => {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to load ${path} (Status: ${res.status})`);
    }
    const code = await res.text();
    pyodideInstance.FS.writeFile(virtualPath, code);
  };

  // 1. Fetch from served path (/chapters/python_engine/...)
  await loadFile('/chapters/python_engine/base.py', '/python_engine/base.py');
  await loadFile('/chapters/python_engine/registry.py', '/python_engine/registry.py');
  await loadFile('/chapters/python_engine/pyodide_bridge.py', '/python_engine/pyodide_bridge.py');
  pyodideInstance.FS.writeFile('/python_engine/challenges/__init__.py', '');

  // 2. Fetch challenges.json from served path
  const res = await fetch('/chapters/python_engine/challenges.json');
  if (!res.ok) {
    throw new Error(`Failed to load challenges.json (Status: ${res.status})`);
  }
  const challengeFiles = await res.json();

  for (const file of challengeFiles) {
    await loadFile(`/chapters/python_engine/challenges/${file}`, `/python_engine/challenges/${file}`);
  }

  await pyodideInstance.runPythonAsync(`
    import sys
    sys.path.append('/python_engine')
    import pyodide_bridge
  `);

  return pyodideInstance;
}

export async function loadPythonChallenge(challengeId, seed) {
  const py = await initPythonEngine();
  const rawJson = py.runPython(`pyodide_bridge.get_challenge_payload("${challengeId}", ${seed})`);
  return JSON.parse(rawJson);
}

export async function submitPythonChallenge(challengeId, seed, submissionString) {
  const py = await initPythonEngine();
  py.globals.set("__sub_input", submissionString);
  const rawJson = py.runPython(`pyodide_bridge.check_challenge_submission("${challengeId}", ${seed}, __sub_input)`);
  return JSON.parse(rawJson);
}

