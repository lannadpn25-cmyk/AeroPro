/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, WorkoutTemplate, CompletedWorkout, WeeklyGoals 
} from './types';
import { 
  DEFAULT_ACTIVITIES, DEFAULT_TEMPLATES, DEFAULT_WEEKLY_GOALS 
} from './data/defaults';
import Dashboard from './components/Dashboard';
import WorkoutList from './components/WorkoutList';
import WorkoutPlayer from './components/WorkoutPlayer';
import SessionHistory from './components/SessionHistory';
import ReportView from './components/ReportView';
import { 
  TrendingUp, Calendar, Dumbbell, Printer, Heart, Award, Sparkles, Flame 
} from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'exercicio' | 'resumo' | 'historico' | 'relatorio'>('exercicio');

  // Core application states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);

  // Active workout player states
  const [activeWorkout, setActiveWorkout] = useState<WorkoutTemplate | null>(null);
  const [musicMode, setMusicMode] = useState(true);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Load from LocalStorage or use defaults
  useEffect(() => {
    const storedActivities = localStorage.getItem('aeroprogress_activities');
    const storedTemplates = localStorage.getItem('aeroprogress_templates');
    const storedCompleted = localStorage.getItem('aeroprogress_completed');
    const storedGoals = localStorage.getItem('aeroprogress_goals');

    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    } else {
      setActivities(DEFAULT_ACTIVITIES);
      localStorage.setItem('aeroprogress_activities', JSON.stringify(DEFAULT_ACTIVITIES));
    }

    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('aeroprogress_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }

    if (storedGoals) {
      setWeeklyGoals(JSON.parse(storedGoals));
    } else {
      setWeeklyGoals(DEFAULT_WEEKLY_GOALS);
    }

    if (storedCompleted) {
      setCompletedWorkouts(JSON.parse(storedCompleted));
    } else {
      // Seed some mock workout history for elegant first-time charts
      const now = new Date();
      const mockHistory: CompletedWorkout[] = [
        {
          id: 'mock-1',
          templateId: 'temp-caminhada-progressiva',
          workoutName: 'Caminhada Progressiva 15min',
          activityId: 'act-caminhada',
          activityName: 'Caminhada ao Ar Livre',
          activityType: 'aerobic',
          date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDurationMinutes: 15,
          actualDurationMinutes: 15,
          actualDistanceKm: 2.1,
          avgHeartRateBpm: 112,
          notes: 'Aquecimento inicial e ritmos rápidos muito bons.'
        },
        {
          id: 'mock-2',
          templateId: 'temp-corrida-intervalada',
          workoutName: 'Corrida Intervalada 20min',
          activityId: 'act-corrida',
          activityName: 'Corrida ao Ar Livre',
          activityType: 'aerobic',
          date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDurationMinutes: 20,
          actualDurationMinutes: 20,
          actualDistanceKm: 4.3,
          avgHeartRateBpm: 145,
          notes: 'Foco no tiro de 11km/h na metade do tempo.'
        },
        {
          id: 'mock-3',
          templateId: 'temp-corrida-intervalada',
          workoutName: 'Corrida Intervalada Forte',
          activityId: 'act-corrida',
          activityName: 'Corrida ao Ar Livre',
          activityType: 'aerobic',
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          plannedDurationMinutes: 20,
          actualDurationMinutes: 22,
          actualDistanceKm: 4.8,
          avgHeartRateBpm: 151,
          notes: 'Pace excelente e fôlego em evolução constante!'
        }
      ];
      setCompletedWorkouts(mockHistory);
      localStorage.setItem('aeroprogress_completed', JSON.stringify(mockHistory));
    }
  }, []);

  // Save to LocalStorage whenever state changes
  const saveActivities = (newActivities: Activity[]) => {
    setActivities(newActivities);
    localStorage.setItem('aeroprogress_activities', JSON.stringify(newActivities));
  };

  const saveTemplates = (newTemplates: WorkoutTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('aeroprogress_templates', JSON.stringify(newTemplates));
  };

  const saveCompleted = (newCompleted: CompletedWorkout[]) => {
    setCompletedWorkouts(newCompleted);
    localStorage.setItem('aeroprogress_completed', JSON.stringify(newCompleted));
  };

  const saveGoals = (newGoals: WeeklyGoals) => {
    setWeeklyGoals(newGoals);
    localStorage.setItem('aeroprogress_goals', JSON.stringify(newGoals));
  };

  // State Handlers
  const handleAddActivity = (activity: Activity) => {
    const updated = [...activities, activity];
    saveActivities(updated);
  };

  const handleEditActivity = (updatedActivity: Activity) => {
    const updated = activities.map(a => a.id === updatedActivity.id ? updatedActivity : a);
    saveActivities(updated);
  };

  const handleDeleteActivity = (id: string) => {
    const updated = activities.filter(a => a.id !== id);
    saveActivities(updated);
  };

  const handleAddTemplate = (template: WorkoutTemplate) => {
    const updated = [...templates, template];
    saveTemplates(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
  };

  const handleEditTemplate = (updatedTemplate: WorkoutTemplate) => {
    const updated = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    saveTemplates(updated);
  };

  const handleStartWorkout = (template: WorkoutTemplate, music: boolean, voice: boolean) => {
    setMusicMode(music);
    setVoiceMode(voice);
    setActiveWorkout(template);
  };

  const handleSaveSession = (sessionData: Omit<CompletedWorkout, 'id' | 'date'>) => {
    const newSession: CompletedWorkout = {
      ...sessionData,
      id: `session-${Date.now()}`,
      date: new Date().toISOString()
    };

    const updated = [newSession, ...completedWorkouts];
    saveCompleted(updated);
    setActiveWorkout(null);
    setActiveTab('historico'); // Automatically redirect to History of runs to view entry
  };

  const handleDeleteSession = (id: string) => {
    const updated = completedWorkouts.filter(s => s.id !== id);
    saveCompleted(updated);
  };

  const handleViewTemplateHistory = (templateId: string) => {
    setActiveTab('historico');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#CCFF00] selection:text-black flex flex-col font-sans">
      
      {/* Upper header - Hidden during active workouts or print */}
      {!activeWorkout && (
        <header className="bg-[#0F0F12] border-b border-white/10 sticky top-0 z-40 print:hidden">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#CCFF00] rounded flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.15)]">
                <Flame className="w-5 h-5 text-black fill-black" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-white leading-none uppercase italic font-display">
                  AERO-X <span className="text-[#CCFF00] underline decoration-[#CCFF00] decoration-2">PRO</span>
                </h1>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">Evolução Cardiovascular</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setActiveTab('resumo');
                  setIsEditingGoals(true);
                }}
                className="text-xs bg-[#151518] border border-white/10 text-white font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white/5 hover:border-[#CCFF00]/50 transition cursor-pointer select-none text-left"
                title="Ajustar metas semanais"
              >
                <Award className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span className="opacity-50 font-sans text-[10px] tracking-wider uppercase">META:</span>
                <span className="text-[#CCFF00] font-bold">{weeklyGoals.targetMinutes} MIN</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main content body container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 mb-16">
        {activeWorkout ? (
          /* Active workout player mode completely hides normal header and tabs to foster deep focus */
          <WorkoutPlayer
            template={activeWorkout}
            musicMode={musicMode}
            voiceMode={voiceMode}
            onSaveSession={handleSaveSession}
            onCancel={() => {
              setActiveWorkout(null);
            }}
          />
        ) : (
          /* Regular navigation views */
          <>
            {activeTab === 'exercicio' && (
              <WorkoutList
                activities={activities}
                templates={templates}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddTemplate={handleAddTemplate}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onStartWorkout={handleStartWorkout}
                onViewTemplateHistory={handleViewTemplateHistory}
              />
            )}

            {activeTab === 'resumo' && (
              <Dashboard
                completedWorkouts={completedWorkouts}
                weeklyGoals={weeklyGoals}
                onUpdateGoals={saveGoals}
                isEditingGoals={isEditingGoals}
                setIsEditingGoals={setIsEditingGoals}
              />
            )}

            {activeTab === 'historico' && (
              <SessionHistory
                completedWorkouts={completedWorkouts}
                onDeleteSession={handleDeleteSession}
                activities={activities}
              />
            )}

            {activeTab === 'relatorio' && (
              <ReportView
                completedWorkouts={completedWorkouts}
                weeklyGoals={weeklyGoals}
              />
            )}
          </>
        )}
      </main>

      {/* Beautiful Tab Navigation Bar at the bottom (Inspired by Apple Fitness screenshot) - Hidden on active workouts or print */}
      {!activeWorkout && (
        <>
          <nav className="fixed bottom-0 left-0 right-0 bg-[#0F0F12]/95 backdrop-blur-md border-t border-white/10 py-3 px-4 z-40 print:hidden">
            <div className="max-w-md mx-auto flex justify-between items-center">
              
              {/* Tab: Resumo */}
              <button
                onClick={() => setActiveTab('resumo')}
                className={`flex-1 flex flex-col items-center justify-center transition gap-1 ${
                  activeTab === 'resumo' ? 'text-[#CCFF00] font-bold scale-105 font-display' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-[0.15em]">Resumo</span>
              </button>

              {/* Tab: Exercício (Matches highlighted center green icon) */}
              <button
                onClick={() => setActiveTab('exercicio')}
                className={`flex-1 flex flex-col items-center justify-center transition gap-1 ${
                  activeTab === 'exercicio' ? 'text-[#CCFF00] font-bold scale-105 font-display' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Dumbbell className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-[0.15em]">Treinos</span>
              </button>

              {/* Tab: Histórico */}
              <button
                onClick={() => setActiveTab('historico')}
                className={`flex-1 flex flex-col items-center justify-center transition gap-1 ${
                  activeTab === 'historico' ? 'text-[#CCFF00] font-bold scale-105 font-display' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-[0.15em]">Histórico</span>
              </button>

              {/* Tab: Relatório */}
              <button
                onClick={() => setActiveTab('relatorio')}
                className={`flex-1 flex flex-col items-center justify-center transition gap-1 ${
                  activeTab === 'relatorio' ? 'text-[#CCFF00] font-bold scale-105 font-display' : 'text-white/40 hover:text-white/80'
                }`}
              >
                <Printer className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-[0.15em]">Relatórios</span>
              </button>

            </div>
          </nav>

          {/* Fixed overlay tiny background decorative footer line to mimic screen status */}
          <footer className="h-6 bg-black border-t border-white/5 px-4 flex items-center justify-between text-[8px] text-white/30 tracking-widest uppercase print:hidden mt-auto">
            <span>STATUS: SYNCED WITH BIOMETRICS</span>
            <span className="text-[#CCFF00] font-mono">SYSTEM CORE v2.4.0-AEROBIC</span>
          </footer>
        </>
      )}
    </div>
  );
}

