import React, { useState } from 'react';
import { 
  Activity, WorkoutTemplate, WorkoutChunk, StrengthExercise, ActivityType 
} from '../types';
import { 
  Plus, Play, Trash2, Milestone, Timer, ChevronRight, Check, Sparkles, Music, 
  MessageSquare, History, PlusCircle, ArrowLeft, Dumbbell, Footprints, Flame, 
  Bike, Heart, Zap, Info, InfoIcon, Pencil, GripVertical, Copy, X, Activity as LucideActivity
} from 'lucide-react';

interface WorkoutListProps {
  activities: Activity[];
  templates: WorkoutTemplate[];
  onAddActivity: (activity: Activity) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onAddTemplate: (template: WorkoutTemplate) => void;
  onEditTemplate: (template: WorkoutTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onStartWorkout: (template: WorkoutTemplate, musicMode: boolean, voiceMode: boolean) => void;
  onViewTemplateHistory: (templateId: string) => void;
}

// Map icon name to component helper
export function ActivityIcon({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  switch (name) {
    case 'Footprints': return <Footprints className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Activity': return <LucideActivity className={className} />;
    case 'Bike': return <Bike className={className} />;
    case 'Dumbbell': return <Dumbbell className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Zap': return <Zap className={className} />;
    default: return <LucideActivity className={className} />;
  }
}

const AVAILABLE_ICONS = ['Footprints', 'Flame', 'Activity', 'Bike', 'Dumbbell', 'Heart', 'Zap'];

export default function WorkoutList({ 
  activities, 
  templates, 
  onAddActivity, 
  onEditActivity,
  onDeleteActivity,
  onAddTemplate, 
  onEditTemplate,
  onDeleteTemplate,
  onStartWorkout,
  onViewTemplateHistory
}: WorkoutListProps) {
  // Navigation states for creating
  const [viewState, setViewState] = useState<'list' | 'create-activity' | 'create-template'>('list');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Custom states
  const [musicConfigs, setMusicConfigs] = useState<Record<string, boolean>>({});
  const [voiceConfigs, setVoiceConfigs] = useState<Record<string, boolean>>({});

  // Form states - Activity
  const [actName, setActName] = useState('');
  const [actType, setActType] = useState<ActivityType>('aerobic');
  const [actIcon, setActIcon] = useState('Footprints');
  const [actDesc, setActDesc] = useState('');

  // Form states - Template
  const [tempName, setTempName] = useState('');
  const [tempActId, setTempActId] = useState('');
  const [tempTargetUnit, setTempTargetUnit] = useState<'minutes' | 'km'>('minutes');
  const [tempTargetValue, setTempTargetValue] = useState(20);
  
  // Chunks (aerobic intervals) builder
  const [chunks, setChunks] = useState<WorkoutChunk[]>([
    { id: 'c-init-1', name: 'Aquecimento', durationMinutes: 5, speedKmh: 6.0 },
    { id: 'c-init-2', name: 'Ritmo Moderado', durationMinutes: 5, speedKmh: 8.5 }
  ]);
  const [newChunkName, setNewChunkName] = useState('Corrida Rápida');
  const [newChunkMin, setNewChunkMin] = useState(5);
  const [newChunkSpeed, setNewChunkSpeed] = useState(10.0);

  // Strength Exercises builder
  const [strengthExs, setStrengthExs] = useState<StrengthExercise[]>([
    { id: 'se-1', name: 'Agachamento', series: 4, reps: 12, weightKg: 0 }
  ]);
  const [newExName, setNewExName] = useState('');
  const [newExSeries, setNewExSeries] = useState(3);
  const [newExReps, setNewExReps] = useState(12);
  const [newExWeight, setNewExWeight] = useState(10);

  // Editing and drag-and-drop states for chunks
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editChunkName, setEditChunkName] = useState('');
  const [editChunkMin, setEditChunkMin] = useState(5);
  const [editChunkSpeed, setEditChunkSpeed] = useState(10.0);
  const [draggedChunkIndex, setDraggedChunkIndex] = useState<number | null>(null);

  // Editing and drag-and-drop states for strength exercises
  const [editingExId, setEditingExId] = useState<string | null>(null);
  const [editExName, setEditExName] = useState('');
  const [editExSeries, setEditExSeries] = useState(3);
  const [editExReps, setEditExReps] = useState(12);
  const [editExWeight, setEditExWeight] = useState(10);
  const [draggedExIndex, setDraggedExIndex] = useState<number | null>(null);

  // Helper handlers for Aerobic Chunks
  const handleStartEditChunk = (chunk: WorkoutChunk) => {
    setEditingChunkId(chunk.id);
    setEditChunkName(chunk.name);
    setEditChunkMin(chunk.durationMinutes);
    setEditChunkSpeed(chunk.speedKmh);
  };

  const handleSaveEditChunk = (id: string) => {
    setChunks(prev => prev.map(c => c.id === id ? {
      ...c,
      name: editChunkName,
      durationMinutes: Math.max(1, editChunkMin),
      speedKmh: Math.max(0.1, editChunkSpeed)
    } : c));
    setEditingChunkId(null);
  };

  const handleDuplicateChunk = (chunk: WorkoutChunk) => {
    const duplicated: WorkoutChunk = {
      ...chunk,
      id: `c-dup-${Date.now()}-${Math.random()}`,
      name: chunk.name
    };
    setChunks(prev => [...prev, duplicated]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedChunkIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedChunkIndex === null) return;
    const items = [...chunks];
    const draggedItem = items[draggedChunkIndex];
    items.splice(draggedChunkIndex, 1);
    items.splice(index, 0, draggedItem);
    setChunks(items);
    setDraggedChunkIndex(null);
  };

  // Helper handlers for Strength Exercises
  const handleStartEditStrengthEx = (ex: StrengthExercise) => {
    setEditingExId(ex.id);
    setEditExName(ex.name);
    setEditExSeries(ex.series);
    setEditExReps(ex.reps);
    setEditExWeight(ex.weightKg);
  };

  const handleSaveEditStrengthEx = (id: string) => {
    setStrengthExs(prev => prev.map(se => se.id === id ? {
      ...se,
      name: editExName,
      series: Math.max(1, editExSeries),
      reps: Math.max(1, editExReps),
      weightKg: Math.max(0, editExWeight)
    } : se));
    setEditingExId(null);
  };

  const handleDuplicateStrengthEx = (ex: StrengthExercise) => {
    const duplicated: StrengthExercise = {
      ...ex,
      id: `se-dup-${Date.now()}-${Math.random()}`,
      name: ex.name
    };
    setStrengthExs(prev => [...prev, duplicated]);
  };

  const handleExDragStart = (e: React.DragEvent, index: number) => {
    setDraggedExIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleExDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleExDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedExIndex === null) return;
    const items = [...strengthExs];
    const draggedItem = items[draggedExIndex];
    items.splice(draggedExIndex, 1);
    items.splice(index, 0, draggedItem);
    setStrengthExs(items);
    setDraggedExIndex(null);
  };

