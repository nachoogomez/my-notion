import { supabase } from "../lib/supabase"
import type { Task, CreateTaskData, UpdateTaskData, TaskFilters, TaskStats } from "../types/task"

export class TaskService {
  // Get all tasks for the current user
  static async getUserTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    try {
      let query = supabase.from("tasks").select("*").eq("user_id", userId)

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category)
      }

      if (filters?.priority) {
        query = query.eq("priority", filters.priority)
      }

      if (filters?.completed !== undefined) {
        query = query.eq("completed", filters.completed)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.dueDateFrom) {
        query = query.gte("due_date", filters.dueDateFrom)
      }

      if (filters?.dueDateTo) {
        query = query.lte("due_date", filters.dueDateTo)
      }

      // Order by: incomplete tasks first, then by priority (high to low), then by due date, then by created date
      query = query
        .order("completed", { ascending: true })
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true, nullsLast: true })
        .order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching tasks:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserTasks:", error)
      throw error
    }
  }

  // Get task statistics for the user
  static async getTaskStats(userId: string): Promise<TaskStats> {
    try {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("completed, priority, category, due_date")
        .eq("user_id", userId)

      if (error) {
        console.error("Error fetching task stats:", error)
        throw error
      }

      const today = new Date().toISOString().split("T")[0]

      const stats: TaskStats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.completed).length,
        pending: tasks.filter((t) => !t.completed).length,
        overdue: tasks.filter((t) => !t.completed && t.due_date && t.due_date < today).length,
        byPriority: {
          high: tasks.filter((t) => t.priority === "high").length,
          medium: tasks.filter((t) => t.priority === "medium").length,
          low: tasks.filter((t) => t.priority === "low").length,
        },
        byCategory: {},
      }

      // Calculate category stats
      tasks.forEach((task) => {
        stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error("Error in getTaskStats:", error)
      throw error
    }
  }

  // Get tasks by category
  static async getTasksByCategory(userId: string, category: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category)
        .order("completed", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks by category:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getTasksByCategory:", error)
      throw error
    }
  }

  // Get overdue tasks
  static async getOverdueTasks(userId: string): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", false)
        .lt("due_date", today)
        .order("due_date", { ascending: true })

      if (error) {
        console.error("Error fetching overdue tasks:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getOverdueTasks:", error)
      throw error
    }
  }

  // Get tasks due today
  static async getTasksDueToday(userId: string): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", false)
        .eq("due_date", today)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks due today:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getTasksDueToday:", error)
      throw error
    }
  }

  // Create a new task
  static async createTask(userId: string, taskData: CreateTaskData): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            user_id: userId,
            ...taskData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating task:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in createTask:", error)
      throw error
    }
  }

  // Update an existing task
  static async updateTask(taskData: UpdateTaskData): Promise<Task> {
    try {
      const { id, ...updateData } = taskData

      const { data, error } = await supabase.from("tasks").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Error updating task:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateTask:", error)
      throw error
    }
  }

  // Toggle task completion status
  static async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      // First get the current task to know its completion status
      const { data: currentTask, error: fetchError } = await supabase
        .from("tasks")
        .select("completed")
        .eq("id", taskId)
        .single()

      if (fetchError) {
        console.error("Error fetching current task:", fetchError)
        throw fetchError
      }

      // Toggle the completion status
      const { data, error } = await supabase
        .from("tasks")
        .update({ completed: !currentTask.completed })
        .eq("id", taskId)
        .select()
        .single()

      if (error) {
        console.error("Error toggling task completion:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in toggleTaskCompletion:", error)
      throw error
    }
  }

  // Delete a task
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) {
        console.error("Error deleting task:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in deleteTask:", error)
      throw error
    }
  }

  // Search tasks
  static async searchTasks(userId: string, searchTerm: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order("completed", { ascending: true })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error searching tasks:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in searchTasks:", error)
      throw error
    }
  }

  // Get unique categories for the user
  static async getUserCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.from("tasks").select("category").eq("user_id", userId)

      if (error) {
        console.error("Error fetching user categories:", error)
        throw error
      }

      // Get unique categories
      const categories = [...new Set(data.map((task) => task.category))].sort()
      return categories
    } catch (error) {
      console.error("Error in getUserCategories:", error)
      throw error
    }
  }

  // Bulk update tasks (useful for batch operations)
  static async bulkUpdateTasks(updates: UpdateTaskData[]): Promise<Task[]> {
    try {
      const promises = updates.map((update) => this.updateTask(update))
      const results = await Promise.all(promises)
      return results
    } catch (error) {
      console.error("Error in bulkUpdateTasks:", error)
      throw error
    }
  }

  // Bulk delete tasks
  static async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    try {
      const { error } = await supabase.from("tasks").delete().in("id", taskIds)

      if (error) {
        console.error("Error bulk deleting tasks:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in bulkDeleteTasks:", error)
      throw error
    }
  }
}
