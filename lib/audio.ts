// ============================================================
// ElectroCombat Operator — Audio Helpers
// Placeholder .mp3 paths — drop real files into public/audio/
// ============================================================

const audioCache: Record<string, HTMLAudioElement> = {};

function playAudio(src: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    let audio = audioCache[src];
    
    if (!audio) {
      audio = new Audio(src);
      audio.volume = 0.8;
      audioCache[src] = audio;
    }

    // If the audio is currently playing, ignore the new request to prevent echoes.
    // This is especially important if the user uses a long audio file (e.g. a full "3-2-1-GO" sequence)
    // rather than a short 0.5s beep, preventing it from stacking over itself.
    if (!audio.paused && audio.currentTime > 0 && !audio.ended) {
      return;
    }

    audio.currentTime = 0;
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
  // playAudio('/audio/buzzer.mp3');
}

/** Alarm siren for recovery timer */
export function playSiren(): void {
  // playAudio('/audio/siren.mp3');
}

/** Knockout alert sound */
export function playKnockout(): void {
  // playAudio('/audio/knockout.mp3');
}
