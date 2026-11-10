import React, { useState } from "react";
import { useArchBench } from "../../context/ArchBenchContext.js";
import { X, Copy, Check, Download, FileText } from "lucide-react";

export const ExportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { evaluation, activeAltId } = useArchBench();
  const [activeFormat, setActiveFormat] = useState<"markdown" | "json" | "mermaid">("markdown");
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const markdownContent = evaluation?.markdownReport || "# No report generated";
  const jsonContent = evaluation?.jsonReport || "{}";
  const mermaidContent = evaluation?.graphs?.[activeAltId]?.mermaid || "";

  const contentToDisplay =
    activeFormat === "markdown"
      ? markdownContent
      : activeFormat === "json"
      ? jsonContent
      : mermaidContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFormat === "json" ? "json" : activeFormat === "mermaid" ? "mmd" : "md";
    const blob = new Blob([contentToDisplay], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archbench-evaluation.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="chrome-chassis border border-zinc-650 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700/80 bg-[#1f2229]">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-zinc-300" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-zinc-100">
              // BLUEPRINT EXPORT SPECIFICATION [DRAFT-EX-01]
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#17191e] border-b border-zinc-800 text-xs font-mono">
          <div className="flex space-x-1.5">
            <button
              onClick={() => setActiveFormat("markdown")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeFormat === "markdown"
                  ? "bg-zinc-700 text-zinc-100 font-bold border border-zinc-500 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              Executive Markdown
            </button>
            <button
              onClick={() => setActiveFormat("json")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeFormat === "json"
                  ? "bg-zinc-700 text-zinc-100 font-bold border border-zinc-500 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              JSON Schema v1
            </button>
            <button
              onClick={() => setActiveFormat("mermaid")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeFormat === "mermaid"
                  ? "bg-zinc-700 text-zinc-100 font-bold border border-zinc-500 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              Mermaid Diagram
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="chrome-button text-xs px-2.5 py-1 rounded flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? "[COPIED]" : "Copy"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="chrome-button-accent text-xs px-3 py-1 rounded flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-4 flex-1 overflow-y-auto bg-[#101215] font-mono text-xs text-zinc-300 whitespace-pre-wrap select-text border-t border-zinc-800">
          {contentToDisplay}
        </div>
      </div>
    </div>
  );
};
