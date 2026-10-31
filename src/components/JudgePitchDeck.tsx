import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ShieldCheck,
  Cpu,
  Database,
  Terminal,
  Layers,
  Sparkles,
  Award,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface JudgePitchDeckProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario?: (scenarioId: string) => void;
}

export const JudgePitchDeck: React.FC<JudgePitchDeckProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      badge: 'Slide 1 of 5 • Problem Statement',
      title: 'The Missing Dimension in Developer Tooling',
      subtitle: 'Source explanations show what code does; repository history can add documented context about why it changed.',
      icon: Terminal,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm mb-2">
                <span>General Code Assistants (Typical Focus)</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Explain syntax and algorithms: "This loop executes 3 times."</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Repository history may not be available unless the tool is connected to it.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Unconstrained model answers can include plausible but unsupported rationale.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>CodeWhy AI (The "Why")</span>
              </div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Shows verbatim context from explicitly linked repository records when there is enough evidence.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Keeps text matches separate from explicit commit-to-PR and PR-to-issue links.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Returns Insufficient Evidence when linked records do not support a causal answer.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-200">Prototype Goal:</span>
              <p className="mt-0.5">Reduce the time engineers spend searching repository history for documented context.</p>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] shrink-0">
              Track: AI & Dev Tools
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Slide 2 of 5 • System Architecture',
      title: 'End-to-End Grounded Pipeline',
      subtitle: 'From bounded GitHub records to source-validated answer excerpts.',
      icon: Layers,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-2">
                1
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">GitHub Ingest</h4>
              <p className="text-[11px] text-zinc-500 mt-1">Bounded commits, PRs, issues and README</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-2">
                2
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">Entity Processor</h4>
              <p className="text-[11px] text-zinc-500 mt-1">Normalized records and explicit references</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-2">
                3
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">In-Memory Relationships</h4>
              <p className="text-[11px] text-zinc-500 mt-1">Explicit links only; no Neo4j persistence</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-2">
                4
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">Grounded LLM</h4>
              <p className="text-[11px] text-zinc-500 mt-1">Exact quote validation and abstention</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 font-mono text-[11px] text-zinc-300">
            <span className="text-emerald-400">Evidence Rule:</span> Model output is accepted only when each source ID and quote matches a record selected by the server. Final answer text is restricted to those exact excerpts.
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Slide 3 of 5 • Relationship Preview',
      title: 'Explicit Repository Relationships',
      subtitle: 'An in-memory preview built from fetched repository records.',
      icon: Database,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-zinc-300">
            <div className="text-purple-400 font-semibold mb-2">// Illustrative pattern — not executed against Neo4j</div>
            <span className="text-cyan-400">MATCH</span> (i:Issue {`{number: 104}`})
            <span className="text-emerald-400">&lt;-[:RESOLVES_ISSUE]-</span> (pr:PullRequest)
            <span className="text-emerald-400">-[:INCLUDES_COMMIT]-&gt;</span> (c:Commit)
            <span className="text-emerald-400">-[:MODIFIES_FILE]-&gt;</span> (f:File {`{path: 'src/retry.ts'}`})
            <br />
            <span className="text-cyan-400">RETURN</span> i.title, pr.title, c.sha, f.path;
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-cyan-400 font-semibold block">:Issue</span>
              <span className="text-[11px] text-zinc-500">Incident tickets, post-mortems</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-purple-400 font-semibold block">:PullRequest</span>
              <span className="text-[11px] text-zinc-500">PR descriptions (review comments are not fetched)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-amber-400 font-semibold block">:Commit</span>
              <span className="text-[11px] text-zinc-500">Atomic diffs & SHA changes</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="text-emerald-400 font-semibold block">:File / :Function</span>
              <span className="text-[11px] text-zinc-500">Changed-file paths for a bounded subset</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      badge: 'Slide 4 of 5 • Anti-Hallucination & Controls',
      title: 'Evidence Checks and Abstention',
      subtitle: 'The prototype checks source identity, exact quotes, and explicit relationships.',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Scenario 1: Curated Demo Provenance</span>
              </div>
              <p className="text-xs text-zinc-300 font-mono mb-2">"Why is retry limit set to 3?"</p>
              <p className="text-xs text-zinc-400">
                ➔ Curated Demo records link <strong>Issue #28</strong>, <strong>PR #42</strong>, and <strong>Commit 8f2a1b4</strong>.
              </p>
              <div className="mt-2 text-[11px] text-emerald-400 font-semibold">Provider: Curated Demo Knowledge Base</div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-amber-900/40">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Scenario 4: Negative Control Check</span>
              </div>
              <p className="text-xs text-zinc-300 font-mono mb-2">"Why is UI button purple?"</p>
              <p className="text-xs text-zinc-400">
                ➔ The curated records do not document a reason for purple button styling.
              </p>
              <div className="mt-2 text-[11px] text-amber-400 font-semibold">Result: Insufficient Evidence · no source links</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span>Links are returned only for source records whose IDs and repository URLs validate.</span>
            <span className="text-emerald-400 font-mono text-[11px]">Server-Checked Sources</span>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      badge: 'Slide 5 of 5 • Prototype Readiness & Limits',
      title: 'A Tested Hackathon Prototype',
      subtitle: 'Current automated checks cover the key retrieval, API, and UI contracts.',
      icon: Award,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xl font-bold text-emerald-400 font-mono">2</div>
              <p className="text-xs text-zinc-400 mt-1">Explicit Modes</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xl font-bold text-cyan-400 font-mono">Bounded</div>
              <p className="text-xs text-zinc-400 mt-1">Live GitHub Index</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xl font-bold text-purple-400 font-mono">5</div>
              <p className="text-xs text-zinc-400 mt-1">Curated Demo Scenarios</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xl font-bold text-amber-400 font-mono">1-Click</div>
              <p className="text-xs text-zinc-400 mt-1">Markdown Report Export</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 text-xs text-zinc-300">
            <span className="font-semibold text-emerald-300">Judges' Evaluation Checklist:</span>
            <ul className="mt-2 space-y-1 text-zinc-400 list-disc list-inside">
              <li>Live mode uses the requested GitHub repository and reports API errors directly</li>
              <li>Relationship view is in memory; Cypher snippets are examples, not executed queries</li>
              <li>Source annotations use curated Demo Mode files; live source files are not fetched</li>
              <li>Demo Mode is a separate curated experience and requires no GitHub request</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev : 0));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = slides[currentSlide];
  const IconComponent = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  {slide.badge}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">CodeWhy AI • HackFront India 2026 Presentation Deck</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              Use [← / →] arrows to navigate
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">{slide.title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{slide.subtitle}</p>
          </div>

          <div className="pt-2">{slide.content}</div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between">
          {/* Slide Indicator Dots */}
          <div className="flex items-center space-x-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Nav Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-md shadow-emerald-500/20 transition-colors cursor-pointer"
            >
              <span>{currentSlide === slides.length - 1 ? 'Start Over' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
