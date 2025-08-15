import { useState, useEffect } from "react"
import { ArrowLeft, Edit, Save, X, Pin, Trash2, Calendar, Tag } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Badge } from "./ui/badge"
import type { Note } from "../types/note"

interface NoteDetailViewProps {
  note: Note
  onBack: () => void
  onUpdate: (updatedNote: Note) => void
  onDelete: (noteId: string) => void
  onTogglePin: (noteId: string) => void
}

export function NoteDetailView({ note, onBack, onUpdate, onDelete, onTogglePin }: NoteDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: note.title,
    content: note.content,
    tags: note.tags.join(", "),
  })
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    })
  }, [note])

  const handleSave = () => {
    const tagsArray = editForm.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const updatedNote: Note = {
      ...note,
      title: editForm.title,
      content: editForm.content,
      tags: tagsArray,
      updated_at: new Date().toISOString(),
    }

    onUpdate(updatedNote)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    })
    setIsEditing(false)
  }

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      const updatedTags = [...note.tags, newTag.trim()]
      const updatedNote: Note = {
        ...note,
        tags: updatedTags,
        updated_at: new Date().toISOString(),
      }
      onUpdate(updatedNote)
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter((tag) => tag !== tagToRemove)
    const updatedNote: Note = {
      ...note,
      tags: updatedTags,
      updated_at: new Date().toISOString(),
    }
    onUpdate(updatedNote)
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      onDelete(note.id)
      onBack()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-yellow-200": "bg-yellow-200 border-yellow-300",
      "bg-green-200": "bg-green-200 border-green-300",
      "bg-blue-200": "bg-blue-200 border-blue-300",
      "bg-purple-200": "bg-purple-200 border-purple-300",
      "bg-pink-200": "bg-pink-200 border-pink-300",
      "bg-orange-200": "bg-orange-200 border-orange-300",
    }
    return colorMap[color] || "bg-yellow-200 border-yellow-300"
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-[#888888] hover:text-white hover:bg-[#1f1f1f]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-[#888888] hover:text-white hover:bg-[#1f1f1f]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-[#888888] hover:text-white hover:bg-[#1f1f1f]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePin(note.id)}
                className={`hover:bg-[#1f1f1f] ${note.pinned ? "text-[#2563eb]" : "text-[#888888] hover:text-white"}`}
              >
                <Pin className={`h-4 w-4 ${note.pinned ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Note Card */}
          <div className={`rounded-lg border-2 p-6 ${getColorClasses(note.color)}`}>
            {/* Title */}
            <div className="mb-4">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-2xl font-bold bg-transparent border-none p-0 text-gray-800 placeholder:text-gray-600 focus:ring-0 shadow-none"
                  placeholder="Note title..."
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{note.title}</h1>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">
              {isEditing ? (
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="min-h-[400px] bg-transparent border-none p-0 text-gray-700 placeholder:text-gray-600 focus:ring-0 shadow-none resize-none"
                  placeholder="Write your note here..."
                />
              ) : (
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</div>
              )}
            </div>

            {/* Tags Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Tags</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="bg-white/50 border-gray-400 text-gray-800 placeholder:text-gray-600"
                    placeholder="Enter tags separated by commas..."
                  />
                  <p className="text-xs text-gray-600">Separate tags with commas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {note.tags.length > 0 ? (
                      note.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-black/10 text-gray-700 hover:bg-black/20 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No tags</span>
                    )}
                  </div>

                  {/* Add new tag */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                      className="bg-white/50 border-gray-400 text-gray-800 placeholder:text-gray-600 text-sm"
                      placeholder="Add a tag..."
                    />
                    <Button size="sm" onClick={addTag} className="bg-gray-600 hover:bg-gray-700 text-white">
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-400/30 pt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(note.created_at)}</span>
              </div>
              {note.updated_at && note.updated_at !== note.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Updated: {formatDate(note.updated_at)}</span>
                </div>
              )}
              {note.pinned && (
                <div className="flex items-center gap-1 text-[#2563eb]">
                  <Pin className="h-3 w-3 fill-current" />
                  <span>Pinned</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
