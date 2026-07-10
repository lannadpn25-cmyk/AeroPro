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
  TrendingUp, Calendar, Dumbbell, Printer, Heart, Award, Sparkles, Flame, Cloud, RefreshCw, LogIn, LogOut, User as UserIcon, X, ShieldCheck, CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
  dbFetchWeeklyGoals,
  dbSaveWeeklyGoals,
  dbFetchActivities,
  dbSaveActivity,
  dbDeleteActivity,
  dbFetchTemplates,
  dbSaveTemplate,
  dbDeleteTemplate,
  dbFetchCompletedWorkouts,
  dbSaveCompletedWorkout,
  dbDeleteCompletedWorkout,
  auth,
  getOrCreateUserId,
  dbMigrateDataToUser
} from './utils/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || !item.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'exercicio' | 'resumo' | 'historico' | 'relatorio'>('exercicio');

  // Core application states
  const [activities, setActivities] = useState<Activity[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoals>(DEFAULT_WEEKLY_GOALS);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);

  // Active workout player states
  const [activeWorkout, setActiveWorkout] = useState<WorkoutTemplate | null>(null);
  const [musicMode, setMusicMode] = useState(true);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isEditingGoals, setIsEditingGoals] = useState(false);

  // Auth & login states
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authIsSignUp, setAuthIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    goals: 'idle' | 'loading' | 'success' | 'error';
    activities: 'idle' | 'loading' | 'success' | 'error';
    templates: 'idle' | 'loading' | 'success' | 'error';
    completed: 'idle' | 'loading' | 'success' | 'error';
  }>({
    goals: 'idle',
    activities: 'idle',
    templates: 'idle',
    completed: 'idle',
  });
  const [syncErrorDetails, setSyncErrorDetails] = useState<string | null>(null);

  // Helper for mock workouts
  const getDefaultCompletedWorkouts = (): CompletedWorkout[] => {
    const now = new Date();
    return [
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
  };

  const loadUserData = async (onProgress?: (step: string, status: 'idle' | 'loading' | 'success' | 'error', details?: string) => void) => {
    try {
      // 1. Fetch Weekly Goals
      if (onProgress) onProgress('goals', 'loading');
      let finalGoals = DEFAULT_WEEKLY_GOALS;
      const dbGoals = await dbFetchWeeklyGoals();
      if (dbGoals) {
        finalGoals = dbGoals;
      } else {
        const storedGoals = localStorage.getItem('aeroprogress_goals');
        if (storedGoals) {
          finalGoals = JSON.parse(storedGoals);
        }
        await dbSaveWeeklyGoals(finalGoals);
      }
      setWeeklyGoals(finalGoals);
      localStorage.setItem('aeroprogress_goals', JSON.stringify(finalGoals));
      if (onProgress) onProgress('goals', 'success');

      // 2. Fetch Activities
      if (onProgress) onProgress('activities', 'loading');
      let finalActivities = DEFAULT_ACTIVITIES;
      const dbActivities = await dbFetchActivities();
      if (dbActivities && dbActivities.length > 0) {
        finalActivities = dbActivities;
      } else {
        const storedActivities = localStorage.getItem('aeroprogress_activities');
        if (storedActivities) {
          finalActivities = JSON.parse(storedActivities);
        }
        // Seed to Firebase
        for (const act of finalActivities) {
          await dbSaveActivity(act);
        }
      }
      setActivities(deduplicateById(finalActivities));
      localStorage.setItem('aeroprogress_activities', JSON.stringify(finalActivities));
      if (onProgress) onProgress('activities', 'success');

      // 3. Fetch Templates
      if (onProgress) onProgress('templates', 'loading');
      let finalTemplates = DEFAULT_TEMPLATES;
      const dbTemplates = await dbFetchTemplates();
      if (dbTemplates && dbTemplates.length > 0) {
        finalTemplates = dbTemplates;
      } else {
        const storedTemplates = localStorage.getItem('aeroprogress_templates');
        if (storedTemplates) {
          finalTemplates = JSON.parse(storedTemplates);
        }
        // Seed to Firebase
        for (const t of finalTemplates) {
          await dbSaveTemplate(t);
        }
      }
      setTemplates(deduplicateById(finalTemplates));
      localStorage.setItem('aeroprogress_templates', JSON.stringify(finalTemplates));
      if (onProgress) onProgress('templates', 'success');

      // 4. Fetch Completed Workouts
      if (onProgress) onProgress('completed', 'loading');
      let finalCompleted: CompletedWorkout[] = [];
      const dbCompleted = await dbFetchCompletedWorkouts();
      if (dbCompleted && dbCompleted.length > 0) {
        finalCompleted = dbCompleted;
      } else {
        const storedCompleted = localStorage.getItem('aeroprogress_completed');
        if (storedCompleted) {
          finalCompleted = JSON.parse(storedCompleted);
        } else {
          finalCompleted = getDefaultCompletedWorkouts();
        }
        // Seed to Firebase
        for (const comp of finalCompleted) {
          await dbSaveCompletedWorkout(comp);
        }
      }
      setCompletedWorkouts(deduplicateById(finalCompleted));
      localStorage.setItem('aeroprogress_completed', JSON.stringify(finalCompleted));
      if (onProgress) onProgress('completed', 'success');
    } catch (err: any) {
      console.error("Error in loadUserData:", err);
      let details = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(details);
        if (parsed && parsed.error) {
          details = `Erro no Firestore [Operação: ${parsed.operationType.toUpperCase()}] no caminho: ${parsed.path}. Detalhes: ${parsed.error}`;
        }
      } catch (e) {
        // ignore
      }
      if (onProgress) onProgress('error', 'error', details);
      throw err;
    }
  };

  const fallbackToLocalStorage = () => {
    const storedActivities = localStorage.getItem('aeroprogress_activities');
    const storedTemplates = localStorage.getItem('aeroprogress_templates');
    const storedCompleted = localStorage.getItem('aeroprogress_completed');
    const storedGoals = localStorage.getItem('aeroprogress_goals');
    if (storedActivities) setActivities(deduplicateById(JSON.parse(storedActivities)));
    else setActivities(DEFAULT_ACTIVITIES);
    if (storedTemplates) setTemplates(deduplicateById(JSON.parse(storedTemplates)));
    else setTemplates(DEFAULT_TEMPLATES);
    if (storedGoals) setWeeklyGoals(JSON.parse(storedGoals));
    if (storedCompleted) setCompletedWorkouts(deduplicateById(JSON.parse(storedCompleted)));
  };

  // Auth listener and load flow
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoadingCloud(true);

      try {
        if (currentUser) {
          const lastLoggedUid = localStorage.getItem('aeroprogress_logged_in_uid');

          if (lastLoggedUid !== currentUser.uid) {
            setIsMigrating(true);
            // New login detected! Migrate whatever we currently have in local state or localStorage
            const localGoalsStr = localStorage.getItem('aeroprogress_goals');
            const localActivitiesStr = localStorage.getItem('aeroprogress_activities');
            const localTemplatesStr = localStorage.getItem('aeroprogress_templates');
            const localCompletedStr = localStorage.getItem('aeroprogress_completed');

            const localData = {
              weeklyGoals: localGoalsStr ? JSON.parse(localGoalsStr) : DEFAULT_WEEKLY_GOALS,
              activities: localActivitiesStr ? JSON.parse(localActivitiesStr) : DEFAULT_ACTIVITIES,
              templates: localTemplatesStr ? JSON.parse(localTemplatesStr) : DEFAULT_TEMPLATES,
              completedWorkouts: localCompletedStr ? JSON.parse(localCompletedStr) : []
            };

            // Migrate to the new authenticated user UID in Firestore, and fetch the consolidated data
            const merged = await dbMigrateDataToUser(currentUser.uid, localData);

            setWeeklyGoals(merged.weeklyGoals);
            setActivities(deduplicateById(merged.activities));
            setTemplates(deduplicateById(merged.templates));
            setCompletedWorkouts(deduplicateById(merged.completedWorkouts));

            // Persist locally
            localStorage.setItem('aeroprogress_goals', JSON.stringify(merged.weeklyGoals));
            localStorage.setItem('aeroprogress_activities', JSON.stringify(merged.activities));
            localStorage.setItem('aeroprogress_templates', JSON.stringify(merged.templates));
            localStorage.setItem('aeroprogress_completed', JSON.stringify(merged.completedWorkouts));
            localStorage.setItem('aeroprogress_logged_in_uid', currentUser.uid);
          } else {
            // Already logged in as this user, just pull updated cloud data
            await loadUserData();
          }
        } else {
          // Logged out (Anonymous / local mode)
          localStorage.removeItem('aeroprogress_logged_in_uid');
          await loadUserData();
        }
      } catch (err) {
        console.error("Auth state change sync error:", err);
        fallbackToLocalStorage();
      } finally {
        setIsLoadingCloud(false);
        setIsMigrating(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      setAuthError("Erro de autenticação. Garanta que o pop-up de login do Google não está bloqueado.");
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      setShowLoginModal(false);
    } catch (err: any) {
      console.error("Sign out failed:", err);
      setAuthError("Erro ao encerrar a sessão.");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setAuthLoading(true);

    try {
      if (authIsSignUp) {
        // Sign Up
        if (!authEmail || !authPassword || !authDisplayName) {
          throw new Error("Por favor, preencha todos os campos.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        // Update profile with name
        await updateProfile(userCredential.user, {
          displayName: authDisplayName
        });
        setAuthSuccessMsg("Conta criada com sucesso! Seus dados foram sincronizados.");
        // Reset form
        setAuthEmail('');
        setAuthPassword('');
        setAuthDisplayName('');
      } else {
        // Sign In
        if (!authEmail || !authPassword) {
          throw new Error("Por favor, informe e-mail e senha.");
        }
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setAuthSuccessMsg("Sessão iniciada com sucesso!");
        setAuthEmail('');
        setAuthPassword('');
      }
      
      // Close modal on success after a short delay
      setTimeout(() => {
        setShowLoginModal(false);
        setAuthSuccessMsg(null);
      }, 1500);

    } catch (err: any) {
      console.error("Authentication error:", err);
      let errMsg = "Erro de autenticação. Verifique os dados fornecidos.";
      if (err.code === 'auth/email-already-in-use') {
        errMsg = "Este e-mail já está em uso.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "A senha deve ter pelo menos 6 caracteres.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = "E-mail inválido.";
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = "E-mail ou senha incorretos.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setAuthError(errMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // State Handlers with Firebase Synchronization
  const handleAddActivity = async (activity: Activity) => {
    const updated = [...activities, activity];
    setActivities(updated);
    localStorage.setItem('aeroprogress_activities', JSON.stringify(updated));
    await dbSaveActivity(activity);
  };

  const handleEditActivity = async (updatedActivity: Activity) => {
    const updated = activities.map(a => a.id === updatedActivity.id ? updatedActivity : a);
    setActivities(updated);
    localStorage.setItem('aeroprogress_activities', JSON.stringify(updated));
    await dbSaveActivity(updatedActivity);
  };

  const handleDeleteActivity = async (id: string) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    localStorage.setItem('aeroprogress_activities', JSON.stringify(updated));
    await dbDeleteActivity(id);
  };

  const handleAddTemplate = async (template: WorkoutTemplate) => {
    const updated = [...templates, template];
    setTemplates(updated);
    localStorage.setItem('aeroprogress_templates', JSON.stringify(updated));
    await dbSaveTemplate(template);
  };

  const handleDeleteTemplate = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('aeroprogress_templates', JSON.stringify(updated));
    await dbDeleteTemplate(id);
  };

  const handleEditTemplate = async (updatedTemplate: WorkoutTemplate) => {
    const updated = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
    setTemplates(updated);
    localStorage.setItem('aeroprogress_templates', JSON.stringify(updated));
    await dbSaveTemplate(updatedTemplate);
  };

  const handleReorderTemplates = async (newTemplates: WorkoutTemplate[]) => {
    const ordered = newTemplates.map((t, idx) => ({ ...t, order: idx }));
    setTemplates(ordered);
    localStorage.setItem('aeroprogress_templates', JSON.stringify(ordered));
    try {
      await Promise.all(ordered.map(t => dbSaveTemplate(t)));
    } catch (e) {
      console.error("Failed to sync reordered templates to cloud:", e);
    }
  };

  const handleStartWorkout = (template: WorkoutTemplate, music: boolean, voice: boolean) => {
    setMusicMode(music);
    setVoiceMode(voice);
    setActiveWorkout(template);
  };

  const handleSaveSession = async (sessionData: Omit<CompletedWorkout, 'id' | 'date'>) => {
    const newSession: CompletedWorkout = {
      ...sessionData,
      id: `session-${Date.now()}`,
      date: new Date().toISOString()
    };

    const updated = [newSession, ...completedWorkouts];
    setCompletedWorkouts(updated);
    localStorage.setItem('aeroprogress_completed', JSON.stringify(updated));
    await dbSaveCompletedWorkout(newSession);
    setActiveWorkout(null);
    setActiveTab('historico'); // Automatically redirect to History of runs to view entry
  };

  const handleDeleteSession = async (id: string) => {
    const updated = completedWorkouts.filter(s => s.id !== id);
    setCompletedWorkouts(updated);
    localStorage.setItem('aeroprogress_completed', JSON.stringify(updated));
    await dbDeleteCompletedWorkout(id);
  };

  const handleUpdateSession = async (id: string, updatedFields: Partial<CompletedWorkout>) => {
    const updated = completedWorkouts.map(session => {
      if (session.id === id) {
        return { ...session, ...updatedFields };
      }
      return session;
    });
    setCompletedWorkouts(updated);
    localStorage.setItem('aeroprogress_completed', JSON.stringify(updated));
    
    // Find full updated session and save to Firestore
    const fullUpdated = updated.find(s => s.id === id);
    if (fullUpdated) {
      await dbSaveCompletedWorkout(fullUpdated);
    }
  };

  const saveGoals = async (newGoals: WeeklyGoals) => {
    setWeeklyGoals(newGoals);
    localStorage.setItem('aeroprogress_goals', JSON.stringify(newGoals));
    await dbSaveWeeklyGoals(newGoals);
  };

  const handleViewTemplateHistory = (templateId: string) => {
    setActiveTab('historico');
  };

  // Calculate current week statistics for header (last 7 days)
  const getWeeklyMinutes = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyWorkouts = completedWorkouts.filter(w => {
      const wDate = new Date(w.date);
      return wDate >= oneWeekAgo;
    });
    return weeklyWorkouts.reduce((sum, w) => sum + w.actualDurationMinutes, 0);
  };
  const weeklyMinutes = getWeeklyMinutes();

  if (isLoadingCloud) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center font-sans p-6">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#CCFF00] animate-spin" />
            </div>
            <Cloud className="w-5 h-5 text-emerald-400 absolute -bottom-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider uppercase text-white font-display">AERO-X PRO</h2>
            <p className="text-xs text-white/50 mt-1 font-mono">Iniciando conexão segura com Firestore...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-[#CCFF00] selection:text-black flex flex-col font-sans">
      
      {/* Upper header - Hidden during active workouts or print */}
      {!activeWorkout && (
        <header className="bg-[#0F0F12] border-b border-white/10 sticky top-0 z-40 print:hidden">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            
            {/* Clickable application icon and brand to open Login/Register Modal */}
            <button 
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-3 text-left hover:opacity-90 transition cursor-pointer group"
              title="Acessar / Cadastrar Conta"
            >
              <div className="w-9 h-9 bg-[#CCFF00] rounded flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.15)] group-hover:scale-105 transition duration-200">
                <Flame className="w-5 h-5 text-black fill-black" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tighter text-white leading-none uppercase italic font-display group-hover:text-[#CCFF00] transition-colors duration-200">
                  AERO-X <span className="text-[#CCFF00] underline decoration-[#CCFF00] decoration-2">PRO</span>
                </h1>
              </div>
            </button>

            <div className="flex items-center gap-2">

              {/* Login Status Badge */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-[#151518] border border-white/10 hover:border-[#CCFF00]/40 text-white font-mono px-3 py-1.5 rounded-lg text-xs hover:bg-white/5 transition cursor-pointer select-none"
                title={user ? `Conectado como ${user.displayName || user.email}` : "Entrar / Cadastrar conta"}
              >
                {user ? (
                  <>
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || "Avatar"} 
                        className="w-4 h-4 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-[#CCFF00]" />
                    )}
                    <span className="hidden sm:inline text-[10px] tracking-wider uppercase truncate max-w-[85px]">
                      {user.displayName?.split(' ')[0] || 'Conta'}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span className="text-[10px] tracking-wider uppercase font-bold">Entrar</span>
                  </>
                )}
              </button>

              {/* Sync button shown when logged in */}
              {user && (
                <button
                  onClick={async () => {
                    if (isSyncing) return;
                    setIsSyncing(true);
                    setSyncErrorDetails(null);
                    setSyncProgress({
                      goals: 'idle',
                      activities: 'idle',
                      templates: 'idle',
                      completed: 'idle',
                    });
                    setShowSyncModal(true);
                    try {
                      await loadUserData((step, status, details) => {
                        if (step === 'error') {
                          setSyncErrorDetails(details || 'Erro desconhecido');
                        } else {
                          setSyncProgress(prev => ({
                            ...prev,
                            [step]: status
                          }));
                        }
                      });
                    } catch (err) {
                      console.error("Sync error:", err);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  disabled={isSyncing}
                  className="p-2 bg-[#151518] border border-white/10 hover:border-[#CCFF00]/40 text-white hover:bg-white/5 rounded-lg transition cursor-pointer flex items-center justify-center disabled:opacity-50"
                  title="Sincronizar dados com a Nuvem"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#CCFF00] ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              )}

              <button 
                onClick={() => {
                  setActiveTab('resumo');
                  setIsEditingGoals(true);
                }}
                className="text-xs bg-[#151518] border border-white/10 text-white font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white/5 hover:border-[#CCFF00]/50 transition cursor-pointer select-none text-left"
                title="Ajustar metas semanais"
              >
                <Award className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                {/* Mobile mode (only completed/total) */}
                <span className="text-[#CCFF00] font-black sm:hidden">
                  {weeklyMinutes}/{weeklyGoals.targetMinutes}
                </span>
                {/* Laptop/Desktop mode (completed/total MIN) */}
                <span className="text-[#CCFF00] font-bold hidden sm:inline">
                  {weeklyMinutes} / {weeklyGoals.targetMinutes}MIN
                </span>
              </button>
            </div>
          </div>
        </header>
      )}


      {/* Main content body container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-2.5 sm:pt-5 pb-6 mb-16">
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
                templates={[...templates].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddTemplate={handleAddTemplate}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onStartWorkout={handleStartWorkout}
                onViewTemplateHistory={handleViewTemplateHistory}
                onReorderTemplates={handleReorderTemplates}
                completedWorkouts={completedWorkouts}
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
                onUpdateSession={handleUpdateSession}
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

      {/* Auth / Login / Register Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#CCFF00] rounded flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-black fill-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase font-display text-white">
                    {user ? 'Sua Conta Aero-X Pro' : 'Identificação do Atleta'}
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                    {user ? 'Sessão Conectada' : 'Sincronização na Nuvem'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs text-center font-medium leading-relaxed">
                  {authError}
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs text-center font-medium leading-relaxed flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {authSuccessMsg}
                </div>
              )}

              {user ? (
                /* Authenticated User View */
                <div className="space-y-4 py-2">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "Avatar"}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#CCFF00]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-black font-display border border-white/20 text-lg">
                          {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#121216] rounded-full"></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {user.displayName || 'Atleta Anônimo'}
                      </h4>
                      <p className="text-xs text-white/40 truncate font-mono mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed text-center">
                    Parabéns! Seus treinos, metas de performance e evolução cardiovascular estão ativamente sincronizados na nuvem e seguros na sua conta.
                  </p>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setShowLoginModal(false);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                /* Login / Signup Tabs Form */
                <div className="space-y-4">
                  {/* Tab Selector */}
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthIsSignUp(false);
                        setAuthError(null);
                        setAuthSuccessMsg(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                        !authIsSignUp ? 'bg-[#CCFF00] text-black' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthIsSignUp(true);
                        setAuthError(null);
                        setAuthSuccessMsg(null);
                      }}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                        authIsSignUp ? 'bg-[#CCFF00] text-black' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Cadastrar
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-3.5">
                    {authIsSignUp && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider font-mono">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: João Silva"
                          value={authDisplayName}
                          onChange={(e) => setAuthDisplayName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 focus:border-[#CCFF00]/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-sans"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider font-mono">Endereço de E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="atleta@aeroprogress.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#CCFF00]/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider font-mono">Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#CCFF00]/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-[#CCFF00] text-black hover:bg-[#bce600] disabled:opacity-50 font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 mt-4"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      ) : authIsSignUp ? (
                        'Criar Nova Conta'
                      ) : (
                        'Entrar na Conta'
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-white/30 uppercase tracking-widest font-mono font-bold">Conexão Rápida</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Google Login Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full bg-[#151518] hover:bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Entrar com o Google
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Migration Loading Overlay */}
      {isMigrating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <div className="flex flex-col items-center gap-5 max-w-sm text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                <RefreshCw className="w-8 h-8 text-[#CCFF00] animate-spin" />
              </div>
              <Cloud className="w-5 h-5 text-emerald-400 absolute -bottom-1 -right-1 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-black tracking-wider uppercase text-white font-display">Sincronizando Seus Dados...</h2>
              <p className="text-xs text-white/50 leading-relaxed font-sans">
                Seu histórico de treinos e rotinas locais está sendo importado de forma segura para o seu novo perfil na nuvem. Por favor, aguarde alguns segundos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync Progress Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#CCFF00] rounded flex items-center justify-center">
                  <RefreshCw className={`w-4.5 h-4.5 text-black ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wider uppercase font-display text-white">
                    Sincronização Cloud
                  </h3>
                  <p className="text-[10px] text-[#CCFF00] uppercase tracking-widest font-mono">
                    {isSyncing ? 'Atualizando dados na nuvem...' : 'Sincronização Concluída'}
                  </p>
                </div>
              </div>
              {!isSyncing && (
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Progress Body */}
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                {/* Step 1: Goals */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/25 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/70 font-medium">🎯 Metas Semanais</div>
                  </div>
                  <div>
                    {syncProgress.goals === 'loading' && <RefreshCw className="w-4 h-4 text-[#CCFF00] animate-spin" />}
                    {syncProgress.goals === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {syncProgress.goals === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {syncProgress.goals === 'idle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/10" />}
                  </div>
                </div>

                {/* Step 2: Activities */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/25 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/70 font-medium">🏃 Atividades de Exercício</div>
                  </div>
                  <div>
                    {syncProgress.activities === 'loading' && <RefreshCw className="w-4 h-4 text-[#CCFF00] animate-spin" />}
                    {syncProgress.activities === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {syncProgress.activities === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {syncProgress.activities === 'idle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/10" />}
                  </div>
                </div>

                {/* Step 3: Templates */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/25 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/70 font-medium">📋 Modelos de Treino (Templates)</div>
                  </div>
                  <div>
                    {syncProgress.templates === 'loading' && <RefreshCw className="w-4 h-4 text-[#CCFF00] animate-spin" />}
                    {syncProgress.templates === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {syncProgress.templates === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {syncProgress.templates === 'idle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/10" />}
                  </div>
                </div>

                {/* Step 4: Completed */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/25 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-white/70 font-medium">⏱️ Histórico de Treinos Finalizados</div>
                  </div>
                  <div>
                    {syncProgress.completed === 'loading' && <RefreshCw className="w-4 h-4 text-[#CCFF00] animate-spin" />}
                    {syncProgress.completed === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {syncProgress.completed === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {syncProgress.completed === 'idle' && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/10" />}
                  </div>
                </div>
              </div>

              {/* Error messages if any */}
              {syncErrorDetails && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>Erro de Sincronização</span>
                  </div>
                  <p className="text-[11px] text-white/70 font-mono leading-relaxed break-all">
                    {syncErrorDetails}
                  </p>
                </div>
              )}

              {/* Status footer/action */}
              <div className="pt-2">
                {!isSyncing ? (
                  syncErrorDetails ? (
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="w-full py-3 bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 text-red-300 font-bold uppercase tracking-wider text-xs rounded-xl transition cursor-pointer text-center"
                    >
                      Fechar e Corrigir
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSyncModal(false)}
                      className="w-full py-3 bg-[#CCFF00] text-black hover:bg-[#bce600] font-bold uppercase tracking-wider text-xs rounded-xl transition cursor-pointer text-center"
                    >
                      Ok, Entendi!
                    </button>
                  )
                ) : (
                  <div className="w-full py-3 bg-white/5 border border-white/5 text-white/40 font-mono text-center text-[10px] tracking-wider uppercase rounded-xl">
                    Sincronizando com o banco Firestore...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

