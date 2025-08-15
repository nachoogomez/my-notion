import { useState, useEffect } from "react"
import { Plus, Search, Grid, List, Pin, Trash2, Eye, BarChart3 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { NoteDetailView } from "./Notes-view"
import { useAuth } from "../context/AuthContext"
import { NoteService } from "../services/noteServices"
import type { Note, CreateNoteData, NoteStats, TagUsage } from "../types/note"

const COLORS = [
  { name: "Yellow", value: "bg-yellow-200", class: "bg-yellow-200" },
  { name: "Green", value: "bg-green-200", class: "bg-green-200" },
  { name: "Blue", value: "bg-blue-200", class: "bg-blue-200" },
  { name: "Purple", value: "bg-purple-200", class: "bg-purple-200" },
  { name: "Pink", value: "bg-pink-200", class: "bg-pink-200" },
  { name: "Orange", value: "bg-orange-200", class: "bg-orange-200" },
]

export function NotesView() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [stats, setStats] = useState<NoteStats | null>(null)
  const [popularTags, setPopularTags] = useState<TagUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showStats, setShowStats] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [newNote, setNewNote] = useState<CreateNoteData>({
    title: "",
    content: "",
    color: "bg-yellow-200",
    tags: [],
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
      await Promise.all([loadNotes(), loadStats(), loadPopularTags()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async () => {
    if (!user?.id) return

    try {
      const userNotes = await NoteService.getUserNotes(user.id, {
        search: searchTerm || undefined,
      })
      setNotes(userNotes)
    } catch (error) {
      console.error("Error loading notes:", error)
    }
  }

  const loadStats = async () => {
    if (!user?.id) return

    try {
      const noteStats = await NoteService.getNoteStats(user.id)
      setStats(noteStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadPopularTags = async () => {
    if (!user?.id) return

    try {
      const tags = await NoteService.getPopularTags(user.id, 10)
      setPopularTags(tags)
    } catch (error) {
      console.error("Error loading popular tags:", error)
    }
  }

  const handleSearch = async () => {
    if (!user?.id) return

    try {
      if (searchTerm.trim()) {
        const searchResults = await NoteService.searchNotes(user.id, searchTerm)
        setNotes(searchResults)
      } else {
        loadNotes()
      }
    } catch (error) {
      console.error("Error searching notes:", error)
    }
  }

  const addNote = async () => {
    if (!user?.id || (!newNote.title.trim() && !newNote.content.trim())) return

    try {
      const createdNote = await NoteService.createNote(user.id, {
        ...newNote,
        title: newNote.title || "Untitled",
        tags: newNote.tags || [],
      })

      setNotes([createdNote, ...notes])
      setNewNote({
        title: "",
        content: "",
        color: "bg-yellow-200",
        tags: [],
      })
      setIsDialogOpen(false)
      loadStats()
      loadPopularTags()
    } catch (error) {
      console.error("Error creating note:", error)
      alert("Error creating note. Please try again.")
    }
  }

  const updateNote = async (updatedNote: Note) => {
    try {
      const updated = await NoteService.updateNote({
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        color: updatedNote.color,
        tags: updatedNote.tags,
      })

      setNotes(notes.map((note) => (note.id === updatedNote.id ? updated : note)))
      loadStats()
      loadPopularTags()
    } catch (error) {
      console.error("Error updating note:", error)
      alert("Error updating note. Please try again.")
    }
  }

  const togglePin = async (id: string) => {
    try {
      const updatedNote = await NoteService.toggleNotePinned(id)
      setNotes(notes.map((note) => (note.id === id ? updatedNote : note)))
    } catch (error) {
      console.error("Error toggling pin:", error)
      alert("Error updating note. Please try again.")
    }
  }

  const deleteNote = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return

    try {
      await NoteService.deleteNote(id)
      setNotes(notes.filter((note) => note.id !== id))
      loadStats()
      loadPopularTags()
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Error deleting note. Please try again.")
    }
  }

  const openNoteDetail = (note: Note) => {
    setSelectedNote(note)
  }

  const closeNoteDetail = () => {
    setSelectedNote(null)
  }

  const handleTagClick = async (tag: string) => {
    if (!user?.id) return

    try {
      const taggedNotes = await NoteService.getNotesByTag(user.id, tag)
      setNotes(taggedNotes)
      setSearchTerm(`tag:${tag}`)
    } catch (error) {
      console.error("Error filtering by tag:", error)
    }
  }

  const handleTagsChange = (value: string) => {
    const tagsList = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    setNewNote({ ...newNote, tags: tagsList })
  }

  const filteredNotes = notes
  const pinnedNotes = filteredNotes.filter((note) => note.pinned)
  const unpinnedNotes = filteredNotes.filter((note) => !note.pinned)

  // If a note is selected, show the detail view
  if (selectedNote) {
    return (
      <NoteDetailView
        note={selectedNote}
        onBack={closeNoteDetail}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onTogglePin={togglePin}
      />
    )
  }

  if (loading) {
    return (
      <div className="p-6 h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading notes...</div>
      </div>
    )
  }

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className={`${note.color} border-0 hover:shadow-lg transition-shadow group cursor-pointer`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-800 truncate">{note.title}</h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openNoteDetail(note)
              }}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                togglePin(note.id)
              }}
              className="h-6 w-6 p-0 hover:bg-black/10"
            >
              <Pin className={`h-3 w-3 ${note.pinned ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                deleteNote(note.id)
              }}
              className="h-6 w-6 p-0 hover:bg-black/10 text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0" onClick={() => openNoteDetail(note)}>
        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">{note.content}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs bg-black/10 text-gray-700 cursor-pointer hover:bg-black/20"
              onClick={(e) => {
                e.stopPropagation()
                handleTagClick(tag)
              }}
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-black/10 text-gray-700">
              +{note.tags.length - 3}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">{new Date(note.created_at).toLocaleDateString()}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Notes</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] h-4 w-4" />
              <Input
                placeholder="Search notes..."
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
            <div className="flex border border-[#1f1f1f] rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white">
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title..."
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                  />
                  <Textarea
                    placeholder="Write your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    className="bg-[#1f1f1f] border-[#333333] min-h-[200px] placeholder:text-[#666666]"
                  />
                  <div>
                    <label className="text-sm font-medium text-[#888888] mb-2 block">Tags</label>
                    <Input
                      placeholder="Enter tags separated by commas..."
                      value={newNote.tags?.join(", ") || ""}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      className="bg-[#1f1f1f] border-[#333333] placeholder:text-[#666666]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#888888] mb-2 block">Color</label>
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewNote({ ...newNote, color: color.value })}
                          className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                            newNote.color === color.value ? "border-white" : "border-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-[#1f1f1f] text-[#888888] hover:bg-[#1f1f1f] bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button onClick={addNote} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                      Create Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <Card className="mb-6 bg-[#111111] border-[#1f1f1f]">
            <CardHeader>
              <CardTitle className="text-white">Notes Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.total_notes}</div>
                  <div className="text-sm text-[#888888]">Total Notes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{stats.pinned_notes}</div>
                  <div className="text-sm text-[#888888]">Pinned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.recent_notes}</div>
                  <div className="text-sm text-[#888888]">Recent (7 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.total_tags}</div>
                  <div className="text-sm text-[#888888]">Unique Tags</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Popular Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.slice(0, 8).map((tagUsage) => (
                      <Badge
                        key={tagUsage.tag}
                        variant="secondary"
                        className="text-xs bg-[#1f1f1f] text-[#888888] cursor-pointer hover:bg-[#2563eb] hover:text-white"
                        onClick={() => handleTagClick(tagUsage.tag)}
                      >
                        {tagUsage.tag} ({tagUsage.usage_count})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2">By Color</h4>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Object.entries(stats.by_color || {}).map(([color, count]) => (
                      <div key={color} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <span className="text-[#888888]">{COLORS.find((c) => c.value === color)?.name || color}</span>
                        </div>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Pin className="h-4 w-4" />
              Pinned ({pinnedNotes.length})
            </h2>
            <div
              className={`grid gap-4 ${
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {unpinnedNotes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Others ({unpinnedNotes.length})</h2>
            <div
              className={`grid gap-4 ${
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {unpinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#888888] text-lg">No notes found</p>
            <p className="text-[#666666] text-sm mt-2">
              {searchTerm ? "Try a different search term" : "Create your first note to get started"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4 bg-[#2563eb] hover:bg-[#1d4ed8]">
                <Plus className="h-4 w-4 mr-2" />
                Create First Note
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
