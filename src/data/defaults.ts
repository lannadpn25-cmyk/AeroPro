import { Activity, WorkoutTemplate, WeeklyGoals } from '../types';

export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'act-caminhada',
    name: 'Caminhada ao Ar Livre',
    type: 'aerobic',
    icon: 'Footprints',
    description: 'Exercício aeróbico de baixo impacto ideal para aquecimento e resistência.',
    isCustom: false,
  },
  {
    id: 'act-corrida',
    name: 'Corrida ao Ar Livre',
    type: 'aerobic',
    icon: 'Flame',
    description: 'Excelente para queima calórica e fortalecimento do sistema cardiovascular.',
    isCustom: false,
  },
  {
    id: 'act-funcional',
    name: 'Treino Funcional de Força',
    type: 'strength',
    icon: 'Activity',
    description: 'Séries focadas em força corporal, agilidade, equilíbrio e musculatura.',
    isCustom: false,
  },
  {
    id: 'act-ciclismo',
    name: 'Ciclismo',
    type: 'aerobic',
    icon: 'Bike',
    description: 'Atividade de alto rendimento aeróbico preservando articulações.',
    isCustom: false,
  }
];

export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'temp-corrida-intervalada',
    name: 'Corrida Intervalada 20min',
    activityId: 'act-corrida',
    type: 'aerobic',
    targetUnit: 'minutes',
    targetValue: 20,
    chunks: [
      { id: 'c1', name: 'Aquecimento', durationMinutes: 4, speedKmh: 6.0 },
      { id: 'c2', name: 'Corrida Leve', durationMinutes: 4, speedKmh: 8.5 },
      { id: 'c3', name: 'Tiro Forte', durationMinutes: 4, speedKmh: 11.0 },
      { id: 'c4', name: 'Recuperação', durationMinutes: 4, speedKmh: 7.5 },
      { id: 'c5', name: 'Esfriamento', durationMinutes: 4, speedKmh: 5.0 }
    ]
  },
  {
    id: 'temp-caminhada-progressiva',
    name: 'Caminhada Progressiva 15min',
    activityId: 'act-caminhada',
    type: 'aerobic',
    targetUnit: 'minutes',
    targetValue: 15,
    chunks: [
      { id: 'w1', name: 'Passo Inicial', durationMinutes: 5, speedKmh: 5.0 },
      { id: 'w2', name: 'Ritmo Acelerado', durationMinutes: 5, speedKmh: 6.8 },
      { id: 'w3', name: 'Desaceleração', durationMinutes: 5, speedKmh: 4.5 }
    ]
  },
  {
    id: 'temp-funcional-geral',
    name: 'Treino de Força Full Body',
    activityId: 'act-funcional',
    type: 'strength',
    targetUnit: 'minutes',
    targetValue: 30,
    strengthExercises: [
      { id: 's1', name: 'Agachamento Livre', series: 4, reps: 15, weightKg: 0 },
      { id: 's2', name: 'Flexão de Braço', series: 3, reps: 12, weightKg: 0 },
      { id: 's3', name: 'Abdominal Remador', series: 4, reps: 20, weightKg: 0 },
      { id: 's4', name: 'Prancha Isométrica', series: 3, reps: 1, weightKg: 0 }
    ]
  }
];

export const DEFAULT_WEEKLY_GOALS: WeeklyGoals = {
  targetMinutes: 150,
  targetDistanceKm: 15,
  targetWorkoutsCount: 4,
};
