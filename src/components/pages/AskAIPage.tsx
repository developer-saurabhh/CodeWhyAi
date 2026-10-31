import React from 'react';
import { Sparkles, HelpCircle, Network, ArrowRight } from 'lucide-react';
import { MockRepoPackage, RepositoryMode } from '../../types';
import { QAPanel } from '../QAPanel';
import { AppRoute } from '../../types/navigation';

interface AskAIPageProps {
  repoPackage: MockRepoPackage;
  mode: RepositoryMode;
  activeQuestion?: string;
  onNavigate: (route: AppRoute) => void;
  onInspectNodeInGraph?: (nodeId?: string) => void;
}

export const AskAIPage: React.FC<AskAIPageProps> = ({
  repoPackage,
  mode,
  activeQuestion,
  onNavigate,
  onInspectNodeInGraph,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Page Header Banner */}
      <div className="p-6 rounded-xl bg-[#161B22] border border-[#272D36] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h1 className="text-xl font-bold text-[#F5F5F5]">Ask CodeWhy AI</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              Evidence-Grounded Answers
            </span>
          </div>
          <p className="text-xs text-[#969DA8] mt-1 max-w-2xl leading-relaxed">
            Inquire about any function, retry threshold, architectural choice, or commit intention.
            Answers use this mode's indexed or curated records and return <span className="text-[#F5F5F5]">Insufficient Evidence</span> when linked records do not support an explanation.
          </p>
        </div>

        <button
          onClick={() => onNavigate('graph')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0B0D10] hover:bg-[#1C222B] border border-[#272D36] text-xs text-[#F5F5F5] transition-colors cursor-pointer shrink-0"
        >
          <Network className="w-3.5 h-3.5 text-indigo-400" />
          <span>Explore Relationships</span>
        </button>
      </div>

      {/* Main Q&A Interactive Panel */}
      <QAPanel
        repoPackage={repoPackage}
        mode={mode}
        initialQuestion={activeQuestion}
        onInspectInGraph={(nodeId) => {
          if (onInspectNodeInGraph) onInspectNodeInGraph(nodeId);
          onNavigate('graph');
        }}
        onInspectInEvidence={() => onNavigate('repository')}
      />
    </div>
  );
};
