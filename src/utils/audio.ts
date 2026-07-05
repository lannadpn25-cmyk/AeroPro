let audioCtx: AudioContext | null = null;

/**
 * Plays a beautiful synthesized beep tone using Web Audio API.
 * 
 * @param frequency The frequency of the tone in Hz (default: 880Hz - high pitch)
 * @param durationSeconds The duration of the beep in seconds (default: 0.15s)
 */
export function playBeep(frequency = 880, durationSeconds = 0.15) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    // Smooth gain ramp to avoid harsh clicks
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSeconds);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + durationSeconds);
  } catch (error) {
    console.warn("Could not play audio beep:", error);
  }
}
