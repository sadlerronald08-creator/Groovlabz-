import { useEffect, useRef, useState, useCallback } from "react";
import { createAudioPlayer, setAudioModeAsync, AudioModule } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { audioSource } from "@/src/api";

export type PlayableTrack = {
  id: string;
  audio_url: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  duration: number;
};

export async function ensureRecordingMode() {
  try {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  } catch {}
}

export async function ensurePlaybackMode() {
  try {
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  } catch {}
}

export async function requestMicPermission() {
  return AudioModule.requestRecordingPermissionsAsync();
}

export async function getMicPermission() {
  return AudioModule.getRecordingPermissionsAsync();
}

export function useMultitrackPlayer(tracks: PlayableTrack[]) {
  const playersRef = useRef<Map<string, AudioPlayer>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const maxDuration = tracks.reduce((m, t) => Math.max(m, t.duration || 0), 0);
  const anySolo = tracks.some((t) => t.solo);
  const trackKey = tracks.map((t) => t.id).join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const [id, p] of playersRef.current) {
        if (!tracks.find((t) => t.id === id)) {
          try {
            p.remove();
          } catch {}
          playersRef.current.delete(id);
        }
      }
      for (const t of tracks) {
        if (!playersRef.current.has(t.id)) {
          try {
            const src = await audioSource(t.audio_url);
            if (cancelled) return;
            const p = createAudioPlayer(src);
            playersRef.current.set(t.id, p);
          } catch {}
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey]);

  // Apply mixer (volume / mute / solo).
  useEffect(() => {
    for (const t of tracks) {
      const p = playersRef.current.get(t.id);
      if (!p) continue;
      const audible = anySolo ? t.solo : !t.muted;
      try {
        p.volume = audible ? t.volume : 0;
      } catch {}
    }
  }, [tracks, anySolo]);

  const stopTicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    stopTicker();
    for (const p of playersRef.current.values()) {
      try {
        p.pause();
      } catch {}
    }
  }, [stopTicker]);

  const seek = useCallback((sec: number) => {
    setPosition(sec);
    for (const p of playersRef.current.values()) {
      try {
        p.seekTo(sec);
      } catch {}
    }
  }, []);

  const play = useCallback(async () => {
    await ensurePlaybackMode();
    let start = position;
    if (maxDuration > 0 && position >= maxDuration - 0.1) start = 0;
    isPlayingRef.current = true;
    setIsPlaying(true);
    for (const p of playersRef.current.values()) {
      try {
        p.seekTo(start);
        p.play();
      } catch {}
    }
    stopTicker();
    intervalRef.current = setInterval(() => {
      let pos = 0;
      for (const p of playersRef.current.values()) {
        try {
          pos = Math.max(pos, p.currentTime || 0);
        } catch {}
      }
      setPosition(pos);
      if (maxDuration > 0 && pos >= maxDuration) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        stopTicker();
        for (const pl of playersRef.current.values()) {
          try {
            pl.pause();
            pl.seekTo(0);
          } catch {}
        }
        setPosition(maxDuration);
      }
    }, 100);
  }, [position, maxDuration, stopTicker]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [pause, play]);

  useEffect(() => {
    return () => {
      stopTicker();
      for (const p of playersRef.current.values()) {
        try {
          p.remove();
        } catch {}
      }
      playersRef.current.clear();
    };
  }, [stopTicker]);

  return { isPlaying, position, maxDuration, play, pause, toggle, seek };
}
