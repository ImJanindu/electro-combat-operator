'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTeams } from '@/lib/store';
import type { Team } from '@/lib/types';

export default function LeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const load = () => {
      const data = getTeams();
      // Sort by totalPoints descending, then by won, then alphabetically
      data.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.won !== a.won) return b.won - a.won;
        return a.name.localeCompare(b.name);
      });
      setTeams(data);
    };

    load();
    // Auto-refresh every 5 seconds
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 scanlines">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-neon-yellow/5 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 rounded-full bg-neon-blue/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="text-muted text-xs font-mono tracking-wider hover:text-neon-blue transition-colors"
            >
              ← HOME
            </Link>
            <h1 className="font-mono text-2xl md:text-3xl font-bold neon-text-yellow mt-1 tracking-wide">
              🏆 LEADERBOARD
            </h1>
          </div>
          <Link
            href="/history"
            className="btn-neon btn-blue text-[0.65rem] py-1.5 px-3"
          >
            MATCH HISTORY →
          </Link>
        </div>

        {/* Table */}
        {teams.length === 0 ? (
          <div className="panel-glow text-center py-16">
            <p className="font-mono text-muted text-sm">
              No teams registered yet. Add teams from the{' '}
              <Link href="/operator" className="text-neon-blue hover:underline">
                Operator Panel
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="panel-glow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3 w-12">
                    #
                  </th>
                  <th className="text-left font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3">
                    Team
                  </th>
                  <th className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3">
                    P
                  </th>
                  <th className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3">
                    W
                  </th>
                  <th className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3">
                    D
                  </th>
                  <th className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase py-3 px-3">
                    L
                  </th>
                  <th className="text-center font-mono text-[0.65rem] tracking-[0.2em] text-neon-yellow uppercase py-3 px-3">
                    PTS
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, i) => (
                  <tr
                    key={team.id}
                    className={`border-b border-border/30 transition-colors hover:bg-surface-alt/40 ${
                      i === 0 && team.totalPoints > 0
                        ? 'bg-neon-yellow/5'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono text-sm font-bold ${
                          i === 0 && team.totalPoints > 0
                            ? 'neon-text-yellow'
                            : i === 1 && team.totalPoints > 0
                            ? 'text-foreground/80'
                            : i === 2 && team.totalPoints > 0
                            ? 'text-neon-orange'
                            : 'text-muted'
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold">
                        {i === 0 && team.totalPoints > 0 && '👑 '}
                        {team.name}
                      </span>
                    </td>
                    <td className="text-center py-3 px-3 font-mono text-muted">
                      {team.matchesPlayed}
                    </td>
                    <td className="text-center py-3 px-3 font-mono text-neon-green">
                      {team.won}
                    </td>
                    <td className="text-center py-3 px-3 font-mono text-neon-yellow">
                      {team.drawn}
                    </td>
                    <td className="text-center py-3 px-3 font-mono text-neon-red">
                      {team.defeated}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span
                        className={`font-mono font-bold text-base ${
                          i === 0 && team.totalPoints > 0
                            ? 'neon-text-yellow'
                            : 'text-foreground'
                        }`}
                      >
                        {team.totalPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[0.6rem] font-mono text-muted">
          <span>P = Played</span>
          <span>W = Won</span>
          <span>D = Drawn</span>
          <span>L = Defeated</span>
          <span>PTS = Points (W=1, D=0.5, L=0)</span>
        </div>
      </div>
    </div>
  );
}

