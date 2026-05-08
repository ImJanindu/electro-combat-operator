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
const RECOVERY_TIME = 30;

function createInitialState(): TimerState {
  return {
    phase: 'idle',
    mainTime: DEFAULT_MATCH_TIME,
    maxTime: DEFAULT_MATCH_TIME,
    recoveryTime: RECOVERY_TIME,
    countdownValue: 3,
    teamA: null,
    teamB: null,
    knockoutTeam: null,
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

  // ---- Pre-start 3-2-1 countdown ----
  const startCountdown = useCallback(() => {
    clearInterval_();
    const s = stateRef.current;
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
        // Start main tick
        intervalRef.current = setInterval(() => {
          setState((prev) => {
            if (prev.mainTime <= 1) {
              clearInterval_();
              playBuzzer();
              logEvent('match_end', 'Timer reached zero');
              return { ...prev, mainTime: 0, phase: 'finished' };
            }
            return { ...prev, mainTime: prev.mainTime - 1 };
          });
        }, 1000);
      }
    }, 1000);
  }, [clearInterval_, logEvent]);

  // ---- Pause ----
  const pause = useCallback(() => {
    clearInterval_();
    logEvent('pause', 'Match paused');
    setState((prev) => ({ ...prev, phase: 'paused' }));
  }, [clearInterval_, logEvent]);

  // ---- Resume (from pause, not recovery) ----
  const resume = useCallback(() => {
    logEvent('resume', 'Match resumed');
    setState((prev) => ({ ...prev, phase: 'running' }));
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.mainTime <= 1) {
          clearInterval_();
          playBuzzer();
          logEvent('match_end', 'Timer reached zero');
          return { ...prev, mainTime: 0, phase: 'finished' };
        }
        return { ...prev, mainTime: prev.mainTime - 1 };
      });
    }, 1000);
  }, [clearInterval_, logEvent]);

  // ---- Emergency stop ----
  const emergencyStop = useCallback(() => {
    clearInterval_();
    playBuzzer();
    logEvent('emergency_stop', 'Emergency stop activated');
    setState((prev) => ({ ...prev, phase: 'stopped' }));
  }, [clearInterval_, logEvent]);

  // ---- Trigger 30s Recovery ----
  const startRecovery = useCallback(
    (team: 'A' | 'B') => {
      clearInterval_();
      playSiren();
      logEvent(
        'recovery_start',
        `Recovery started for Team ${team} (${team === 'A' ? stateRef.current.teamA?.name : stateRef.current.teamB?.name})`
      );
      setState((prev) => ({
        ...prev,
        phase: 'recovery',
        recoveryTime: RECOVERY_TIME,
        knockoutTeam: team,
      }));

      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.recoveryTime <= 1) {
            clearInterval_();
            playKnockout();
            logEvent('knockout', `Knockout! Team ${prev.knockoutTeam} failed to recover`);
            return { ...prev, recoveryTime: 0, phase: 'knockout' };
          }
          return { ...prev, recoveryTime: prev.recoveryTime - 1 };
        });
      }, 1000);
    },
    [clearInterval_, logEvent]
  );

  // ---- Resume from recovery ----
  const recoverResume = useCallback(() => {
    clearInterval_();
    logEvent('recovery_resume', 'Robot recovered — match resuming');
    setState((prev) => ({
      ...prev,
      phase: 'running',
      recoveryTime: RECOVERY_TIME,
      knockoutTeam: null,
    }));

    // Resume main timer from where it left off
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.mainTime <= 1) {
          clearInterval_();
          playBuzzer();
          logEvent('match_end', 'Timer reached zero');
          return { ...prev, mainTime: 0, phase: 'finished' };
        }
        return { ...prev, mainTime: prev.mainTime - 1 };
      });
    }, 1000);
  }, [clearInterval_, logEvent]);

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

  // ---- Show leaderboard on display ----
  const showLeaderboard = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'show_leaderboard' }));
  }, []);

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
    startRecovery,
    recoverResume,
    adjustTime,
    setTeams,
    setMatchDuration,
    reset,
    showResult,
    showLeaderboard,
    goToIdle,
    getMatchDuration,
  };
}
