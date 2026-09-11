// ============================================================
// ElectroCombat Operator — Timer Hook (Operator Side)
// Manages all timer phases and broadcasts state via
// BroadcastChannel for the /display page to consume.
// ============================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { TimerState, TimerPhase, MatchEvent } from './types';
import { playCountdownBeep, playBuzzer, playSiren, playKnockout } from './audio';

const CHANNEL_NAME = 'electro-combat-timer';
const DEFAULT_MATCH_TIME = 180; // 3 minutes
const RECOVERY_TIME = 15;

function createInitialState(): TimerState {
  return {
    phase: 'idle',
    mainTime: DEFAULT_MATCH_TIME,
    maxTime: DEFAULT_MATCH_TIME,
    recoveryTimeA: null,
    recoveryTimeB: null,
    countdownValue: 3,
    teamA: null,
    teamB: null,
    matchResult: null,
  };
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(createInitialState);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchStartTimestamp, setMatchStartTimestamp] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef<TimerState>(createInitialState());

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Initialize BroadcastChannel
  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast state whenever it changes
  useEffect(() => {
    channelRef.current?.postMessage(state);
    
    // Notify Electron Main process if running in Desktop mode
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const isActive = !['idle', 'result', 'show_leaderboard'].includes(state.phase);
        ipcRenderer.send('set-match-active', isActive);
      } catch (err) {
        // Ignore if not in Electron
      }
    }
  }, [state]);

  const logEvent = useCallback(
    (type: MatchEvent['type'], description: string) => {
      setMatchEvents((prev) => [
        ...prev,
        { timestamp: Date.now(), type, description },
      ]);
    },
    []
  );

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startMainTicker = useCallback(() => {
    clearInterval_();
    intervalRef.current = setInterval(() => {
      let ended = false;
      let isKnockout = false;
      setState((prev) => {
        const next = { ...prev };
        
        // Tick recovery A
        if (next.recoveryTimeA !== null) {
          next.recoveryTimeA -= 1;
          if (next.recoveryTimeA <= 0) {
            next.recoveryTimeA = 0;
            next.phase = 'knockout';
            isKnockout = true;
          }
        }

        // Tick recovery B
        if (next.recoveryTimeB !== null) {
          next.recoveryTimeB -= 1;
          if (next.recoveryTimeB <= 0) {
            next.recoveryTimeB = 0;
            next.phase = 'knockout';
            isKnockout = true;
          }
        }

        // Tick main time if not already knocked out
        if (!isKnockout) {
          if (next.mainTime <= 1) {
            next.mainTime = 0;
            next.phase = 'finished';
            ended = true;
          } else {
            next.mainTime -= 1;
          }
        }

        return next;
      });

      if (isKnockout) {
        clearInterval_();
        playKnockout();
        logEvent('knockout', 'Match ended by Knockout');
      } else if (ended) {
        clearInterval_();
        playBuzzer();
        logEvent('match_end', 'Timer reached zero');
      }
    }, 1000);
  }, [clearInterval_, logEvent]);

  // ---- Pre-start 3-2-1 countdown ----
  const startCountdown = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'countdown' || s.phase === 'running') return;
    
    clearInterval_();
    if (!s.teamA || !s.teamB) return;

    setState((prev) => ({ ...prev, phase: 'countdown', countdownValue: 3 }));
    playCountdownBeep();

    let count = 3;
    intervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        playCountdownBeep();
        setState((prev) => ({ ...prev, countdownValue: count }));
      } else {
        // Countdown finished — start main timer
        clearInterval_();
        playBuzzer();
        setMatchStartTimestamp(Date.now());
        logEvent('match_start', 'Match started');
        setState((prev) => ({
          ...prev,
          phase: 'running',
          countdownValue: 0,
        }));
        startMainTicker();
      }
    }, 1000);
  }, [clearInterval_, logEvent, startMainTicker]);

  // ---- Pause ----
  const pause = useCallback(() => {
    clearInterval_();
    logEvent('pause', 'Match paused');
    setState((prev) => ({ ...prev, phase: 'paused' }));
  }, [clearInterval_, logEvent]);

  // ---- Resume (from pause) ----
  const resume = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'paused') return;
    
    logEvent('resume', 'Match resumed');
    setState((prev) => ({ ...prev, phase: 'running' }));
    startMainTicker();
  }, [logEvent, startMainTicker]);

  // ---- Emergency stop ----
  const emergencyStop = useCallback(() => {
    clearInterval_();
    playBuzzer();
    logEvent('emergency_stop', 'Emergency stop activated');
    setState((prev) => ({ ...prev, phase: 'stopped' }));
  }, [clearInterval_, logEvent]);

  // ---- Toggle 15s Recovery ----
  const toggleRecovery = useCallback((team: 'A' | 'B') => {
    const s = stateRef.current;
    if (s.phase !== 'running' && s.phase !== 'paused') return;

    let startedRecovery = false;

    setState((prev) => {
      const next = { ...prev };
      if (team === 'A') {
        if (next.recoveryTimeA === null) {
           next.recoveryTimeA = RECOVERY_TIME;
           startedRecovery = true;
        } else {
           next.recoveryTimeA = null;
        }
      } else {
        if (next.recoveryTimeB === null) {
           next.recoveryTimeB = RECOVERY_TIME;
           startedRecovery = true;
        } else {
           next.recoveryTimeB = null;
        }
      }
      return next;
    });

    setTimeout(() => {
      if (startedRecovery) {
         playSiren();
         logEvent('recovery_start', `Recovery started for Team ${team}`);
      } else {
         logEvent('recovery_resume', `Robot recovered — Team ${team}`);
      }
    }, 0);
  }, [logEvent]);

  // ---- +/- 1 second adjustments ----
  const adjustTime = useCallback(
    (delta: number) => {
      logEvent('time_adjust', `Time adjusted by ${delta > 0 ? '+' : ''}${delta}s`);
      setState((prev) => ({
        ...prev,
        mainTime: Math.max(0, prev.mainTime + delta),
      }));
    },
    [logEvent]
  );

  // ---- Set teams ----
  const setTeams = useCallback(
    (
      teamA: { id: string; name: string } | null,
      teamB: { id: string; name: string } | null
    ) => {
      setState((prev) => ({ ...prev, teamA, teamB }));
    },
    []
  );

  // ---- Set match duration ----
  const setMatchDuration = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      mainTime: seconds,
      maxTime: seconds,
    }));
  }, []);

  // ---- Reset to idle ----
  const reset = useCallback(() => {
    clearInterval_();
    setMatchEvents([]);
    setMatchStartTimestamp(0);
    setState(createInitialState());
  }, [clearInterval_]);

  // ---- Show result on display ----
  const showResult = useCallback(
    (result: import('./types').MatchResult, winnerName: string) => {
      setState((prev) => ({
        ...prev,
        phase: 'result',
        matchResult: { result, winnerName },
      }));
    },
    []
  );



  // ---- Return display to idle ----
  const goToIdle = useCallback(() => {
    clearInterval_();
    setMatchEvents([]);
    setMatchStartTimestamp(0);
    setState(createInitialState());
  }, [clearInterval_]);

  // Compute match duration in seconds for the record
  const getMatchDuration = useCallback((): number => {
    if (matchStartTimestamp === 0) return 0;
    return Math.round((Date.now() - matchStartTimestamp) / 1000);
  }, [matchStartTimestamp]);

  return {
    state,
    matchEvents,
    startCountdown,
    pause,
    resume,
    emergencyStop,
    toggleRecovery,
    adjustTime,
    setTeams,
    setMatchDuration,
    reset,
    showResult,
    goToIdle,
    getMatchDuration,
  };
}
