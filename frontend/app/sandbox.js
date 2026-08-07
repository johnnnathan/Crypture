// sandbox.js — Canvas engine: nodes, wires, execution, inspector
import { Inspector } from './inspector.js';
import { log } from './logger.js';

// ── Op metadata ─────────────────────────────────────────────────────────────
const OP_META = {
  Xor:      { label: 'XOR',      colorClass: 'xor',     inputs: ['A','B'],              outputs: ['Out'] },
  SBox:     { label: 'S-Box',    colorClass: 'sbox',    inputs: ['In'],                 outputs: ['Out'] },
  Caesar:   { label: 'Caesar',   colorClass: 'caesar',  inputs: ['Data','Key'],         outputs: ['Out'] },
  Vigenere: { label: 'Vigenere', colorClass: 'vigenere',inputs: ['Data','Key','Len'],   outputs: ['Out'] },
};

// Default S-Box (AES SubBytes)
const AES_SBOX = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
];

// ── Sandbox class ────────────────────────────────────────────────────────────
export class Sandbox {
  constructor(circuit) {
    this.circuit     = circuit;
    this.nodes       = [];       // { id, opType, el, portEls: {portId: domEl}, x, y }
    this.wires       = [];       // { id, fromPort, toPort, path }
    this.stepCount   = 0;
    this.wiringFrom  = null;     // { portId, el, isOutput }
    this.selectedNode = null;

    this.canvasEl  = document.getElementById('canvas-area');
    this.wireSvg   = document.getElementById('wire-layer');
    this.inspector = new Inspector(circuit, this);

    this._wirePreview = null;   // SVG path for live preview
    this._nodeIdCounter = 0;

    this._initPaletteDrag();
    this._initCanvasDrop();
    this._initControls();
    this._initMouseMove();
  }

