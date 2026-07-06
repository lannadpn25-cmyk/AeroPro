import React, { useState } from 'react';
import { CompletedWorkout, WeeklyGoals } from '../types';
import { Printer, Download, Award, ShieldAlert, Heart, Calendar, Clock, Milestone, Sparkles } from 'lucide-react';

interface ReportViewProps {
  completedWorkouts: CompletedWorkout[];
  weeklyGoals: WeeklyGoals;
}

export default function ReportView({ completedWorkouts, weeklyGoals }: ReportViewProps) {
  const [userName, setUserName] = useState('Atleta AeroProgress');
  const [trainerName, setTrainerName] = useState('Treinador Geral');
  const [timeframe, setTimeframe] = useState('Últimas semanas');

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Stats calculation
  const totalSessions = completedWorkouts.length;
  const totalMinutes = completedWorkouts.reduce((sum, w) => sum + w.actualDurationMinutes, 0);
  const totalDistance = completedWorkouts.reduce((sum, w) => sum + (w.actualDistanceKm || 0), 0);
  
  const workoutsWithBpm = completedWorkouts.filter(w => w.avgHeartRateBpm && w.avgHeartRateBpm > 0);
  const averageHeartRate = workoutsWithBpm.length > 0 
    ? Math.round(workoutsWithBpm.reduce((sum, w) => sum + (w.avgHeartRateBpm || 0), 0) / workoutsWithBpm.length)
    : 0;

  // Pace calculations (min/km)
  const averagePace = totalDistance > 0
    ? (() => {
        const paceDecimal = totalMinutes / totalDistance;
        const paceMin = Math.floor(paceDecimal);
        const paceSec = Math.round((paceDecimal - paceMin) * 60).toString().padStart(2, '0');
        return `${paceMin}:${paceSec} min/km`;
      })()
    : '--';

  return (
    <div className="space-y-6 pb-24">
      
      {/* Configuration bar - Hidden on print */}
      <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 space-y-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 font-display uppercase tracking-tight italic">
            <Sparkles className="w-5 h-5 text-[#CCFF00]" />
            Configurações do Relatório
          </h2>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome do Aluno/Atleta</label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Nome do Treinador/Personal</label>
            <input
              type="text"
              value={trainerName}
              onChange={e => setTrainerName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-white/40 text-[10px] font-bold uppercase tracking-wider block">Período de Análise</label>
            <input
              type="text"
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#CCFF00]/50 text-sm font-mono"
            />
          </div>
        </div>
 
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 animate-pulse" />
            O layout é otimizado para salvar como PDF através de "Salvar como PDF" do sistema de impressão.
          </p>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#CCFF00] hover:bg-[#b3e000] text-black font-black text-xs uppercase tracking-widest rounded transition shadow-[0_0_15px_rgba(204,255,0,0.15)] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Exportar PDF
          </button>
        </div>
      </div>

      {/* THE REPORT SHEET CONTAINER */}
      {/* This has custom classes for high compatibility on print page formatting */}
      <div 
        className="bg-white text-neutral-900 border border-neutral-200 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto space-y-8 print:border-0 print:shadow-none print:p-0 print:mx-0 print:my-0 print:bg-white print:text-black"
        id="pdf-printable-report"
      >
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6">
          <div className="space-y-1">
            <span className="text-lime-600 font-extrabold text-sm uppercase tracking-widest block">Relatório de Treinos</span>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight">AEROPROGRESS</h1>
            <p className="text-neutral-500 text-xs">Treinamento Aeróbico Sistêmico & Cargas Intervaladas</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <p><span className="font-bold text-neutral-700">Data de Geração:</span> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><span className="font-bold text-neutral-700">Atleta:</span> {userName}</p>
            <p><span className="font-bold text-neutral-700">Treinador:</span> {trainerName}</p>
            <p><span className="font-bold text-neutral-700">Período:</span> {timeframe}</p>
          </div>
        </div>

        {/* Executive summary statement */}
        <div className="bg-neutral-50 p-4 border border-neutral-200 rounded-xl text-xs leading-relaxed">
          <span className="font-bold block text-neutral-800 text-sm mb-1">Acompanhamento Técnico de Evolução</span>
          Este relatório detalha as sessões de treino realizadas pelo atleta, com foco prioritário no desenvolvimento e consolidação da capacidade cardiovascular. Os dados abaixo compilam a velocidade dos blocos (chunks) intervalados, quilometragem real percorrida e a respectiva frequência cardíaca de esforço, permitindo ao treinador diagnosticar e prescrever novas metas com base em dados.
        </div>

        {/* Scoreboard Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-neutral-50 p-4 border border-neutral-150 rounded-xl text-center">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">Total de Treinos</span>
            <span className="text-2xl font-black text-neutral-950">{totalSessions} sessões</span>
          </div>
          <div className="bg-neutral-50 p-4 border border-neutral-150 rounded-xl text-center">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">Tempo Acumulado</span>
            <span className="text-2xl font-black text-neutral-950">{totalMinutes} min</span>
          </div>
          <div className="bg-neutral-50 p-4 border border-neutral-150 rounded-xl text-center">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">Distância Percorrida</span>
            <span className="text-2xl font-black text-neutral-950">{Math.round(totalDistance * 10) / 10} KM</span>
          </div>
          <div className="bg-neutral-50 p-4 border border-neutral-150 rounded-xl text-center">
            <span className="text-neutral-500 text-[10px] uppercase font-bold block mb-1">Média Freq. Cardíaca</span>
            <span className="text-2xl font-black text-rose-600">{averageHeartRate ? `${averageHeartRate} BPM` : '--'}</span>
          </div>
        </div>

        {/* Goals Progress in Report */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1.5">Metas Semanais Configuradas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-neutral-50 p-3.5 border border-neutral-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-neutral-500 block font-semibold">Minutos semanais desejados</span>
                <span className="text-neutral-950 font-bold text-sm">{weeklyGoals.targetMinutes} min</span>
              </div>
              <span className="text-lime-600 font-bold bg-lime-100 px-2 py-0.5 rounded-full">Zonas 2 a 4</span>
            </div>
            <div className="bg-neutral-50 p-3.5 border border-neutral-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-neutral-500 block font-semibold">Distância semanal desejada</span>
                <span className="text-neutral-950 font-bold text-sm">{weeklyGoals.targetDistanceKm} KM</span>
              </div>
              <span className="text-blue-600 font-bold bg-blue-100 px-2 py-0.5 rounded-full">Aeróbico</span>
            </div>
            <div className="bg-neutral-50 p-3.5 border border-neutral-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-neutral-500 block font-semibold">Média Geral de Pace (Ritmo)</span>
                <span className="text-neutral-950 font-bold text-sm">{averagePace}</span>
              </div>
              <span className="text-purple-600 font-bold bg-purple-100 px-2 py-0.5 rounded-full">Eficiência</span>
            </div>
          </div>
        </div>

        {/* Detailed Workouts Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1.5">Registro de Atividades Realizadas</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-300 bg-neutral-100 text-neutral-700 font-bold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Treino</th>
                  <th className="py-2.5 px-3">Foco</th>
                  <th className="py-2.5 px-3 text-right">Tempo real</th>
                  <th className="py-2.5 px-3 text-right">Distância real</th>
                  <th className="py-2.5 px-3 text-right">Freq. Cardíaca</th>
                  <th className="py-2.5 px-3">Pace Médio</th>
                </tr>
              </thead>
              <tbody>
                {completedWorkouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-neutral-400 italic bg-neutral-50">
                      Nenhum registro de treino encontrado para exibir no relatório.
                    </td>
                  </tr>
                ) : (
                  completedWorkouts.map((workout, index) => {
                    const dateObj = new Date(workout.date);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    
                    const pace = workout.actualDistanceKm && workout.actualDistanceKm > 0
                      ? (() => {
                          const pDec = workout.actualDurationMinutes / workout.actualDistanceKm;
                          const pMin = Math.floor(pDec);
                          const pSec = Math.round((pDec - pMin) * 60).toString().padStart(2, '0');
                          return `${pMin}:${pSec}`;
                        })()
                      : '--';

                    return (
                      <tr key={workout.id} className="border-b border-neutral-200 hover:bg-neutral-50 transition">
                        <td className="py-2.5 px-3 font-mono">{formattedDate}</td>
                        <td className="py-2.5 px-3 font-semibold">{workout.workoutName}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-neutral-600">{workout.activityName}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{workout.actualDurationMinutes} min</td>
                        <td className="py-2.5 px-3 text-right font-mono">{workout.actualDistanceKm ? `${workout.actualDistanceKm} KM` : '--'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">{workout.avgHeartRateBpm ? `${workout.avgHeartRateBpm} BPM` : '--'}</td>
                        <td className="py-2.5 px-3 font-mono">{pace !== '--' ? `${pace} min/km` : '--'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed block breakdown notes on aerobic */}
        {completedWorkouts.some(w => w.notes) && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1.5">Anotações / Feedbacks de Esforço do Atleta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {completedWorkouts.filter(w => w.notes).slice(-4).map((w, i) => (
                <div key={i} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500">
                    <span>{w.workoutName} ({new Date(w.date).toLocaleDateString('pt-BR')})</span>
                    <span className="text-rose-600">{w.avgHeartRateBpm} BPM</span>
                  </div>
                  <p className="text-neutral-700 italic">"{w.notes}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature lines at bottom of printable page */}
        <div className="grid grid-cols-2 gap-12 pt-16 pb-4">
          <div className="text-center space-y-1">
            <div className="border-t border-neutral-400 w-full mx-auto" />
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold block">Assinatura do Aluno / Atleta</span>
            <span className="text-sm font-bold text-neutral-900">{userName}</span>
          </div>

          <div className="text-center space-y-1">
            <div className="border-t border-neutral-400 w-full mx-auto" />
            <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold block">Assinatura do Treinador</span>
            <span className="text-sm font-bold text-neutral-900">{trainerName}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
