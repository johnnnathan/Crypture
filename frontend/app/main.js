// main.js — App bootstrap & screen router
import initCryptoEngine, { CircuitWasm } from './crypto_engine_pkg/crypto_engine.js';
import initChallengeEngine from './chapters/challenges_pkg/challenge_engine.js';
import { initPythonEngine } from './python-engine.js'; // 👈 1. Import Python Engine
import { Sandbox } from './sandbox.js';
import { initExercises } from './exercises.js';

let circuit = null;
let sandbox = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function initEngine() {
  const statusLed  = document.getElementById('wasm-status-led');
  const statusText = document.getElementById('wasm-status-text');
  
  try {
    statusText.textContent = 'booting engines...';

    // 👈 2. Concurrently boot ALL THREE engines (Rust Crypto, Rust Challenge, Python Pyodide)
    await Promise.all([
      initCryptoEngine(),
      initChallengeEngine(),
      initPythonEngine()
    ]);

    circuit = new CircuitWasm('CryptureEngine');
    statusLed.classList.add('ready');
    statusText.textContent = 'engines ready';

    // Unlock nav cards
    document.getElementById('btn-open-sandbox').style.opacity       = '1';
    document.getElementById('btn-open-sandbox').style.pointerEvents = 'auto';
    document.getElementById('btn-open-exercises').style.opacity     = '1';
    document.getElementById('btn-open-exercises').style.pointerEvents = 'auto';

    // Boot exercises — each gets its own CircuitWasm instance internally
    initExercises(CircuitWasm);
  } catch (err) {
    statusLed.classList.add('error');
    statusText.textContent = 'engine failed — ' + err.message;
    console.error('Engine init error:', err);
  }
}

function initMenuBg() {
  const canvas = document.getElementById('menu-bg-canvas');
  const ctx    = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const nodes = Array.from({ length: 18 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
    });
    ctx.strokeStyle = '#00e5aa';
    ctx.lineWidth   = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 220) {
          ctx.globalAlpha = (1 - d/220) * 0.3;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 0.6;
    nodes.forEach(n => {
      ctx.fillStyle = '#00e5aa';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

document.addEventListener('DOMContentLoaded', () => {
  initMenuBg();
  initEngine();

  document.getElementById("btn-back-from-exercises")
    .addEventListener("click", () => {
      showScreen("screen-menu");
    });

  document.getElementById('btn-open-sandbox').addEventListener('click', () => {
    if (!circuit) return;
    showScreen('screen-sandbox');
    if (!sandbox) sandbox = new Sandbox(circuit, CircuitWasm);
  });

  document.getElementById('btn-open-exercises').addEventListener('click', () => {
    showScreen('screen-exercises');
  });

  document.getElementById('btn-back-to-menu').addEventListener('click', () => {
    showScreen('screen-menu');
  });
});
