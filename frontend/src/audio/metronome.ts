import { useEffect, useRef } from "react";
import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";

const accentSrc = require("../../assets/audio/click-accent.wav");
const clickSrc = require("../../assets/audio/click.wav");

// Audible metronome + count-in using pre-loaded click players.
export function useMetronome() {
  const players = useRef<{ accent?: AudioPlayer; click?: AudioPlayer }>({});
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const beat = useRef(0);

  useEffect(() => {
    try {
      players.current.accent = createAudioPlayer(accentSrc);
      players.current.click = createAudioPlayer(clickSrc);
    } catch {}
    return () => {
      if (timer.current) clearInterval(timer.current);
      try {
        players.current.accent?.remove();
        players.current.click?.remove();
      } catch {}
    };
  }, []);

  const tick = (i: number) => {
    const p = i % 4 === 0 ? players.current.accent : players.current.click;
    if (!p) return;
    try {
      p.seekTo(0);
      p.play();
    } catch {}
  };

  const start = (bpm: number) => {
    stop();
    beat.current = 0;
    const interval = 60000 / Math.max(30, Math.min(300, bpm));
    tick(0);
    beat.current = 1;
    timer.current = setInterval(() => {
      tick(beat.current);
      beat.current += 1;
    }, interval);
  };

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const countIn = (bpm: number, beats = 4, onBeat?: (remaining: number) => void) =>
    new Promise<void>((resolve) => {
      const interval = 60000 / Math.max(30, Math.min(300, bpm));
      let i = 0;
      onBeat?.(beats - i);
      tick(i);
      i += 1;
      const t = setInterval(() => {
        if (i >= beats) {
          clearInterval(t);
          onBeat?.(0);
          setTimeout(resolve, interval);
          return;
        }
        onBeat?.(beats - i);
        tick(i);
        i += 1;
      }, interval);
    });

  return { start, stop, countIn };
}
