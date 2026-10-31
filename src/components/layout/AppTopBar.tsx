import React from 'react';
import { AppRoute } from '../../types/navigation';
import { MockRepoPackage } from '../../types';
import { ExternalLink, GitBranch, Sparkles, FolderGit2 } from 'lucide-react';

interface AppTopBarProps {
  currentRoute: AppRoute;
  activeRepoPackage: MockRepoPackage;
  source: 'live_github_api' | 'demo_mode';
  warning?: string;
  onNavigate: (route: AppRoute) => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  currentRoute,
  activeRepoPackage,
  source,
  warning,
  onNavigate,
}) => {
  const routeTitles: Record<AppRoute, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Repository connection and overview',
    },
    repository: {
      title: 'Repository Explorer',
      subtitle: 'Source files, pull requests, and issue discussions',
    },
    ask: {
      title: 'Ask CodeWhy AI',
      subtitle: 'Natural-language architectural and decision reasoning',
    },
    graph: {
      title: 'Knowledge Graph',
      subtitle: 'Relationship preview from repository records indexed in this session',
    },
    history: {
      title: 'Commit & History Explorer',
      subtitle: 'Chronological Git commits, diffs, and author context',
    },
    settings: {
      title: 'Settings & Diagnostics',
      subtitle: 'API credentials, model configuration, and pitch deck',
    },
  };

  const currentMeta = routeTitles[currentRoute];

  return (
    <header className="h-16 px-8 border-b border-[#272D36] bg-[#0B0D10]/90 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-[#969DA8]">
          <span>CodeWhy AI</span>
          <span>/</span>
          <span className="text-[#F5F5F5] font-medium capitalize">{currentMeta.title}</span>
        </div>
        <p className="text-xs text-[#969DA8] mt-0.5 hidden sm:block">{currentMeta.subtitle}</p>
      </div>

      {/* Right Context Badges & Actions */}
      <div className="flex items-center space-x-3">
        {/* Active Repo Capsule */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#272D36] text-xs">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[#F5F5F5] font-medium">{activeRepoPackage.summary.fullName}</span>
          {activeRepoPackage.summary.url && (
            <a
              href={activeRepoPackage.summary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#969DA8] hover:text-white transition-colors"
              title="Open repository on GitHub"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Source Mode */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#161B22] border border-[#272D36] text-[11px] text-[#969DA8] font-mono">
          <span className={`h-1.5 w-1.5 rounded-full ${source === 'live_github_api' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          <span>{source === 'live_github_api' ? 'Live Repository Mode' : 'Demo Mode · Curated'}</span>
        </div>

        {/* Quick Ask Shortcut */}
        {currentRoute !== 'ask' && (
          <button
            onClick={() => onNavigate('ask')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        )}
      </div>
    </header>
  );
};