  // Calculate current total chunks duration
  const totalChunksDuration = chunks.reduce((sum, c) => sum + c.durationMinutes, 0);

  // Quick Music/Voice toggle helper
  const toggleMusic = (templateId: string) => {
    setMusicConfigs(prev => ({ ...prev, [templateId]: !prev[templateId] }));
  };

  const toggleVoice = (templateId: string) => {
    setVoiceConfigs(prev => ({ ...prev, [templateId]: !prev[templateId] }));
  };

  // Autocomplete / autofill aerobic chunks up to target
  const handleAutoFillChunks = () => {
    if (chunks.length === 0) return;
    const missingMin = tempTargetValue - totalChunksDuration;
    if (missingMin <= 0) return;

    // We can loop or repeat current chunks to fill the remaining time,
    // or add a "Desaceleração" or replicate the last chunk with a remaining timer.
    const lastChunk = chunks[chunks.length - 1];
    const fillChunk: WorkoutChunk = {
      id: `c-fill-${Date.now()}`,
      name: missingMin <= 5 ? 'Resfriamento Final' : `${lastChunk.name} (Repetido)`,
      durationMinutes: missingMin,
      speedKmh: Math.max(4.0, lastChunk.speedKmh - 1.5)
    };
    setChunks(prev => [...prev, fillChunk]);
  };

  const handleAddChunk = () => {
    if (!newChunkName) return;
    const c: WorkoutChunk = {
      id: `c-${Date.now()}-${Math.random()}`,
      name: newChunkName,
      durationMinutes: newChunkMin,
      speedKmh: newChunkSpeed
    };
    setChunks(prev => [...prev, c]);
  };

  const handleRemoveChunk = (id: string) => {
    setChunks(prev => prev.filter(c => c.id !== id));
  };

  const handleAddStrengthEx = () => {
    if (!newExName) return;
    const s: StrengthExercise = {
      id: `se-${Date.now()}`,
      name: newExName,
      series: newExSeries,
      reps: newExReps,
      weightKg: newExWeight
    };
    setStrengthExs(prev => [...prev, s]);
    setNewExName('');
  };

  const handleRemoveStrengthEx = (id: string) => {
    setStrengthExs(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName) return;

    if (editingActivity) {
      const updatedActivity: Activity = {
        ...editingActivity,
        name: actName,
        type: actType,
        icon: actIcon,
        description: actDesc || 'Atividade física personalizada.'
      };
      onEditActivity(updatedActivity);
    } else {
      const activity: Activity = {
        id: `act-${Date.now()}`,
        name: actName,
        type: actType,
        icon: actIcon,
        description: actDesc || 'Atividade física personalizada.',
        isCustom: true
      };
      onAddActivity(activity);
    }

    setViewState('list');
    setEditingActivity(null);
    
    // Clear state
    setActName('');
    setActDesc('');
    setActType('aerobic');
    setActIcon('Footprints');
  };

