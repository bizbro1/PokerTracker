let audioContext: AudioContext | null = null;
const audioCache = new Map<string, HTMLAudioElement>();

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playFallbackChime(): void {
  try {
    const ctx = getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    osc.frequency.setValueAtTime(783.99, now + 0.24);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Audio may be blocked until user interaction
  }
}

function playClip(src: string, fallback?: () => void): void {
  try {
    let audio = audioCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      audioCache.set(src, audio);
    }
    audio.currentTime = 0;
    void audio.play().catch(() => fallback?.());
  } catch {
    fallback?.();
  }
}

export function playBlindLevelUpSound(): void {
  playClip('/blinds-up.mp3', playFallbackChime);
}

export function playStackUpdateSound(): void {
  playClip('/stack-update.mp3');
}
