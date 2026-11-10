import React, { useState } from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { Play, AlertTriangle, CheckCircle2, Code, FileText } from "lucide-react";

export const SpecEditorView: React.FC = () => {
  const { yamlContent, setYamlContent, reEvaluate, evaluation, loading, error } = useArchBench();
  const [dirty, setDirty] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setYamlContent(e.target.value);
    setDirty(true);
  };

  const handleReEvaluate = async () => {
    setSaveStatus("Evaluating...");
    await reEvaluate();
    setDirty(false);
    setSaveStatus("Evaluation updated successfully!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const validationErrors = evaluation?.errors || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-4 overflow-y-auto h-full flex flex-col text-zinc-200">
      {/* Header Chassis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 chrome-chassis p-4 rounded-xl border border-zinc-700/80 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                // SPEC-EDITOR
              </span>
              <h2 className="text-sm font-mono font-bold text-zinc-100 uppercase tracking-wider">
                Live ArchSpec YAML Declaration
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              Edit the ArchSpec YAML declaration directly with real-time graph re-evaluation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveStatus && (
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center mr-2">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {saveStatus}
            </span>
          )}
          <button
            onClick={handleReEvaluate}
            disabled={loading}
            className="chrome-button-accent text-xs px-3.5 py-2 rounded-lg flex items-center space-x-2 font-mono disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? "EVALUATING..." : "RE-EVALUATE SPEC"}</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Bar */}
      {(!evaluation?.valid || error) && (
        <div className="bg-[#1f1315] border border-red-800/80 p-4 rounded-xl text-xs text-red-200 space-y-1.5 shadow-xl font-mono">
          <div className="font-bold flex items-center text-red-400">
            <AlertTriangle className="w-4 h-4 mr-2" /> [SCHEMA VALIDATION ERRORS]
          </div>
          {error && <p>{error}</p>}
          {validationErrors.map((err, i) => (
            <p key={i} className="text-[11px] text-red-300">
              • {err.path || "schema"}: {err.message}
            </p>
          ))}
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 min-h-[520px] border border-zinc-700/80 rounded-xl overflow-hidden paper-card drafting-corners flex flex-col shadow-2xl">
        <div className="bg-[#181a1f] px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-200 font-bold">// ARCHSPEC.YAML [ACTIVE]</span>
          </div>
          <span className={dirty ? "text-amber-400 font-semibold" : "text-emerald-400"}>
            {dirty ? "[● UNSAVED CHANGES]" : "[✓ SYNCED WITH ENGINE]"}
          </span>
        </div>
        <textarea
          value={yamlContent}
          onChange={handleTextChange}
          spellCheck={false}
          className="flex-1 w-full bg-[#101215] text-zinc-200 font-mono text-xs p-5 resize-none focus:outline-none leading-relaxed tracking-wide select-text border-0"
          placeholder="# Enter ArchSpec YAML declaration..."
        />
      </div>
    </div>
  );
};
