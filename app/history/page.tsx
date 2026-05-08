'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMatchHistory } from '@/lib/store';
import type { MatchRecord } from '@/lib/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDatetime(ts: number): string {
  return new Date(ts).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resultLabel(record: MatchRecord): { text: string; color: string } {
  switch (record.result) {
    case 'teamA':
      return { text: `${record.teamAName} wins`, color: 'neon-text-cyan' };
    case 'teamB':
      return { text: `${record.teamBName} wins`, color: 'neon-text-magenta' };
    case 'draw':
      return { text: 'Draw', color: 'neon-text-yellow' };
  }
}

function eventIcon(type: string): string {
  switch (type) {
    case 'match_start':
      return '▶';
    case 'match_end':
      return '🏁';
    case 'pause':
      return '⏸';
    case 'resume':
      return '▶';
    case 'recovery_start':
      return '⚠';
    case 'recovery_resume':
      return '✓';
    case 'knockout':
      return '💀';
    case 'emergency_stop':
      return '🛑';
    case 'time_adjust':
      return '⏱';
    default:
      return '•';
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const data = getMatchHistory();
    // Show most recent first
    data.sort((a, b) => b.timestamp - a.timestamp);
    setHistory(data);
  }, []);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 scanlines">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-neon-green/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-neon-cyan/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-muted text-xs font-mono tracking-wider hover:text-neon-cyan transition-colors"
            >
              ← HOME
            </Link>
            <h1 className="font-mono text-2xl md:text-3xl font-bold neon-text-green mt-1 tracking-wide">
              📜 MATCH HISTORY
            </h1>
          </div>
          <Link
            href="/leaderboard"
            className="btn-neon btn-yellow text-[0.65rem] py-1.5 px-3"
          >
            LEADERBOARD →
          </Link>
        </div>

        {/* Match list */}
        {history.length === 0 ? (
          <div className="panel-glow text-center py-16">
            <p className="font-mono text-muted text-sm">
              No matches played yet. Start a match from the{' '}
              <Link href="/operator" className="text-neon-cyan hover:underline">
                Operator Panel
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record, index) => {
              const { text, color } = resultLabel(record);
              const isExpanded = expandedId === record.id;

              return (
                <div
                  key={record.id}
                  className="panel-glow animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Match card header */}
                  <button
                    onClick={() => toggle(record.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold neon-text-cyan">
                            {record.teamAName}
                          </span>
                          <span className="font-mono text-xs text-neon-magenta tracking-widest">
                            VS
                          </span>
                          <span className="font-mono text-sm font-bold neon-text-magenta">
                            {record.teamBName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`font-mono text-xs font-bold ${color}`}>
                            {text}
                          </span>
                          <span className="text-[0.6rem] text-muted font-mono">
                            {formatDuration(record.durationSeconds)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-[0.6rem] text-muted font-mono">
                          {formatDate(record.timestamp)}
                        </p>
                        <p className="text-[0.6rem] text-muted/50 font-mono mt-0.5">
                          {isExpanded ? '▲ collapse' : '▼ expand'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Event timeline */}
                  {isExpanded && record.events.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/30 animate-slide-up">
                      <p className="font-mono text-[0.6rem] tracking-[0.2em] text-muted uppercase mb-2">
                        EVENT TIMELINE
                      </p>
                      <div className="space-y-1.5 pl-2 border-l border-border/30">
                        {record.events.map((evt, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-[0.65rem] font-mono pl-3 relative"
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${
                                evt.type === 'knockout'
                                  ? 'bg-neon-red'
                                  : evt.type === 'recovery_start'
                                  ? 'bg-neon-orange'
                                  : evt.type === 'match_start' || evt.type === 'match_end'
                                  ? 'bg-neon-cyan'
                                  : 'bg-border'
                              }`}
                            />
                            <span className="text-muted shrink-0 w-10">
                              {formatDatetime(evt.timestamp).split(', ')[1] || formatDatetime(evt.timestamp)}
                            </span>
                            <span className="shrink-0">{eventIcon(evt.type)}</span>
                            <span
                              className={`${
                                evt.type === 'knockout'
                                  ? 'text-neon-red'
                                  : evt.type === 'recovery_start'
                                  ? 'text-neon-orange'
                                  : 'text-foreground/70'
                              }`}
                            >
                              {evt.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats summary */}
        {history.length > 0 && (
          <div className="mt-6 text-center">
            <p className="font-mono text-xs text-muted">
              {history.length} match{history.length !== 1 ? 'es' : ''} played
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
