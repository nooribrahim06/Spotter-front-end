/** Frontend contracts for the existing append-only Progress API. */
export type BodyMeasurementType = 'WAIST' | 'ABDOMEN' | 'CHEST' | 'HIPS' | 'NECK' | 'SHOULDERS' | 'LEFT_UPPER_ARM' | 'RIGHT_UPPER_ARM' | 'LEFT_FOREARM' | 'RIGHT_FOREARM' | 'LEFT_THIGH' | 'RIGHT_THIGH' | 'LEFT_CALF' | 'RIGHT_CALF';
export type Measurement = { measurementType: BodyMeasurementType; valueCm: number };
export type CreateProgressBody = { weightKg: number; recordedAt?: string; bodyFatPercentage?: number | null; skeletalMuscleMassKg?: number | null; restingHeartRateBpm?: number | null; notes?: string | null; measurements?: Measurement[] };
export type ProgressEntry = Required<Omit<CreateProgressBody, 'measurements'>> & { id: string; goalId: string | null; isInitialForGoal: boolean | null; createdAt: string; measurements: Measurement[] };
export type ProgressFilters = { page?: number; limit?: number; startDate?: string; endDate?: string };
export type ProgressHistory = { items: ProgressEntry[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number; hasPreviousPage: boolean; hasNextPage: boolean } };
export type GoalProgress = { goal: { id: string; goalType: string; targetWeightKg: number | null; targetDate: string | null; startedAt: string | null }; starting: { entryId: string; weightKg: number; recordedAt: string }; current: { entryId: string; weightKg: number; recordedAt: string }; weightChangeKg: number; remainingKg: number | null; progressPercentage: number | null };
