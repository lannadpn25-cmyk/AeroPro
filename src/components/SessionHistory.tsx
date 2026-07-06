import React, { useState } from 'react';
import { CompletedWorkout, Activity } from '../types';
import { ActivityIcon } from './WorkoutList';
import { 
  History, Calendar, Milestone, Heart, Clock, Trash2, Search, Filter, ChevronDown, ChevronUp, AlertCircle, Edit2 
} from 'lucide-react';

interface SessionHistoryProps {
  completedWorkouts: CompletedWorkout[];
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, updatedFields: Partial<CompletedWorkout>) => void;
  activities: Activity[];
}

export default function SessionHistory({ completedWorkouts, onDeleteSession, onUpdateSession, activities }: SessionHistoryProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Edit fields state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editWorkoutName, setEditWorkoutName] = useState('');
  const [editHeartRate, setEditHeartRate] = useState<string>('');
  const [editDistance, setEditDistance] = useState<string>('');

  // Toggle show/hide aerobic chunks list (default hidden)
  const [visibleChunks, setVisibleChunks] = useState<Record<string, boolean>>({});

  const toggleChunksVisibility = (sessionId: string) => {
    setVisibleChunks(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  // Filter sessions
  const filteredSessions = [...completedWorkouts]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleExpand = (id: string) => {
    setExpandedSessionId(prev => (prev === id ? null : id));
  };

  // Helper to format date in the pattern: Dia mes ano - horario (e.g. 06/07/2026 - 13:45)
  const formatFullDateTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  // Group sessions by calendar date (local)
  interface GroupedSessions {
    dateKey: string;
    dayNumber: string;
    weekday: string;
    sessions: CompletedWorkout[];
  }

  const groupedSessions: GroupedSessions[] = [];

  filteredSessions.forEach(session => {
    const d = new Date(session.date);
    if (isNaN(d.getTime())) return;
    const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    
    let group = groupedSessions.find(g => g.dateKey === dateKey);
    if (!group) {
      const dayNumber = d.getDate().toString().padStart(2, '0');
      const weekdays = [
        'DOMINGO',
        'SEGUNDA-FEIRA',
        'TERÇA-FEIRA',
        'QUARTA-FEIRA',
        'QUINTA-FEIRA',
        'SEXTA-FEIRA',
        'SÁBADO'
      ];
      const weekday = weekdays[d.getDay()];
      group = {
        dateKey,
        dayNumber,
        weekday,
        sessions: []
      };
      groupedSessions.push(group);
    }
    group.sessions.push(session);
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white uppercase font-display tracking-tight italic">Histórico de Treinos</h1>
      </div>

      {/* History List */}
      <div className="space-y-8">
        {groupedSessions.length === 0 ? (
          <div className="bg-[#151518] rounded-2xl p-10 text-center border border-white/5 flex flex-col justify-center items-center">
            <History className="w-12 h-12 text-white/20 mb-3 opacity-30" />
            <p className="text-white/60 text-xs uppercase font-bold tracking-wider mb-1">Nenhum registro encontrado.</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider max-w-sm mx-auto leading-relaxed">Sua lista de treinos realizados aparecerá aqui assim que você concluir uma sessão.</p>
          </div>
        ) : (
          groupedSessions.map(group => (
            <div key={group.dateKey} className="space-y-4">
              {/* Group Date Header styled exactly as mockup: DD • WEEKDAY */}
              <div className="flex items-center gap-2 px-1.5 py-1 border-b border-white/5 select-none">
                <span className="text-sm font-black text-white/95 tracking-widest font-mono">
                  {group.dayNumber}
                </span>
                <span className="text-white/20 text-xs font-semibold">•</span>
                <span className="text-xs font-black text-[#CCFF00] tracking-widest uppercase font-display">
                  {group.weekday}
                </span>
              </div>

              {/* Sessions container */}
              <div className="space-y-4">
                {group.sessions.map(session => {
                  const isExpanded = expandedSessionId === session.id;
                  const activity = activities.find(a => a.id === session.activityId);
                  const iconName = activity?.icon || 'Activity';

                  return (
                    <div 
                      key={session.id} 
                      className="bg-[#151518] border border-white/5 rounded-2xl overflow-hidden transition hover:border-[#CCFF00]/30"
                      id={`session-record-${session.id}`}
                    >
                      {/* Collapsed Header */}
                      <div 
                        onClick={() => toggleExpand(session.id)}
                        className="p-5 flex justify-between items-center cursor-pointer select-none"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="p-3 bg-white/5 border border-white/10 text-[#CCFF00] rounded-xl">
                            <ActivityIcon name={iconName} className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-2 py-0.5 rounded-md text-[#CCFF00] font-black tracking-widest uppercase">
                                {session.activityName}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 opacity-60 text-white/30" />
                                {formatFullDateTime(session.date)}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-white tracking-tight leading-snug uppercase font-display">
                              {session.workoutName}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Key metrics badge summary */}
                          <div className="hidden sm:flex items-center gap-3 text-xs">
                            <div className="text-right">
                              <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider block">Distância</span>
                              <span className="text-blue-400 font-bold font-mono text-sm">
                                {session.actualDistanceKm ? `${session.actualDistanceKm} KM` : '--'}
                              </span>
                            </div>
                            <div className="text-right border-l border-white/5 pl-3">
                              <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider block">Freq. Cardíaca</span>
                              <span className="text-rose-500 font-bold font-mono text-sm">
                                {session.avgHeartRateBpm ? `${session.avgHeartRateBpm} BPM` : '--'}
                              </span>
                            </div>
                          </div>

                          <button 
                            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(session.id);
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details Body */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 border-t border-white/5 bg-black/20 space-y-4 text-sm">
                          {/* Mobile metrics view */}
                          <div className="grid grid-cols-2 gap-3 sm:hidden">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                              <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider block mb-1">Distância</span>
                              <span className="text-blue-400 font-bold font-mono text-base">
                                {session.actualDistanceKm ? `${session.actualDistanceKm} KM` : '--'}
                              </span>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                              <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider block mb-1">Coração</span>
                              <span className="text-rose-500 font-bold font-mono text-base">
                                {session.avgHeartRateBpm ? `${session.avgHeartRateBpm} BPM` : '--'}
                              </span>
                            </div>
                          </div>

                          {/* Planned vs Actual Duration metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Duration Comparison */}
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                              <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider block">Duração Real</span>
                              <div className="flex items-baseline gap-1.5">
                                <Clock className="w-4 h-4 text-[#CCFF00] self-center" />
                                <span className="text-white font-extrabold text-base font-mono">{session.actualDurationMinutes} minutos</span>
                                <span className="text-white/30 text-[10px] font-bold font-mono">/ {session.plannedDurationMinutes} MIN PLANEJADOS</span>
                              </div>
                            </div>

                            {/* Cardiovascular Intensity Indicator */}
                            {session.avgHeartRateBpm && (
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider block">Zona Cardiovascular</span>
                                <div className="flex items-center gap-1.5">
                                  <Heart className="w-4 h-4 text-rose-500" />
                                  <span className="text-white font-bold font-mono text-sm">
                                    {session.avgHeartRateBpm < 110 ? 'Regenerativo' :
                                     session.avgHeartRateBpm < 140 ? 'Zonas Aeróbicas 2/3' :
                                     session.avgHeartRateBpm < 165 ? 'Limiar Anaeróbico' : 'Intensidade Máxima'}
                                  </span>
                                  <span className="text-[10px] text-white/40 font-mono font-bold">({session.avgHeartRateBpm} BPM)</span>
                                </div>
                              </div>
                            )}

                            {/* Pace indicator */}
                            {session.actualDistanceKm && session.actualDistanceKm > 0 && (
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider block">Ritmo Médio (Pace)</span>
                                <div className="flex items-center gap-1.5">
                                  <Milestone className="w-4 h-4 text-blue-400" />
                                  <span className="text-white font-bold font-mono text-sm">
                                    {(() => {
                                      const totalMin = session.actualDurationMinutes;
                                      const paceDecimal = totalMin / session.actualDistanceKm;
                                      const paceMin = Math.floor(paceDecimal);
                                      const paceSec = Math.round((paceDecimal - paceMin) * 60).toString().padStart(2, '0');
                                      return `${paceMin}:${paceSec} min/km`;
                                    })()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Original Workout plan list */}
                          {session.chunks && session.chunks.length > 0 && (
                            <div className="space-y-2">
                              <button
                                onClick={() => toggleChunksVisibility(session.id)}
                                className="flex items-center justify-between w-full text-left text-white/40 hover:text-white transition duration-200 cursor-pointer group"
                              >
                                <span className="text-[10px] font-bold uppercase tracking-wider block">
                                  Roteiro Aeróbico Realizado
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-mono text-white/30 group-hover:text-white/60 transition duration-200">
                                  {visibleChunks[session.id] ? (
                                    <>
                                      Ocultar <ChevronUp className="w-3.5 h-3.5 text-[#CCFF00]" />
                                    </>
                                  ) : (
                                    <>
                                      Exibir ({session.chunks.length} {session.chunks.length === 1 ? 'fase' : 'fases'}) <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </span>
                              </button>
                              
                              {visibleChunks[session.id] && (
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5 animate-fade-in">
                                  {session.chunks.map((chunk, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-white/80 py-1 border-b border-white/5 last:border-0">
                                      <span className="font-semibold uppercase tracking-wide text-white">Fase #{idx + 1}: {chunk.name}</span>
                                      <span className="text-white/60 font-mono">{chunk.durationMinutes} min • {chunk.speedKmh} km/h</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Strength reps */}
                          {session.strengthExercises && session.strengthExercises.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Exercícios Realizados</span>
                              <div className="bg-black/40 rounded-xl p-3 border border-white/5 space-y-1.5">
                                {session.strengthExercises.map((ex, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs text-white/80 py-1 border-b border-white/5 last:border-0">
                                    <span className="font-semibold uppercase tracking-wide text-white">{ex.name}</span>
                                    <span className="text-white/60 font-mono">{ex.series} SÉRIES x {ex.reps} REPS {ex.weightKg ? `• ${ex.weightKg}kg` : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Personal Notes */}
                          {session.notes && (
                            <div className="space-y-1">
                              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Anotações / Notas</span>
                              <p className="bg-black/40 p-3.5 border border-white/5 text-white/60 rounded-xl text-xs leading-relaxed italic">
                                "{session.notes}"
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end pt-2 border-t border-white/5 gap-3">
                            <button
                              onClick={() => {
                                setEditingSessionId(session.id);
                                setEditWorkoutName(session.workoutName);
                                setEditHeartRate(session.avgHeartRateBpm ? String(session.avgHeartRateBpm) : '');
                                setEditDistance(session.actualDistanceKm ? String(session.actualDistanceKm) : '');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] rounded-lg text-[10px] uppercase font-black tracking-widest transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar Registro
                            </button>
                            <button
                              onClick={() => {
                                setDeletingSessionId(session.id);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] uppercase font-black tracking-widest transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover Registro
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Confirmation Modal for Deletion */}
      {deletingSessionId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase font-display italic">Excluir Registro?</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Tem certeza que deseja excluir permanentemente este registro de treino? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingSessionId(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded font-bold text-xs uppercase tracking-wider border border-white/10 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteSession(deletingSessionId);
                  setDeletingSessionId(null);
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal for Editing Completed Workout */}
      {editingSessionId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151518] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <div className="p-2 bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg border border-[#CCFF00]/20">
                <Edit2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-white uppercase font-display italic">Editar Treino Realizado</h3>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Ajuste os dados registrados da sua atividade</p>
              </div>
            </div>

            <div className="space-y-4 text-left">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Nome do Treino</label>
                <input
                  type="text"
                  value={editWorkoutName}
                  onChange={e => setEditWorkoutName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#CCFF00]/50 font-sans"
                  placeholder="Ex: Corrida na Esteira"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Distance */}
                <div className="space-y-1.5">
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Distância (KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDistance}
                    onChange={e => setEditDistance(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#CCFF00]/50 font-mono"
                    placeholder="Ex: 5.2"
                  />
                </div>

                {/* Heart Rate */}
                <div className="space-y-1.5">
                  <label className="text-white/50 text-[10px] font-bold uppercase tracking-wider block">Freq. Cardíaca (BPM)</label>
                  <input
                    type="number"
                    step="1"
                    value={editHeartRate}
                    onChange={e => setEditHeartRate(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#CCFF00]/50 font-mono"
                    placeholder="Ex: 145"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingSessionId(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-wider border border-white/10 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!editWorkoutName.trim()) return;
                  onUpdateSession(editingSessionId, {
                    workoutName: editWorkoutName.trim(),
                    actualDistanceKm: editDistance ? parseFloat(editDistance) : undefined,
                    avgHeartRateBpm: editHeartRate ? parseInt(editHeartRate, 10) : undefined
                  });
                  setEditingSessionId(null);
                }}
                className="flex-1 py-3 bg-[#CCFF00] hover:bg-[#b3e000] text-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.15)] transition cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
