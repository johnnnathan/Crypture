/**
 * ECC Theory Chapter Module with Live Canvas Simulation
 */
export const eccTheory = {
  id: 'ecc-theory',
  num: '03.1',
  tag: 'Elliptic Curves',
  tagClass: 'ecc',
  category: 'Theory',
  title: 'Elliptic Curve Cryptography — Fundamentals',
  desc: 'Understand point addition, doubling, and the geometry behind finite-field elliptic curve groups.',
  concepts: ['Short Weierstrass Equation', 'Group Law', 'Point Addition & Doubling', 'ECDLP'],
  topbarTitle: 'Chapter 03.1 — ECC Fundamentals',

  blocks: [
    {
      kind: 'text',
      heading: 'h2',
      title: '1. What is an Elliptic Curve?',
      html: `
        <p class="ex-p">
          Elliptic Curve Cryptography (ECC) relies on points $(x,y)$ satisfying the <strong>short Weierstrass equation</strong>:
        </p>
        <div class="ex-data-block" style="text-align: center; margin: 10px 0;">
          <code style="font-size: 1.2rem; color: var(--accent, #00e5aa);">y² = x³ + ax + b (mod p)</code>
        </div>
        <p class="ex-p">
          Unlike multiplicative finite fields where index calculus attacks force key sizes to be thousands of bits long, elliptic curve groups maintain full discrete log security with much smaller parameters (e.g., 256 bits).
        </p>`
    },
    {
      kind: 'text',
      heading: 'h2',
      title: '2. Geometric Point Addition Simulation',
      html: `
        <p class="ex-p">
          Explore geometric point addition over $\\mathbb{R}$ on $y^2 = x^3 - 3x + 3$. 
          Click <strong>Step Addition</strong> to visualize the secant line, the 3rd point of intersection ($-R$), and its reflection ($R = P + Q$).
        </p>
        <div class="ecc-sim-container" style="background:#090d10; border:1px solid #1e2832; padding:15px; border-radius:8px; margin: 15px 0;">
          <canvas id="eccCanvas" width="550" height="320" style="width:100%; height:auto; background:#060809; border-radius:4px; border:1px solid #1a232d;"></canvas>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button id="simStepBtn" class="ex-btn" style="padding:6px 14px;">Step Addition</button>
            <button id="simResetBtn" class="ex-btn" style="padding:6px 14px; background:#2a1b1b; color:#ff6b6b; border-color:#5a2b2b;">Reset</button>
            <span id="simStatus" style="align-self:center; font-family:monospace; font-size:0.85rem; color:#8a99a8; margin-left:auto;">State: Ready</span>
          </div>
        </div>`
    },
    {
      kind: 'text',
      heading: 'h2',
      title: '3. Algebraic Point Operations',
      html: `
        <p class="ex-p">In a finite field $\\mathbb{F}_p$, point addition $P + Q = (x_3, y_3)$ is calculated using the modular slope $\\lambda$:</p>
        <ul>
          <li><strong>Point Addition ($P \\neq Q$):</strong> $\\lambda = \\frac{y_2 - y_1}{x_2 - x_1} \\pmod p$</li>
          <li><strong>Point Doubling ($P = Q$):</strong> $\\lambda = \\frac{3x_1^2 + a}{2y_1} \\pmod p$</li>
        </ul>
        <p class="ex-p">Coordinates of $R = P + Q$ are then:</p>
        <div class="ex-data-block">
          <div class="ex-data-row"><span>x₃</span><span class="mono">λ² - x₁ - x₂ (mod p)</span></div>
          <div class="ex-data-row"><span>y₃</span><span class="mono">λ(x₁ - x₃) - y₁ (mod p)</span></div>
        </div>`
    }
  ],

  /**
   * Optional mount lifecycle hook to initialize the interactive simulation
   */
  onMount(container) {
    const canvas = container.querySelector('#eccCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const stepBtn = container.querySelector('#simStepBtn');
    const resetBtn = container.querySelector('#simResetBtn');
    const status = container.querySelector('#simStatus');

    let state = 0; // 0: Points P & Q, 1: Secant Line + -R, 2: Reflection R = P + Q

    // Curve parameters: y^2 = x^3 - 3x + 3
    const a = -3, b = 3;

    // Canvas scaling constants
    const scale = 30;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const toX = (x) => cx + x * scale;
    const toY = (y) => cy - y * scale;

    const P = { x: -1.5, y: Math.sqrt(Math.pow(-1.5, 3) + a * (-1.5) + b) };
    const Q = { x: 0.75, y: Math.sqrt(Math.pow(0.75, 3) + a * (0.75) + b) };

    const lam = (Q.y - P.y) / (Q.x - P.x);
    const Rx = lam * lam - P.x - Q.x;
    const RnegY = lam * (P.x - Rx) - P.y;
    const Ry = -RnegY;

    function drawBase() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Axes
      ctx.strokeStyle = '#1a2530';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height);
      ctx.stroke();

      // Draw Curve y^2 = x^3 - 3x + 3
      ctx.strokeStyle = '#00e5aa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;

      for (let px = -cx / scale; px < cx / scale; px += 0.02) {
        const val = px * px * px + a * px + b;
        if (val >= 0) {
          const py = Math.sqrt(val);
          if (!started) {
            ctx.moveTo(toX(px), toY(py));
            started = true;
          } else {
            ctx.lineTo(toX(px), toY(py));
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();

      // Bottom half of curve
      started = false;
      ctx.beginPath();
      for (let px = -cx / scale; px < cx / scale; px += 0.02) {
        const val = px * px * px + a * px + b;
        if (val >= 0) {
          const py = -Math.sqrt(val);
          if (!started) {
            ctx.moveTo(toX(px), toY(py));
            started = true;
          } else {
            ctx.lineTo(toX(px), toY(py));
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();

      // Draw P & Q
      drawPoint(P.x, P.y, '#3b82f6', 'P');
      drawPoint(Q.x, Q.y, '#3b82f6', 'Q');
    }

    function drawPoint(x, y, color, label) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toX(x), toY(y), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d0dbe5';
      ctx.font = '12px monospace';
      ctx.fillText(label, toX(x) + 8, toY(y) - 8);
    }

    function update() {
      drawBase();

      if (state >= 1) {
        // Secant Line
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toX(-2.5), toY(lam * (-2.5 - P.x) + P.y));
        ctx.lineTo(toX(3.5), toY(lam * (3.5 - P.x) + P.y));
        ctx.stroke();
        ctx.setLineDash([]);

        // -R point
        drawPoint(Rx, RnegY, '#ec4899', '-R');
        status.textContent = 'State: Secant Line & Intercept (-R)';
      }

      if (state >= 2) {
        // Reflection vertical line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(toX(Rx), toY(RnegY));
        ctx.lineTo(toX(Rx), toY(Ry));
        ctx.stroke();
        ctx.setLineDash([]);

        // R = P + Q
        drawPoint(Rx, Ry, '#22c55e', 'R = P + Q');
        status.textContent = 'State: Reflection (R = P + Q)';
      }

      if (state === 0) {
        status.textContent = 'State: Initial Points P & Q';
      }
    }

    stepBtn?.addEventListener('click', () => {
      state = (state + 1) % 3;
      update();
    });

    resetBtn?.addEventListener('click', () => {
      state = 0;
      update();
    });

    update();
  }
};

export default eccTheory;
