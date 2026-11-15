"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const AUDIO_SRC = "/Mahol Poora Wavy Haye - Wavy _ Karan Aujla _ Punjabi.mp3";

declare global {
  interface Window {
    playWavyVibe3s?: () => void;
    playWavyVibe4s?: () => void;
  }
}

/**
 * Invisible background audio controller.
 * On the homepage the Wavy soundtrack plays in the background for the entire
 * preloader duration (no separate audio UI — it is purely ambient) and stops the
 * instant the preloader curtain drops. On other routes it stays silent.
 */
export function AudioVibePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let active: HTMLAudioElement | null = null;

    const ensureAudio = (): HTMLAudioElement => {
      if (active) return active;
      const audio = new Audio(AUDIO_SRC);
      audio.loop = false;
      audio.volume = 0.6;
      audioRef.current = audio;
      active = audio;
      return audio;
    };

    const stop = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };

    // Short vibe clips used elsewhere (e.g. the checkout thermal-receipt mount).
    window.playWavyVibe3s = () => {
      stop();
      const audio = ensureAudio();
      audio.currentTime = 0;
      audio.play().then(() => {
        setTimeout(stop, 3000);
      }).catch(() => {});
    };

    window.playWavyVibe4s = () => {
      stop();
      const audio = ensureAudio();
      audio.currentTime = 0;
      audio.play().then(() => {
        setTimeout(stop, 4000);
      }).catch(() => {});
    };

    // Homepage: play the track while the preloader is up, stop when it drops.
    if (pathname !== "/") return;

    const audio = ensureAudio();
    audio.currentTime = 0;

    const onDone = () => stop();
    window.addEventListener("wavy:preloader-done", onDone, { once: true });

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Strict autoplay policy: one user gesture unlocks it for the rest of the session.
        const unlock = () => {
          const a = audioRef.current;
          if (a && a.paused) {
            a.currentTime = 0;
            a.play().catch(() => {});
          }
          window.removeEventListener("click", unlock);
          window.removeEventListener("keydown", unlock);
          window.removeEventListener("touchstart", unlock);
        };
        window.addEventListener("click", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
        window.addEventListener("touchstart", unlock, { once: true });
      });
    }

    return () => {
      window.removeEventListener("wavy:preloader-done", onDone);
      stop();
    };
  }, [pathname]);

  // Completely invisible: renders no UI element in the DOM.
  return null;
}