  const handleEditActivityClick = (activity: Activity) => {
    setEditingActivity(activity);
    setActName(activity.name);
    setActType(activity.type);
    setActIcon(activity.icon);
    setActDesc(activity.description || '');
    setViewState('create-activity');
  };

  const handleCancelActivityEdit = () => {
    setEditingActivity(null);
    setActName('');
    setActDesc('');
    setActType('aerobic');
    setActIcon('Footprints');
    setViewState('list');
  };

  const handleEditClick = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setTempName(template.name);
    setTempActId(template.activityId);
    setTempTargetUnit(template.targetUnit);
    setTempTargetValue(template.targetValue);
    setChunks(template.chunks || []);
    setStrengthExs(template.strengthExercises || []);
    setViewState('create-template');
  };

  const handleCancelTemplateForm = () => {
    setViewState('list');
    setEditingTemplate(null);
    setTempName('');
    setTempActId('');
    setChunks([
      { id: 'c-init-1', name: 'Aquecimento', durationMinutes: 5, speedKmh: 6.0 },
      { id: 'c-init-2', name: 'Ritmo Moderado', durationMinutes: 5, speedKmh: 8.5 }
    ]);
    setStrengthExs([
      { id: 'se-1', name: 'Agachamento', series: 4, reps: 12, weightKg: 0 }
    ]);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName || !tempActId) return;

    const selectedAct = activities.find(a => a.id === tempActId);
    if (!selectedAct) return;

    if (editingTemplate) {
      const updatedTemplate: WorkoutTemplate = {
        ...editingTemplate,
        name: tempName,
        activityId: tempActId,
        type: selectedAct.type,
        targetUnit: selectedAct.type === 'aerobic' ? tempTargetUnit : 'minutes',
        targetValue: tempTargetValue,
        chunks: selectedAct.type === 'aerobic' ? chunks : undefined,
        strengthExercises: selectedAct.type === 'strength' ? strengthExs : undefined
      };
      onEditTemplate(updatedTemplate);
    } else {
      const template: WorkoutTemplate = {
        id: `temp-${Date.now()}`,
        name: tempName,
        activityId: tempActId,
        type: selectedAct.type,
        targetUnit: selectedAct.type === 'aerobic' ? tempTargetUnit : 'minutes',
        targetValue: tempTargetValue,
        chunks: selectedAct.type === 'aerobic' ? chunks : undefined,
        strengthExercises: selectedAct.type === 'strength' ? strengthExs : undefined
      };
      onAddTemplate(template);
    }

    setViewState('list');
    setEditingTemplate(null);

    // Clear state
    setTempName('');
    setTempActId('');
    setChunks([
      { id: 'c-init-1', name: 'Aquecimento', durationMinutes: 5, speedKmh: 6.0 },
      { id: 'c-init-2', name: 'Ritmo Moderado', durationMinutes: 5, speedKmh: 8.5 }
    ]);
    setStrengthExs([
      { id: 'se-1', name: 'Agachamento', series: 4, reps: 12, weightKg: 0 }
    ]);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* List / Selection View */}
      {viewState === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-white font-display tracking-tighter uppercase italic">Escolha Seu Treino</h1>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewState('create-activity')}
                className="flex items-center gap-1.5 bg-[#151518] border border-white/10 hover:bg-white/5 hover:text-white text-white/80 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#CCFF00]" />
                Nova Atividade
              </button>
              <button
                onClick={() => {
                  if (activities.length > 0) {
                    setTempActId(activities[0].id);
                  }
                  setViewState('create-template');
                }}
                className="flex items-center gap-1.5 bg-[#CCFF00] hover:bg-[#b3e000] text-black px-4 py-2 rounded text-xs font-black uppercase tracking-widest transition shadow-[0_0_15px_rgba(204,255,0,0.15)]"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Treino
              </button>
            </div>
          </div>

          {/* List of workout templates (Apple Fitness inspired) */}
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="bg-[#151518] rounded-xl p-8 text-center border border-white/5">
                <p className="text-white/40 text-xs uppercase font-mono tracking-wider">Nenhum treino cadastrado. Crie um novo treino para começar!</p>
              </div>
            ) : (
              templates.map(template => {
                const activity = activities.find(a => a.id === template.activityId) || {
                  name: 'Atividade Geral',
                  icon: 'Activity',
                  description: ''
                };
                
                const isMusicActive = musicConfigs[template.id] ?? true;
                const isVoiceActive = voiceConfigs[template.id] ?? true;
 
                return (
                  <div 
                    key={template.id} 
                    className="bg-[#151518] border border-white/5 rounded-2xl p-5 hover:border-[#CCFF00]/40 transition duration-300 relative overflow-hidden group shadow-md"
                    id={`workout-card-${template.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left Block: Icon & Info with padding to avoid overlapping the absolute action buttons */}
                      <div className="flex gap-4 items-center pr-16 sm:pr-0 flex-1 min-w-0">
                        <div className="p-3 bg-white/5 border border-white/10 text-[#CCFF00] rounded-xl shrink-0">
                          <ActivityIcon name={activity.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <span className="text-[#CCFF00] text-[10px] font-bold tracking-[0.2em] uppercase hidden sm:block truncate">
                            {activity.name}
                          </span>
                          <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug uppercase font-display break-words">
                            {template.name}
                          </h3>
                          {template.type === 'aerobic' ? (
                            <p className="text-white/40 text-[11px] sm:text-xs flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono">
                              <Milestone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>{template.chunks?.length || 0} INTERVALOS</span>
                              <span className="text-white/20">•</span>
                              <span>META: <span className="text-white font-bold">{template.targetValue}</span> <span className="text-[#CCFF00] font-bold">{template.targetUnit === 'minutes' ? 'MINUTOS' : 'KM'}</span></span>
                            </p>
                          ) : (
                            <p className="text-white/40 text-[11px] sm:text-xs flex items-center gap-1.5 font-mono">
                              <Dumbbell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              <span>{template.strengthExercises?.length || 0} EXERCÍCIOS DE FORÇA</span>
                            </p>
                          )}
                        </div>
                      </div>
 
                      {/* Action buttons (Edit/Duplicate/Delete) placed absolutely in the top corner for perfect layout control */}
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(template)}
                          className="p-1.5 text-white/30 hover:text-[#CCFF00] rounded-lg hover:bg-white/5 transition"
                          title="Editar treino"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const newTemplate: WorkoutTemplate = {
                              ...template,
                              id: `temp-${Date.now()}-${Math.random()}`,
                              name: `${template.name} (Cópia)`,
                              chunks: template.chunks ? template.chunks.map(c => ({ ...c, id: `c-${Date.now()}-${Math.random()}` })) : undefined,
                              strengthExercises: template.strengthExercises ? template.strengthExercises.map(s => ({ ...s, id: `se-${Date.now()}-${Math.random()}` })) : undefined
                            };
                            onAddTemplate(newTemplate);
                          }}
                          className="p-1.5 text-white/30 hover:text-blue-400 rounded-lg hover:bg-white/5 transition cursor-pointer"
                          title="Duplicar treino"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
 
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza de que deseja excluir este treino?')) {
                              onDeleteTemplate(template.id);
                            }
                          }}
                          className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
                          title="Excluir treino"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* START Button - Prominent, high-contrast, large, and perfectly labeled */}
                      <button
                        onClick={() => onStartWorkout(template, false, isVoiceActive)}
                        className="w-full sm:w-auto px-6 py-3 bg-[#CCFF00] hover:bg-[#b3e000] text-black font-black rounded-xl transition transform hover:scale-[1.02] sm:hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(204,255,0,0.25)] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest text-xs font-mono shrink-0"
                        id={`btn-play-workout-${template.id}`}
                        title="Iniciar Treino"
                      >
                        <Play className="w-4 h-4 fill-black" />
                        <span>START</span>
                      </button>
                    </div>
 
                    {/* Footer Action Buttons inside card (now responsive with wrap to avoid squishing on narrow screens) */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-5 border-t border-white/5 pt-4">
                      {/* Voice feedback toggle button */}
                      <button 
                        onClick={() => toggleVoice(template.id)}
                        className={`flex-1 min-w-[100px] flex justify-center items-center py-2 px-2 sm:px-3 rounded transition gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                          isVoiceActive 
                            ? 'bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20' 
                            : 'bg-black/40 text-white/40 border border-white/5 hover:border-white/10 hover:text-white/60'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>VOZ: {isVoiceActive ? 'ATIVA' : 'MUDA'}</span>
                      </button>
 
                      {/* History button */}
                      <button 
                        onClick={() => onViewTemplateHistory(template.id)}
                        className="flex-1 min-w-[100px] flex justify-center items-center py-2 px-2 sm:px-3 rounded bg-black/40 hover:bg-black/60 text-white/60 hover:text-white hover:border-white/10 transition border border-white/5 gap-1.5 text-[10px] uppercase font-bold tracking-wider"
                      >
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>HISTÓRICO</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create custom physical activity type */}
      {viewState === 'create-activity' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Form Side - 7 columns on md */}
          <div className="md:col-span-7 bg-[#151518] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleCancelActivityEdit}
                className="p-2 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-black uppercase font-display tracking-tight text-white italic">
                  {editingActivity ? 'Editar Atividade' : 'Nova Atividade Física'}
                </h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  {editingActivity ? 'Modifique os detalhes da atividade selecionada' : 'Adicione uma modalidade de exercício personalizada'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome da Atividade</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pilates, Jump Aeróbico, Funcional de Areia"
                  value={actName}
                  onChange={e => setActName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Foco / Tipo</label>
                  <select
                    value={actType}
                    disabled={!!editingActivity} // Prevent changing type after creation if linked templates depend on it
                    onChange={e => setActType(e.target.value as ActivityType)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono disabled:opacity-50"
                  >
                    <option value="aerobic">Aeróbico (Tempo/Distância)</option>
                    <option value="strength">Força/Resistência (Séries/Reps)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Ícone Ilustrativo</label>
                  <div className="flex gap-2 flex-wrap bg-black/40 p-2 border border-white/10 rounded-lg">
                    {AVAILABLE_ICONS.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setActIcon(iconName)}
                        className={`p-2 rounded-lg transition ${
                          actIcon === iconName 
                            ? 'bg-[#CCFF00] text-black' 
                            : 'bg-transparent text-white/40 hover:text-white'
                        }`}
                      >
                        <ActivityIcon name={iconName} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Descrição curta</label>
                <textarea
                  placeholder="Ex: Treino de alta intensidade na esteira ou ao ar livre..."
                  value={actDesc}
                  onChange={e => setActDesc(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm h-24 resize-none font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelActivityEdit}
                  className="flex-1 py-2 border border-white/10 text-white/40 hover:text-white rounded text-xs uppercase tracking-widest font-bold transition"
                >
                  {editingActivity ? 'Limpar / Cancelar' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#CCFF00] text-black hover:bg-[#b3e000] rounded font-black text-xs uppercase tracking-widest transition shadow-[0_0_15px_rgba(204,255,0,0.15)]"
                >
                  {editingActivity ? 'Salvar Alterações' : 'Adicionar Atividade'}
                </button>
              </div>
            </form>
          </div>

          {/* List/Management Side - 5 columns on md */}
          <div className="md:col-span-5 bg-[#151518] border border-white/5 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase font-display tracking-tight text-white italic">Atividades Atuais</h3>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Gerencie ou edite os nomes e ícones das modalidades</p>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {activities.map(act => (
                <div 
                  key={act.id} 
                  className={`flex justify-between items-center p-3 rounded-xl border transition ${
                    editingActivity?.id === act.id 
                      ? 'bg-[#CCFF00]/5 border-[#CCFF00]/40' 
                      : 'bg-black/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      editingActivity?.id === act.id ? 'bg-[#CCFF00]/20 text-[#CCFF00]' : 'bg-white/5 text-[#CCFF00]'
                    }`}>
                      <ActivityIcon name={act.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">{act.name}</h4>
                      <p className="text-[9px] text-white/40 font-mono uppercase">
                        {act.type === 'aerobic' ? 'Aeróbico' : 'Força'} {act.isCustom && '• Personalizado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleEditActivityClick(act)}
                      className={`p-1.5 rounded transition ${
                        editingActivity?.id === act.id 
                          ? 'text-[#CCFF00] bg-white/5' 
                          : 'text-white/40 hover:text-[#CCFF00] hover:bg-white/5'
                      }`}
                      title="Editar Atividade"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {act.isCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          const linkedTemplatesCount = templates.filter(t => t.activityId === act.id).length;
                          if (linkedTemplatesCount > 0) {
                            if (!window.confirm(`Esta atividade possui ${linkedTemplatesCount} treino(s) vinculado(s). Se você excluí-la, esses treinos podem ficar sem uma categoria. Deseja mesmo excluir?`)) {
                              return;
                            }
                          } else if (!window.confirm('Tem certeza de que deseja excluir esta atividade?')) {
                            return;
                          }
                          onDeleteActivity(act.id);
                          if (editingActivity?.id === act.id) {
                            handleCancelActivityEdit();
                          }
                        }}
                        className="p-1.5 text-white/40 hover:text-red-400 rounded hover:bg-white/5 transition"
                        title="Excluir Atividade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Create custom Workout Template (with intervals/chunks or sets) */}
      {viewState === 'create-template' && (
        <div className="max-w-2xl mx-auto bg-[#151518] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancelTemplateForm}
              className="p-2 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-black uppercase font-display tracking-tight text-white italic">
                {editingTemplate ? 'Editar Treino' : 'Criar Novo Treino'}
              </h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                {editingTemplate ? 'Modifique os detalhes, metas ou blocos de exercícios' : 'Configure o plano de performance e blocos de exercícios'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTemplate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome do Treino</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corrida de Tiro Curto 20m"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Vincular à Atividade</label>
                <select
                  value={tempActId}
                  onChange={e => setTempActId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
                >
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type === 'aerobic' ? 'Aeróbico' : 'Força'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Check selected activity type */}
            {(() => {
              const selectedAct = activities.find(a => a.id === tempActId);
              const isAerobic = selectedAct?.type === 'aerobic';

              if (isAerobic) {
                return (
                  <div className="space-y-6 border-t border-white/5 pt-5">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Definir Meta Geral</span>
                        <div className="flex gap-2 items-center">
                          <label className="flex items-center gap-1.5 text-white text-xs uppercase tracking-wider font-semibold">
                            <input 
                              type="radio" 
                              name="targetUnit" 
                              checked={tempTargetUnit === 'minutes'} 
                              onChange={() => setTempTargetUnit('minutes')}
                              className="accent-[#CCFF00]"
                            />
                            Tempo (Minutos)
                          </label>
                          <label className="flex items-center gap-1.5 text-white text-xs uppercase tracking-wider font-semibold ml-2">
                            <input 
                              type="radio" 
                              name="targetUnit" 
                              checked={tempTargetUnit === 'km'} 
                              onChange={() => setTempTargetUnit('km')}
                              className="accent-[#CCFF00]"
                            />
                            Distância (KMs)
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={tempTargetUnit === 'km' ? '0.1' : '1'}
                          value={tempTargetValue}
                          onChange={e => setTempTargetValue(Math.max(1, parseFloat(e.target.value) || 0))}
                          className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none text-center font-bold text-lg font-mono"
                        />
                        <span className="text-white/40 text-xs uppercase tracking-wider font-bold">{tempTargetUnit === 'minutes' ? 'minutos' : 'KMs'}</span>
                      </div>
                    </div>

                    {/* Aerobic Chunks Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-display font-bold text-sm uppercase">Divisão em Blocos (Chunks)</h4>
                          <p className="text-[10px] text-white/40 font-bold uppercase">
                            Crie intervalos com velocidade específica para preencher a meta
                          </p>
                        </div>
                        {tempTargetUnit === 'minutes' && (
                          <div className="text-right">
                            <span className="text-[9px] text-white/40 font-bold uppercase block">Duração dos blocos</span>
                            <span className={`text-xs font-mono font-bold ${
                              totalChunksDuration === tempTargetValue 
                                ? 'text-[#CCFF00]' 
                                : totalChunksDuration > tempTargetValue 
                                  ? 'text-red-400' 
                                  : 'text-amber-400'
                            }`}>
                              {totalChunksDuration} / {tempTargetValue} minutos
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Display added chunks timeline */}
                      <div className="space-y-2">
                        {chunks.map((chunk, index) => {
                          const isEditing = editingChunkId === chunk.id;
                          return (
                            <div 
                              key={chunk.id} 
                              draggable={!isEditing}
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, index)}
                              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 p-3 rounded-lg border transition ${
                                isEditing 
                                  ? 'border-[#CCFF00]/50 bg-black/60 shadow-[0_0_10px_rgba(204,255,0,0.05)]' 
                                  : 'border-white/5 hover:border-white/10'
                              } ${draggedChunkIndex === index ? 'opacity-40 border-dashed border-[#CCFF00]' : ''}`}
                            >
                              {isEditing ? (
                                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
                                  <span className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] font-mono font-bold px-2 py-1 rounded text-xs self-start sm:self-auto">
                                    #{index + 1}
                                  </span>
                                  <div className="flex flex-wrap gap-2 items-center flex-1">
                                    <div className="flex flex-col gap-1 min-w-[120px] flex-1">
                                      <span className="text-[8px] text-white/30 uppercase font-bold">Título do Bloco</span>
                                      <input
                                        type="text"
                                        value={editChunkName}
                                        onChange={e => setEditChunkName(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] font-mono"
                                        placeholder="Nome"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1 w-18">
                                      <span className="text-[8px] text-white/30 uppercase font-bold">Tempo</span>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={editChunkMin}
                                          onChange={e => setEditChunkMin(Math.max(1, parseInt(e.target.value) || 0))}
                                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] text-center font-mono"
                                        />
                                        <span className="text-[10px] text-white/40 font-mono">min</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 w-24">
                                      <span className="text-[8px] text-white/30 uppercase font-bold">Velocidade</span>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          step="0.1"
                                          value={editChunkSpeed}
                                          onChange={e => setEditChunkSpeed(Math.max(0.1, parseFloat(e.target.value) || 0))}
                                          className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] text-center font-mono"
                                        />
                                        <span className="text-[10px] text-white/40 font-mono">km/h</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 items-center justify-end sm:border-l border-white/5 sm:pl-3 self-end sm:self-auto pt-2 sm:pt-0">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditChunk(chunk.id)}
                                      className="p-2 text-[#CCFF00] hover:bg-[#CCFF00]/10 rounded-lg transition cursor-pointer"
                                      title="Salvar alterações"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingChunkId(null)}
                                      className="p-2 text-white/40 hover:bg-white/5 hover:text-white rounded-lg transition cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center w-full">
                                  <div className="flex gap-2.5 items-center">
                                    <div 
                                      className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/60 rounded transition"
                                      title="Arraste para reordenar"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <span className="bg-white/5 border border-white/10 text-[#CCFF00] font-mono font-bold px-2 py-0.5 rounded text-xs">
                                      #{index + 1}
                                    </span>
                                    <div>
                                      <h5 className="text-white text-xs uppercase font-bold tracking-wide">{chunk.name}</h5>
                                      <p className="text-white/40 text-[10px] font-mono">
                                        {chunk.durationMinutes} min • Velocidade ideal: <span className="text-[#CCFF00] font-bold">{chunk.speedKmh} km/h</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditChunk(chunk)}
                                      className="p-1.5 text-white/30 hover:text-[#CCFF00] hover:bg-white/5 rounded transition cursor-pointer"
                                      title="Editar bloco"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateChunk(chunk)}
                                      className="p-1.5 text-white/30 hover:text-cyan-400 hover:bg-white/5 rounded transition cursor-pointer"
                                      title="Duplicar bloco"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChunk(chunk.id)}
                                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition cursor-pointer"
                                      title="Excluir bloco"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {chunks.length === 0 && (
                          <p className="text-white/30 text-xs py-3 text-center uppercase font-mono">Nenhum bloco de corrida configurado ainda.</p>
                        )}
                      </div>

                      {/* Add new Chunk Builder */}
                      <div className="bg-black/30 p-4 border border-white/5 rounded-xl space-y-3">
                        <span className="text-white font-display font-bold text-xs uppercase tracking-wider block">Adicionar Novo Intervalo/Modo</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome do Bloco</label>
                            <input
                              type="text"
                              value={newChunkName}
                              onChange={e => setNewChunkName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                              placeholder="Ex: Corrida Intensa"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Duração (Minutos)</label>
                            <input
                              type="number"
                              value={newChunkMin}
                              onChange={e => setNewChunkMin(Math.max(1, parseInt(e.target.value) || 0))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Velocidade Alvo (KM/H)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={newChunkSpeed}
                              onChange={e => setNewChunkSpeed(Math.max(0.1, parseFloat(e.target.value) || 0))}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-between items-center pt-2">
                          {tempTargetUnit === 'minutes' && totalChunksDuration < tempTargetValue && (
                            <button
                              type="button"
                              onClick={handleAutoFillChunks}
                              className="flex items-center gap-1 text-[#CCFF00] hover:text-[#b3e000] text-xs font-bold uppercase tracking-wider"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Auto-preencher meta ({tempTargetValue - totalChunksDuration} min restantes)
                            </button>
                          )}
                          <div className="flex-1"></div>
                          <button
                            type="button"
                            onClick={handleAddChunk}
                            className="bg-[#CCFF00] hover:bg-[#b3e000] text-black text-xs font-black px-4 py-2 rounded uppercase tracking-wider transition flex items-center gap-1 self-end cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Incluir Bloco
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Strength Exercise customization
                return (
                  <div className="space-y-6 border-t border-white/5 pt-5">
                    <div>
                      <h4 className="text-white font-display font-bold text-sm uppercase">Exercícios e Séries de Força</h4>
                      <p className="text-[10px] text-white/40 font-bold uppercase">
                        Adicione exercícios de força corporal ou pesos a este plano
                      </p>
                    </div>

                    <div className="space-y-2">
                      {strengthExs.map((ex, index) => {
                        const isEditing = editingExId === ex.id;
                        return (
                          <div 
                            key={ex.id} 
                            draggable={!isEditing}
                            onDragStart={(e) => handleExDragStart(e, index)}
                            onDragOver={handleExDragOver}
                            onDrop={(e) => handleExDrop(e, index)}
                            className={`flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black/40 p-3 rounded-lg border transition ${
                              isEditing 
                                ? 'border-[#CCFF00]/50 bg-black/60 shadow-[0_0_10px_rgba(204,255,0,0.05)]' 
                                : 'border-white/5 hover:border-white/10'
                            } ${draggedExIndex === index ? 'opacity-40 border-dashed border-[#CCFF00]' : ''}`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
                                <span className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 text-[#CCFF00] font-mono font-bold px-2 py-1 rounded text-xs self-start sm:self-auto">
                                  #{index + 1}
                                </span>
                                <div className="flex flex-wrap gap-2 items-center flex-1">
                                  <div className="flex flex-col gap-1 min-w-[120px] flex-1">
                                    <span className="text-[8px] text-white/30 uppercase font-bold">Exercício</span>
                                    <input
                                      type="text"
                                      value={editExName}
                                      onChange={e => setEditExName(e.target.value)}
                                      className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] font-mono"
                                      placeholder="Nome do Exercício"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 w-14">
                                    <span className="text-[8px] text-white/30 uppercase font-bold">Séries</span>
                                    <input
                                      type="number"
                                      value={editExSeries}
                                      onChange={e => setEditExSeries(Math.max(1, parseInt(e.target.value) || 0))}
                                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] text-center font-mono"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 w-14">
                                    <span className="text-[8px] text-white/30 uppercase font-bold">Reps</span>
                                    <input
                                      type="number"
                                      value={editExReps}
                                      onChange={e => setEditExReps(Math.max(1, parseInt(e.target.value) || 0))}
                                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] text-center font-mono"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1 w-20">
                                    <span className="text-[8px] text-white/30 uppercase font-bold">Carga (kg)</span>
                                    <input
                                      type="number"
                                      value={editExWeight}
                                      onChange={e => setEditExWeight(Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-full bg-black/60 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#CCFF00] text-center font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-1 items-center justify-end sm:border-l border-white/5 sm:pl-3 self-end sm:self-auto pt-2 sm:pt-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditStrengthEx(ex.id)}
                                    className="p-2 text-[#CCFF00] hover:bg-[#CCFF00]/10 rounded-lg transition cursor-pointer"
                                    title="Salvar alterações"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingExId(null)}
                                    className="p-2 text-white/40 hover:bg-white/5 hover:text-white rounded-lg transition cursor-pointer"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center w-full">
                                <div className="flex gap-2.5 items-center">
                                  <div 
                                    className="cursor-grab active:cursor-grabbing p-1 text-white/20 hover:text-white/60 rounded transition"
                                    title="Arraste para reordenar"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <span className="bg-white/5 border border-white/10 text-purple-400 font-mono font-bold px-2 py-0.5 rounded text-xs">
                                    #{index + 1}
                                  </span>
                                  <div>
                                    <h5 className="text-white text-xs uppercase font-bold tracking-wide">{ex.name}</h5>
                                    <p className="text-white/40 text-[10px] font-mono">
                                      {ex.series} séries x {ex.reps} reps {ex.weightKg ? `• Carga: ${ex.weightKg} kg` : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-1 items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditStrengthEx(ex)}
                                    className="p-1.5 text-white/30 hover:text-[#CCFF00] hover:bg-white/5 rounded transition cursor-pointer"
                                    title="Editar exercício"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateStrengthEx(ex)}
                                    className="p-1.5 text-white/30 hover:text-cyan-400 hover:bg-white/5 rounded transition cursor-pointer"
                                    title="Duplicar exercício"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStrengthEx(ex.id)}
                                    className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition cursor-pointer"
                                    title="Excluir exercício"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {strengthExs.length === 0 && (
                        <p className="text-white/30 text-xs py-2 text-center uppercase font-mono">Nenhum exercício incluído ainda.</p>
                      )}
                    </div>

                    {/* Add strength builder */}
                    <div className="bg-black/30 p-4 border border-white/5 rounded-xl space-y-3">
                      <span className="text-white font-display font-bold text-xs uppercase tracking-wider block">Adicionar Exercício de Força</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome do Exercício</label>
                          <input
                            type="text"
                            value={newExName}
                            onChange={e => setNewExName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                            placeholder="Ex: Supino Reto, Agachamento Búlgaro"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Séries</label>
                          <input
                            type="number"
                            value={newExSeries}
                            onChange={e => setNewExSeries(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Reps</label>
                          <input
                            type="number"
                            value={newExReps}
                            onChange={e => setNewExReps(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 items-center justify-between pt-2">
                        <div className="space-y-1 flex items-center gap-2">
                          <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block whitespace-nowrap">Peso / Carga (KG)</label>
                          <input
                            type="number"
                            value={newExWeight}
                            onChange={e => setNewExWeight(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs text-center font-mono"
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleAddStrengthEx}
                          className="bg-[#CCFF00] hover:bg-[#b3e000] text-black text-xs font-black px-4 py-2 rounded uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Exercício
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}

            {/* Form actions */}
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleCancelTemplateForm}
                className="flex-1 py-2 border border-white/10 text-white/40 hover:text-white rounded text-xs uppercase tracking-widest font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#CCFF00] text-black hover:bg-[#b3e000] rounded font-black text-xs uppercase tracking-widest transition shadow-[0_0_15px_rgba(204,255,0,0.15)]"
              >
                {editingTemplate ? 'Salvar Alterações' : 'Salvar Plano de Treino'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
