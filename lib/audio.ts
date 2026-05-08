// ============================================================
// ElectroCombat Operator — Audio Helpers
// Placeholder .mp3 paths — drop real files into public/audio/
// ============================================================

function playAudio(src: string): void {
  try {
    const audio = new Audio(src);
    audio.volume = 0.8;
    audio.play().catch(() => {
      // Autoplay may be blocked — silently ignore
    });
  } catch {
    // Audio not available
  }
}

/** Short beep for each 3-2-1 countdown tick */
export function playCountdownBeep(): void {
  playAudio('/audio/countdown-beep.mp3');
}

/** Buzzer for match start and match end */
export function playBuzzer(): void {
  playAudio('/audio/buzzer.mp3');
}

/** Alarm siren for recovery timer */
export function playSiren(): void {
  playAudio('/audio/siren.mp3');
}

/** Knockout alert sound */
export function playKnockout(): void {
  playAudio('/audio/knockout.mp3');
}
