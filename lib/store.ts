// ============================================================
// ElectroCombat Operator — Data Store
// Abstraction layer over localStorage. Each function here is a
// self-contained unit that can be individually replaced with a
// Firebase/Supabase call in the future without touching callers.
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Team, MatchRecord, MatchResult } from './types';

// --------------- Storage Keys ---------------
const TEAMS_KEY = 'electro-combat-teams';
const HISTORY_KEY = 'electro-combat-history';

// --------------- Low-level helpers ---------------

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// --------------- Team CRUD ---------------

export function getTeams(): Team[] {
  return readJSON<Team[]>(TEAMS_KEY, []);
}

export function saveTeams(teams: Team[]): void {
  writeJSON(TEAMS_KEY, teams);
}

export function addTeam(name: string): Team[] {
  const teams = getTeams();
  const newTeam: Team = {
    id: crypto.randomUUID(),
    name: name.trim(),
    matchesPlayed: 0,
    won: 0,
    defeated: 0,
    drawn: 0,
    totalPoints: 0,
  };
  const updated = [...teams, newTeam];
  saveTeams(updated);
  return updated;
}

export function removeTeam(id: string): Team[] {
  const updated = getTeams().filter((t) => t.id !== id);
  saveTeams(updated);
  return updated;
}

// --------------- Match Result ---------------

export function updateMatchResult(
  teamAId: string,
  teamBId: string,
  result: MatchResult
): Team[] {
  const teams = getTeams();

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);
  if (!teamA || !teamB) return teams;

  teamA.matchesPlayed += 1;
  teamB.matchesPlayed += 1;

  switch (result) {
    case 'teamA':
      teamA.won += 1;
      teamA.totalPoints += 1;
      teamB.defeated += 1;
      break;
    case 'teamB':
      teamB.won += 1;
      teamB.totalPoints += 1;
      teamA.defeated += 1;
      break;
    case 'draw':
      teamA.drawn += 1;
      teamA.totalPoints += 0.5;
      teamB.drawn += 1;
      teamB.totalPoints += 0.5;
      break;
  }

  saveTeams(teams);
  return [...teams];
}

// --------------- Match History ---------------

export function getMatchHistory(): MatchRecord[] {
  return readJSON<MatchRecord[]>(HISTORY_KEY, []);
}

export function addMatchRecord(record: MatchRecord): MatchRecord[] {
  const history = getMatchHistory();
  const updated = [...history, record];
  writeJSON(HISTORY_KEY, updated);
  return updated;
}

// --------------- React Hook ---------------

export function useTeamStore() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [history, setHistory] = useState<MatchRecord[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setTeams(getTeams());
    setHistory(getMatchHistory());
  }, []);

  const add = useCallback((name: string) => {
    const updated = addTeam(name);
    setTeams(updated);
  }, []);

  const remove = useCallback((id: string) => {
    const updated = removeTeam(id);
    setTeams(updated);
  }, []);

  const resolveMatch = useCallback(
    (
      teamAId: string,
      teamBId: string,
      result: MatchResult,
      record: MatchRecord
    ) => {
      const updatedTeams = updateMatchResult(teamAId, teamBId, result);
      const updatedHistory = addMatchRecord(record);
      setTeams(updatedTeams);
      setHistory(updatedHistory);
    },
    []
  );

  const refresh = useCallback(() => {
    setTeams(getTeams());
    setHistory(getMatchHistory());
  }, []);

  return { teams, history, add, remove, resolveMatch, refresh };
}
