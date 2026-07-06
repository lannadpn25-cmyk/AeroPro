import React, { useState, useEffect, useRef } from 'react';
import { WorkoutTemplate, WorkoutChunk, StrengthExercise, CompletedWorkout } from '../types';
import { playBeep, playTransitionChime, playSuccessChime } from '../utils/audio';
import { 
  Play, Pause, Square, ChevronRight, Activity, Heart, Milestone, Volume2, 
  VolumeX, CheckCircle, Flame, Award, Clock, Sparkles, Send 
} from 'lucide-react';

interface WorkoutPlayerProps {
  template: WorkoutTemplate;
  musicMode: boolean;
  voiceMode: boolean;
  onSaveSession: (session: Omit<CompletedWorkout, 'id' | 'date'>) => void;
  onCancel: () => void;
}

export default function WorkoutPlayer({ 
  template, 
  musicMode, 
  voiceMode, 
  onSaveSession, 
  onCancel 
}: WorkoutPlayerProps) {
  // Workout state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlannedFinished, setIsPlannedFinished] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  
  // Timer references
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [timeRemainingInChunk, setTimeRemainingInChunk] = useState(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  
  // For strength workouts
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);

  // Stats captured at the end
  const [actualDistance, setActualDistance] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  // Audio/Voice states
  const [isMuted, setIsMuted] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState('');

  // Splash countdown state
  const [splashCountdown, setSplashCountdown] = useState<number | null>(3);

  const [currentWorkoutChunks, setCurrentWorkoutChunks] = useState<WorkoutChunk[]>([]);
  const chunks = currentWorkoutChunks;
  const currentChunk = (chunks[activeChunkIndex] || chunks[chunks.length - 1]) as WorkoutChunk | undefined;

  // Track the total expected seconds for progress calculation (Aerobic)
  const totalPlannedSeconds = (template.chunks || []).reduce((sum, c) => sum + c.durationMinutes * 60, 0);

  // References for tracking background/drift transitions and keep-awake loop
  const lastTickRef = useRef<number>(Date.now());
  const lastAnnouncedChunkIndexRef = useRef<number>(-1);
  const lastBeepRemainingRef = useRef<number>(-1);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Background audio keep-awake loop to prevent background sleep
  useEffect(() => {
    // 1-second ultra-compressed silent MP3 base64
    const SILENT_MP3_B64 = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAASAAADbWFqb3JfYnJhbmQAbXA0MgBUWFhYAAAAEgAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzb21tcDQyAFRFTkMaaaaVbGFtZSBNVDNsaWIAdXNpbmcAI0ZpcnN0IGZyYW1lIGFzIHNpbGVuY2UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUxAAAAAACbAIACAAAA0gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8UxAYAAAAAkAIAEAAAA0gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const audio = new Audio(SILENT_MP3_B64);
    audio.loop = true;
    audio.volume = 0.01;
    silentAudioRef.current = audio;

    if (isPlaying && splashCountdown === null && !isCompleted) {
      audio.play().catch(err => {
        console.log("Autoplay of silent keep-awake audio deferred until user gesture:", err);
      });
    }

    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
      }
    };
  }, []);

  // Sync active play state with keep-awake loop
  useEffect(() => {
    if (silentAudioRef.current) {
      if (isPlaying && splashCountdown === null && !isCompleted) {
        silentAudioRef.current.play().catch(err => {
          console.log("Could not trigger silent loop:", err);
        });
      } else {
        silentAudioRef.current.pause();
      }
    }
  }, [isPlaying, splashCountdown, isCompleted]);

  // MediaSession API setup to keep the browser tab alive and update lock screen controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (isPlaying && splashCountdown === null && !isCompleted) {
        navigator.mediaSession.playbackState = 'playing';
        
        let title = template.name;
        let artist = 'PowerFit Player';
        if (template.type === 'aerobic' && currentChunk) {
          title = `${currentChunk.name} (${currentChunk.speedKmh} km/h)`;
          artist = `Treino: ${template.name}`;
        } else if (template.type === 'strength') {
          const exercises = template.strengthExercises || [];
          const currentEx = exercises[activeExerciseIndex];
          if (currentEx) {
            title = `${currentEx.name} (Série ${currentSet}/${currentEx.series})`;
            artist = `Força: ${template.name}`;
          }
        }

        navigator.mediaSession.metadata = new MediaMetadata({
          title: title,
          artist: artist,
          album: 'PowerFit App',
          artwork: [
            { src: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', sizes: '512x512', type: 'image/png' }
          ]
        });

        // Set control handlers for lockscren audio controls
        try {
          navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
          navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
        } catch (error) {
          console.log("MediaSession action handler error:", error);
        }
      } else {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, splashCountdown, isCompleted, activeChunkIndex, activeExerciseIndex, currentSet, template, currentChunk]);

  // Initialize first chunk timer, active chunks and reset background tracking refs
  useEffect(() => {
    if (template.type === 'aerobic' && template.chunks && template.chunks.length > 0) {
      setCurrentWorkoutChunks([...template.chunks]);
      setActiveChunkIndex(0);
      setTimeRemainingInChunk(template.chunks[0].durationMinutes * 60);
      setTotalSecondsElapsed(0);
      setIsPlannedFinished(false);
      lastAnnouncedChunkIndexRef.current = -1;
      lastBeepRemainingRef.current = -1;
      lastTickRef.current = Date.now();
    } else {
      setCurrentWorkoutChunks([]);
      setTotalSecondsElapsed(0);
      setIsPlannedFinished(false);
    }
  }, [template]);

  // Portuguese Speech Synthesis helper
  const announceChunk = (chunk: WorkoutChunk, isTransition = false) => {
    if (voiceMode && !isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      
      // Wake up the browser audio subsystem to ensure background audio works
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tempCtx = new AudioContextClass();
          const osc = tempCtx.createOscillator();
          const gain = tempCtx.createGain();
          gain.gain.setValueAtTime(0.001, tempCtx.currentTime);
          osc.connect(gain);
          gain.connect(tempCtx.destination);
          osc.start();
          osc.stop(tempCtx.currentTime + 0.05);
        }
      } catch (e) {
        console.log("Could not trigger silent wake-up oscillator:", e);
      }

      let text = `Iniciando fase: ${chunk.name}. Velocidade sugerida: ${chunk.speedKmh} quilômetros por hora.`;
      if (isTransition) {
        text = `Trocar de atividade! Iniciando fase: ${chunk.name}. Velocidade sugerida: ${chunk.speedKmh} quilômetros por hora.`;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      activeUtteranceRef.current = utterance;
      
      utterance.onend = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
      };
      utterance.onerror = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
      };

      window.speechSynthesis.speak(utterance);
      setLastSpokenText(text);
    }
  };

  const announceWorkoutComplete = () => {
    if (voiceMode && !isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Wake up the browser audio subsystem to ensure background audio works
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tempCtx = new AudioContextClass();
          const osc = tempCtx.createOscillator();
          const gain = tempCtx.createGain();
          gain.gain.setValueAtTime(0.001, tempCtx.currentTime);
          osc.connect(gain);
          gain.connect(tempCtx.destination);
          osc.start();
          osc.stop(tempCtx.currentTime + 0.05);
        }
      } catch (e) {
        console.log("Could not trigger silent wake-up oscillator:", e);
      }

      const text = `Você encerrou o treino com sucesso! Parabéns pelo excelente trabalho.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      activeUtteranceRef.current = utterance;

      utterance.onend = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
      };
      utterance.onerror = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Splash countdown timer
  useEffect(() => {
    if (splashCountdown === null) return;

    // Play a distinct countdown beep for 3, 2, 1
    if (splashCountdown > 0 && !isMuted) {
      playBeep(600, 0.15);
    } else if (splashCountdown === 0 && !isMuted) {
      // GO beep
      playBeep(1200, 0.3);
    }

    const timer = setTimeout(() => {
      if (splashCountdown > 0) {
        setSplashCountdown(splashCountdown - 1);
      } else {
        setSplashCountdown(null);
        setIsPlaying(true);
        // Once splash finishes, start the actual workout chunk announcement!
        if (template.type === 'aerobic' && chunks.length > 0) {
          announceChunk(chunks[0]);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [splashCountdown, template, chunks, isMuted]);

  // Keep update timestamp in sync when play status changes
  useEffect(() => {
    if (isPlaying && splashCountdown === null && !isCompleted) {
      lastTickRef.current = Date.now();
    }
  }, [isPlaying, splashCountdown, isCompleted]);

  // Main countdown/up timer tick with drift-compensation
  useEffect(() => {
    if (!isPlaying || isCompleted || splashCountdown !== null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      const deltaSec = Math.round(deltaMs / 1000);

      if (deltaSec > 0) {
        lastTickRef.current = now;
        setTotalSecondsElapsed(prev => prev + deltaSec);
        
        // Safety unfreeze for browser speech synthesis in the background
        if ('speechSynthesis' in window) {
          window.speechSynthesis.resume();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isCompleted, splashCountdown]);

  // Unified state monitor for Aerobic workouts (Self-healing and drift-immune)
  useEffect(() => {
    if (template.type !== 'aerobic' || isCompleted || splashCountdown !== null) return;

    let accumulatedSeconds = 0;
    let foundIndex = 0;
    let remaining = 0;
    let completed = false;

    for (let i = 0; i < chunks.length; i++) {
      const chunkSec = chunks[i].durationMinutes * 60;
      if (totalSecondsElapsed < accumulatedSeconds + chunkSec) {
        foundIndex = i;
        remaining = (accumulatedSeconds + chunkSec) - totalSecondsElapsed;
        break;
      }
      accumulatedSeconds += chunkSec;
      if (i === chunks.length - 1) {
        completed = true;
      }
    }

    if (completed) {
      const originalChunks = template.chunks || [];
      if (originalChunks.length > 0) {
        if (!isPlannedFinished) {
          if (!isMuted) {
            playSuccessChime();
          }
          setIsPlannedFinished(true);
          if (voiceMode && !isMuted && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const text = "Você concluiu a meta planejada do treino! Iniciando fase de tempo extra.";
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
          }
        }
        
        const nextIndex = (chunks.length - originalChunks.length) % originalChunks.length;
        const chunkToClone = originalChunks[nextIndex];
        const newChunk: WorkoutChunk = {
          ...chunkToClone,
          id: `${chunkToClone.id}_loop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        };
        setCurrentWorkoutChunks(prev => [...prev, newChunk]);
      }
      return;
    }

    // Set remaining time in current chunk
    setTimeRemainingInChunk(remaining);

    // Beeps when 5, 4, 3, 2, 1 seconds remain for the next block
    if (remaining <= 5 && remaining > 0 && !isMuted && lastBeepRemainingRef.current !== remaining) {
      playBeep(880, 0.12);
      lastBeepRemainingRef.current = remaining;
    }

    // Transition between chunks
    if (foundIndex !== activeChunkIndex) {
      if (!isMuted && activeChunkIndex !== undefined) {
        playTransitionChime();
      }
      setActiveChunkIndex(foundIndex);
    }

    // Voice announcement when entering a new chunk
    if (foundIndex !== lastAnnouncedChunkIndexRef.current) {
      const isTransition = lastAnnouncedChunkIndexRef.current !== -1;
      announceChunk(chunks[foundIndex], isTransition);
      lastAnnouncedChunkIndexRef.current = foundIndex;
    }

  }, [totalSecondsElapsed, chunks, template.type, isCompleted, splashCountdown, isMuted, activeChunkIndex, isPlannedFinished, voiceMode]);

  // Handle Strength series completion
  const handleNextSet = () => {
    const exercises = template.strengthExercises || [];
    const currentEx = exercises[activeExerciseIndex] as StrengthExercise | undefined;
    if (!currentEx) return;

    if (currentSet < currentEx.series) {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      if (!isMuted) playBeep(1000, 0.15);
    } else {
      // Move to next exercise
      if (activeExerciseIndex < exercises.length - 1) {
        setActiveExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        if (!isMuted) playTransitionChime();
      } else {
        // Last exercise and last set done!
        if (!isPlannedFinished) {
          if (!isMuted) {
            playSuccessChime();
          }
          setIsPlannedFinished(true);
          announceWorkoutComplete();
        }
      }
    }
  };

  const handleFinishEarly = () => {
    setShowFinishConfirm(true);
  };

  // Save the recorded training session
  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();

    const actualDuration = Math.ceil(totalSecondsElapsed / 60);
    const plannedDuration = template.type === 'aerobic' 
      ? chunks.reduce((sum, c) => sum + c.durationMinutes, 0)
      : template.targetValue;

    onSaveSession({
      templateId: template.id,
      workoutName: template.name,
      activityId: template.activityId,
      activityName: template.type === 'aerobic' ? 'Aeróbico' : 'Força',
      activityType: template.type,
      plannedDurationMinutes: plannedDuration,
      actualDurationMinutes: actualDuration,
      actualDistanceKm: actualDistance ? parseFloat(actualDistance) : undefined,
      avgHeartRateBpm: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      notes: notes || undefined,
      chunks: template.type === 'aerobic' ? chunks : undefined,
      strengthExercises: template.type === 'strength' ? template.strengthExercises : undefined
    });
  };

  // Helper format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Calculations for Segmented Progress Wheel of the CURRENT active block
  const getCurrentChunkProgressPercent = () => {
    if (template.type === 'strength') return 100; // default for strength

    if (!currentChunk) return 0;
    const currentChunkTotalSec = currentChunk.durationMinutes * 60;
    if (currentChunkTotalSec <= 0) return 0;

    // We want the progress to represent time remaining over total time
    // so it starts at 100% (fully filled) and empties down to 0% (empty)
    return (timeRemainingInChunk / currentChunkTotalSec) * 100;
  };

  const currentChunkProgressPercent = getCurrentChunkProgressPercent();

  // Draw 12 segments for a beautiful gap progress ring, exactly like the image.
  // Circle radius is 80, circumference = 2 * PI * 80 = 502.65
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  // To create a segmented wheel with 10 segments (matches screen)
  // Each segment has a length and a gap.
  // E.g., Total circumference 502.65 / 10 = 50.26. Let's make segment=45, gap=5.26
  const numSegments = 10;
  const gapSize = 5;
  const segmentSize = (circumference / numSegments) - gapSize;
  const segmentedDashArray = `${segmentSize} ${gapSize}`;

  // For the active progress indicator, we want it to overlay on top of the gray background wheel.
  // Starting fully filled (0 offset) and emptying down to 0% (circumference offset)
  const progressOffset = circumference - (currentChunkProgressPercent / 100) * circumference;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 animate-fade-in" id="workout-player-container">
      
      {/* Active Workout Screen */}
      {!isCompleted ? (
        <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8 space-y-8 flex flex-col items-center relative overflow-hidden">
          
          {/* Header Activity Title */}
          <div className="w-full flex justify-between items-center pb-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-[#CCFF00]" />
              <div>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">TREINANDO AGORA</span>
                <h2 className="text-lg font-black text-white uppercase tracking-tight font-display">{template.name}</h2>
              </div>
            </div>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 transition"
              title={isMuted ? "Ativar áudio" : "Mutar áudio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#CCFF00]" />}
            </button>
          </div>

          {/* Unified High-Contrast Upper Stats Card */}
          <div className="w-full grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner">
            <div className="text-center flex flex-col items-center justify-center">
              <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#CCFF00]" /> Tempo Decorrido
              </span>
              <span className="text-xl font-black text-white font-mono mt-1">{formatTime(totalSecondsElapsed)}</span>
            </div>
            <div className="text-center border-l border-white/5 flex flex-col items-center justify-center">
              <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#CCFF00]" /> Meta Total
              </span>
              <span className="text-xl font-black text-[#CCFF00] font-mono mt-1">
                {template.type === 'aerobic' 
                  ? `${template.targetValue} ${template.targetUnit === 'minutes' ? 'MIN' : 'KM'}`
                  : `${template.targetValue} MIN`
                }
              </span>
            </div>
          </div>

          {/* AEROBIC TYPE INTERFACE */}
          {template.type === 'aerobic' && currentChunk && (
            <div className="w-full flex flex-col items-center space-y-4">
              
              {/* SEGMENTED PROGRESS RING (Matches provided images exactly) */}
              <div className="relative flex items-center justify-center w-64 h-64" id="segmented-circular-gauge">
                {/* SVG Ring container */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  {/* Outer Background Segmented Ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={segmentedDashArray}
                    className="transition duration-300"
                  />
                  
                  {/* Foreground Active Segmented Progress Ring */}
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke="#CCFF00" // Sophisticated High-contrast brand color
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                {/* Text inside Ring (Matches "36% / 74 Dias" look but for timing) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                  <span className="text-4xl font-black text-white tracking-tighter font-mono">
                    {formatTime(timeRemainingInChunk)}
                  </span>
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">
                    {currentChunk ? currentChunk.name : ''}
                  </span>
                  {currentChunk && (
                    <div className="flex flex-col items-center gap-1.5 mt-1">
                      <span className="bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg border border-[#CCFF00]/20 font-mono">
                        {currentChunk.speedKmh} km/h
                      </span>
                      {isPlannedFinished && (
                        <span className="text-emerald-400 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                          Tempo Extra
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Countdown Sound Alert Alert */}
              {timeRemainingInChunk <= 5 && timeRemainingInChunk > 0 && (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl py-2 px-4 flex items-center justify-center gap-2 animate-bounce">
                  <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-red-400 text-xs font-bold">Próximo modo em {timeRemainingInChunk} segundos... bipa!</span>
                </div>
              )}

              {/* Phase Timeline progress */}
              <div className="w-full space-y-2 mt-1">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">
                  Linha do Tempo de Blocos ({activeChunkIndex + 1}/{chunks.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {chunks.map((chunk, idx) => {
                    const isPast = idx < activeChunkIndex;
                    if (isPast) return null; // Hide already completed blocks!
                    const isActive = idx === activeChunkIndex;
                    return (
                      <div 
                        key={chunk.id} 
                        className={`p-2 rounded border text-center transition ${
                          isActive 
                            ? 'bg-[#CCFF00]/10 border-[#CCFF00] text-white font-bold' 
                            : 'bg-black/40 border-white/5 text-white/60'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wide block truncate">{chunk.name}</span>
                        <span className="text-[9px] opacity-70 block font-mono">{chunk.durationMinutes}m • {chunk.speedKmh}km/h</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* STRENGTH TYPE INTERFACE */}
          {template.type === 'strength' && (
            <div className="w-full flex flex-col items-center space-y-6">
              
              {/* Strength active exercise detail */}
              {(() => {
                const exercises = template.strengthExercises || [];
                const currentEx = exercises[activeExerciseIndex] as StrengthExercise | undefined;

                if (!currentEx) return <p className="text-neutral-400">Nenhum exercício configurado.</p>;

                return (
                  <div className="w-full space-y-6 text-center">
                    
                    {/* Visual Round Tracker */}
                    {isPlannedFinished ? (
                      <div className="inline-flex flex-col items-center justify-center p-8 bg-emerald-500/5 border border-emerald-500/25 rounded-full w-44 h-44 relative animate-pulse">
                        <Award className="w-8 h-8 text-[#CCFF00] mb-1" />
                        <span className="text-white font-black text-sm uppercase tracking-tight font-display italic">
                          CONCLUÍDO!
                        </span>
                        <span className="text-[#CCFF00]/80 text-[9px] font-bold uppercase mt-1 tracking-wider">
                          Séries Planejadas
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-center justify-center p-8 bg-purple-500/5 border border-purple-500/20 rounded-full w-44 h-44 relative">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Série Ativa</span>
                        <span className="text-5xl font-black text-white font-mono my-1">
                          {currentSet}
                        </span>
                        <span className="text-white/40 text-[9px] font-bold uppercase">
                          DE {currentEx.series} SÉRIES
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                        isPlannedFinished 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {isPlannedFinished ? 'Meta de Força Concluída' : 'Exercício de Força'}
                      </span>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase font-display">
                        {isPlannedFinished ? 'Excelente Trabalho!' : currentEx.name}
                      </h3>
                      {!isPlannedFinished ? (
                        <p className="text-white/40 text-sm">
                          Meta: <span className="text-[#CCFF00] font-black font-mono">{currentEx.reps}</span> REPS
                          {currentEx.weightKg ? ` • ${currentEx.weightKg} KG` : ''}
                        </p>
                      ) : (
                        <p className="text-white/40 text-xs px-6 leading-relaxed max-w-sm mx-auto">
                          Todos os exercícios planejados foram concluídos. Você pode realizar séries extras (o cronômetro continuará contando) ou salvar abaixo.
                        </p>
                      )}
                    </div>

                    {/* Progress Checklist */}
                    <div className="bg-black/40 p-4 border border-white/5 rounded-xl max-w-sm mx-auto text-left space-y-2">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block font-bold">Roteiro de Treino</span>
                      {exercises.map((ex, idx) => {
                        const isDone = isPlannedFinished || idx < activeExerciseIndex;
                        const isCurrent = !isPlannedFinished && idx === activeExerciseIndex;
                        return (
                          <div 
                            key={ex.id}
                            className={`flex justify-between items-center text-xs p-2 rounded ${
                              isCurrent ? 'bg-purple-500/10 border-purple-500/20 font-bold text-white' : 'text-neutral-400'
                            }`}
                          >
                            <span className={isDone ? 'line-through opacity-40 text-emerald-400/75' : ''}>{idx + 1}. {ex.name}</span>
                            <span className="font-mono">{ex.series}x{ex.reps}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Completion of series button or End Workout */}
                    {!isPlannedFinished ? (
                      <button
                        onClick={handleNextSet}
                        className="w-full max-w-sm py-3 bg-purple-500 hover:bg-purple-600 text-white rounded font-black text-xs uppercase tracking-widest transition transform active:scale-95 shadow-lg shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir Série #{currentSet}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsCompleted(true);
                          announceWorkoutComplete();
                        }}
                        className="w-full max-w-sm py-3.5 bg-[#CCFF00] hover:bg-[#b3e000] text-black rounded font-black text-xs uppercase tracking-widest transition transform active:scale-95 shadow-lg shadow-[#CCFF00]/10 cursor-pointer flex items-center justify-center gap-2 font-display italic"
                      >
                        <Award className="w-4 h-4" />
                        Salvar e Registrar Treino
                      </button>
                    )}

                  </div>
                );
              })()}

            </div>
          )}

          {/* Big high-contrast direct save button for aerobic workouts when they are in overtime */}
          {template.type === 'aerobic' && isPlannedFinished && (
            <div className="w-full max-w-sm px-2 pt-2">
              <button
                onClick={() => {
                  setIsCompleted(true);
                  announceWorkoutComplete();
                }}
                className="w-full py-3.5 bg-[#CCFF00] hover:bg-[#b3e000] text-black rounded-xl font-black text-sm uppercase tracking-wider transition transform active:scale-95 shadow-[0_0_20px_rgba(204,255,0,0.3)] cursor-pointer flex items-center justify-center gap-2 font-display italic"
              >
                <Award className="w-5 h-5" />
                Finalizar e Registrar Treino
              </button>
            </div>
          )}

          {/* TIMER CONTROL BUTTONS (Underneath Gauge) */}
          {(template.type === 'aerobic' || !isPlannedFinished) && (
            <>
              <div className="flex gap-4 items-center justify-center pt-4">
                
                {/* Cancel/Stop Button */}
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="p-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Sair do treino"
                >
                  <Square className="w-4 h-4 fill-red-400" />
                </button>

                {/* Play/Pause (Matches second screenshot circular blue button) */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-5 bg-[#CCFF00] hover:bg-[#b3e000] text-black rounded-full transition transform hover:scale-110 active:scale-90 shadow-[0_0_20px_rgba(204,255,0,0.25)] flex flex-col items-center justify-center cursor-pointer animate-none"
                  id="btn-play-pause-timer"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-black stroke-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black stroke-black ml-0.5" />
                  )}
                </button>

                {/* Finish Workout Early Button */}
                <button
                  onClick={handleFinishEarly}
                  className="p-3.5 bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/20 rounded-full transition transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer font-bold"
                  title="Finalizar Treino"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>

              </div>
              
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider mt-1">
                {isPlaying ? 'Pausar' : 'Retomar'}
              </span>
            </>
          )}

        </div>
      ) : (
        <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6" id="workout-survey-panel">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 bg-[#CCFF00] text-black rounded-lg shadow-lg shadow-[#CCFF00]/10">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase font-display tracking-tight">Treino Concluído!</h2>
            <p className="text-white/40 text-xs uppercase font-mono max-w-sm mx-auto">
              Parabéns pelo esforço hoje. Como foi o seu desempenho? Digite abaixo para registrar a evolução.
            </p>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-3">
            <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Resumo do Plano Concluído</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-white/40 block">Treino planejado:</span>
                <span className="text-white font-semibold uppercase">{template.name}</span>
              </div>
              <div>
                <span className="text-white/40 block">Tempo total treinado:</span>
                <span className="text-[#CCFF00] font-black font-mono text-sm">{Math.ceil(totalSecondsElapsed / 60)} min</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveData} className="space-y-4">
            
            {/* Ask Kilometers (Distance) */}
            <div className="space-y-1.5">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Milestone className="w-3.5 h-3.5 text-blue-400" />
                Quantos KMs foram realizados hoje? (Distância real)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 5.25"
                value={actualDistance}
                onChange={e => setActualDistance(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-semibold font-mono"
              />
            </div>

            {/* Ask Heart Rate (Frequência cardíaca média) */}
            <div className="space-y-1.5">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Qual foi a sua frequência cardíaca média? (BPM) - Opcional
              </label>
              <input
                type="number"
                placeholder="Ex: 142 (Opcional)"
                value={avgHeartRate}
                onChange={e => setAvgHeartRate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-semibold font-mono"
              />
            </div>

            {/* General notes */}
            <div className="space-y-1.5">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">
                Notas sobre o Treino (Como se sentiu?)
              </label>
              <textarea
                placeholder="Ex: Me senti cansado no início, mas o ritmo forte de 11km/h correu super bem!"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm h-24 resize-none font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#CCFF00] hover:bg-[#b3e000] text-black font-black text-xs uppercase tracking-widest rounded transition transform active:scale-95 shadow-lg shadow-[#CCFF00]/10 flex items-center justify-center gap-2 cursor-pointer"
              id="btn-save-completed-workout"
            >
              <Send className="w-4 h-4" />
              Salvar e Registrar Treino
            </button>

          </form>
        </div>
      )}

      {/* Custom Confirmation Modal for Abandoning/Canceling */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <Square className="w-4 h-4 fill-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase font-display italic">Abandonar Treino?</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Tem certeza que deseja abandonar o treino atual? Seus dados de hoje não serão registrados.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded font-bold text-xs uppercase tracking-wider border border-white/10 transition cursor-pointer"
              >
                Continuar
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Finishing Early */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-[#CCFF00]/10 text-[#CCFF00] rounded-full flex items-center justify-center mx-auto border border-[#CCFF00]/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase font-display italic">Encerrar Treino?</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Deseja encerrar o seu treino agora e salvar as estatísticas acumuladas até o momento?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded font-bold text-xs uppercase tracking-wider border border-white/10 transition cursor-pointer"
              >
                Continuar
              </button>
              <button
                onClick={() => {
                  setShowFinishConfirm(false);
                  setIsCompleted(true);
                  announceWorkoutComplete();
                }}
                className="flex-1 py-2.5 bg-[#CCFF00] hover:bg-[#b3e000] text-black rounded font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Splash Countdown Modal */}
      {splashCountdown !== null && (
        <div className="fixed inset-0 h-screen w-screen bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <div className="text-center space-y-8 max-w-sm w-full flex flex-col items-center justify-center h-full">
            <div className="space-y-3">
              <span className="text-[#CCFF00] text-xs font-black tracking-widest uppercase font-mono block animate-pulse">
                PREPARE-SE PARA TREINAR
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">
                {template.name}
              </h3>
            </div>

            {/* Giant Countdown Number with Pulse animation */}
            <div className="relative flex items-center justify-center w-52 h-52">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 border-2 border-[#CCFF00]/20 rounded-full animate-ping" />
              <div className="absolute inset-3 border border-[#CCFF00]/40 rounded-full" />
              
              <span className="text-8xl font-black text-[#CCFF00] font-mono tracking-tighter drop-shadow-[0_0_20px_rgba(204,255,0,0.6)]">
                {splashCountdown === 0 ? 'VAI!' : splashCountdown}
              </span>
            </div>

            <p className="text-white/40 text-xs font-bold uppercase tracking-widest font-mono">
              {template.type === 'aerobic' ? 'Iniciando com aquecimento ou bloco inicial' : 'Iniciando primeira série do exercício'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
