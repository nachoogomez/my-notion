export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  due_date?: string // YYYY-MM-DD format
  category: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  due_date?: string
  category: string
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string
  completed?: boolean
}

export interface TaskFilters {
  category?: string
  priority?: string
  completed?: boolean
  search?: string
  dueDateFrom?: string
  dueDateTo?: string
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
  byCategory: Record<string, number>
}
