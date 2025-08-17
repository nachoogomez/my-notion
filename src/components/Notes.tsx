import { useState, useEffect } from "react"
import { Plus, Search, Pin, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { NoteEditView } from "./NotesEditView"
import { useAuth } from "../context/AuthContext"
import { NoteService } from "../services/noteServices"
import type { Note, CreateNoteData } from "../types/note"

export function NotesView() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Load notes when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadNotes()
    }
  }, [user?.id])

  const loadNotes = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const userNotes = await NoteService.getUserNotes(user.id, {
        search: searchTerm || undefined,
      })
      setNotes(userNotes)
    } catch (error) {
      console.error("Error loading notes:", error)
    } finally {
      setLoading(false)
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

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(true)
    setIsCreatingNew(false)
  }

  const handleNewNote = () => {
    setSelectedNote(null)
    setIsEditing(true)
    setIsCreatingNew(true)
  }

  const handleSaveNote = async (noteData: Note) => {
    if (!user?.id) return

    try {
      if (isCreatingNew) {
        // Create new note
        const createData: CreateNoteData = {
          title: noteData.title,
          content: noteData.content,
          color: "bg-slate-800",
          pinned: noteData.pinned,
          tags: noteData.tags || [],
        }
        const createdNote = await NoteService.createNote(user.id, createData)
        setNotes([createdNote, ...notes])
      } else {
        // Update existing note
        const updatedNote = await NoteService.updateNote({
          id: noteData.id,
          title: noteData.title,
          content: noteData.content,
          color: noteData.color,
          tags: noteData.tags,
        })
        setNotes(notes.map((note) => (note.id === noteData.id ? updatedNote : note)))
      }

      setIsEditing(false)
      setSelectedNote(null)
      setIsCreatingNew(false)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Error al guardar la nota. Inténtalo de nuevo.")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await NoteService.deleteNote(noteId)
      setNotes(notes.filter((note) => note.id !== noteId))
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Error al eliminar la nota. Inténtalo de nuevo.")
    }
  }

  const handleTogglePin = async (noteId: string) => {
    try {
      const updatedNote = await NoteService.toggleNotePinned(noteId)
      setNotes(notes.map((note) => (note.id === noteId ? updatedNote : note)))
    } catch (error) {
      console.error("Error toggling pin:", error)
      alert("Error al actualizar la nota. Inténtalo de nuevo.")
    }
  }

  const handleBackToNotes = () => {
    setIsEditing(false)
    setSelectedNote(null)
    setIsCreatingNew(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // If editing, show the edit view
  if (isEditing) {
    return (
      <NoteEditView
        note={selectedNote}
        onBack={handleBackToNotes}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onTogglePin={handleTogglePin}
      />
    )
  }

  if (loading) {
    return (
      <div className="p-6 h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Cargando notas...</div>
      </div>
    )
  }

  const NoteCard = ({ note }: { note: Note }) => (
    <Card
      className="bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors cursor-pointer group"
      onClick={() => handleNoteClick(note)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          {/* Title and Date */}
          <div className="mb-3">
            <h3 className="font-medium text-white text-base mb-1 truncate">{note.title || "Nueva nota"}</h3>
            <p className="text-sm text-[#666666]">{formatDate(note.created_at)}</p>
          </div>

          {/* Content Preview */}
          <div className="flex-1 mb-4">
            <p className="text-[#888888] text-sm line-clamp-3">{note.content || "Nota vacía..."}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleTogglePin(note.id)
              }}
              className={`h-8 w-8 p-0 hover:bg-[#2a2a2a] ${
                note.pinned ? "text-[#2563eb]" : "text-[#666666] hover:text-white"
              }`}
            >
              <Pin className={`h-4 w-4 ${note.pinned ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteNote(note.id)
              }}
              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 h-screen bg-[#0a0a0a] overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Mis Notas</h1>
          </div>
          <Button onClick={handleNewNote} className="bg-[#2563eb] hover:bg-[#1d4ed8] flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva nota
          </Button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative w-full"> {/* Cambiado de max-w-2xl a w-full */}
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666666] h-5 w-5" />
            <Input
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#666666] h-12 text-base w-full" // <-- agregado w-full
            />
          </div>
        </div>

        {/* Notes Grid */}
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#888888] text-lg mb-2">No hay notas</p>
            <p className="text-[#666666] text-sm mb-6">
              {searchTerm ? "Intenta con un término de búsqueda diferente" : "Crea tu primera nota para comenzar"}
            </p>
            {!searchTerm && (
              <Button onClick={handleNewNote} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                <Plus className="h-4 w-4 mr-2" />
                Crear primera nota
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
