// ------------------------------------------------------------
// SoundFX
// ------------------------------------------------------------
// Centralized audio system for Echoes of Fate
// ------------------------------------------------------------

type SoundKey =
  | "dice"
  | "discover"
  | "danger";

const SOUND_PATHS: Record<SoundKey, string> = {
  dice: "/assets/audio/sfx_dice_roll.mp3",
  discover: "/assets/audio/sfx_soft_chime_01.mp3",
  danger: "/assets/audio/sfx_low_rumble_01.mp3",
};

const cache: Partial<Record<SoundKey, HTMLAudioElement>> = {};

function getAudio(key: SoundKey): HTMLAudioElement {
  if (!cache[key]) {
    const audio = new Audio(SOUND_PATHS[key]);
    audio.preload = "auto";
    cache[key] = audio;
  }

  return cache[key]!;
}

export function playSound(key: SoundKey) {
  try {
    const audio = getAudio(key);
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // fail silently (autoplay restrictions etc.)
  }
}
