/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './components/pages/DashboardPage';
import { RepositoryPage } from './components/pages/RepositoryPage';
import { AskAIPage } from './components/pages/AskAIPage';
import { KnowledgeGraphPage } from './components/pages/KnowledgeGraphPage';
import { HistoryPage } from './components/pages/HistoryPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { AnalysisProgress } from './components/AnalysisProgress';
import { checkBackendHealth } from './services/api';
import { HealthCheckState, MockRepoPackage, RepositoryMode } from './types';
import { AppRoute } from './types/navigation';
import { DEMO_PAYMENT_REPO } from './mock/demoData';
import { JudgeDemoScenario, getRepoPackageForScenario } from './utils/demoScenarios';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [targetRepoUrl, setTargetRepoUrl] = useState<string>('codewhy-ai/demo-payment-service');
  const [activeRepoPackage, setActiveRepoPackage] = useState<MockRepoPackage>(DEMO_PAYMENT_REPO);
  const [activeQuestion, setActiveQuestion] = useState<string>('Why is the retry limit set to 3?');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [repositoryMode, setRepositoryMode] = useState<RepositoryMode>('demo');
  const [ingestionWarning, setIngestionWarning] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPitchDeck, setShowPitchDeck] = useState<boolean>(false);

  const [healthState, setHealthState] = useState<HealthCheckState>({
    loading: true,
    data: null,
    error: null,
    latencyMs: null,
    lastChecked: null,
  });

  // Sync hash routing with state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '').trim() as AppRoute;
      const validRoutes: AppRoute[] = ['dashboard', 'repository', 'ask', 'graph', 'history', 'settings'];
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    } else {
      window.location.hash = '#/dashboard';
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { data, latencyMs } = await checkBackendHealth();
      setHealthState({
        loading: false,
        data,
        error: null,
        latencyMs,
        lastChecked: new Date().toISOString(),
      });
    } catch (err: unknown) {
      setHealthState({
        loading: false,
        data: null,
        error: err instanceof Error ? err.message : 'Failed to connect to backend',
        latencyMs: null,
        lastChecked: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleStartAnalysis = useCallback((repoUrl: string) => {
    setTargetRepoUrl(repoUrl);
    setErrorMessage(null);
    setRepositoryMode('live');
    setIngestionWarning(undefined);
    setIsAnalyzing(true);
  }, []);

  const handleAnalysisComplete = useCallback((data: {
    packageData: MockRepoPackage;
    source: 'live_github_api';
    warning?: string;
  }) => {
    setActiveRepoPackage(data.packageData);
    setRepositoryMode('live');
    setIngestionWarning(data.warning);
    setIsAnalyzing(false);
    handleNavigate('repository');
  }, [handleNavigate]);

  const handleAnalysisError = useCallback((errText: string) => {
    setErrorMessage(errText);
    setIsAnalyzing(false);
  }, []);

  const handleSelectScenario = (scenario: JudgeDemoScenario) => {
    setTargetRepoUrl(scenario.repoUrl);
    setErrorMessage(null);
    const pkg = getRepoPackageForScenario(scenario);
    setActiveRepoPackage(pkg);
    setActiveQuestion(scenario.question);
    setRepositoryMode('demo');
    setIngestionWarning(`Preset Active: ${scenario.title}`);
    handleNavigate('ask');
  };

  const isHealthy = Boolean(healthState.data && healthState.data.status === 'ok');

  return (
    <AppLayout
      currentRoute={currentRoute}
      onRouteChange={handleNavigate}
      activeRepoPackage={activeRepoPackage}
      isBackendHealthy={isHealthy}
      source={repositoryMode === 'live' ? 'live_github_api' : 'demo_mode'}
      warning={ingestionWarning}
      showPitchDeck={showPitchDeck}
      setShowPitchDeck={setShowPitchDeck}
    >
      {/* Optional Ingestion Warning Notification */}
      {ingestionWarning && (
        <div className="mb-6 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
          <span>{ingestionWarning}</span>
          <button
            onClick={() => setIngestionWarning(undefined)}
            className="text-[#969DA8] hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Analysis Overlay Mode */}
      {isAnalyzing ? (
        <div className="max-w-xl mx-auto py-12">
          <AnalysisProgress
            repoUrl={targetRepoUrl}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
          />
        </div>
      ) : (
        <>
          {/* ROUTE 1: DASHBOARD */}
          {currentRoute === 'dashboard' && (
            <DashboardPage
              activeRepoPackage={activeRepoPackage}
              onAnalyze={handleStartAnalysis}
              onSelectScenario={handleSelectScenario}
              onNavigate={handleNavigate}
              isLoading={isAnalyzing}
            />
          )}

          {/* ROUTE 2: REPOSITORY EXPLORER */}
          {currentRoute === 'repository' && (
            <RepositoryPage
              repoPackage={activeRepoPackage}
              mode={repositoryMode}
              onAskFromCode={(question) => {
                setActiveQuestion(question);
                handleNavigate('ask');
              }}
              onNavigate={handleNavigate}
            />
          )}

          {/* ROUTE 3: ASK CODEWHY AI */}
          {currentRoute === 'ask' && (
            <AskAIPage
              repoPackage={activeRepoPackage}
              mode={repositoryMode}
              activeQuestion={activeQuestion}
              onNavigate={handleNavigate}
              onInspectNodeInGraph={(nodeId) => {
                if (nodeId) setSelectedGraphNodeId(nodeId);
                handleNavigate('graph');
              }}
            />
          )}

          {/* ROUTE 4: KNOWLEDGE GRAPH */}
          {currentRoute === 'graph' && (
            <KnowledgeGraphPage
              repoPackage={activeRepoPackage}
              selectedNodeId={selectedGraphNodeId}
              onNavigate={handleNavigate}
            />
          )}

          {/* ROUTE 5: COMMIT HISTORY */}
          {currentRoute === 'history' && (
            <HistoryPage
              repoPackage={activeRepoPackage}
              onNavigate={handleNavigate}
              onAskAboutCommit={(sha, msg) => {
                setActiveQuestion(`Why was commit ${sha.substring(0, 7)} introduced: "${msg}"?`);
                handleNavigate('ask');
              }}
            />
          )}

          {/* ROUTE 6: SETTINGS */}
          {currentRoute === 'settings' && (
            <SettingsPage
              healthState={healthState}
              onRefreshHealth={fetchHealth}
              onOpenPitchDeck={() => setShowPitchDeck(true)}
            />
          )}
        </>
      )}
    </AppLayout>
  );
}
