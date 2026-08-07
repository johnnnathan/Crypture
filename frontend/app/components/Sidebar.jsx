export default function Sidebar({ circuit, setActiveView, activeView, onUpdate }) {
  const addNode = (type) => {
    const name = `${type}_${Math.floor(Math.random() * 100)}`;
    // Note: React-to-Rust enum mapping
    const op = type === 'Vigenere' ? { Vigenere: null } : { Xor: null };
    circuit.add_node(name, op, 40);
    onUpdate();
  };

  return (
    <aside className="w-64 border-r border-slate-800 flex flex-col p-4 bg-[#16161a]">
      <h1 className="text-xl font-bold text-white mb-8 tracking-tight">Crypture <span className="text-blue-500">v3</span></h1>
      
      <div className="space-y-1 mb-10">
        <label className="text-xs font-semibold text-slate-500 uppercase px-2">Views</label>
        <button 
          onClick={() => setActiveView('canvas')}
          className={`w-full text-left px-3 py-2 rounded-md transition ${activeView === 'canvas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
        >
          Visual Canvas
        </button>
        <button 
          onClick={() => setActiveView('json')}
          className={`w-full text-left px-3 py-2 rounded-md transition ${activeView === 'json' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
        >
          Circuit JSON
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase px-2">Add Nodes</label>
        <button onClick={() => addNode('Xor')} className="w-full bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-700 text-sm">Add XOR</button>
        <button onClick={() => addNode('Vigenere')} className="w-full bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-700 text-sm">Add Vigenere</button>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <button 
          onClick={() => { circuit.iterate(); onUpdate(); }}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-900/20"
        >
          RUN ITERATION
        </button>
      </div>
    </aside>
  );
}