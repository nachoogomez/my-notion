import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, Clock, MapPin, User, Search } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { useAuth } from "../context/AuthContext"
import { CalendarService } from "../services/calendarServices"
import type { CalendarEvent, CreateCalendarEventData } from "../types/calendar"

const EVENT_TYPES = [
  { value: "meeting", label: "Meeting", color: "bg-blue-500" },
  { value: "task", label: "Task", color: "bg-green-500" },
  { value: "personal", label: "Personal", color: "bg-purple-500" },
  { value: "appointment", label: "Appointment", color: "bg-red-500" },
  { value: "reminder", label: "Reminder", color: "bg-yellow-500" },
] as const

export function Calendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    event_type: "meeting" as CalendarEvent["event_type"],
    attendees: [] as string[],
  })

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Load events when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadEvents()
    }
  }, [user?.id])

  // Load events for current month when date changes
  useEffect(() => {
    if (user?.id) {
      loadEventsForMonth()
    }
  }, [currentDate, user?.id])

  const loadEvents = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const userEvents = await CalendarService.getUserEvents(user.id)
      setEvents(userEvents)
    } catch (error) {
      console.error("Error loading events:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadEventsForMonth = async () => {
    if (!user?.id) return

    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`

      const monthEvents = await CalendarService.getEventsByDateRange(user.id, startDate, endDate)
      setEvents(monthEvents)
    } catch (error) {
      console.error("Error loading month events:", error)
    }
  }

  const searchEvents = async () => {
    if (!user?.id || !searchTerm.trim()) {
      loadEvents()
      return
    }

    try {
      const searchResults = await CalendarService.searchEvents(user.id, searchTerm)
      setEvents(searchResults)
    } catch (error) {
      console.error("Error searching events:", error)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((event) => event.event_date === dateStr)
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return events
      .filter((event) => event.event_date === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
  }

  const openAddDialog = (date?: string) => {
    setEditingEvent(null)
    setFormData({
      title: "",
      description: "",
      event_date: date || selectedDate || "",
      start_time: "",
      end_time: "",
      location: "",
      event_type: "meeting",
      attendees: [],
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (event: CalendarEvent) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location || "",
      event_type: event.event_type,
      attendees: event.attendees || [],
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user?.id || !formData.title || !formData.event_date || !formData.start_time || !formData.end_time) return

    try {
      const eventType = EVENT_TYPES.find((type) => type.value === formData.event_type)

      const eventData: CreateCalendarEventData = {
        title: formData.title,
        description: formData.description || undefined,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location || undefined,
        color: eventType?.color || "bg-blue-500",
        event_type: formData.event_type,
        attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
      }

      if (editingEvent) {
        const updatedEvent = await CalendarService.updateEvent({
          id: editingEvent.id,
          ...eventData,
        })
        setEvents(events.map((event) => (event.id === editingEvent.id ? updatedEvent : event)))
      } else {
        const newEvent = await CalendarService.createEvent(user.id, eventData)
        setEvents([...events, newEvent])
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving event:", error)
      alert("Error saving event. Please try again.")
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return

    try {
      await CalendarService.deleteEvent(eventId)
      setEvents(events.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Error deleting event. Please try again.")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleAttendeesChange = (value: string) => {
    const attendeesList = value
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
    setFormData({ ...formData, attendees: attendeesList })
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date()
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return selectedDate === dateStr
  }

  if (loading) {
    return (
      <div className="p-6 h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-white">Calendar</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] h-4 w-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchEvents()}
                className="pl-10 bg-[#111111] border-[#1f1f1f] text-white placeholder:text-[#666666]"
              />
            </div>
            <Button onClick={() => openAddDialog()} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-[#111111] border-[#1f1f1f]">
              <CardContent className="p-6">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center text-[#888888] font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 rounded-lg border border-[#1f1f1f] cursor-pointer transition-colors ${
                        day
                          ? `bg-[#1a1a1a] hover:bg-[#222222] ${
                              isToday(day) ? "ring-2 ring-[#2563eb]" : ""
                            } ${isSelected(day) ? "bg-[#2563eb]/20 border-[#2563eb]" : ""}`
                          : ""
                      }`}
                      onClick={() => day && handleDayClick(day)}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-medium mb-2 ${
                              isToday(day) ? "text-[#2563eb]" : isSelected(day) ? "text-[#2563eb]" : "text-white"
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {getEventsForDate(day)
                              .slice(0, 2)
                              .map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded text-white ${event.color} truncate`}
                                >
                                  <div className="font-medium">{event.start_time}</div>
                                  <div className="truncate">{event.title}</div>
                                </div>
                              ))}
                            {getEventsForDate(day).length > 2 && (
                              <div className="text-xs text-[#888888] text-center">
                                +{getEventsForDate(day).length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Events */}
          <div>
            <Card className="bg-[#111111] border-[#1f1f1f]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {selectedDate ? formatDate(selectedDate) : "Select a day"}
                  </CardTitle>
                  {selectedDate && (
                    <Button
                      onClick={() => openAddDialog(selectedDate)}
                      size="sm"
                      className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {getSelectedDateEvents().length > 0 ? (
                      getSelectedDateEvents().map((event) => (
                        <div
                          key={event.id}
                          className="p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${event.color}`} />
                              <h4 className="text-white font-medium">{event.title}</h4>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => openEditDialog(event)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-[#888888] hover:text-white"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(event.id)}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-[#888888]">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(event.start_time)} - {formatTime(event.end_time)}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{event.attendees.join(", ")}</span>
                              </div>
                            )}
                          </div>

                          {event.description && <p className="text-[#666666] text-sm mt-2">{event.description}</p>}

                          <Badge variant="secondary" className="mt-2 text-xs bg-[#1f1f1f] text-[#888888]">
                            {EVENT_TYPES.find((type) => type.value === event.event_type)?.label}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[#888888] mb-3">No events for this day</p>
                        <Button
                          onClick={() => openAddDialog(selectedDate)}
                          size="sm"
                          className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                        >
                          Add Event
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#888888]">Click on a day to view events</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add/Edit Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Title</label>
                <Input
                  placeholder="Event title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Description</label>
                <Textarea
                  placeholder="Event description (optional)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666] min-h-[80px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Date</label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="bg-[#1f1f1f] border-[#333333] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="bg-[#1f1f1f] border-[#333333] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Location</label>
                <Input
                  placeholder="Event location (optional)..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Attendees</label>
                <Input
                  placeholder="Enter names separated by commas..."
                  value={formData.attendees.join(", ")}
                  onChange={(e) => handleAttendeesChange(e.target.value)}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as CalendarEvent["event_type"] })
                  }
                  className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                  disabled={!formData.title || !formData.event_date || !formData.start_time || !formData.end_time}
                >
                  {editingEvent ? "Update" : "Create"} Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
