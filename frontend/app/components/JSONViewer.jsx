export default function JSONViewer({ circuit }) {
  return (
    <div className="p-6 h-full overflow-auto">
      <pre className="text-sm bg-[#1e1e26] p-6 rounded-lg border border-slate-800 text-blue-300">
        {circuit.to_json()}
      </pre>
    </div>
  );
}