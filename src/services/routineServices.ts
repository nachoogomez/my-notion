import { supabase } from "../lib/supabase"
import type {
  Routine,
  RoutineInstance,
  CreateRoutineData,
  UpdateRoutineData,
  RoutineFilters,
  RoutineStats,
  DayOfWeek,
  RoutineInstanceStatus,
  WeeklyRoutineView,
  DayRoutineView,
} from "../types/routine"

export class RoutineService {
  // Get all routines for the current user
  static async getUserRoutines(userId: string, filters?: RoutineFilters): Promise<Routine[]> {
    try {
      let query = supabase.from("routines").select("*").eq("user_id", userId)

      // Apply filters
      if (filters?.day_of_week) {
        query = query.eq("day_of_week", filters.day_of_week)
      }

      if (filters?.category) {
        query = query.eq("category", filters.category)
      }

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Order by day of week, then by start time
      query = query.order("day_of_week").order("start_time")

      const { data, error } = await query

      if (error) {
        console.error("Error fetching routines:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserRoutines:", error)
      throw error
    }
  }

  // Get routines organized by day of week
  static async getWeeklyRoutines(userId: string): Promise<WeeklyRoutineView> {
    try {
      const routines = await this.getUserRoutines(userId, { is_active: true })

      const weeklyView: WeeklyRoutineView = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      }

      routines.forEach((routine) => {
        weeklyView[routine.day_of_week].push(routine)
      })

      // Sort each day by start time
      Object.keys(weeklyView).forEach((day) => {
        weeklyView[day].sort((a, b) => a.start_time.localeCompare(b.start_time))
      })

      return weeklyView
    } catch (error) {
      console.error("Error in getWeeklyRoutines:", error)
      throw error
    }
  }

  // Get today's routine view
  static async getTodayRoutines(userId: string): Promise<DayRoutineView> {
    try {
      const today = new Date()
      const dayNames: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const dayOfWeek = dayNames[today.getDay()]
      const dateStr = today.toISOString().split("T")[0]

      // Get routines for today
      const routines = await this.getUserRoutines(userId, {
        day_of_week: dayOfWeek,
        is_active: true,
      })

      // Get instances for today
      const instances = await this.getRoutineInstancesByDate(userId, dateStr)

      // Get upcoming routines (not yet started)
      const currentTime = today.toTimeString().slice(0, 5) // HH:MM format
      const upcoming = routines.filter((routine) => routine.start_time > currentTime)

      return {
        date: dateStr,
        day_of_week: dayOfWeek,
        routines,
        instances,
        upcoming: upcoming.slice(0, 3), // Limit to 3 upcoming items
      }
    } catch (error) {
      console.error("Error in getTodayRoutines:", error)
      throw error
    }
  }

