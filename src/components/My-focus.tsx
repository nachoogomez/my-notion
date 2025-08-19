"use client"

import { useState, useEffect } from "react"
import { Plus, Clock, Edit, Trash2, Save, X, BarChart3, Play, Pause, CheckCircle2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { useAuth } from "../context/AuthContext"
import { RoutineService } from "../services/routineServices"
import type {
  Routine,
  CreateRoutineData,
  RoutineStats,
  WeeklyRoutineView,
  DayRoutineView,
  DayOfWeek,
  RoutineInstanceStatus,
} from "../types/routine"

const DAYS_OF_WEEK = [
  { key: "monday" as DayOfWeek, label: "Monday", short: "Mon" },
  { key: "tuesday" as DayOfWeek, label: "Tuesday", short: "Tue" },
  { key: "wednesday" as DayOfWeek, label: "Wednesday", short: "Wed" },
  { key: "thursday" as DayOfWeek, label: "Thursday", short: "Thu" },
  { key: "friday" as DayOfWeek, label: "Friday", short: "Fri" },
  { key: "saturday" as DayOfWeek, label: "Saturday", short: "Sat" },
  { key: "sunday" as DayOfWeek, label: "Sunday", short: "Sun" },
]

const CATEGORIES = [
  { name: "Work", color: "bg-blue-500" },
  { name: "Health", color: "bg-green-500" },
  { name: "Personal", color: "bg-purple-500" },
  { name: "Education", color: "bg-yellow-500" },
  { name: "Social", color: "bg-pink-500" },
  { name: "Exercise", color: "bg-red-500" },
  { name: "Meals", color: "bg-orange-500" },
  { name: "Rest", color: "bg-gray-500" },
  { name: "Hobbies", color: "bg-indigo-500" },
  { name: "Family", color: "bg-rose-500" },
]

export function MyFocusView() {
  const { user } = useAuth()
  const [weeklyRoutines, setWeeklyRoutines] = useState<WeeklyRoutineView>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  })
  const [todayView, setTodayView] = useState<DayRoutineView | null>(null)
  const [stats, setStats] = useState<RoutineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)

  const [formData, setFormData] = useState<CreateRoutineData>({
    title: "",
    description: "",
    day_of_week: "monday",
    start_time: "",
    end_time: "",
    category: "Personal",
    color: "bg-blue-500",
  })

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadAllData()
    }
  }, [user?.id])

  const loadAllData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      await Promise.all([loadWeeklyRoutines(), loadTodayView(), loadStats()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadWeeklyRoutines = async () => {
    if (!user?.id) return

    try {
      const weekly = await RoutineService.getWeeklyRoutines(user.id)
      setWeeklyRoutines(weekly)
    } catch (error) {
      console.error("Error loading weekly routines:", error)
    }
  }

  const loadTodayView = async () => {
    if (!user?.id) return

    try {
      const today = await RoutineService.getTodayRoutines(user.id)
      setTodayView(today)
    } catch (error) {
      console.error("Error loading today view:", error)
    }
  }

  const loadStats = async () => {
    if (!user?.id) return

    try {
      const routineStats = await RoutineService.getRoutineStats(user.id)
      setStats(routineStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const getCurrentDay = (): DayOfWeek => {
    const today = new Date().getDay()
    const dayIndex = today === 0 ? 6 : today - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
    return DAYS_OF_WEEK[dayIndex].key
  }

  const openAddDialog = (day: DayOfWeek) => {
    setSelectedDay(day)
    setEditingRoutine(null)
    setFormData({
      title: "",
      description: "",
      day_of_week: day,
      start_time: "",
      end_time: "",
      category: "Personal",
      color: "bg-blue-500",
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (routine: Routine) => {
    setSelectedDay(routine.day_of_week)
    setEditingRoutine(routine)
    setFormData({
      title: routine.title,
      description: routine.description || "",
      day_of_week: routine.day_of_week,
      start_time: routine.start_time,
      end_time: routine.end_time,
      category: routine.category,
      color: routine.color,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user?.id || !formData.title || !formData.start_time || !formData.end_time) return

    try {
      if (editingRoutine) {
        const updatedRoutine = await RoutineService.updateRoutine({
          id: editingRoutine.id,
          ...formData,
          description: formData.description || undefined,
        })

        // Update local state
        setWeeklyRoutines((prev) => ({
          ...prev,
          [updatedRoutine.day_of_week]: prev[updatedRoutine.day_of_week].map((item) =>
            "id" in item && item.id === updatedRoutine.id ? updatedRoutine : item,
          ),
        }))
      } else {
        const newRoutine = await RoutineService.createRoutine(user.id, {
          ...formData,
          description: formData.description || undefined,
        })

        // Update local state
        setWeeklyRoutines((prev) => ({
          ...prev,
          [newRoutine.day_of_week]: [...prev[newRoutine.day_of_week], newRoutine].sort((a, b) =>
            a.start_time.localeCompare(b.start_time),
          ),
        }))
      }

      setIsDialogOpen(false)
      loadTodayView() // Refresh today view
      loadStats() // Refresh stats
    } catch (error) {
      console.error("Error saving routine:", error)
      alert("Error saving routine. Please try again.")
    }
  }

  const handleDelete = async (routineId: string, day: DayOfWeek) => {
    if (!window.confirm("Are you sure you want to delete this routine?")) return

    try {
      await RoutineService.deleteRoutine(routineId)

      // Update local state
      setWeeklyRoutines((prev) => ({
        ...prev,
        [day]: prev[day].filter((item) => !("id" in item) || item.id !== routineId),
      }))

      loadTodayView() // Refresh today view
      loadStats() // Refresh stats
    } catch (error) {
      console.error("Error deleting routine:", error)
      alert("Error deleting routine. Please try again.")
    }
  }

  const handleInstanceStatusUpdate = async (instanceId: string, status: RoutineInstanceStatus, notes?: string) => {
    try {
      await RoutineService.updateRoutineInstanceStatus(instanceId, status, notes)
      loadTodayView() // Refresh today view
      loadStats() // Refresh stats
    } catch (error) {
      console.error("Error updating instance status:", error)
      alert("Error updating routine status. Please try again.")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const getStatusColor = (status: RoutineInstanceStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "skipped":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: RoutineInstanceStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3" />
      case "skipped":
        return <Pause className="h-3 w-3" />
      case "cancelled":
        return <X className="h-3 w-3" />
      default:
        return <Play className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading routines...</div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-[#2563eb] rounded-2xl p-4 flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[#888888] text-sm">Good afternoon,</p>
            <h1 className="text-white text-2xl font-semibold">My Focus</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <div className="text-white bg-[#2563eb] px-3 py-1 rounded-lg font-mono text-sm">{getCurrentTime()}</div>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <Card className="mb-6 bg-[#111111] border-[#1f1f1f]">
            <CardHeader>
              <CardTitle className="text-white">Routine Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.total_routines}</div>
                  <div className="text-sm text-[#888888]">Active Routines</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.completed_instances}</div>
                  <div className="text-sm text-[#888888]">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.total_instances}</div>
                  <div className="text-sm text-[#888888]">Total Instances</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.completion_rate}%</div>
                  <div className="text-sm text-[#888888]">Completion Rate</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">By Category</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Object.entries(stats.by_category || {}).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-[#888888]">{category}</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">By Day</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Object.entries(stats.by_day || {}).map(([day, count]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-[#888888] capitalize">{day}</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#111111] border-[#1f1f1f] lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Today's Schedule
                <Badge variant="secondary" className="bg-[#2563eb] text-white">
                  {DAYS_OF_WEEK.find((day) => day.key === getCurrentDay())?.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayView && todayView.routines.length > 0 ? (
                  todayView.routines.map((routine) => {
                    const instance = todayView.instances.find((inst) => inst.routine_id === routine.id)

                    return (
                      <div
                        key={routine.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors group"
                      >
                        <div className={`w-3 h-3 rounded-full ${routine.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium">{routine.title}</h3>
                            <Badge variant="secondary" className="text-xs bg-[#1f1f1f] text-[#888888]">
                              {routine.category}
                            </Badge>
                            {instance && (
                              <Badge
                                variant="secondary"
                                className={`text-xs text-white ${getStatusColor(instance.status)}`}
                              >
                                {getStatusIcon(instance.status)}
                                <span className="ml-1 capitalize">{instance.status}</span>
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#888888] text-sm">
                            {formatTime(routine.start_time)} - {formatTime(routine.end_time)}
                          </p>
                          {routine.description && <p className="text-[#666666] text-xs mt-1">{routine.description}</p>}
                        </div>

                        {instance && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {instance.status === "scheduled" && (
                              <>
                                <Button
                                  onClick={() => handleInstanceStatusUpdate(instance.id, "completed")}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleInstanceStatusUpdate(instance.id, "skipped")}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-yellow-400 hover:text-yellow-300"
                                >
                                  <Pause className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#888888]">No routines for today</p>
                    <Button
                      onClick={() => openAddDialog(getCurrentDay())}
                      className="mt-2 bg-[#2563eb] hover:bg-[#1d4ed8]"
                      size="sm"
                    >
                      Add First Routine
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardHeader>
              <CardTitle className="text-white">Coming Up</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayView && todayView.upcoming.length > 0 ? (
                  todayView.upcoming.map((item) => (
                    <div key={item.id} className="p-2 rounded bg-[#1a1a1a]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-white text-sm font-medium truncate">{item.title}</span>
                      </div>
                      <p className="text-[#888888] text-xs">{formatTime(item.start_time)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#888888] text-sm">No upcoming routines today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule */}
        <Card className="bg-[#111111] border-[#1f1f1f]">
          <CardHeader>
            <CardTitle className="text-white">Weekly Routine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${day.key === getCurrentDay() ? "text-[#2563eb]" : "text-white"}`}>
                      {day.short}
                    </h3>
                    <Button
                      onClick={() => openAddDialog(day.key)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-[#888888] hover:text-white hover:bg-[#1f1f1f]"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2 min-h-[200px]">
                    {weeklyRoutines[day.key]
                      .filter(
                        (item): item is Routine =>
                          "start_time" in item &&
                          typeof item.start_time === "string" &&
                          "day_of_week" in item &&
                          "category" in item &&
                          "is_active" in item
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="group p-2 rounded bg-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-white text-xs font-medium truncate max-w-[120px] block">{item.title}</span>
                              </div>
                              <p className="text-[#888888] text-xs">
                                {formatTime(item.start_time)} - {formatTime(item.end_time)}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                onClick={() => openEditDialog(item)}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-[#888888] hover:text-white"
                              >
                                <Edit className="h-2 w-2" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(item.id, day.key)}
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRoutine ? "Edit Routine" : "Add Routine"}
                {selectedDay && (
                  <span className="text-[#888888] text-sm font-normal ml-2">
                    - {DAYS_OF_WEEK.find((day) => day.key === selectedDay)?.label}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Title</label>
                <Input
                  placeholder="e.g., Morning Workout, Work Meeting..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Description</label>
                <Textarea
                  placeholder="Additional details (optional)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666] min-h-[80px]"
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
                <label className="text-sm font-medium text-[#888888] mb-2 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const category = CATEGORIES.find((cat) => cat.name === e.target.value)
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      color: category?.color || "bg-blue-500",
                    })
                  }}
                  className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
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
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                  disabled={!formData.title || !formData.start_time || !formData.end_time}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingRoutine ? "Update" : "Add"} Routine
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
