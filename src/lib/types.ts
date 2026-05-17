export interface Family {
  id: string;
  name: string;
  pin_code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  family_id: string;
  name: string;
  starting_weight_kg: number | null;
  goal_weight_kg: number | null;
  created_at: string;
}

export interface WeighIn {
  id: string;
  profile_id: string;
  weight_kg: number;
  date: string;
  created_at: string;
}

export interface ProfileStats {
  profileId: string;
  name: string;
  firstWeight: number | null;
  latestRawWeight: number | null;
  latestTrendWeight: number | null;
  goalWeight: number | null;
  kgChange: number | null;
  isWeightLossGoal: boolean;
  bodyWeightChangePercent: number | null;
  progressTowardGoalPercent: number | null;
  lastWeighInDate: string | null;
  weighInCount: number;
}

export interface TrendPoint {
  date: string;
  rawWeight: number;
  trendWeight: number;
}
