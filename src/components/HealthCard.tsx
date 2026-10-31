import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Layers, Database, Cpu, Globe } from 'lucide-react';
import { HealthCheckState } from '../types';

interface HealthCardProps {
  healthState: HealthCheckState;
  onRefresh: () => void;
}

export const HealthCard: React.FC<HealthCardProps> = ({ healthState, onRefresh }) => {
  const { loading, data, error, latencyMs, lastChecked } = healthState;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 text-emerald-400 border border-zinc-700">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Backend Communication Bridge</h2>
            <p className="text-xs text-zinc-400">Verifying live connection between React UI & API server</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50 border border-zinc-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{loading ? 'Pinging /api/health...' : 'Test Connection Again'}</span>
        </button>
      </div>

      {/* Main Status Display */}
      <div className="mt-5 space-y-5">
        {loading && !data && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-zinc-400 font-mono">Pinging endpoint /api/health ...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-rose-200">Connection Failed</p>
              <p className="text-rose-300/80 mt-1">{error}</p>
              <p className="text-zinc-400 mt-2">
                Make sure the backend server is running and route <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">/api/health</code> is reachable.
              </p>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-emerald-200 text-sm">{data.service}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                      HTTP 200 OK
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1">{data.message}</p>
                </div>
              </div>

              {latencyMs !== null && (
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-emerald-400 font-medium">{latencyMs} ms</span>
                  <p className="text-[10px] text-zinc-500">Round-trip</p>
                </div>
              )}
            </div>

            {/* Architecture Stack Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center space-x-2 text-zinc-400 text-xs mb-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-zinc-300">Frontend UI</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono truncate">{data.architecture.frontend}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center space-x-2 text-zinc-400 text-xs mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-zinc-300">Backend API</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono truncate">{data.architecture.backend}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center space-x-2 text-zinc-400 text-xs mb-1">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium text-zinc-300">Graph Database</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono truncate">{data.architecture.database}</p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center space-x-2 text-zinc-400 text-xs mb-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium text-zinc-300">AI Reasoning</span>
                </div>
                <p className="text-xs text-zinc-400 font-mono truncate">{data.architecture.llm}</p>
              </div>
            </div>

            {/* Raw JSON inspection toggle */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span className="font-mono">Payload received from /api/health:</span>
                {lastChecked && (
                  <span className="text-[11px] text-zinc-500">
                    Checked at {new Date(lastChecked).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300/90 overflow-x-auto leading-relaxed">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
