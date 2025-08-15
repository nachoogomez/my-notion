export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  event_date: string // YYYY-MM-DD format
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  location?: string
  attendees?: string[]
  color: string
  event_type: "meeting" | "task" | "personal" | "appointment" | "reminder"
  created_at: string
  updated_at: string
}

export interface CreateCalendarEventData {
  title: string
  description?: string
  event_date: string
  start_time: string
  end_time: string
  location?: string
  attendees?: string[]
  color: string
  event_type: "meeting" | "task" | "personal" | "appointment" | "reminder"
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {
  id: string
}
