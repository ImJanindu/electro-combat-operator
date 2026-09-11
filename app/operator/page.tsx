'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useTimer } from '@/lib/use-timer';
import { useTeamStore } from '@/lib/store';
import { exportBackup, importBackup, getLastBackupTime } from '@/lib/backup';
import type { MatchResult, MatchRecord } from '@/lib/types';
import { PinDialog } from '@/components/PinDialog';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OperatorPage() {
  const timer = useTimer();
  const store = useTeamStore();

  const handleHomeNavigation = (e: React.MouseEvent) => {
    if (timer.state.phase !== 'idle') {
      e.preventDefault();
      alert("A match is currently ongoing! Please end or resolve the match before leaving the operator dashboard.");
    }
  };

  // Prevent accidental tab close/refresh during match
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).require;
    if (isElectron) return; // Let Electron main process handle window close
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timer.state.phase !== 'idle') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timer.state.phase]);

  // Team selection
  const [selectedTeamAId, setSelectedTeamAId] = useState('');
  const [selectedTeamBId, setSelectedTeamBId] = useState('');

  // Team management
  const [newTeamName, setNewTeamName] = useState('');

  // Match duration input (minutes)
  const [durationMin, setDurationMin] = useState(3);

  // Backup state
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [backupReminder, setBackupReminder] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recovery team target
  const [recoveryTarget, setRecoveryTarget] = useState<'A' | 'B'>('A');

  useEffect(() => {
    setLastBackup(getLastBackupTime());
  }, []);

  // Sync selected teams → timer
  useEffect(() => {
    const teamA = store.teams.find((t) => t.id === selectedTeamAId) ?? null;
    const teamB = store.teams.find((t) => t.id === selectedTeamBId) ?? null;
    timer.setTeams(
      teamA ? { id: teamA.id, name: teamA.name } : null,
      teamB ? { id: teamB.id, name: teamB.name } : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamAId, selectedTeamBId, store.teams]);

  // ---- Handlers ----

  // Pin Dialog state
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<string | null>(null);

  const handleAddTeam = useCallback(() => {
    const name = newTeamName.trim();
    if (!name) return;
    store.add(name);
    setNewTeamName('');
  }, [newTeamName, store]);

  const handleRemoveTeam = useCallback((id: string) => {
    setTeamToRemove(id);
    setPinDialogOpen(true);
  }, []);

  const onConfirmRemove = (pin: string) => {
    setPinDialogOpen(false);
    const correctPin = process.env.NEXT_PUBLIC_CLEAR_HISTORY_PIN || '23249';
    if (pin === correctPin && teamToRemove) {
      store.remove(teamToRemove);
    } else if (pin) {
      alert('Incorrect PIN.');
    }
    setTeamToRemove(null);
  };

  const onCancelRemove = () => {
    setPinDialogOpen(false);
    setTeamToRemove(null);
  };

  const handleStart = useCallback(() => {
    timer.setMatchDuration(durationMin * 60);
    setTimeout(() => timer.startCountdown(), 50);
  }, [timer, durationMin]);

  const handleResolve = useCallback(
    (result: MatchResult) => {
      if (!timer.state.teamA || !timer.state.teamB) return;

      const record: MatchRecord = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        teamAId: timer.state.teamA.id,
        teamAName: timer.state.teamA.name,
        teamBId: timer.state.teamB.id,
        teamBName: timer.state.teamB.name,
        result,
        durationSeconds: timer.getMatchDuration(),
        events: timer.matchEvents,
      };

      store.resolveMatch(
        timer.state.teamA.id,
        timer.state.teamB.id,
        result,
        record
      );

      // Show result on display tab instead of immediately resetting
      const winnerName =
        result === 'teamA'
          ? timer.state.teamA.name
          : result === 'teamB'
          ? timer.state.teamB.name
          : 'Draw';
      timer.showResult(result, winnerName);

      setBackupReminder(true);
      setTimeout(() => setBackupReminder(false), 8000);
    },
    [timer, store]
  );

  const handleExport = useCallback(() => {
    exportBackup();
    setLastBackup(Date.now());
    setBackupReminder(false);
  }, []);

  const handleImport = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const result = await importBackup(file);
    if (result.success) {
      setImportMsg('✅ Backup restored successfully!');
      store.refresh();
    } else {
      setImportMsg(`❌ ${result.error}`);
    }
    setTimeout(() => setImportMsg(''), 5000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [store]);

  const { phase } = timer.state;
  const isIdle = phase === 'idle';
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';
  const isRecovery = timer.state.recoveryTimeA !== null || timer.state.recoveryTimeB !== null;
  const isKnockout = phase === 'knockout';
  const isFinished = phase === 'finished';
  const isStopped = phase === 'stopped';
  const isCountdown = phase === 'countdown';
  const isResult = phase === 'result';
  const isShowLeaderboard = phase === 'show_leaderboard';
  const matchInProgress = isRunning || isPaused || isCountdown;
  const matchEnded = isFinished || isKnockout || isStopped;
  const isPostMatch = isResult || isShowLeaderboard;
  const teamsSelected = !!selectedTeamAId && !!selectedTeamBId && selectedTeamAId !== selectedTeamBId;

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/select fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // S — Start match
      if (key === 's' && isIdle && teamsSelected) {
        e.preventDefault();
        handleStart();
        return;
      }

      // Space — Pause / Resume toggle
      if (key === ' ') {
        e.preventDefault();
        if (isRunning) timer.pause();
        else if (isPaused) timer.resume();
        return;
      }

      // + — Add 1 second
      if (key === '+' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        if (matchInProgress || isPaused) timer.adjustTime(1);
        return;
      }

      // - — Reduce 1 second
      if (key === '-') {
        e.preventDefault();
        if (matchInProgress || isPaused) timer.adjustTime(-1);
        return;
      }

      // Enter — Emergency Stop
      if (key === 'enter' && matchInProgress) {
        e.preventDefault();
        timer.emergencyStop();
        return;
      }

      // Shift — Toggle recovery target team
      if (e.key === 'Shift') {
        e.preventDefault();
        setRecoveryTarget((prev) => (prev === 'A' ? 'B' : 'A'));
        return;
      }

      // Backspace — Trigger Recovery / Resume from Recovery
      if (key === 'backspace') {
        e.preventDefault();
        if (isRunning || isPaused) timer.toggleRecovery(recoveryTarget);
        return;
      }

      // Match resolution shortcuts — only after round ends
      if (matchEnded) {
        // A — Team A Wins
        if (key === 'a') {
          e.preventDefault();
          handleResolve('teamA');
          return;
        }

        // B — Team B Wins
        if (key === 'b') {
          e.preventDefault();
          handleResolve('teamB');
          return;
        }

        // D — Draw
        if (key === 'd') {
          e.preventDefault();
          handleResolve('draw');
          return;
        }

        // R — Reset / Cancel
        if (key === 'r') {
          e.preventDefault();
          timer.reset();
          return;
        }
      }

      // Post-match only shortcuts
      if (isPostMatch) {
        // I — Return to Idle
        if (key === 'i') {
          e.preventDefault();
          timer.goToIdle();
          setSelectedTeamAId('');
          setSelectedTeamBId('');
          return;
        }

        // L — Show Leaderboard
        if (key === 'l') {
          e.preventDefault();
          timer.showLeaderboard();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isIdle, isRunning, isPaused, isRecovery, isPostMatch,
    matchInProgress, matchEnded, teamsSelected, recoveryTarget,
    timer, handleStart, handleResolve,
  ]);

  return (
    <div className="min-h-screen p-4 md:p-6 scanlines">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link 
            href="/" 
            onClick={handleHomeNavigation}
            className="text-muted text-xs font-mono tracking-wider hover:text-neon-blue transition-colors"
          >
            ← HOME
          </Link>
          <h1 className="font-mono text-xl md:text-2xl font-bold neon-text-blue mt-1 tracking-wide">
            OPERATOR PANEL
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Backup controls */}
          <button onClick={handleExport} className="btn-neon btn-green text-[0.65rem] py-1.5 px-3">
            ↓ Export
          </button>
          <label className="btn-neon btn-yellow text-[0.65rem] py-1.5 px-3 cursor-pointer">
            ↑ Import
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Backup messages */}
      {importMsg && (
        <div className="panel mb-4 text-sm font-mono animate-slide-up">
          {importMsg}
        </div>
      )}
      {backupReminder && (
        <div className="neon-border-green panel mb-4 text-sm font-mono animate-slide-up flex items-center justify-between">
          <span className="neon-text-green">💾 Match saved! Consider exporting a backup.</span>
          <button onClick={handleExport} className="btn-neon btn-green text-[0.6rem] py-1 px-2 ml-3">
            Export Now
          </button>
        </div>
      )}
      {lastBackup && !backupReminder && (
        <p className="text-[0.65rem] text-muted mb-4 font-mono">
          Last backup: {new Date(lastBackup).toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ====== LEFT COLUMN: Team Management ====== */}
        <div className="space-y-4">
          <div className="panel-glow">
            <h2 className="font-mono text-sm font-bold tracking-wider text-neon-blue mb-3">
              TEAM ROSTER
            </h2>
            <div className="flex gap-2 mb-3">
              <input
                className="input-neon flex-1 text-sm"
                placeholder="New team name..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
              />
              <button
                onClick={handleAddTeam}
                disabled={!newTeamName.trim()}
                className="btn-neon btn-blue text-[0.65rem] py-1.5"
              >
                + ADD
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {store.teams.length === 0 && (
                <p className="text-xs text-muted italic">No teams added yet.</p>
              )}
              {store.teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded bg-surface-alt/50 group"
                >
                  <span className="text-sm truncate">{team.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] text-muted font-mono">
                      {team.totalPoints}pt
                    </span>
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      className="text-neon-red/50 hover:text-neon-red text-xs transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove team"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Setup */}
          <div className="panel-glow">
            <h2 className="font-mono text-sm font-bold tracking-wider text-neon-blue mb-3">
              MATCH SETUP
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted font-mono block mb-1">
                  TEAM A
                </label>
                <select
                  className="select-neon w-full text-sm"
                  value={selectedTeamAId}
                  onChange={(e) => setSelectedTeamAId(e.target.value)}
                  disabled={matchInProgress || matchEnded}
                >
                  <option value="">— Select Team A —</option>
                  {store.teams
                    .filter((t) => t.id !== selectedTeamBId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="text-center text-neon-red font-mono text-xs font-bold tracking-widest">
                VS
              </div>
              <div>
                <label className="text-xs text-muted font-mono block mb-1">
                  TEAM B
                </label>
                <select
                  className="select-neon w-full text-sm"
                  value={selectedTeamBId}
                  onChange={(e) => setSelectedTeamBId(e.target.value)}
                  disabled={matchInProgress || matchEnded}
                >
                  <option value="">— Select Team B —</option>
                  {store.teams
                    .filter((t) => t.id !== selectedTeamAId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted font-mono block mb-1">
                  DURATION (MINUTES)
                </label>
                <input
                  type="number"
                  className="input-neon w-full text-sm"
                  value={durationMin}
                  min={1}
                  max={30}
                  onChange={(e) =>
                    setDurationMin(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={matchInProgress || matchEnded}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ====== CENTER COLUMN: Timer & Controls ====== */}
        <div className="space-y-4">
          {/* Timer Display */}
          <div className="panel-glow text-center relative overflow-hidden">
            {/* Pre-start countdown overlay */}
            {isCountdown && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <span
                  key={timer.state.countdownValue}
                  className="timer-display text-8xl md:text-9xl font-black neon-text-blue animate-countdown-zoom"
                >
                  {timer.state.countdownValue}
                </span>
              </div>
            )}

            {/* Team names */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-[0.6rem] font-mono text-muted tracking-widest">TEAM A</p>
                <p className="font-mono text-sm font-bold neon-text-blue truncate max-w-[120px]">
                  {timer.state.teamA?.name || '—'}
                </p>
              </div>
              <span className="font-mono text-xs text-neon-red font-bold tracking-widest">
                VS
              </span>
              <div className="text-right">
                <p className="text-[0.6rem] font-mono text-muted tracking-widest">TEAM B</p>
                <p className="font-mono text-sm font-bold neon-text-red truncate max-w-[120px]">
                  {timer.state.teamB?.name || '—'}
                </p>
              </div>
            </div>

            {/* Main clock */}
            <div className={`timer-display text-6xl md:text-7xl font-black tracking-wider py-4 ${
              isRunning ? 'neon-text-green' :
              isPaused ? 'neon-text-yellow animate-pulse-glow' :
              isRecovery ? 'neon-text-yellow animate-pulse-glow' :
              isFinished ? 'neon-text-blue' :
              isKnockout ? 'neon-text-red animate-knockout-pulse' :
              isStopped ? 'neon-text-red' :
              'text-foreground/60'
            }`}>
              {formatTime(timer.state.mainTime)}
            </div>

            {/* Phase label */}
            <p className={`font-mono text-xs tracking-[0.3em] uppercase mt-1 ${
              isRunning ? 'text-neon-green' :
              isPaused ? 'text-neon-yellow' :
              isRecovery ? 'text-neon-red animate-pulse-glow' :
              isKnockout ? 'text-neon-red' :
              isFinished ? 'text-neon-blue' :
              isStopped ? 'text-neon-red' :
              'text-muted'
            }`}>
              {phase === 'idle' && 'READY'}
              {phase === 'countdown' && 'GET READY'}
              {phase === 'running' && 'MATCH IN PROGRESS'}
              {phase === 'paused' && '⏸ PAUSED'}
              {phase === 'recovery' && '⚠ RECOVERY IN PROGRESS'}
              {phase === 'knockout' && '💀 KNOCKOUT'}
              {phase === 'finished' && '🏁 MATCH OVER'}
              {phase === 'stopped' && '🛑 EMERGENCY STOP'}
            </p>
          </div>

          {/* Recovery Timer */}
          {/* Recovery Timers */}
          {(timer.state.recoveryTimeA !== null || timer.state.recoveryTimeB !== null || isKnockout) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-slide-up">
              {/* Team A Recovery */}
              {(timer.state.recoveryTimeA !== null || (isKnockout && timer.state.recoveryTimeA === 0)) && (
                <div className={`panel text-center ${timer.state.recoveryTimeA === 0 ? 'neon-border-red' : 'neon-border-yellow'}`}>
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] text-neon-yellow uppercase mb-2">
                    {timer.state.recoveryTimeA === 0 ? '💀 KNOCKOUT' : '⚠ RECOVERY (A)'}
                  </p>
                  <div className={`timer-display text-4xl md:text-5xl font-black ${timer.state.recoveryTimeA === 0 ? 'neon-text-red animate-knockout-pulse' : 'neon-text-yellow animate-pulse-glow'}`}>
                    {formatTime(timer.state.recoveryTimeA!)}
                  </div>
                </div>
              )}
              {/* Team B Recovery */}
              {(timer.state.recoveryTimeB !== null || (isKnockout && timer.state.recoveryTimeB === 0)) && (
                <div className={`panel text-center ${timer.state.recoveryTimeB === 0 ? 'neon-border-red' : 'neon-border-yellow'}`}>
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] text-neon-yellow uppercase mb-2">
                    {timer.state.recoveryTimeB === 0 ? '💀 KNOCKOUT' : '⚠ RECOVERY (B)'}
                  </p>
                  <div className={`timer-display text-4xl md:text-5xl font-black ${timer.state.recoveryTimeB === 0 ? 'neon-text-red animate-knockout-pulse' : 'neon-text-yellow animate-pulse-glow'}`}>
                    {formatTime(timer.state.recoveryTimeB!)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="panel-glow">
            <h2 className="font-mono text-sm font-bold tracking-wider text-neon-blue mb-3">
              CONTROLS
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {/* Start */}
              <button
                onClick={handleStart}
                disabled={!teamsSelected || !isIdle}
                className="btn-neon btn-solid-blue col-span-2 py-3 text-sm"
              >
                ▶ START MATCH
              </button>

              {/* Pause / Resume */}
              <button
                onClick={timer.pause}
                disabled={!isRunning}
                className="btn-neon btn-yellow"
              >
                ⏸ PAUSE
              </button>
              <button
                onClick={timer.resume}
                disabled={!isPaused}
                className="btn-neon btn-green"
              >
                ▶ RESUME
              </button>

              {/* Time adjustments */}
              <button
                onClick={() => timer.adjustTime(-1)}
                disabled={!matchInProgress && !isPaused}
                className="btn-neon btn-blue"
              >
                −1 SEC
              </button>
              <button
                onClick={() => timer.adjustTime(1)}
                disabled={!matchInProgress && !isPaused}
                className="btn-neon btn-blue"
              >
                +1 SEC
              </button>

              {/* Emergency Stop */}
              <button
                onClick={timer.emergencyStop}
                disabled={!matchInProgress}
                className="btn-neon btn-red col-span-2 py-2.5"
              >
                🛑 EMERGENCY STOP
              </button>
            </div>
          </div>
        </div>

        {/* ====== RIGHT COLUMN: Recovery & Resolution ====== */}
        <div className="space-y-4">
          {/* Recovery Panel */}
          <div className="panel-glow">
            <h2 className="font-mono text-sm font-bold tracking-wider text-neon-red mb-3">
              ⚠ RECOVERY SYSTEM
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted font-mono block mb-1">
                  RECOVERING TEAM
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRecoveryTarget('A')}
                    className={`flex-1 btn-neon text-[0.65rem] py-1.5 ${
                      recoveryTarget === 'A' ? 'btn-blue' : 'border-border text-muted'
                    }`}
                  >
                    Team A
                  </button>
                  <button
                    onClick={() => setRecoveryTarget('B')}
                    className={`flex-1 btn-neon text-[0.65rem] py-1.5 ${
                      recoveryTarget === 'B' ? 'btn-red' : 'border-border text-muted'
                    }`}
                  >
                    Team B
                  </button>
                </div>
              </div>

              <button
                onClick={() => timer.toggleRecovery(recoveryTarget)}
                disabled={!isRunning && !isPaused}
                className="btn-neon btn-red w-full py-2.5 mt-2"
              >
                ⚡ TOGGLE 15s RECOVERY
              </button>
            </div>
          </div>

          {/* Match Resolution */}
          <div className="panel-glow">
            <h2 className="font-mono text-sm font-bold tracking-wider text-neon-yellow mb-3">
              🏁 MATCH RESOLUTION
            </h2>
            {matchEnded ? (
              <div className="space-y-2 animate-slide-up">
                <button
                  onClick={() => handleResolve('teamA')}
                  className="btn-neon btn-blue w-full py-2.5"
                >
                  🏆 {timer.state.teamA?.name || 'Team A'} WINS
                </button>
                <button
                  onClick={() => handleResolve('teamB')}
                  className="btn-neon btn-red w-full py-2.5"
                >
                  🏆 {timer.state.teamB?.name || 'Team B'} WINS
                </button>
                <button
                  onClick={() => handleResolve('draw')}
                  className="btn-neon btn-yellow w-full py-2.5"
                >
                  🤝 DRAW
                </button>
                <button
                  onClick={timer.reset}
                  className="btn-neon border-border text-muted w-full py-2 text-[0.65rem] mt-1"
                >
                  CANCEL / RESET
                </button>
              </div>
            ) : isPostMatch ? (
              <p className="text-xs text-neon-green italic font-mono">
                ✅ Match resolved — result is showing on display.
              </p>
            ) : (
              <p className="text-xs text-muted italic font-mono">
                {matchInProgress
                  ? 'Match in progress... resolution available after match ends.'
                  : 'Start a match to enable resolution.'}
              </p>
            )}
          </div>

          {/* Display Control — visible after match resolution */}
          {isPostMatch && (
            <div className="panel-glow animate-slide-up">
              <h2 className="font-mono text-sm font-bold tracking-wider text-neon-blue mb-3">
                📺 DISPLAY CONTROL
              </h2>
              <div className="space-y-2">
                <p className="text-[0.65rem] text-muted font-mono mb-2">
                  Currently showing: <span className={isResult ? 'neon-text-yellow' : 'neon-text-blue'}>
                    {isResult ? 'MATCH RESULT' : 'LEADERBOARD'}
                  </span>
                </p>
                {isResult && (
                  <button
                    onClick={timer.showLeaderboard}
                    className="btn-neon btn-yellow w-full py-2.5"
                  >
                    📊 SHOW LEADERBOARD
                  </button>
                )}
                {isShowLeaderboard && (
                  <button
                    onClick={() => {
                      const mr = timer.state.matchResult;
                      if (mr) timer.showResult(mr.result, mr.winnerName);
                    }}
                    className="btn-neon btn-yellow w-full py-2.5"
                  >
                    🏆 SHOW RESULT AGAIN
                  </button>
                )}
                <button
                  onClick={() => {
                    timer.goToIdle();
                    setSelectedTeamAId('');
                    setSelectedTeamBId('');
                  }}
                  className="btn-neon btn-blue w-full py-2.5"
                >
                  ⏹ RETURN TO IDLE
                </button>
              </div>
            </div>
          )}

          {/* Match Events Log */}
          {timer.matchEvents.length > 0 && (
            <div className="panel">
              <h2 className="font-mono text-sm font-bold tracking-wider text-muted mb-2">
                EVENT LOG
              </h2>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {timer.matchEvents.map((evt, i) => (
                  <div key={i} className="flex items-start gap-2 text-[0.65rem] font-mono">
                    <span className="text-muted shrink-0">
                      {formatTimestamp(evt.timestamp)}
                    </span>
                    <span className={`${
                      evt.type === 'knockout' ? 'text-neon-red' :
                      evt.type === 'recovery_start' ? 'text-neon-orange' :
                      evt.type === 'match_start' || evt.type === 'match_end' ? 'text-neon-blue' :
                      'text-foreground/70'
                    }`}>
                      {evt.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PinDialog
        isOpen={pinDialogOpen}
        title="Enter PIN to delete team"
        onConfirm={onConfirmRemove}
        onCancel={onCancelRemove}
      />
    </div>
  );
}

