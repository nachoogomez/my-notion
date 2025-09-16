import { useState, useEffect } from "react"
import { 
  Calendar, 
  CheckSquare, 
  StickyNote, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  Star,
  Target,
  Zap
} from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { useAuth } from "../context/AuthContext"
import { TaskService } from "../services/taskServices"
import { NoteService } from "../services/noteServices"
import { CalendarService } from "../services/calendarServices"
import { RoutineService } from "../services/routineServices"
import { useNavigate } from "react-router-dom"
import type { Task, TaskStats } from "../types/task"
import type { Note, NoteStats } from "../types/note"
import type { CalendarEvent } from "../types/calendar"
import type { RoutineStats, DayRoutineView } from "../types/routine"

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // State for dashboard data
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [todayRoutines, setTodayRoutines] = useState<DayRoutineView | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [noteStats, setNoteStats] = useState<NoteStats | null>(null)
  const [routineStats, setRoutineStats] = useState<RoutineStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    } else {
      // If no user, still show the dashboard with empty state
      setLoading(false)
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // Load data with error handling for each service
      await Promise.allSettled([
        loadRecentTasks(),
        loadRecentNotes(),
        loadUpcomingEvents(),
        loadTodayRoutines(),
        loadStats()
      ])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentTasks = async () => {
    try {
      const tasks = await TaskService.getUserTasks(user!.id, { completed: false })
      setRecentTasks(tasks.slice(0, 5))
    } catch (error) {
      console.error("Error loading recent tasks:", error)
      setRecentTasks([])
    }
  }

  const loadRecentNotes = async () => {
    try {
      const notes = await NoteService.getUserNotes(user!.id)
      setRecentNotes(notes.slice(0, 5))
    } catch (error) {
      console.error("Error loading recent notes:", error)
      setRecentNotes([])
    }
  }

  const loadUpcomingEvents = async () => {
    try {
      const events = await CalendarService.getUserEvents(user!.id)
      setUpcomingEvents(events.slice(0, 5))
    } catch (error) {
      console.error("Error loading upcoming events:", error)
      setUpcomingEvents([])
    }
  }

  const loadTodayRoutines = async () => {
    try {
      const today = await RoutineService.getTodayRoutines(user!.id)
      setTodayRoutines(today)
    } catch (error) {
      console.error("Error loading today routines:", error)
      setTodayRoutines(null)
    }
  }

  const loadStats = async () => {
    try {
      const [taskStatsData, noteStatsData, routineStatsData] = await Promise.all([
        TaskService.getTaskStats(user!.id),
        NoteService.getNoteStats(user!.id),
        RoutineService.getRoutineStats(user!.id)
      ])
      
      setTaskStats(taskStatsData)
      setNoteStats(noteStatsData)
      setRoutineStats(routineStatsData)
    } catch (error) {
      console.error("Error loading stats:", error)
      // Set default stats if loading fails
      setTaskStats({ 
        completed: 0, 
        total: 0, 
        pending: 0, 
        overdue: 0, 
        byPriority: { high: 0, medium: 0, low: 0 }, 
        byCategory: {} 
      })
      setNoteStats({ 
        total_notes: 0, 
        pinned_notes: 0, 
        recent_notes: 0, 
        total_tags: 0, 
        top_tags: {}, 
        by_color: {} 
      })
      setRoutineStats({ 
        completion_rate: 0, 
        total_routines: 0, 
        completed_instances: 0, 
        total_instances: 0, 
        by_category: {}, 
        by_day: { 
          monday: 0, 
          tuesday: 0, 
          wednesday: 0, 
          thursday: 0, 
          friday: 0, 
          saturday: 0, 
          sunday: 0 
        } 
      })
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500"
      case "medium": return "bg-yellow-500"
      case "low": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "bg-blue-500"
      case "personal": return "bg-purple-500"
      case "work": return "bg-green-500"
      case "reminder": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-3 md:p-6 min-h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-3 md:p-6 min-h-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Welcome to My Notion</h1>
          <p className="text-[#888888]">Please sign in to access your dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 min-h-full bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {getGreeting()}, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-[#888888] text-sm md:text-base">
            Here's what's happening in your workspace today
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#2563eb]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Button
              onClick={() => navigate('/tasks')}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] h-16 flex flex-col items-center gap-2"
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-sm">New Task</span>
            </Button>
            <Button
              onClick={() => navigate('/notes')}
              className="bg-[#10b981] hover:bg-[#059669] h-16 flex flex-col items-center gap-2"
            >
              <StickyNote className="h-5 w-5" />
              <span className="text-sm">New Note</span>
            </Button>
            <Button
              onClick={() => navigate('/calendar')}
              className="bg-[#f59e0b] hover:bg-[#d97706] h-16 flex flex-col items-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-sm">New Event</span>
            </Button>
            <Button
              onClick={() => navigate('/my-focus')}
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] h-16 flex flex-col items-center gap-2"
            >
              <Target className="h-5 w-5" />
              <span className="text-sm">New Routine</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#888888] text-sm">Tasks</p>
                  <p className="text-2xl font-bold text-white">
                    {taskStats ? `${taskStats.completed}/${taskStats.total}` : '0/0'}
                  </p>
                  <p className="text-xs text-[#666666]">Completed</p>
                </div>
                <div className="bg-[#2563eb] rounded-full p-3">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#888888] text-sm">Notes</p>
                  <p className="text-2xl font-bold text-white">
                    {noteStats?.total_notes || 0}
                  </p>
                  <p className="text-xs text-[#666666]">Total</p>
                </div>
                <div className="bg-[#10b981] rounded-full p-3">
                  <StickyNote className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#888888] text-sm">Events</p>
                  <p className="text-2xl font-bold text-white">
                    {upcomingEvents.length}
                  </p>
                  <p className="text-xs text-[#666666]">This Week</p>
                </div>
                <div className="bg-[#f59e0b] rounded-full p-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#888888] text-sm">Routines</p>
                  <p className="text-2xl font-bold text-white">
                    {todayRoutines?.routines.length || 0}
                  </p>
                  <p className="text-xs text-[#666666]">Today</p>
                </div>
                <div className="bg-[#8b5cf6] rounded-full p-3">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Tasks */}
          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-[#2563eb]" />
                  Recent Tasks
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tasks')}
                  className="text-[#888888] hover:text-white"
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1a1a]">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{task.title}</p>
                        <p className="text-[#666666] text-xs">
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-[#1f1f1f] text-[#888888]">
                        {task.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#888888] text-sm">No recent tasks</p>
                  <Button
                    onClick={() => navigate('/tasks')}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[#2563eb] hover:text-[#1d4ed8]"
                  >
                    Create your first task
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5 text-[#10b981]" />
                  Recent Notes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/notes')}
                  className="text-[#888888] hover:text-white"
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotes.length > 0 ? (
                <div className="space-y-3">
                  {recentNotes.map((note) => (
                    <div key={note.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        {note.pinned && <Star className="h-3 w-3 text-[#f59e0b]" />}
                        <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{note.title}</p>
                        <p className="text-[#666666] text-xs">
                          {formatDate(note.updated_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#888888] text-sm">No recent notes</p>
                  <Button
                    onClick={() => navigate('/notes')}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[#10b981] hover:text-[#059669]"
                  >
                    Create your first note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="bg-[#111111] border-[#1f1f1f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#f59e0b]" />
                  Upcoming Events
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/calendar')}
                  className="text-[#888888] hover:text-white"
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1a1a]">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{event.title}</p>
                        <p className="text-[#666666] text-xs">
                          {formatDate(event.event_date)} at {formatTime(event.start_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#888888] text-sm">No upcoming events</p>
                  <Button
                    onClick={() => navigate('/calendar')}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[#f59e0b] hover:text-[#d97706]"
                  >
                    Create your first event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Routines */}
          <Card className="bg-[#111111] border-[#1f1f1f] lg:col-span-2 xl:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#8b5cf6]" />
                  Today's Focus
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/my-focus')}
                  className="text-[#888888] hover:text-white"
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayRoutines && todayRoutines.routines.length > 0 ? (
                <div className="space-y-3">
                  {todayRoutines.routines.slice(0, 3).map((routine) => (
                    <div key={routine.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#1a1a1a]">
                      <div className={`w-3 h-3 rounded-full ${routine.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{routine.title}</p>
                        <p className="text-[#666666] text-xs">
                          {formatTime(routine.start_time)} - {formatTime(routine.end_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {todayRoutines.routines.length > 3 && (
                    <p className="text-[#666666] text-xs text-center">
                      +{todayRoutines.routines.length - 3} more routines
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#888888] text-sm">No routines for today</p>
                  <Button
                    onClick={() => navigate('/my-focus')}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-[#8b5cf6] hover:text-[#7c3aed]"
                  >
                    Create your first routine
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productivity Insights */}
          <Card className="bg-[#111111] border-[#1f1f1f] lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#2563eb]" />
                Productivity Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[#888888] text-sm">Task Completion Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#1a1a1a] rounded-full h-2">
                      <div 
                        className="bg-[#2563eb] h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: taskStats ? `${(taskStats.completed / taskStats.total) * 100}%` : '0%' 
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium">
                      {taskStats ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[#888888] text-sm">Notes Created This Week</p>
                  <p className="text-2xl font-bold text-white">
                    {noteStats?.recent_notes || 0}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[#888888] text-sm">Routine Completion</p>
                  <p className="text-2xl font-bold text-white">
                    {routineStats?.completion_rate || 0}%
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[#888888] text-sm">Events This Week</p>
                  <p className="text-2xl font-bold text-white">
                    {upcomingEvents.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
