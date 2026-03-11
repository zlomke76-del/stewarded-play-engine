import type { MusicMode } from "./demoRuntimeTypes";

export const AMBIENT_TRACKS = [
  "/audio/music/dungeon_ambient1.mp3",
  "/audio/music/dungeon_ambient2.mp3",
] as const;

export const COMBAT_TRACKS = [
  "/audio/music/combat_theme1.mp3",
  "/audio/music/combat_theme2.mp3",
] as const;

export function chooseNextTrack(
  tracks: readonly string[],
  lastIndexRef: React.MutableRefObject<number>
): string {
  if (tracks.length <= 1) {
    lastIndexRef.current = 0;
    return tracks[0] ?? "";
  }

  let nextIndex = Math.floor(Math.random() * tracks.length);
  if (nextIndex === lastIndexRef.current) {
    nextIndex = (nextIndex + 1) % tracks.length;
  }

  lastIndexRef.current = nextIndex;
  return tracks[nextIndex];
}

export function pauseIntroTheme(
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
  resetTime = true
) {
  const intro = introAudioRef.current;
  if (!intro) return;

  try {
    intro.pause();
    if (resetTime) intro.currentTime = 0;
  } catch {
    // fail silently
  }
}

export function pauseBackgroundTheme(
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>
) {
  const bgm = bgmAudioRef.current;
  if (!bgm) return;

  try {
    bgm.pause();
    bgm.currentTime = 0;
    bgm.removeAttribute("src");
    bgm.load();
  } catch {
    // fail silently
  }
}

export function stopAmbience(
  ambienceAudioRef: React.MutableRefObject<HTMLAudioElement | null>
) {
  const ambience = ambienceAudioRef.current;
  if (!ambience) return;

  try {
    ambience.pause();
    ambience.currentTime = 0;
  } catch {
    // fail silently
  }
}

export function stopAllMusic(args: {
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  ambienceAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
}) {
  pauseIntroTheme(args.introAudioRef, true);
  pauseBackgroundTheme(args.bgmAudioRef);
  stopAmbience(args.ambienceAudioRef);
  args.currentMusicModeRef.current = "none";
}

export function startLoopingTrack(args: {
  src: string;
  volume: number;
  mode: Exclude<MusicMode, "none" | "intro">;
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
}) {
  const { src, volume, mode, introAudioRef, bgmAudioRef, currentMusicModeRef } = args;
  const bgm = bgmAudioRef.current;
  if (!bgm || !src) return;

  try {
    pauseIntroTheme(introAudioRef, true);

    const sameSrc = bgm.getAttribute("src") === src;
    bgm.loop = true;
    bgm.volume = volume;

    if (!sameSrc) {
      bgm.src = src;
      bgm.load();
    }

    currentMusicModeRef.current = mode;
    const playPromise = bgm.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {
    // fail silently
  }
}

export function startAmbientTheme(args: {
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
  lastAmbientIndexRef: React.MutableRefObject<number>;
}) {
  const src = chooseNextTrack(AMBIENT_TRACKS, args.lastAmbientIndexRef);
  startLoopingTrack({
    src,
    volume: 0.36,
    mode: "ambient",
    introAudioRef: args.introAudioRef,
    bgmAudioRef: args.bgmAudioRef,
    currentMusicModeRef: args.currentMusicModeRef,
  });
}

export function startCombatTheme(args: {
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
  lastCombatIndexRef: React.MutableRefObject<number>;
}) {
  const src = chooseNextTrack(COMBAT_TRACKS, args.lastCombatIndexRef);
  startLoopingTrack({
    src,
    volume: 0.72,
    mode: "combat",
    introAudioRef: args.introAudioRef,
    bgmAudioRef: args.bgmAudioRef,
    currentMusicModeRef: args.currentMusicModeRef,
  });
}

export function playIntroTheme(args: {
  introAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentMusicModeRef: React.MutableRefObject<MusicMode>;
  loop?: boolean;
}) {
  const { introAudioRef, bgmAudioRef, currentMusicModeRef, loop = false } = args;
  const intro = introAudioRef.current;
  if (!intro) return;

  try {
    pauseBackgroundTheme(bgmAudioRef);

    intro.pause();
    intro.currentTime = 0;
    intro.loop = loop;
    intro.volume = 0.72;
    currentMusicModeRef.current = "intro";

    const playPromise = intro.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch {
    // fail silently
  }
}
