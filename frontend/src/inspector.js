// inspector.js — Right panel: port data display, hex/binary view, set data
import { log } from './logger.js';

export class Inspector {
  constructor(circuit, sandbox) {
    this.circuit  = circuit;
    this.sandbox  = sandbox;
    this.el       = document.getElementById('inspector-content');
  }

  clear() {
    this.el.innerHTML = '<div class="inspector-empty">Select a node on the canvas to inspect its port values.</div>';
  }

  inspect(nodeId, nodeRecord) {
    const json   = JSON.parse(this.circuit.to_json());
    const cNode  = json.nodes.find(n => n.id === nodeId);
    if (!cNode) { this.clear(); return; }

    const meta = {
      Xor:      { label: 'XOR Gate',      color: 'var(--xor)',     inputLabels: ['A','B'],             outputLabels: ['Out'] },
      SBox:     { label: 'S-Box',          color: 'var(--sbox)',    inputLabels: ['In'],                outputLabels: ['Out'] },
      Caesar:   { label: 'Caesar Shift',   color: 'var(--caesar)',  inputLabels: ['Data','Key'],        outputLabels: ['Out'] },
      Vigenere: { label: 'Vigenere Cipher',color: 'var(--vig)',     inputLabels: ['Data','Key','Len'],  outputLabels: ['Out'] },
    };

    const opKey = typeof cNode.op_type === 'string' ? cNode.op_type : Object.keys(cNode.op_type)[0];
    const m     = meta[opKey] || { label: opKey, color: 'var(--text-dim)', inputLabels: [], outputLabels: [] };

    let html = `
      <div class="inspector-node-title">${cNode.name}</div>
      <div class="inspector-node-type" style="color:${m.color}">${m.label}</div>
    `;

    // Input ports
    if (cNode.inputs.length) {
      html += `<div class="inspector-port-group">
        <div class="inspector-port-group-label">Inputs</div>`;
      cNode.inputs.forEach((pId, i) => {
        const data = this.circuit.pull_data(pId);
        html += this._portHtml(pId, m.inputLabels[i] || `in${i}`, data, true);
      });
      html += `</div>`;
    }

    // Output ports
    if (cNode.outputs.length) {
      html += `<div class="inspector-port-group">
        <div class="inspector-port-group-label">Outputs</div>`;
      cNode.outputs.forEach((pId, i) => {
        const data = this.circuit.pull_data(pId);
        html += this._portHtml(pId, m.outputLabels[i] || `out${i}`, data, false);
      });
      html += `</div>`;
    }

    this.el.innerHTML = html;

    // Wire up "Set" buttons
    this.el.querySelectorAll('.btn-set-port').forEach(btn => {
      btn.addEventListener('click', () => {
        const portId = parseInt(btn.dataset.portId);
        const input  = btn.previousElementSibling;
        const hexStr = input.value.trim().replace(/\s/g,'');
        if (!hexStr) return;

        // Parse hex string into bytes
        const bytes = [];
        for (let i = 0; i < hexStr.length; i += 2) {
          bytes.push(parseInt(hexStr.slice(i, i + 2), 16));
        }
        const arr = new Uint8Array(bytes);
        this.circuit.set_port_data(portId, arr);
        log(`Set port ${portId} = 0x${hexStr.toUpperCase()}`, 'info');

        // Refresh
        if (this.sandbox.selectedNode !== null) {
          const n = this.sandbox.nodes.find(n => n.id === this.sandbox.selectedNode);
          if (n) this.inspect(this.sandbox.selectedNode, n);
        }
      });
    });
  }

  _portHtml(portId, label, data, isInput) {
    const hexStr = this._toHex(data);
    const binStr = this._toBin(data);
    const inputHtml = isInput ? `
      <div class="inspector-set-data">
        <input type="text" placeholder="hex e.g. 0a1b2c" maxlength="32" />
        <button class="tb-btn btn-set-port" data-port-id="${portId}">Set</button>
      </div>` : '';

    return `
      <div class="inspector-port">
        <div class="inspector-port-name">Port ${portId} — ${label}</div>
        <div class="inspector-port-hex">${hexStr || '00'}</div>
        <div class="inspector-port-bin">${binStr || '00000000'}</div>
        ${inputHtml}
      </div>`;
  }

  _toHex(data) {
    if (!data || !data.length) return '00';
    return Array.from(data).map(b => b.toString(16).padStart(2,'0')).join(' ');
  }

  _toBin(data) {
    if (!data || !data.length) return '00000000';
    return Array.from(data).map(b => b.toString(2).padStart(8,'0')).join(' ');
  }
}
