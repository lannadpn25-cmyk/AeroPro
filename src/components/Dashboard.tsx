import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  WeeklyGoals, CompletedWorkout 
} from '../types';
import { 
  Target, Flame, Footprints, Clock, Award, TrendingUp, Heart, Edit2, Check 
} from 'lucide-react';

interface DashboardProps {
  completedWorkouts: CompletedWorkout[];
  weeklyGoals: WeeklyGoals;
  onUpdateGoals: (newGoals: WeeklyGoals) => void;
  isEditingGoals: boolean;
  setIsEditingGoals: (val: boolean) => void;
}

export default function Dashboard({ 
  completedWorkouts, 
  weeklyGoals, 
  onUpdateGoals,
  isEditingGoals,
  setIsEditingGoals
}: DashboardProps) {
  const [goalMin, setGoalMin] = useState(weeklyGoals.targetMinutes);
  const [goalKm, setGoalKm] = useState(weeklyGoals.targetDistanceKm);
  const [goalCount, setGoalCount] = useState(weeklyGoals.targetWorkoutsCount);

  useEffect(() => {
    if (isEditingGoals) {
      setGoalMin(weeklyGoals.targetMinutes);
      setGoalKm(weeklyGoals.targetDistanceKm);
      setGoalCount(weeklyGoals.targetWorkoutsCount);
    }
  }, [isEditingGoals, weeklyGoals]);

  // Calculate current week statistics (last 7 days)
  const getWeeklyStats = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = completedWorkouts.filter(w => {
      const wDate = new Date(w.date);
      return wDate >= oneWeekAgo;
    });

    const totalMinutes = weeklyWorkouts.reduce((sum, w) => sum + w.actualDurationMinutes, 0);
    const totalKm = weeklyWorkouts.reduce((sum, w) => sum + (w.actualDistanceKm || 0), 0);
    const workoutsCount = weeklyWorkouts.length;

    return {
      minutes: totalMinutes,
      km: Math.round(totalKm * 10) / 10,
      count: workoutsCount
    };
  };

  const stats = getWeeklyStats();

  const handleSaveGoals = () => {
    onUpdateGoals({
      targetMinutes: goalMin,
      targetDistanceKm: goalKm,
      targetWorkoutsCount: goalCount,
    });
    setIsEditingGoals(false);
  };

  // Prepare data for the charts
  // Group workouts by date to show a nice timeline
  const getChartData = () => {
    if (completedWorkouts.length === 0) return [];
    
    // Sort workouts by date ascending
    const sorted = [...completedWorkouts].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted.slice(-10).map(w => {
      const dateObj = new Date(w.date);
      return {
        name: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        minutos: w.actualDurationMinutes,
        km: w.actualDistanceKm || 0,
        bpm: w.avgHeartRateBpm || 0,
        tipo: w.activityName
      };
    });
  };

  const chartData = getChartData();

  // Progress percentages
  const pctMin = Math.min(Math.round((stats.minutes / weeklyGoals.targetMinutes) * 100), 100);
  const pctKm = Math.min(Math.round((stats.km / weeklyGoals.targetDistanceKm) * 100), 100);
  const pctCount = Math.min(Math.round((stats.count / weeklyGoals.targetWorkoutsCount) * 100), 100);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white font-display tracking-tighter uppercase italic">Resumo <span className="text-[#CCFF00]">&</span> Evolução</h1>
          <p className="text-white/40 text-[10px] tracking-wider uppercase font-bold">Seu progresso nos últimos 7 dias de treino</p>
        </div>
      </div>

      {/* Goal Edit Panel */}
      {isEditingGoals && (
        <div className="bg-[#151518] border border-[#CCFF00]/30 rounded-xl p-5 space-y-4 animate-fade-in" id="panel-edit-goals">
          <h3 className="text-white font-display font-bold text-sm tracking-widest uppercase flex items-center gap-2">
            <Target className="w-4 h-4 text-[#CCFF00]" />
            Definir Metas Semanais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Tempo Aeróbico (Minutos)</label>
              <input
                type="number"
                value={goalMin}
                onChange={e => setGoalMin(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Distância Semanal Alvo (KM)</label>
              <input
                type="number"
                value={goalKm}
                onChange={e => setGoalKm(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Quantidade de Treinos Alvo</label>
              <input
                type="number"
                value={goalCount}
                onChange={e => setGoalCount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00]/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditingGoals(false)}
              className="px-4 py-1.5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded text-xs uppercase tracking-widest transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveGoals}
              className="px-5 py-1.5 bg-[#CCFF00] text-black font-black hover:bg-[#b3e000] rounded text-xs uppercase tracking-widest transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Goal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Minutes Card */}
        <div className="bg-[#151518] rounded-xl p-5 border border-white/5 flex flex-col justify-between" id="card-goal-minutes">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Minutos Aeróbicos</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-white">{stats.minutes}</span>
                <span className="text-white/40 text-xs font-mono">/ {weeklyGoals.targetMinutes} min</span>
              </div>
            </div>
            <div className="p-2 bg-[#CCFF00]/10 rounded border border-[#CCFF00]/20 text-[#CCFF00]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-[#CCFF00] font-bold">{pctMin}% CONCLUÍDO</span>
              <span className="text-white/30 uppercase">META SEMANAL</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#CCFF00] rounded-full transition-all duration-500" 
                style={{ width: `${pctMin}%` }}
              />
            </div>
          </div>
        </div>

        {/* Distance Card */}
        <div className="bg-[#151518] rounded-xl p-5 border border-white/5 flex flex-col justify-between" id="card-goal-distance">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Distância Total</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-white">{stats.km}</span>
                <span className="text-white/40 text-xs font-mono">/ {weeklyGoals.targetDistanceKm} km</span>
              </div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-blue-400 font-bold">{pctKm}% CONCLUÍDO</span>
              <span className="text-white/30 uppercase">META SEMANAL</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${pctKm}%` }}
              />
            </div>
          </div>
        </div>

        {/* Workouts Card */}
        <div className="bg-[#151518] rounded-xl p-5 border border-white/5 flex flex-col justify-between" id="card-goal-count">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">Sessões de Treino</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-white">{stats.count}</span>
                <span className="text-white/40 text-xs font-mono">/ {weeklyGoals.targetWorkoutsCount} treinos</span>
              </div>
            </div>
            <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-purple-400 font-bold">{pctCount}% CONCLUÍDO</span>
              <span className="text-white/30 uppercase">META SEMANAL</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${pctCount}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Banner */}
      {(pctMin === 100 || pctKm === 100 || pctCount === 100) && (
        <div className="bg-gradient-to-r from-[#CCFF00]/15 to-neutral-950 border border-[#CCFF00]/20 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-[#CCFF00] text-black p-2 rounded">
            <Award className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h4 className="text-[#CCFF00] font-bold text-sm uppercase tracking-wider font-display">Meta Semanal Atingida!</h4>
            <p className="text-white/60 text-xs">Parabéns pelo comprometimento com sua evolução aeróbica e saúde.</p>
          </div>
        </div>
      )}

      {/* Evolution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Minutes per workout */}
        <div className="bg-[#151518] rounded-xl p-5 border border-white/5 space-y-4" id="chart-volume">
          <div>
            <h3 className="text-white font-display font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#CCFF00]" />
              Volume de Atividade (Minutos)
            </h3>
            <p className="text-white/40 text-[10px] uppercase">Histórico das últimas 10 sessões realizadas</p>
          </div>
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-white/30">
                <Clock className="w-8 h-8 mb-2 opacity-30 text-[#CCFF00]" />
                <span className="text-xs uppercase tracking-widest font-mono">Nenhum treino registrado ainda.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#555" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#555" fontSize={10} fontClassName="font-mono" unit="m" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F0F12', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    labelStyle={{ color: '#CCFF00', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="minutos" stroke="#CCFF00" strokeWidth={2} fillOpacity={1} fill="url(#colorMinutos)" name="Minutos" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Cardio Evolution */}
        <div className="bg-[#151518] rounded-xl p-5 border border-white/5 space-y-4" id="chart-cardio">
          <div>
            <h3 className="text-white font-display font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Frequência Cardíaca (BPM) & Distância (KM)
            </h3>
            <p className="text-white/40 text-[10px] uppercase">Relação entre intensidade cardiovascular e distância</p>
          </div>
          <div className="h-72 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-white/30">
                <Heart className="w-8 h-8 mb-2 opacity-30 text-rose-500" />
                <span className="text-xs uppercase tracking-widest font-mono">Nenhum dado cardio registrado.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#555" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} unit=" bpm" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} unit=" km" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F0F12', borderColor: '#333', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 5 }} name="Freq. Cardíaca (BPM)" />
                  <Line yAxisId="right" type="monotone" dataKey="km" stroke="#3b82f6" strokeWidth={2} name="Distância (KM)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
