'use client';

import { useState, useEffect } from 'react';
import { useTimerReceiver } from '@/lib/use-timer-receiver';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DisplayPage() {
  const state = useTimerReceiver();

  const { phase } = state;
  const isIdle = phase === 'idle';
  const isCountdown = phase === 'countdown';
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const isRecovery = state.recoveryTimeA !== null || state.recoveryTimeB !== null;
  const isKnockout = phase === 'knockout';
  const isFinished = phase === 'finished';
  const isStopped = phase === 'stopped';
  const isResult = phase === 'result';

  // Determine which "active match" phases to show (timer display)
  const isMatchPhase = !isIdle && !isCountdown && !isResult;

  const elapsedTime = state.maxTime - state.mainTime;
  const showTrapDoors = isMatchPhase && elapsedTime >= 60 && elapsedTime < 65;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden scanlines select-none cursor-default"
      suppressHydrationWarning
    >
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[180px] transition-all duration-1000 ${
            isRunning ? 'bg-neon-green/8' :
            isRecovery ? 'bg-neon-red/12' :
            isKnockout ? 'bg-neon-red/20' :
            isResult ? 'bg-neon-yellow/10' :
            'bg-neon-blue/5'
          }`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[180px] transition-all duration-1000 ${
            isRunning ? 'bg-neon-blue/5' :
            isRecovery ? 'bg-neon-orange/10' :
            isKnockout ? 'bg-neon-red/15' :
            isResult ? 'bg-neon-blue/8' :
            'bg-neon-red/5'
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
      
      {/* Trap Doors Alert */}
      {showTrapDoors && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-neon-red/20 border-2 border-neon-red px-8 py-4 rounded-xl backdrop-blur-sm">
            <h2 className="font-mono text-3xl md:text-5xl font-black text-neon-red tracking-widest uppercase animate-pulse-glow text-center">
              ⚠ TRAP DOORS OPEN ⚠
            </h2>
          </div>
        </div>
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
          <p className="font-mono text-sm tracking-[0.25em] text-neon-red mt-4 uppercase">
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
              <p className="font-mono text-2xl md:text-4xl font-bold neon-text-blue mt-1 truncate max-w-[280px]">
                {state.teamA?.name || '—'}
              </p>
            </div>
            <span className="font-mono text-2xl md:text-3xl text-neon-red font-black tracking-widest animate-pulse-glow">
              VS
            </span>
            <div className="text-left">
              <p className="font-mono text-xs tracking-[0.3em] text-muted uppercase">Team B</p>
              <p className="font-mono text-2xl md:text-4xl font-bold neon-text-red mt-1 truncate max-w-[280px]">
                {state.teamB?.name || '—'}
              </p>
            </div>
          </div>

          {/* Countdown number */}
          <div
            key={state.countdownValue}
            className="timer-display text-[10rem] md:text-[14rem] font-black neon-text-blue animate-countdown-zoom leading-none"
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
            <span className="font-mono text-lg md:text-2xl text-neon-red font-black tracking-widest px-4 shrink-0">
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
              </>
            ) : (
              <>
                <p className="font-mono text-xl md:text-2xl tracking-[0.3em] text-muted uppercase mb-4">
                  🏆 WINNER
                </p>
                <h2 className="font-mono text-5xl md:text-7xl lg:text-8xl font-black neon-text-green animate-pulse-glow">
                  {state.matchResult.winnerName}
                </h2>
              </>
            )}
          </div>
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
              <p className="font-mono text-xl md:text-3xl lg:text-4xl font-bold neon-text-blue mt-1 truncate">
                {state.teamA?.name || '—'}
              </p>
            </div>
            <span className="font-mono text-lg md:text-2xl text-neon-red font-black tracking-widest px-4 shrink-0">
              VS
            </span>
            <div className="text-right flex-1">
              <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-muted uppercase">
                Team B
              </p>
              <p className="font-mono text-xl md:text-3xl lg:text-4xl font-bold neon-text-red mt-1 truncate">
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
              isFinished ? 'neon-text-blue' :
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
              isFinished ? 'text-neon-blue' :
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

          {/* Recovery Timers */}
          {(isRecovery || isKnockout) && (
            <div className="mt-8 md:mt-12 animate-slide-up flex flex-col md:flex-row gap-4 justify-center">
              {/* Team A Recovery */}
              {(state.recoveryTimeA !== null || (isKnockout && state.recoveryTimeA === 0)) && (
                <div className={`inline-block rounded-lg px-8 py-4 bg-surface/80 ${state.recoveryTimeA === 0 ? 'neon-border-red' : 'neon-border-yellow'}`}>
                  <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-neon-yellow uppercase mb-2 truncate max-w-[250px]">
                    {state.recoveryTimeA === 0 ? `💀 ${state.teamA?.name || 'TEAM A'} KNOCKOUT` : `⚠ ${state.teamA?.name || 'TEAM A'} RECOVERY`}
                  </p>
                  <div
                    className={`timer-display text-5xl md:text-7xl font-black ${
                      state.recoveryTimeA === 0 ? 'neon-text-red animate-knockout-pulse' : 'neon-text-yellow animate-pulse-glow'
                    }`}
                  >
                    {formatTime(state.recoveryTimeA!)}
                  </div>
                </div>
              )}
              {/* Team B Recovery */}
              {(state.recoveryTimeB !== null || (isKnockout && state.recoveryTimeB === 0)) && (
                <div className={`inline-block rounded-lg px-8 py-4 bg-surface/80 ${state.recoveryTimeB === 0 ? 'neon-border-red' : 'neon-border-yellow'}`}>
                  <p className="font-mono text-xs md:text-sm tracking-[0.3em] text-neon-yellow uppercase mb-2 truncate max-w-[250px]">
                    {state.recoveryTimeB === 0 ? `💀 ${state.teamB?.name || 'TEAM B'} KNOCKOUT` : `⚠ ${state.teamB?.name || 'TEAM B'} RECOVERY`}
                  </p>
                  <div
                    className={`timer-display text-5xl md:text-7xl font-black ${
                      state.recoveryTimeB === 0 ? 'neon-text-red animate-knockout-pulse' : 'neon-text-yellow animate-pulse-glow'
                    }`}
                  >
                    {formatTime(state.recoveryTimeB!)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

