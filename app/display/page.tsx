'use client';

import { useState, useEffect } from 'react';
import { useTimerReceiver } from '@/lib/use-timer-receiver';
import { getTeams } from '@/lib/store';
import type { Team } from '@/lib/types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DisplayPage() {
  const state = useTimerReceiver();
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);

  const { phase } = state;
  const isIdle = phase === 'idle';
  const isCountdown = phase === 'countdown';
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const isRecovery = phase === 'recovery';
  const isKnockout = phase === 'knockout';
  const isFinished = phase === 'finished';
  const isStopped = phase === 'stopped';
  const isResult = phase === 'result';
  const isShowLeaderboard = phase === 'show_leaderboard';

  // Load leaderboard data when the leaderboard phase is active
  useEffect(() => {
    if (isShowLeaderboard) {
      const teams = getTeams();
      teams.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.won !== a.won) return b.won - a.won;
        return a.name.localeCompare(b.name);
      });
      setLeaderboard(teams);
    }
  }, [isShowLeaderboard]);

  // Determine which "active match" phases to show (timer display)
  const isMatchPhase = !isIdle && !isCountdown && !isResult && !isShowLeaderboard;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden scanlines select-none cursor-default">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] transition-all duration-1000 ${
            isRunning ? 'bg-neon-green/8' :
            isRecovery ? 'bg-neon-red/12' :
            isKnockout ? 'bg-neon-red/20' :
            isResult ? 'bg-neon-yellow/10' :
            isShowLeaderboard ? 'bg-neon-yellow/8' :
            'bg-neon-cyan/5'
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[180px] transition-all duration-1000 ${
            isRunning ? 'bg-neon-cyan/5' :
            isRecovery ? 'bg-neon-orange/10' :
            isKnockout ? 'bg-neon-red/15' :
            isResult ? 'bg-neon-cyan/8' :
            isShowLeaderboard ? 'bg-neon-cyan/5' :
            'bg-neon-magenta/5'
          }`}
        />
      </div>

      {/* Recovery/Knockout overlay */}
      {isRecovery && (
        <div className="fixed inset-0 recovery-overlay pointer-events-none animate-pulse-glow z-10" />
      )}
      {isKnockout && (
        <div className="fixed inset-0 knockout-overlay pointer-events-none z-10" />
      )}

      {/* Top Logo */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
        <img src="/logo.png" alt="ElectroCombat Logo" className="h-32 md:h-48 lg:h-56 w-auto opacity-90 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]" />
      </div>

      {/* ---- IDLE state ---- */}
      {isIdle && (
        <div className="relative z-20 text-center animate-slide-up">
          <p className="font-mono text-[0.6rem] md:text-sm tracking-[0.15em] md:tracking-[0.25em] text-muted uppercase mb-4">
            MTSS of University of Sri Jayewardnepura Presents
          </p>
          <h1 className="font-mono text-5xl md:text-7xl font-black neon-text-cyan animate-neon-flicker tracking-tight">
            ELECTRO COMBAT 2.0
          </h1>
          <p className="font-mono text-sm tracking-[0.25em] text-neon-magenta mt-4 uppercase">
            Waiting for operator...
          </p>
        </div>
      )}

      {/* ---- COUNTDOWN 3-2-1 ---- */}
      {isCountdown && (
        <div className="relative z-20 text-center">
          {/* Team names */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mb-12">
            <div className="text-right">
              <p className="font-mono text-xs tracking-[0.3em] text-muted uppercase">Team A</p>
              <p className="font-mono text-2xl md:text-4xl font-bold neon-text-cyan mt-1 truncate max-w-[280px]">
                {state.teamA?.name || '—'}
              </p>
            </div>
            <span className="font-mono text-2xl md:text-3xl text-neon-magenta font-black tracking-widest animate-pulse-glow">
              VS
            </span>
            <div className="text-left">
              <p className="font-mono text-xs tracking-[0.3em] text-muted uppercase">Team B</p>
              <p className="font-mono text-2xl md:text-4xl font-bold neon-text-magenta mt-1 truncate max-w-[280px]">
                {state.teamB?.name || '—'}
              </p>
            </div>
          </div>

          {/* Countdown number */}
          <div
            key={state.countdownValue}
            className="timer-display text-[10rem] md:text-[14rem] font-black neon-text-cyan animate-countdown-zoom leading-none"
          >
            {state.countdownValue}
          </div>
        </div>
      )}

      {/* ---- MATCH RESULT ---- */}
      {isResult && state.matchResult && (
        <div className="relative z-20 text-center w-full max-w-4xl px-6 animate-slide-up">
          {/* Team names */}
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="text-left flex-1">
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-muted uppercase">
                Team A
              </p>
              <p className={`font-mono text-xl md:text-3xl lg:text-4xl font-bold mt-1 truncate ${
                state.matchResult.result === 'teamA' ? 'neon-text-green' : 'text-foreground/50'
              }`}>
                {state.teamA?.name || '—'}
              </p>
            </div>
            <span className="font-mono text-lg md:text-2xl text-neon-magenta font-black tracking-widest px-4 shrink-0">
              VS
            </span>
            <div className="text-right flex-1">
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-muted uppercase">
                Team B
              </p>
              <p className={`font-mono text-xl md:text-3xl lg:text-4xl font-bold mt-1 truncate ${
                state.matchResult.result === 'teamB' ? 'neon-text-green' : 'text-foreground/50'
              }`}>
                {state.teamB?.name || '—'}
              </p>
            </div>
          </div>

          {/* Result announcement */}
          <div className="py-6">
            {state.matchResult.result === 'draw' ? (
              <>
                <p className="font-mono text-xl md:text-2xl tracking-[0.3em] text-muted uppercase mb-4">
                  MATCH RESULT
                </p>
                <h2 className="font-mono text-5xl md:text-7xl lg:text-8xl font-black neon-text-yellow animate-pulse-glow">
                  DRAW
                </h2>
                <p className="font-mono text-lg md:text-xl tracking-[0.2em] text-neon-yellow mt-4">
                  🤝 Both teams earn 0.5 points
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-xl md:text-2xl tracking-[0.3em] text-muted uppercase mb-4">
                  🏆 WINNER
                </p>
                <h2 className="font-mono text-5xl md:text-7xl lg:text-8xl font-black neon-text-green animate-pulse-glow">
                  {state.matchResult.winnerName}
                </h2>
                <p className="font-mono text-lg md:text-xl tracking-[0.2em] text-neon-green mt-4">
                  🏆 +1 POINT
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- LEADERBOARD DISPLAY ---- */}
      {isShowLeaderboard && (
        <div className="relative z-20 w-full max-w-4xl px-6 animate-slide-up">
          <h2 className="font-mono text-3xl md:text-4xl font-black neon-text-yellow text-center mb-8 tracking-wide">
            🏆 LEADERBOARD
          </h2>

          {leaderboard.length === 0 ? (
            <p className="text-center font-mono text-muted">No standings data.</p>
          ) : (
            <div className="panel-glow overflow-hidden">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4 w-14">
                      #
                    </th>
                    <th className="text-left font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4">
                      Team
                    </th>
                    <th className="text-center font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4">
                      P
                    </th>
                    <th className="text-center font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4">
                      W
                    </th>
                    <th className="text-center font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4">
                      D
                    </th>
                    <th className="text-center font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-muted uppercase py-3 px-4">
                      L
                    </th>
                    <th className="text-center font-mono text-[0.7rem] md:text-xs tracking-[0.2em] text-neon-yellow uppercase py-3 px-4">
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, i) => (
                    <tr
                      key={team.id}
                      className={`border-b border-border/30 transition-colors ${
                        i === 0 && team.totalPoints > 0
                          ? 'bg-neon-yellow/5'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-base md:text-lg font-bold ${
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
                      <td className="py-3 px-4">
                        <span className="font-semibold text-base md:text-lg">
                          {i === 0 && team.totalPoints > 0 && '👑 '}
                          {team.name}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 font-mono text-muted">
                        {team.matchesPlayed}
                      </td>
                      <td className="text-center py-3 px-4 font-mono text-neon-green">
                        {team.won}
                      </td>
                      <td className="text-center py-3 px-4 font-mono text-neon-yellow">
                        {team.drawn}
                      </td>
                      <td className="text-center py-3 px-4 font-mono text-neon-red">
                        {team.defeated}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`font-mono font-bold text-lg md:text-xl ${
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
        </div>
      )}

      {/* ---- MATCH ACTIVE (running / paused / recovery / knockout / finished / stopped) ---- */}
      {isMatchPhase && (
        <div className="relative z-20 text-center w-full max-w-5xl px-6">
          {/* Team names */}
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="text-left flex-1">
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-muted uppercase">
                Team A
              </p>
              <p className="font-mono text-xl md:text-3xl lg:text-4xl font-bold neon-text-cyan mt-1 truncate">
                {state.teamA?.name || '—'}
              </p>
            </div>
            <span className="font-mono text-lg md:text-2xl text-neon-magenta font-black tracking-widest px-4 shrink-0">
              VS
            </span>
            <div className="text-right flex-1">
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-muted uppercase">
                Team B
              </p>
              <p className="font-mono text-xl md:text-3xl lg:text-4xl font-bold neon-text-magenta mt-1 truncate">
                {state.teamB?.name || '—'}
              </p>
            </div>
          </div>

          {/* Main Timer */}
          <div
            className={`timer-display text-[7rem] md:text-[10rem] lg:text-[12rem] font-black leading-none tracking-wider ${
              isRunning ? 'neon-text-green' :
              isPaused ? 'neon-text-yellow animate-pulse-glow' :
              isRecovery ? 'neon-text-yellow animate-pulse-glow' :
              isFinished ? 'neon-text-cyan' :
              isKnockout ? 'neon-text-red animate-knockout-pulse' :
              isStopped ? 'neon-text-red' :
              'text-foreground/40'
            }`}
          >
            {formatTime(state.mainTime)}
          </div>

          {/* Phase label */}
          <p
            className={`font-mono text-sm md:text-lg tracking-[0.3em] uppercase mt-4 ${
              isRunning ? 'text-neon-green' :
              isPaused ? 'text-neon-yellow' :
              isRecovery ? 'text-neon-red animate-pulse-glow' :
              isKnockout ? 'text-neon-red' :
              isFinished ? 'text-neon-cyan' :
              isStopped ? 'text-neon-red' :
              'text-muted'
            }`}
          >
            {phase === 'running' && 'FIGHT!'}
            {phase === 'paused' && '⏸ PAUSED'}
            {phase === 'recovery' && '⚠ RECOVERY'}
            {phase === 'knockout' && '💀 KNOCKOUT!'}
            {phase === 'finished' && '🏁 MATCH OVER'}
            {phase === 'stopped' && '🛑 EMERGENCY STOP'}
          </p>

          {/* Recovery Timer */}
          {(isRecovery || isKnockout) && (
            <div className="mt-8 md:mt-12 animate-slide-up">
              <div className="inline-block rounded-lg px-8 py-4 neon-border-red bg-surface/80">
                <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-neon-red uppercase mb-2">
                  {isKnockout ? '💀 KNOCKOUT — RECOVERY FAILED' : '⚠ RECOVERY COUNTDOWN'}
                </p>
                <div
                  className={`timer-display text-5xl md:text-7xl font-black neon-text-red ${
                    isRecovery ? 'animate-pulse-glow' : 'animate-knockout-pulse'
                  }`}
                >
                  {formatTime(state.recoveryTime)}
                </div>
                {state.knockoutTeam && (
                  <p className="font-mono text-xs md:text-sm text-muted mt-2">
                    {state.knockoutTeam === 'A' ? state.teamA?.name : state.teamB?.name}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Corner branding */}
      <div className="fixed bottom-4 right-6 z-20">
        <p className="font-mono text-[0.6rem] text-muted/30 tracking-[0.3em] uppercase">
          ElectroCombat v1.0
        </p>
      </div>
    </div>
  );
}
