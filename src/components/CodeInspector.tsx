import React, { useState } from 'react';
import { FileCode, Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DEMO_SOURCE_FILES, SourceFile } from '../mock/sourceFiles';

interface CodeInspectorProps {
  onAskQuestion: (question: string) => void;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({ onAskQuestion }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(DEMO_SOURCE_FILES[0].path);
  const selectedFile = DEMO_SOURCE_FILES.find((f) => f.path === selectedFilePath) || DEMO_SOURCE_FILES[0];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">
              Interactive Source Inspector (“Why Was This Code Written?”)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Browse source code and click any annotated line with a <span className="text-emerald-400 font-semibold">Why?</span> badge to discover its historical reasoning.
          </p>
        </div>

        {/* File Selector Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {DEMO_SOURCE_FILES.map((file) => (
            <button
              key={file.path}
              onClick={() => setSelectedFilePath(file.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                selectedFilePath === file.path
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Code Viewer */}
        <div className="lg:col-span-2 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">{selectedFile.path}</span>
            <span className="uppercase text-[10px] tracking-wider text-zinc-500">{selectedFile.language}</span>
          </div>

          <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto space-y-0.5">
            {selectedFile.lines.map((line, idx) => {
              const lineNum = idx + 1;
              const annotation = selectedFile.annotations.find((a) => a.lineNumber === lineNum);

              return (
                <div
                  key={lineNum}
                  className={`group flex items-start space-x-3 px-2 py-0.5 rounded transition-colors ${
                    annotation
                      ? 'bg-emerald-950/40 border-l-2 border-emerald-400'
                      : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <span className="w-8 shrink-0 select-none text-right text-zinc-600 text-[11px]">
                    {lineNum}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span
                      className={`break-all ${
                        annotation
                          ? 'text-emerald-200 font-semibold'
                          : line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')
                          ? 'text-zinc-500 italic'
                          : line.includes('class') || line.includes('function') || line.includes('const')
                          ? 'text-indigo-300'
                          : 'text-zinc-300'
                      }`}
                    >
                      {line || '\u00A0'}
                    </span>

                    {annotation && (
                      <button
                        onClick={() => onAskQuestion(annotation.question)}
                        className="ml-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-[10px] font-bold shadow transition-all cursor-pointer shrink-0"
                        title="Ask CodeWhy AI why this line exists"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why?</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detected Questions & Annotations for this File */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Historical Decision Inquiries</span>
          </div>

          {selectedFile.annotations.map((ann) => (
            <div
              key={ann.lineNumber}
              className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Line {ann.lineNumber}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Demo annotation</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-200 leading-snug">
                  {ann.question}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {ann.explanationExcerpt}
                </p>
              </div>

              <button
                onClick={() => onAskQuestion(ann.question)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <span>Investigate in CodeWhy AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Curated Demo Trace</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              These sample line annotations are curated for Demo Mode. Live source code and Neo4j graph persistence are not part of this prototype.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
