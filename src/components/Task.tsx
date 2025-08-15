"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, CheckCircle2, Circle, Edit, Trash2, BarChart3 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { useAuth } from "../context/AuthContext"
import { TaskService } from "../services/taskServices"
import type { Task, CreateTaskData, TaskFilters, TaskStats } from "../types/task"

const CATEGORIES = [
  "General",
  "Work",
  "Personal",
  "Development",
  "Health",
  "Finance",
  "Learning",
  "Shopping",
  "Travel",
  "Home",
]

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-green-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-red-500" },
] as const

export function TasksView() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<TaskFilters>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showStats, setShowStats] = useState(false)

  const [newTask, setNewTask] = useState<CreateTaskData>({
    title: "",
    description: "",
    priority: "medium",
    category: "General",
    due_date: "",
  })

  const [editForm, setEditForm] = useState<CreateTaskData>({
    title: "",
    description: "",
    priority: "medium",
    category: "General",
    due_date: "",
  })

  // Load tasks when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadTasks()
      loadStats()
    }
  }, [user?.id])

  // Reload tasks when filters change
  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
  }, [filters, user?.id])

  const loadTasks = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const userTasks = await TaskService.getUserTasks(user.id, {
        ...filters,
        search: searchTerm || undefined,
      })
      setTasks(userTasks)
    } catch (error) {
      console.error("Error loading tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user?.id) return

    try {
      const taskStats = await TaskService.getTaskStats(user.id)
      setStats(taskStats)
    } catch (error) {
      console.error("Error loading task stats:", error)
    }
  }

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm })
  }

  const toggleTask = async (taskId: string) => {
    try {
      const updatedTask = await TaskService.toggleTaskCompletion(taskId)
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)))
      loadStats() // Reload stats after completion change
    } catch (error) {
      console.error("Error toggling task:", error)
      alert("Error updating task. Please try again.")
    }
  }

  const addTask = async () => {
    if (!user?.id || !newTask.title.trim()) return

    try {
      const createdTask = await TaskService.createTask(user.id, {
        ...newTask,
        due_date: newTask.due_date || undefined,
        description: newTask.description || undefined,
      })

      setTasks([createdTask, ...tasks])
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        category: "General",
        due_date: "",
      })
      setIsCreateDialogOpen(false)
      loadStats()
    } catch (error) {
      console.error("Error creating task:", error)
      alert("Error creating task. Please try again.")
    }
  }

  const startEditing = (task: Task) => {
    setEditingTask(task)
    setEditForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      category: task.category,
      due_date: task.due_date || "",
    })
    setIsEditDialogOpen(true)
  }

  const saveEdit = async () => {
    if (!editingTask) return

    try {
      const updatedTask = await TaskService.updateTask({
        id: editingTask.id,
        ...editForm,
        due_date: editForm.due_date || undefined,
        description: editForm.description || undefined,
      })

      setTasks(tasks.map((task) => (task.id === editingTask.id ? updatedTask : task)))
      setIsEditDialogOpen(false)
      setEditingTask(null)
      loadStats()
    } catch (error) {
      console.error("Error updating task:", error)
      alert("Error updating task. Please try again.")
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    try {
      await TaskService.deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      loadStats()
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Error deleting task. Please try again.")
    }
  }

  const getPriorityColor = (priority: string) => {
    const priorityObj = PRIORITIES.find((p) => p.value === priority)
    return priorityObj?.color || "bg-gray-500"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isOverdue = (dueDate: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dueDate < today
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const pendingTasks = tasks.filter((task) => !task.completed)

  if (loading) {
    return (
      <div className="p-6 h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-[#111111] border-[#1f1f1f] text-white placeholder:text-[#666666]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <Card className="mb-6 bg-[#111111] border-[#1f1f1f]">
            <CardHeader>
              <CardTitle className="text-white">Task Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-sm text-[#888888]">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
                  <div className="text-sm text-[#888888]">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                  <div className="text-sm text-[#888888]">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
                  <div className="text-sm text-[#888888]">Overdue</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">By Priority</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888888]">High</span>
                      <span className="text-red-500">{stats.byPriority.high}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888888]">Medium</span>
                      <span className="text-yellow-500">{stats.byPriority.medium}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#888888]">Low</span>
                      <span className="text-green-500">{stats.byPriority.low}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">By Category</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Object.entries(stats.byCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="text-[#888888]">{category}</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Task Button */}
        <div className="mb-6">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </Button>
        </div>

        {/* Filter Chips */}
        {(filters.category || filters.priority || filters.completed !== undefined) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.category && (
              <Badge
                variant="secondary"
                className="bg-[#1f1f1f] text-[#888888] cursor-pointer"
                onClick={() => setFilters({ ...filters, category: undefined })}
              >
                Category: {filters.category} ×
              </Badge>
            )}
            {filters.priority && (
              <Badge
                variant="secondary"
                className="bg-[#1f1f1f] text-[#888888] cursor-pointer"
                onClick={() => setFilters({ ...filters, priority: undefined })}
              >
                Priority: {filters.priority} ×
              </Badge>
            )}
            {filters.completed !== undefined && (
              <Badge
                variant="secondary"
                className="bg-[#1f1f1f] text-[#888888] cursor-pointer"
                onClick={() => setFilters({ ...filters, completed: undefined })}
              >
                Status: {filters.completed ? "Completed" : "Pending"} ×
              </Badge>
            )}
          </div>
        )}

        {/* Pending Tasks */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Pending ({pendingTasks.length})</h2>
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <Card key={task.id} className="bg-[#111111] border-[#1f1f1f] hover:bg-[#1a1a1a] transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleTask(task.id)} className="mt-1">
                      <Circle className="h-5 w-5 text-[#666666] hover:text-[#2563eb]" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{task.title}</h3>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <Badge variant="secondary" className="text-xs bg-[#1f1f1f] text-[#888888] border-[#333333]">
                          {task.category}
                        </Badge>
                        {task.due_date && (
                          <Badge
                            variant="secondary"
                            className={`text-xs border-[#333333] ${
                              isOverdue(task.due_date) ? "bg-red-500/20 text-red-400" : "bg-[#1f1f1f] text-[#888888]"
                            }`}
                          >
                            {isOverdue(task.due_date) ? "Overdue" : "Due"}: {formatDate(task.due_date)}
                          </Badge>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(task)}
                            className="h-6 w-6 p-0 hover:bg-[#1f1f1f] text-[#888888] hover:text-white"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(task.id)}
                            className="h-6 w-6 p-0 hover:bg-[#1f1f1f] text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {task.description && <p className="text-[#888888] text-sm mb-2">{task.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-[#666666]">
                        <span>Created: {formatDate(task.created_at.split("T")[0])}</span>
                        {task.updated_at !== task.created_at && (
                          <span>Updated: {formatDate(task.updated_at.split("T")[0])}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Completed ({completedTasks.length})</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="bg-[#111111] border-[#1f1f1f] opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleTask(task.id)} className="mt-1">
                        <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[#666666] font-medium line-through">{task.title}</h3>
                          <Badge variant="secondary" className="text-xs bg-[#1f1f1f] text-[#666666] border-[#333333]">
                            {task.category}
                          </Badge>
                          {task.completed_at && (
                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                              Completed: {formatDate(task.completed_at.split("T")[0])}
                            </Badge>
                          )}
                        </div>

                        {task.description && <p className="text-[#555555] text-sm line-through">{task.description}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#888888] text-lg">No tasks found</p>
            <p className="text-[#666666] text-sm mt-2">
              {searchTerm || Object.keys(filters).length > 0
                ? "Try adjusting your search or filters"
                : "Create your first task to get started"}
            </p>
          </div>
        )}

        {/* Create Task Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Title</label>
                <Input
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Description</label>
                <Textarea
                  placeholder="Task description (optional)..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666] min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })}
                    className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
                >
                  Cancel
                </Button>
                <Button onClick={addTask} className="bg-[#2563eb] hover:bg-[#1d4ed8]" disabled={!newTask.title.trim()}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Title</label>
                <Input
                  placeholder="Task title..."
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Description</label>
                <Textarea
                  placeholder="Task description (optional)..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666] min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">Priority</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Task["priority"] })}
                    className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#888888] mb-2 block">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#1f1f1f] border border-[#333333] rounded-md px-3 py-2 text-white"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#888888] mb-2 block">Due Date</label>
                <Input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="bg-[#1f1f1f] border-[#333333] text-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEdit}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                  disabled={!editForm.title.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
