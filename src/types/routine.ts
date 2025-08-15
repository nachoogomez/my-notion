export interface Routine {
  id: string
  user_id: string
  title: string
  description?: string
  day_of_week: DayOfWeek
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  category: string
  color: string
  is_active: boolean
  recurring_weeks?: number // null means infinite
  created_at: string
  updated_at: string
}

export interface RoutineInstance {
  id: string
  routine_id: string
  user_id: string
  instance_date: string // YYYY-MM-DD format
  status: RoutineInstanceStatus
  actual_start_time?: string
  actual_end_time?: string
  notes?: string
  created_at: string
  updated_at: string
  // Joined data from routine
  routine?: Routine
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export type RoutineInstanceStatus = "scheduled" | "completed" | "skipped" | "cancelled"

export interface CreateRoutineData {
  title: string
  description?: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  category: string
  color: string
  recurring_weeks?: number
}

export interface UpdateRoutineData extends Partial<CreateRoutineData> {
  id: string
  is_active?: boolean
}

export interface RoutineFilters {
  day_of_week?: DayOfWeek
  category?: string
  is_active?: boolean
  search?: string
}

export interface RoutineStats {
  total_routines: number
  completed_instances: number
  total_instances: number
  completion_rate: number
  by_category: Record<string, number>
  by_day: Record<DayOfWeek, number>
}

export interface WeeklyRoutineView {
  [key: string]: (Routine | RoutineInstance)[]
}

export interface DayRoutineView {
  date: string
  day_of_week: DayOfWeek
  routines: Routine[]
  instances: RoutineInstance[]
  upcoming: (Routine | RoutineInstance)[]
}
