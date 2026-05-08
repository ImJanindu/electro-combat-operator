// ============================================================
// ElectroCombat Operator — Timer Receiver Hook (Display Side)
// Listens to BroadcastChannel for timer state updates from
// the operator. Read-only — the display never sends.
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import type { TimerState, TimerPhase } from './types';

const CHANNEL_NAME = 'electro-combat-timer';

const DEFAULT_STATE: TimerState = {
  phase: 'idle' as TimerPhase,
  mainTime: 180,
  maxTime: 180,
  recoveryTime: 30,
  countdownValue: 3,
  teamA: null,
  teamB: null,
  knockoutTeam: null,
  matchResult: null,
};

export function useTimerReceiver() {
  const [state, setState] = useState<TimerState>(DEFAULT_STATE);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<TimerState>) => {
      setState(event.data);
    };

    return () => {
      channel.close();
    };
  }, []);

  return state;
}
