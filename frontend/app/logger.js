// logger.js — append to the log panel in the left sidebar

const MAX_LINES = 80;

export function log(msg, level = '') {
  const panel = document.getElementById('log-panel');
  if (!panel) { console.log(`[${level || 'log'}]`, msg); return; }

  const line = document.createElement('div');
  line.classList.add('log-line');
  if (level) line.classList.add(level);

  const now = new Date();
  const ts  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

  line.textContent = `[${ts}] ${msg}`;
  panel.appendChild(line);

  // Prune old lines
  while (panel.children.length > MAX_LINES) {
    panel.removeChild(panel.firstChild);
  }

  panel.scrollTop = panel.scrollHeight;
}
