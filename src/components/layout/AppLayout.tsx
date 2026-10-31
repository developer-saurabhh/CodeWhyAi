import React from 'react';
import { AppSidebar } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import { AppRoute } from '../../types/navigation';
import { MockRepoPackage } from '../../types';
import { JudgePitchDeck } from '../JudgePitchDeck';

interface AppLayoutProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  activeRepoPackage: MockRepoPackage;
  isBackendHealthy: boolean;
  source: 'live_github_api' | 'demo_mode';
  warning?: string;
  showPitchDeck: boolean;
  setShowPitchDeck: (show: boolean) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onRouteChange,
  activeRepoPackage,
  isBackendHealthy,
  source,
  warning,
  showPitchDeck,
  setShowPitchDeck,
  children,
}) => {
  return (
    <div className="flex h-screen bg-[#0B0D10] text-[#F5F5F5] font-sans antialiased overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-300">
      {/* 1. Left Persistent Sidebar */}
      <AppSidebar
        currentRoute={currentRoute}
        onRouteChange={onRouteChange}
        activeRepoPackage={activeRepoPackage}
        isBackendHealthy={isBackendHealthy}
        onOpenPitchDeck={() => setShowPitchDeck(true)}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / Breadcrumb Bar */}
        <AppTopBar
          currentRoute={currentRoute}
          activeRepoPackage={activeRepoPackage}
          source={source}
          warning={warning}
          onNavigate={onRouteChange}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
          {children}
        </main>
      </div>

      {/* 3. Global Judge Pitch Deck Modal */}
      <JudgePitchDeck
        isOpen={showPitchDeck}
        onClose={() => setShowPitchDeck(false)}
      />
    </div>
  );
};
