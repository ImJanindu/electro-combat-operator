// ============================================================
// ElectroCombat Operator — Backup / Restore
// Exports the entire tournament state as a portable JSON file.
// Import restores it on any machine.
// ============================================================

import type { AppBackup } from './types';
import { getTeams, saveTeams, getMatchHistory } from './store';

const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = 'electro-combat-last-backup';
const HISTORY_KEY = 'electro-combat-history';

export function exportBackup(): void {
  const backup: AppBackup = {
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    teams: getTeams(),
    matchHistory: getMatchHistory(),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `electro-combat-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
}

export async function importBackup(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as AppBackup;

    // Validate structure
    if (!data.version || !Array.isArray(data.teams) || !Array.isArray(data.matchHistory)) {
      return { success: false, error: 'Invalid backup file structure.' };
    }

    // Restore data
    saveTeams(data.teams);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data.matchHistory));

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse backup file.' };
  }
}

export function getLastBackupTime(): number | null {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  return raw ? parseInt(raw, 10) : null;
}
