import type { MuscleId } from "./exercise-catalog";

export type NullableNumber = number | null;

export type Profile = {
  id: number;
  name: string;
  heightCm: number;
  baselineWeightKg: number;
  baselineBodyFatPct: NullableNumber;
  targetPhaseOneKg: number;
  targetWeightKg: number;
  targetBodyFatPct: number;
  dailyCalories: number;
  dailyProteinG: NullableNumber;
  dailySteps: number;
  weeklyWorkouts: number;
  personalGoalDate: string | null;
  weeklyLossRateKg: number;
  wristCm: NullableNumber;
  ankleCm: NullableNumber;
  proportionModel: string;
  proportionTolerancePct: number;
  customBodyTargets: string;
};

export type DailyLog = {
  id: number;
  logDate: string;
  weightKg: NullableNumber;
  bodyFatPct: NullableNumber;
  waistCm: NullableNumber;
  calories: NullableNumber;
  proteinG: NullableNumber;
  carbsG: NullableNumber;
  fatG: NullableNumber;
  steps: NullableNumber;
  waterMl: NullableNumber;
  sleepHours: NullableNumber;
  energy: NullableNumber;
  trainingMinutes: NullableNumber;
  notes: string;
};

export type Measurement = {
  id: number;
  measuredAt: string;
  weightKg: NullableNumber;
  bodyFatPct: NullableNumber;
  chestCm: NullableNumber;
  waistCm: NullableNumber;
  abdomenCm: NullableNumber;
  hipsCm: NullableNumber;
  bicepsLeftCm: NullableNumber;
  bicepsRightCm: NullableNumber;
  thighLeftCm: NullableNumber;
  thighRightCm: NullableNumber;
  calvesCm: NullableNumber;
  neckCm: NullableNumber;
  shouldersCm: NullableNumber;
  forearmLeftCm: NullableNumber;
  forearmRightCm: NullableNumber;
  calfLeftCm: NullableNumber;
  calfRightCm: NullableNumber;
  note: string;
};

export type Food = {
  id: number;
  name: string;
  category: string;
  pricePerKg: NullableNumber;
  kcalPer100g: NullableNumber;
  proteinPer100g: NullableNumber;
  carbsPer100g: NullableNumber;
  fatPer100g: NullableNumber;
  source: string;
  favorite: boolean;
};

export type Supplement = {
  id: number;
  name: string;
  dose: string;
  timing: string;
  costCents: NullableNumber;
  servingsPerPack: NullableNumber;
  stockServings: NullableNumber;
  active: boolean;
  note: string;
};

export type AppSettings = {
  id: number;
  weeklyBudgetCents: number;
  email: string;
  weeklyEmail: boolean;
  emailDay: string;
  emailTime: string;
  compactMode: boolean;
  accent: string;
  gardenHistoryImportedAt: string | null;
};

export type ActivityLog = {
  id: number;
  activityDate: string;
  activityType: string;
  category: string;
  durationMinutes: number;
  distanceKm: NullableNumber;
  steps: NullableNumber;
  calories: NullableNumber;
  intensity: NullableNumber;
  note: string;
};

export type TrainingProgram = {
  id: number;
  name: string;
  description: string;
  active: boolean;
};

export type ProgramDay = {
  id: number;
  programId: number;
  name: string;
  orderIndex: number;
  cardioMinutes: NullableNumber;
  note: string;
};

export type ProgramExercise = {
  id: number;
  dayId: number;
  name: string;
  catalogKey: string | null;
  muscleGroup: string;
  primaryMuscles: MuscleId[];
  secondaryMuscles: MuscleId[];
  equipment: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  defaultWeightKg: NullableNumber;
  note: string;
};

export type StrengthSession = {
  id: number;
  programDayId: NullableNumber;
  sessionName: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: NullableNumber;
  totalVolumeKg: number;
  totalSets: number;
  note: string;
};

export type StrengthSet = {
  id: number;
  sessionId: number;
  exerciseId: NullableNumber;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weightKg: number;
  rir: NullableNumber;
  restSeconds: NullableNumber;
  completedAt: string;
};

export type LegacyWorkout = {
  id: number;
  workoutDate: string;
  type: string;
  durationMinutes: number;
  volumeKg: NullableNumber;
  rpe: NullableNumber;
};

export type TaskDefinition = {
  id: number;
  title: string;
  domain: string;
  recurrence: string;
  defaultTime: string | null;
  autoSource: string | null;
  active: boolean;
  orderIndex: number;
};

export type TaskState = {
  id: number;
  taskId: number;
  taskDate: string;
  status: string;
  completedAt: string | null;
  note: string;
};

export type ProduceItem = {
  id: number;
  name: string;
  variety: string;
  category: string;
  defaultPricePerKg: NullableNumber;
  priceSource: string;
  active: boolean;
};

export type ProducePrice = {
  id: number;
  produceId: number;
  effectiveAt: string;
  pricePerKg: number;
  source: string;
};

export type HarvestEntry = {
  id: number;
  harvestDate: string;
  produceId: NullableNumber;
  produceName: string;
  variety: string;
  weightKg: number;
  unitCount: NullableNumber;
  destination: string;
  priceMode: "catalog" | "manual";
  pricePerKg: NullableNumber;
  valueCents: NullableNumber;
  note: string;
};

export type AppData = {
  serverNow: string;
  profile: Profile;
  settings: AppSettings;
  logs: DailyLog[];
  measurements: Measurement[];
  workouts: LegacyWorkout[];
  foods: Food[];
  supplements: Supplement[];
  activities: ActivityLog[];
  programs: TrainingProgram[];
  programDays: ProgramDay[];
  programExercises: ProgramExercise[];
  strengthSessions: StrengthSession[];
  strengthSets: StrengthSet[];
  tasks: TaskDefinition[];
  taskStates: TaskState[];
  produce: ProduceItem[];
  producePrices: ProducePrice[];
  harvests: HarvestEntry[];
};

export type Mutate = (
  payload: Record<string, unknown>,
  successMessage: string,
) => Promise<boolean>;