  // Get routine instances for a specific date
  static async getRoutineInstancesByDate(userId: string, date: string): Promise<RoutineInstance[]> {
    try {
      const { data, error } = await supabase
        .from("routine_instances")
        .select(`
          *,
          routine:routines(*)
        `)
        .eq("user_id", userId)
        .eq("instance_date", date)
        .order("routine(start_time)")

      if (error) {
        console.error("Error fetching routine instances:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getRoutineInstancesByDate:", error)
      throw error
    }
  }

  // Get routine statistics
  static async getRoutineStats(userId: string, startDate?: string, endDate?: string): Promise<RoutineStats> {
    try {
      const { data, error } = await supabase.rpc("get_routine_stats", {
        p_user_id: userId,
        p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        p_end_date: endDate || new Date().toISOString().split("T")[0],
      })

      if (error) {
        console.error("Error fetching routine stats:", error)
        throw error
      }

      return (
        data || {
          total_routines: 0,
          completed_instances: 0,
          total_instances: 0,
          completion_rate: 0,
          by_category: {},
          by_day: {},
        }
      )
    } catch (error) {
      console.error("Error in getRoutineStats:", error)
      throw error
    }
  }

  // Create a new routine
  static async createRoutine(userId: string, routineData: CreateRoutineData): Promise<Routine> {
    try {
      const { data, error } = await supabase
        .from("routines")
        .insert([
          {
            user_id: userId,
            ...routineData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating routine:", error)
        throw error
      }

      // Create instances for the current week
      await this.createRoutineInstancesForWeek(userId)

      return data
    } catch (error) {
      console.error("Error in createRoutine:", error)
      throw error
    }
  }

  // Update an existing routine
  static async updateRoutine(routineData: UpdateRoutineData): Promise<Routine> {
    try {
      const { id, ...updateData } = routineData

      const { data, error } = await supabase.from("routines").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Error updating routine:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateRoutine:", error)
      throw error
    }
  }

  // Delete a routine
  static async deleteRoutine(routineId: string): Promise<void> {
    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId)

      if (error) {
        console.error("Error deleting routine:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in deleteRoutine:", error)
      throw error
    }
  }

  // Toggle routine active status
  static async toggleRoutineActive(routineId: string): Promise<Routine> {
    try {
      // First get the current routine to know its active status
      const { data: currentRoutine, error: fetchError } = await supabase
        .from("routines")
        .select("is_active")
        .eq("id", routineId)
        .single()

      if (fetchError) {
        console.error("Error fetching current routine:", fetchError)
        throw fetchError
      }

      // Toggle the active status
      const { data, error } = await supabase
        .from("routines")
        .update({ is_active: !currentRoutine.is_active })
        .eq("id", routineId)
        .select()
        .single()

      if (error) {
        console.error("Error toggling routine active status:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in toggleRoutineActive:", error)
      throw error
    }
  }

  // Update routine instance status
  static async updateRoutineInstanceStatus(
    instanceId: string,
    status: RoutineInstanceStatus,
    notes?: string,
    actualStartTime?: string,
    actualEndTime?: string,
  ): Promise<RoutineInstance> {
    try {
      const updateData: any = { status }

      if (notes !== undefined) updateData.notes = notes
      if (actualStartTime !== undefined) updateData.actual_start_time = actualStartTime
      if (actualEndTime !== undefined) updateData.actual_end_time = actualEndTime

      const { data, error } = await supabase
        .from("routine_instances")
        .update(updateData)
        .eq("id", instanceId)
        .select(`
          *,
          routine:routines(*)
        `)
        .single()

      if (error) {
        console.error("Error updating routine instance:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateRoutineInstanceStatus:", error)
      throw error
    }
  }

  // Create routine instances for a week
  static async createRoutineInstancesForWeek(userId: string, startDate?: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("create_routine_instances_for_week", {
        p_user_id: userId,
        p_start_date: startDate || new Date().toISOString().split("T")[0],
      })

      if (error) {
        console.error("Error creating routine instances:", error)
        throw error
      }

      return data || 0
    } catch (error) {
      console.error("Error in createRoutineInstancesForWeek:", error)
      throw error
    }
  }

  // Get unique categories for the user
  static async getUserCategories(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("routines")
        .select("category")
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching user categories:", error)
        throw error
      }

      // Get unique categories
      const categories = [...new Set(data.map((routine) => routine.category))].sort()
      return categories
    } catch (error) {
      console.error("Error in getUserCategories:", error)
      throw error
    }
  }

  // Search routines
  static async searchRoutines(userId: string, searchTerm: string): Promise<Routine[]> {
    try {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order("day_of_week")
        .order("start_time")

      if (error) {
        console.error("Error searching routines:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in searchRoutines:", error)
      throw error
    }
  }

  // Get routines by category
  static async getRoutinesByCategory(userId: string, category: string): Promise<Routine[]> {
    try {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category)
        .eq("is_active", true)
        .order("day_of_week")
        .order("start_time")

      if (error) {
        console.error("Error fetching routines by category:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getRoutinesByCategory:", error)
      throw error
    }
  }

  // Bulk operations
  static async bulkUpdateRoutines(updates: UpdateRoutineData[]): Promise<Routine[]> {
    try {
      const promises = updates.map((update) => this.updateRoutine(update))
      const results = await Promise.all(promises)
      return results
    } catch (error) {
      console.error("Error in bulkUpdateRoutines:", error)
      throw error
    }
  }

  static async bulkDeleteRoutines(routineIds: string[]): Promise<void> {
    try {
      const { error } = await supabase.from("routines").delete().in("id", routineIds)

      if (error) {
        console.error("Error bulk deleting routines:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in bulkDeleteRoutines:", error)
      throw error
    }
  }
}
