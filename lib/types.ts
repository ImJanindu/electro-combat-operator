// ============================================================
// ElectroCombat Operator — Type Definitions
// All data interfaces are storage-agnostic. The store layer
// can be backed by localStorage today or Firebase tomorrow.
// ============================================================

export interface Team {
  id: string;
  name: string;
  matchesPlayed: number;
  won: number;
  defeated: number;
  drawn: number;
  totalPoints: number;
}

export type MatchResult = 'teamA' | 'teamB' | 'draw';

export type MatchEventType =
  | 'match_start'
  | 'pause'
  | 'resume'
  | 'recovery_start'
  | 'recovery_resume'
  | 'knockout'
  | 'emergency_stop'
  | 'time_adjust'
  | 'match_end';

export interface MatchEvent {
  timestamp: number;       // Unix ms
  type: MatchEventType;
  description: string;
}

export interface MatchRecord {
  id: string;
  timestamp: number;       // Unix ms — when match was resolved
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  result: MatchResult;
  durationSeconds: number; // How long the match actually ran
  events: MatchEvent[];
}

export type TimerPhase =
  | 'idle'              // No match in progress
  | 'countdown'         // 3-2-1 pre-start
  | 'running'           // Main timer counting down
  | 'paused'            // Main timer paused (manual or recovery)
  | 'recovery'          // 30-second recovery countdown active
  | 'knockout'          // Recovery expired — knockout triggered
  | 'finished'          // Main timer reached 0
  | 'stopped'           // Emergency stop
  | 'result'            // Showing match result on display
  | 'show_leaderboard'; // Showing leaderboard on display

export interface TimerState {
  phase: TimerPhase;
  mainTime: number;          // Remaining seconds on the main clock
  maxTime: number;           // Total match duration (default 180)
  recoveryTimeA: number | null; // Remaining seconds for Team A recovery, null if not active
  recoveryTimeB: number | null; // Remaining seconds for Team B recovery, null if not active
  countdownValue: number;    // 3, 2, 1, or 0 during pre-start
  teamA: { id: string; name: string } | null;
  teamB: { id: string; name: string } | null;
  matchResult: {                     // Set after match resolution
    result: MatchResult;
    winnerName: string;              // Winner team name or 'Draw'
  } | null;
}

// Shape of the full app backup
export interface AppBackup {
  version: number;
  exportedAt: number;
  teams: Team[];
  matchHistory: MatchRecord[];
}
