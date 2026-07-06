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

/**
 * Plays a rising 3-note chime to indicate block transition.
 * Scheduled directly on the audio context timeline to resist background throttling.
 */
export function playTransitionChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 784.00]; // C5, E5, G5
    const noteDuration = 0.25;
    const spacing = 0.15;

    notes.forEach((freq, index) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * spacing);
      
      gain.gain.setValueAtTime(0.001, now + index * spacing);
      gain.gain.linearRampToValueAtTime(0.2, now + index * spacing + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * spacing + noteDuration);
      
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      
      osc.start(now + index * spacing);
      osc.stop(now + index * spacing + noteDuration);
    });
  } catch (error) {
    console.warn("Could not play transition chime:", error);
  }
}

/**
 * Plays a triumphant fanfare to indicate workout success/completion.
 * Scheduled directly on the audio context timeline to resist background throttling.
 */
export function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    // Triumphant rising major chord progression
    const notes = [523.25, 659.25, 784.00, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    const noteDuration = 0.4;
    const spacing = 0.12;

    notes.forEach((freq, index) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * spacing);
      
      gain.gain.setValueAtTime(0.001, now + index * spacing);
      gain.gain.linearRampToValueAtTime(0.25, now + index * spacing + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * spacing + noteDuration);
      
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      
      osc.start(now + index * spacing);
      osc.stop(now + index * spacing + noteDuration);
    });
  } catch (error) {
    console.warn("Could not play success chime:", error);
  }
}

