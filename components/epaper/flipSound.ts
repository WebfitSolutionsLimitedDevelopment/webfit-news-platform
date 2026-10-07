'use client';

/*
 * A short paper page-turn sound, made in the browser with the Web Audio API
 * (no audio file to download or license). Filtered noise shaped like a page
 * lifting, sweeping across and settling.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function noiseBuffer(ac: AudioContext) {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  const length = Math.floor(ac.sampleRate * 0.8);
  noise = ac.createBuffer(1, length, ac.sampleRate);
  const data = noise.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    // Slightly "brown" noise sounds more like paper than pure white noise.
    const white = Math.random() * 2 - 1;
    last = (last + 0.06 * white) / 1.06;
    data[i] = white * 0.55 + last * 3.2;
  }
  return noise;
}

function swish(ac: AudioContext, at: number, length: number, from: number, to: number, level: number) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 0.9;
  band.frequency.setValueAtTime(from, at);
  band.frequency.exponentialRampToValueAtTime(to, at + length);
  const high = ac.createBiquadFilter();
  high.type = 'highpass';
  high.frequency.value = 350;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + length * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(band).connect(high).connect(gain).connect(ac.destination);
  src.start(at, Math.random() * 0.2, length + 0.05);
}

/** Play one page turn. Safe to call anywhere; does nothing if audio is unavailable. */
export function playFlipSound(durationMs = 650) {
  try {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + 0.01;
    const d = Math.max(0.35, Math.min(0.9, durationMs / 1000));
    swish(ac, t, d * 0.55, 900, 3800, 0.22);          // page lifts and sweeps
    swish(ac, t + d * 0.45, d * 0.45, 2600, 700, 0.14); // page settles
    swish(ac, t + d * 0.86, 0.07, 1800, 1200, 0.18);   // soft tap as it lands
  } catch {}
}

/** Call on the first tap/click so mobile browsers allow sound later. */
export function unlockFlipSound() {
  try { audio(); } catch {}
}

const KEY = 'webfit-epaper-sound';
export function soundPreference(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}
export function saveSoundPreference(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
}
