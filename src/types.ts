export type ActivityType = 'aerobic' | 'strength';

export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  icon: string; // lucide icon name (e.g. 'Activity', 'TrendingUp', etc.)
  description: string;
  isCustom: boolean;
}

export interface WorkoutChunk {
  id: string;
  name: string;
  durationMinutes: number;
  speedKmh: number;
}

export interface StrengthExercise {
  id: string;
  name: string;
  series: number;
  reps: number;
  weightKg?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  activityId: string;
  type: ActivityType;
  targetUnit: 'minutes' | 'km';
  targetValue: number; // desired total minutes or total kms
  chunks?: WorkoutChunk[]; // for aerobic
  strengthExercises?: StrengthExercise[]; // for strength
  order?: number;
}

export interface CompletedWorkout {
  id: string;
  templateId: string;
  workoutName: string;
  activityId: string;
  activityName: string;
  activityType: ActivityType;
  date: string; // ISO format string
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  actualDistanceKm?: number; // entered by user at the end
  avgHeartRateBpm?: number; // entered by user at the end
  notes?: string;
  chunks?: WorkoutChunk[];
  strengthExercises?: StrengthExercise[];
}

export interface WeeklyGoals {
  targetMinutes: number;
  targetDistanceKm: number;
  targetWorkoutsCount: number;
}
