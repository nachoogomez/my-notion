import { supabase } from "../lib/supabase"
import type { CalendarEvent, CreateCalendarEventData, UpdateCalendarEventData } from "../types/calendar"

export class CalendarService {
  // Get all events for the current user
  static async getUserEvents(userId: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error fetching calendar events:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserEvents:", error)
      throw error
    }
  }

  // Get events for a specific date range
  static async getEventsByDateRange(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error fetching events by date range:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getEventsByDateRange:", error)
      throw error
    }
  }

  // Get events for a specific date
  static async getEventsByDate(userId: string, date: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .eq("event_date", date)
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error fetching events by date:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getEventsByDate:", error)
      throw error
    }
  }

  // Create a new event
  static async createEvent(userId: string, eventData: CreateCalendarEventData): Promise<CalendarEvent> {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert([
          {
            user_id: userId,
            ...eventData,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating calendar event:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in createEvent:", error)
      throw error
    }
  }

  // Update an existing event
  static async updateEvent(eventData: UpdateCalendarEventData): Promise<CalendarEvent> {
    try {
      const { id, ...updateData } = eventData

      const { data, error } = await supabase.from("calendar_events").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Error updating calendar event:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateEvent:", error)
      throw error
    }
  }

  // Delete an event
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase.from("calendar_events").delete().eq("id", eventId)

      if (error) {
        console.error("Error deleting calendar event:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in deleteEvent:", error)
      throw error
    }
  }

  // Search events by title or description
  static async searchEvents(userId: string, searchTerm: string): Promise<CalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error searching calendar events:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in searchEvents:", error)
      throw error
    }
  }
}