  // ── Palette drag ──────────────────────────────────────────────────────────
  _initPaletteDrag() {
    document.querySelectorAll('.palette-node').forEach(el => {
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('op', el.dataset.op);
        e.dataTransfer.setData('width', el.dataset.width);
      });
    });
  }

  // ── Canvas drop ───────────────────────────────────────────────────────────
  _initCanvasDrop() {
    this.canvasEl.addEventListener('dragover', e => e.preventDefault());
    this.canvasEl.addEventListener('drop', e => {
      e.preventDefault();
      const op    = e.dataTransfer.getData('op');
      const width = parseInt(e.dataTransfer.getData('width') || '8');
      if (!op) return;

      const rect = this.canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left - 80;
      const y = e.clientY - rect.top  - 40;

      this._placeNode(op, width, x, y);
    });
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  _initControls() {
    document.getElementById('btn-step').addEventListener('click', () => this.step());
    document.getElementById('btn-run-all').addEventListener('click', () => this.runAll());
    document.getElementById('btn-randomize').addEventListener('click', () => this.randomize());
    document.getElementById('btn-clear-circuit').addEventListener('click', () => this.clear());
    document.getElementById('btn-cancel-wire').addEventListener('click', () => this._cancelWiring());

    document.getElementById('btn-view-json').addEventListener('click', () => {
      document.getElementById('json-content').textContent = this.circuit.to_json();
      document.getElementById('json-modal').style.display = 'flex';
    });
    document.getElementById('btn-close-json').addEventListener('click', () => {
      document.getElementById('json-modal').style.display = 'none';
    });

    // Click on canvas background — deselect
    this.canvasEl.addEventListener('click', e => {
      if (e.target === this.canvasEl || e.target.classList.contains('canvas-empty-hint') || e.target.classList.contains('ceh-icon') || e.target.classList.contains('ceh-text')) {
        this._cancelWiring();
        this._selectNode(null);
      }
    });
  }

  // ── Mouse move — wire preview ──────────────────────────────────────────────
  _initMouseMove() {
    this.canvasEl.addEventListener('mousemove', e => {
      if (!this.wiringFrom) return;

      const rect = this.canvasEl.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const src = this._getPortCenter(this.wiringFrom.portId, this.wiringFrom.el);

      if (!this._wirePreview) {
        this._wirePreview = document.createElementNS('http://www.w3.org/2000/svg','path');
        this._wirePreview.classList.add('wire-preview');
        this.wireSvg.appendChild(this._wirePreview);
      }
      this._wirePreview.setAttribute('d', this._makePath(src.x, src.y, mx, my));
    });
  }

  // ── Place node ────────────────────────────────────────────────────────────
  _placeNode(opType, width, x, y) {
    const meta = OP_META[opType];
    if (!meta) return;

    // Determine JS op argument
    let opArg;
    if (opType === 'SBox') {
      opArg = { SBox: Array.from(AES_SBOX) };
    } else if (opType === 'Xor') {
      opArg = { Xor: null };
    } else if (opType === 'Caesar') {
      opArg = { Caesar: null };
    } else {
      opArg = { Vigenere: null };
    }

    const nodeIdx = this.nodes.length;
    const name    = `${meta.label}_${++this._nodeIdCounter}`;
    this.circuit.add_node(name, opArg, width);

    // Circuit gives us consecutive port IDs — we need to track which node
    // maps to which ports.  The circuit JSON is the ground truth.
    const json   = JSON.parse(this.circuit.to_json());
    const cNode  = json.nodes[json.nodes.length - 1];
    const nodeId = cNode.id;

    const inputPortIds  = cNode.inputs;
    const outputPortIds = cNode.outputs;

    const el = this._buildNodeEl(name, opType, meta, inputPortIds, outputPortIds, nodeId);
    el.style.left = Math.max(0, x) + 'px';
    el.style.top  = Math.max(0, y) + 'px';
    this.canvasEl.appendChild(el);

    const portEls = {};
    el.querySelectorAll('[data-port-id]').forEach(p => {
      portEls[parseInt(p.dataset.portId)] = p;
    });

    this.nodes.push({ id: nodeId, name, opType, el, portEls, x, y });

    this._initNodeDrag(el, nodeId);
    this._initPortClicks(el, nodeId);

    log(`Added ${name} (node ${nodeId})`, 'info');
    this._hideEmptyHint();
    document.getElementById('canvas-empty-hint').classList.add('hidden');

    return nodeId;
  }

  // ── Build node DOM ────────────────────────────────────────────────────────
  _buildNodeEl(name, opType, meta, inputIds, outputIds, nodeId) {
    const el = document.createElement('div');
    el.classList.add('cn-node');
    el.dataset.nodeId = nodeId;

    // Header
    const header = document.createElement('div');
    header.classList.add('cn-header');

    const bar = document.createElement('div');
    bar.classList.add('cn-type-bar', meta.colorClass);

    const label = document.createElement('div');
    label.classList.add('cn-label');
    label.textContent = name;

    const delBtn = document.createElement('button');
    delBtn.classList.add('cn-delete');
    delBtn.innerHTML = '×';
    delBtn.title = 'Remove node';
    delBtn.addEventListener('click', e => {
      e.stopPropagation();
      this._removeNode(nodeId);
    });

    header.append(bar, label, delBtn);

    // Body — ports
    const body  = document.createElement('div');
    body.classList.add('cn-body');
    const ports = document.createElement('div');
    ports.classList.add('cn-ports');

// Input ports
    inputIds.forEach((pId, i) => {
      const row = document.createElement('div');
      row.classList.add('cn-port-row');

      const dot = document.createElement('div');
      dot.classList.add('cn-port');
      dot.dataset.portId   = pId;
      dot.dataset.isOutput = 'false';
      dot.title = `Port ${pId}`;

      // Hover to show value
      dot.addEventListener('mouseenter', () => {
        try {
          const data = this.circuit.pull_data(pId);
          if (data && data.length > 0) {
            const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
            dot.title = `Value: ${hex}`;
          }
        } catch (e) { dot.title = `Port ${pId}`; }
      });
      dot.addEventListener('mouseleave', () => {
        dot.title = `Port ${pId}`;
      });

      const lbl = document.createElement('span');
      lbl.classList.add('cn-port-label');
      lbl.textContent = meta.inputs[i] || `in${i}`;

      row.append(dot, lbl);
      ports.appendChild(row);
    });

    // Separator
    if (inputIds.length && outputIds.length) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:4px;border-top:1px solid var(--border-dim);margin:4px 0;';
      ports.appendChild(sep);
    }

    // Output ports
      outputIds.forEach((pId, i) => {
      const row = document.createElement('div');
      row.classList.add('cn-port-row', 'out');

      const lbl = document.createElement('span');
      lbl.classList.add('cn-port-label');
      lbl.textContent = meta.outputs[i] || `out${i}`;

      const dot = document.createElement('div');
      dot.classList.add('cn-port');
      dot.dataset.portId   = pId;
      dot.dataset.isOutput = 'true';
      dot.title = `Port ${pId}`;

      // Hover to show value
      dot.addEventListener('mouseenter', () => {
        try {
          const data = this.circuit.pull_data(pId);
          if (data && data.length > 0) {
            const hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' ');
            dot.title = `Value: ${hex}`;
          }
        } catch (e) { dot.title = `Port ${pId}`; }
      });
      dot.addEventListener('mouseleave', () => {
        dot.title = `Port ${pId}`;
      });

      row.append(lbl, dot);
      ports.appendChild(row);
    });

    body.appendChild(ports);
    el.append(header, body);
    return el;
  }

  // ── Node drag ─────────────────────────────────────────────────────────────
  _initNodeDrag(el, nodeId) {
    let dragging = false, ox = 0, oy = 0;

    el.addEventListener('mousedown', e => {
      if (e.target.classList.contains('cn-port') ||
          e.target.classList.contains('cn-delete')) return;

      e.stopPropagation();
      dragging = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;

      this._selectNode(nodeId);

      const onMove = e => {
        if (!dragging) return;
        const rect = this.canvasEl.getBoundingClientRect();
        const nx = e.clientX - rect.left - ox;
        const ny = e.clientY - rect.top  - oy;
        el.style.left = Math.max(0, nx) + 'px';
        el.style.top  = Math.max(0, ny) + 'px';

        // Update node record
        const n = this.nodes.find(n => n.id === nodeId);
        if (n) { n.x = nx; n.y = ny; }

        this._redrawWires();
      };
      const onUp = () => {
        dragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  // ── Port click — wiring ───────────────────────────────────────────────────
  _initPortClicks(el, nodeId) {
    el.querySelectorAll('.cn-port').forEach(portEl => {
      portEl.addEventListener('click', e => {
        e.stopPropagation();
        const portId   = parseInt(portEl.dataset.portId);
        const isOutput = portEl.dataset.isOutput === 'true';

        if (!this.wiringFrom) {
          // Start wiring from an output port
          if (!isOutput) {
            log('Start wiring from an output port', 'warn');
            return;
          }
          this.wiringFrom = { portId, el: portEl, nodeId, isOutput };
          portEl.classList.add('wiring-source');
          document.getElementById('btn-cancel-wire').style.display = 'block';
          document.getElementById('wire-mode-hint').textContent = 'Click an input port to connect';
          log(`Wiring from port ${portId}...`);
        } else {
          // Complete wiring to an input port
          if (isOutput) {
            log('Connect to an input port', 'warn');
            return;
          }
          if (this.wiringFrom.nodeId === nodeId) {
            log('Cannot wire a node to itself', 'warn');
            this._cancelWiring();
            return;
          }

          this._addWire(this.wiringFrom.portId, portId);
          this._cancelWiring();
        }
      });
    });
  }

  // ── Add wire ──────────────────────────────────────────────────────────────
  _addWire(fromPort, toPort) {
    // Check duplicate
    if (this.wires.find(w => w.fromPort === fromPort && w.toPort === toPort)) {
      log('Wire already exists', 'warn');
      return;
    }

    this.circuit.add_connection(fromPort, toPort);

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg','path');
    pathEl.classList.add('wire');
    pathEl.dataset.from = fromPort;
    pathEl.dataset.to   = toPort;
    pathEl.addEventListener('click', () => this._removeWire(fromPort, toPort));
    this.wireSvg.appendChild(pathEl);

    const wire = { fromPort, toPort, path: pathEl };
    this.wires.push(wire);

    // Mark ports as connected
    this._markPortConnected(fromPort, true);
    this._markPortConnected(toPort, true);

    this._redrawWire(wire);
    log(`Connected port ${fromPort} → ${toPort}`, 'info');
  }

  _removeWire(fromPort, toPort) {
    const idx = this.wires.findIndex(w => w.fromPort === fromPort && w.toPort === toPort);
    if (idx === -1) return;

    this.wires[idx].path.remove();
    this.wires.splice(idx, 1);

    // Update circuit (not exposed directly, but we can rebuild... for now just track locally)
    // If your CircuitWasm exposes remove_connection, call it here:
    // this.circuit.remove_connection(fromPort, toPort);

    this._markPortConnected(fromPort, this.wires.some(w => w.fromPort === fromPort));
    this._markPortConnected(toPort,   this.wires.some(w => w.toPort === toPort));

    log(`Removed wire ${fromPort} → ${toPort}`);
  }

  _markPortConnected(portId, connected) {
    this.nodes.forEach(n => {
      const el = n.portEls[portId];
      if (el) el.classList.toggle('connected', connected);
    });
  }

  // ── Remove node ───────────────────────────────────────────────────────────
  _removeNode(nodeId) {
    const idx = this.nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return;

    const n = this.nodes[idx];

    // Remove all wires connected to this node's ports
    const allPortIds = Object.keys(n.portEls).map(Number);
    this.wires = this.wires.filter(w => {
      if (allPortIds.includes(w.fromPort) || allPortIds.includes(w.toPort)) {
        w.path.remove();
        return false;
      }
      return true;
    });

    n.el.remove();
    this.nodes.splice(idx, 1);

    if (this.selectedNode === nodeId) this._selectNode(null);

    log(`Removed node ${n.name}`);

    if (this.nodes.length === 0) {
      document.getElementById('canvas-empty-hint').classList.remove('hidden');
    }
  }

  // ── Select node ───────────────────────────────────────────────────────────
  _selectNode(nodeId) {
    this.nodes.forEach(n => n.el.classList.remove('selected'));
    this.selectedNode = nodeId;
    if (nodeId !== null) {
      const n = this.nodes.find(n => n.id === nodeId);
      if (n) {
        n.el.classList.add('selected');
        this.inspector.inspect(nodeId, n);
      }
    } else {
      this.inspector.clear();
    }
  }

  // ── Cancel wiring ─────────────────────────────────────────────────────────
  _cancelWiring() {
    if (this.wiringFrom) {
      this.wiringFrom.el.classList.remove('wiring-source');
      this.wiringFrom = null;
    }
    if (this._wirePreview) {
      this._wirePreview.remove();
      this._wirePreview = null;
    }
    document.getElementById('btn-cancel-wire').style.display = 'none';
    document.getElementById('wire-mode-hint').textContent = 'Click a port to start wiring';
  }

  // ── Wire path geometry ────────────────────────────────────────────────────
  _getPortCenter(portId, portEl) {
    const canvasRect = this.canvasEl.getBoundingClientRect();
    const portRect   = portEl.getBoundingClientRect();
    return {
      x: portRect.left + portRect.width  / 2 - canvasRect.left,
      y: portRect.top  + portRect.height / 2 - canvasRect.top,
    };
  }

  _makePath(x1, y1, x2, y2) {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  }

  _redrawWire(wire) {
    const fromEl = this._findPortEl(wire.fromPort);
    const toEl   = this._findPortEl(wire.toPort);
    if (!fromEl || !toEl) return;

    const a = this._getPortCenter(wire.fromPort, fromEl);
    const b = this._getPortCenter(wire.toPort,   toEl);
    wire.path.setAttribute('d', this._makePath(a.x, a.y, b.x, b.y));
  }

  _redrawWires() {
    this.wires.forEach(w => this._redrawWire(w));
    if (this._wirePreview && this.wiringFrom) {
      // Preview is handled by mousemove
    }
  }

  _findPortEl(portId) {
    for (const n of this.nodes) {
      if (n.portEls[portId]) return n.portEls[portId];
    }
    return null;
  }

  // ── Execution ─────────────────────────────────────────────────────────────
  step() {
    if (this.nodes.length === 0) {
      log('No nodes to evaluate', 'warn');
      return;
    }
    this.circuit.iterate();
    this.stepCount++;
    document.getElementById('tb-step-count').textContent = this.stepCount;
    log(`Step ${this.stepCount} — evaluated ${this.nodes.length} node(s)`, 'info');

    // Flash evaluated nodes
    this.nodes.forEach(n => {
      n.el.classList.add('evaluating');
      setTimeout(() => n.el.classList.remove('evaluating'), 400);
    });

    // Mark active wires
    this.wires.forEach(w => w.path.classList.add('active'));

    // Refresh inspector
    if (this.selectedNode !== null) {
      const n = this.nodes.find(n => n.id === this.selectedNode);
      if (n) this.inspector.inspect(this.selectedNode, n);
    }
  }

  runAll() {
    this.circuit.run_rounds(3);
    this.stepCount += 3;
    document.getElementById('tb-step-count').textContent = this.stepCount;
    log('Ran 3 rounds of evaluation', 'info');
    this.wires.forEach(w => w.path.classList.add('active'));
    if (this.selectedNode !== null) {
      const n = this.nodes.find(n => n.id === this.selectedNode);
      if (n) this.inspector.inspect(this.selectedNode, n);
    }
  }

  randomize() {
    if (this.nodes.length === 0) {
      log('Add nodes first', 'warn');
      return;
    }
    // Randomize all input ports (those with no incoming wire)
    const connectedInputs = new Set(this.wires.map(w => w.toPort));

    this.nodes.forEach(n => {
      Object.entries(n.portEls).forEach(([portId, el]) => {
        const pid = parseInt(portId);
        const isInput = el.dataset.isOutput === 'false';
        if (isInput && !connectedInputs.has(pid)) {
          // Generate random bytes via pull_data with random set
          const bytes = crypto.getRandomValues(new Uint8Array(1));
          this.circuit.set_port_data(pid, bytes);
        }
      });
    });

    log('Randomized free input ports', 'info');
    if (this.selectedNode !== null) {
      const n = this.nodes.find(n => n.id === this.selectedNode);
      if (n) this.inspector.inspect(this.selectedNode, n);
    }
  }

  clear() {
    // Remove all node DOM elements and wires
    this.nodes.forEach(n => n.el.remove());
    this.wires.forEach(w => w.path.remove());
    this.nodes = [];
    this.wires = [];
    this._cancelWiring();
    this._selectNode(null);
    this.stepCount = 0;
    document.getElementById('tb-step-count').textContent = '0';
    document.getElementById('canvas-empty-hint').classList.remove('hidden');
    log('Canvas cleared');
  }

  _hideEmptyHint() {
    document.getElementById('canvas-empty-hint').classList.add('hidden');
  }
}