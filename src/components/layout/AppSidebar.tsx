import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Network,
  GitCommit,
  Settings,
  GitBranch,
  Activity,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AppRoute } from '../../types/navigation';
import { MockRepoPackage } from '../../types';

interface AppSidebarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  activeRepoPackage: MockRepoPackage;
  isBackendHealthy: boolean;
  onOpenPitchDeck?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentRoute,
  onRouteChange,
  activeRepoPackage,
  isBackendHealthy,
  onOpenPitchDeck,
}) => {
  const navItems: { id: AppRoute; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repository', label: 'Repository Explorer', icon: FolderGit2 },
    { id: 'ask', label: 'Ask CodeWhy AI', icon: Sparkles, badge: 'AI' },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'history', label: 'Commit History', icon: GitCommit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#111419] border-r border-[#272D36] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#272D36] flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onRouteChange('dashboard')}
          title="Return to Dashboard"
        >
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GitBranch className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm text-[#F5F5F5] tracking-tight">CodeWhy AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#969DA8] font-normal">Code Reasoning Engine</p>
          </div>
        </div>
      </div>

      {/* Active Repository Card in Sidebar */}
      <div className="px-4 py-3 border-b border-[#272D36] bg-[#0E1116]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#969DA8]">Active Repository</span>
          <button
            onClick={() => onRouteChange('dashboard')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Change
          </button>
        </div>
        <div
          onClick={() => onRouteChange('repository')}
          className="p-2.5 rounded-lg bg-[#161B22] border border-[#272D36] hover:border-[#3D4554] transition-all cursor-pointer group"
        >
          <div className="flex items-center space-x-2">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-xs font-medium text-[#F5F5F5] truncate group-hover:text-indigo-300 transition-colors">
              {activeRepoPackage.summary.fullName}
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-[#969DA8] font-mono">
            <span>{activeRepoPackage.commits.length} commits</span>
            <span>•</span>
            <span>{activeRepoPackage.pullRequests.length} PRs</span>
            <span>•</span>
            <span>{activeRepoPackage.issues.length} issues</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] uppercase font-mono tracking-wider text-[#969DA8]">Navigation</div>
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#161B22] text-[#F5F5F5] border border-[#272D36] shadow-sm font-semibold'
                  : 'text-[#969DA8] hover:text-[#F5F5F5] hover:bg-[#161B22]/60'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-[#969DA8]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Actions & Status */}
      <div className="p-4 border-t border-[#272D36] space-y-2.5 bg-[#0E1116]">
        {/* Judge Pitch Deck Button */}
        {onOpenPitchDeck && (
          <button
            onClick={onOpenPitchDeck}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#161B22] hover:bg-[#1C222B] border border-[#272D36] hover:border-indigo-500/40 text-xs text-[#F5F5F5] transition-all cursor-pointer group"
          >
            <div className="flex items-center space-x-2">
              <Award className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Pitch Deck</span>
            </div>
            <span className="text-[10px] text-[#969DA8] font-mono">5 Slides</span>
          </button>
        )}

        {/* Backend & Integration Status */}
        <div className="flex items-center justify-between px-1 text-[11px] text-[#969DA8]">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {isBackendHealthy ? 'API Online' : 'Connecting...'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">HackFront 2026</span>
        </div>
      </div>
    </aside>
  );
};
