import { useState, useEffect } from "react"
import { ArrowLeft, Pin } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { ConfirmDialog } from "./ui/confirm-dialog"
import { useConfirm } from "../hooks/use-confirm"
import type { Note } from "../types/note"

interface NoteEditViewProps {
  note: Note | null
  onBack: () => void
  onSave: (note: Note) => void
  onDelete?: (noteId: string) => void
  onTogglePin?: (noteId: string) => void
}

export function NoteEditView({ note, onBack, onSave, onDelete, onTogglePin }: NoteEditViewProps) {
  const { confirm, close, handleConfirm, isOpen: isConfirmOpen, options: confirmOptions } = useConfirm()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setIsPinned(note.pinned)
    } else {
      // Nueva nota
      setTitle("Nueva nota")
      setContent("")
      setIsPinned(false)
    }
  }, [note])

  const handleSave = () => {
    const noteData: Note = note
      ? {
          ...note,
          title: title || "Nueva nota",
          content,
          pinned: isPinned,
          updated_at: new Date().toISOString(),
        }
      : {
          id: crypto.randomUUID(),
          user_id: "",
          title: title || "Nueva nota",
          content,
          color: "bg-slate-800",
          pinned: isPinned,
          tags: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

    onSave(noteData)
  }

  const handleDelete = async () => {
    if (!note || !onDelete) return

    const confirmed = await confirm({
      title: "Delete Note",
      description: `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger"
    })

    if (!confirmed) return

    onDelete(note.id)
    onBack()
  }

  const handleTogglePin = () => {
    setIsPinned(!isPinned)
    if (note && onTogglePin) {
      onTogglePin(note.id)
    }
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

  const createdDate = note?.created_at || new Date().toISOString()
  const updatedDate = note?.updated_at || new Date().toISOString()

  return (
    <div className="min-h-full bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-[#888888] hover:text-white hover:bg-[#1f1f1f] flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a notas
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePin}
            className={`hover:bg-[#1f1f1f] flex items-center gap-2 ${
              isPinned ? "text-[#2563eb]" : "text-[#888888] hover:text-white"
            }`}
          >
            <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
            Anclar
          </Button>
          <Button onClick={handleSave} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6">
            Guardar
          </Button>
          {note && onDelete && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300"
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none p-0 text-white placeholder:text-[#666666] focus:ring-0 shadow-none mb-4"
            placeholder="Título de la nota..."
          />

          {/* Metadata */}
          <div className="text-sm text-[#666666] mb-6">
            Creada: {formatDate(createdDate)} • Actualizada: {formatDate(updatedDate)}
          </div>

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] bg-transparent border-none p-0 text-white placeholder:text-[#666666] focus:ring-0 shadow-none resize-none text-base leading-relaxed"
            placeholder="Empieza a escribir tu nota..."
          />
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={close}
        onConfirm={handleConfirm}
        title={confirmOptions?.title || ""}
        description={confirmOptions?.description || ""}
        confirmText={confirmOptions?.confirmText}
        cancelText={confirmOptions?.cancelText}
        variant={confirmOptions?.variant}
      />
    </div>
  )
}
