import { supabase } from "../lib/supabase"
import type {
  Note,
  CreateNoteData,
  UpdateNoteData,
  NoteFilters,
  NoteStats,
  SearchResult,
  TagUsage,
} from "../types/note"

export class NoteService {
  // Get all notes for the current user
  static async getUserNotes(userId: string, filters?: NoteFilters): Promise<Note[]> {
    try {
      let query = supabase.from("notes").select("*").eq("user_id", userId)

      // Apply filters
      if (filters?.pinned !== undefined) {
        query = query.eq("pinned", filters.pinned)
      }

      if (filters?.color) {
        query = query.eq("color", filters.color)
      }

      if (filters?.tag) {
        query = query.contains("tags", [filters.tag])
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom)
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo)
      }

      // Order by: pinned first, then by updated date
      query = query.order("pinned", { ascending: false }).order("updated_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching notes:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getUserNotes:", error)
      throw error
    }
  }

  // Get note statistics
  static async getNoteStats(userId: string): Promise<NoteStats> {
    try {
      const { data, error } = await supabase.rpc("get_note_stats", {
        p_user_id: userId,
      })

      if (error) {
        console.error("Error fetching note stats:", error)
        throw error
      }

      return (
        data || {
          total_notes: 0,
          pinned_notes: 0,
          recent_notes: 0,
          total_tags: 0,
          top_tags: {},
          by_color: {},
        }
      )
    } catch (error) {
      console.error("Error in getNoteStats:", error)
      throw error
    }
  }

  // Search notes with full-text search
  static async searchNotes(userId: string, searchTerm: string, limit = 50): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.rpc("search_notes", {
        p_user_id: userId,
        p_search_term: searchTerm,
        p_limit: limit,
      })

      if (error) {
        console.error("Error searching notes:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in searchNotes:", error)
      throw error
    }
  }

  // Get notes by tag
  static async getNotesByTag(userId: string, tag: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase.rpc("get_notes_by_tag", {
        p_user_id: userId,
        p_tag: tag,
      })

      if (error) {
        console.error("Error fetching notes by tag:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getNotesByTag:", error)
      throw error
    }
  }

  // Get popular tags
  static async getPopularTags(userId: string, limit = 20): Promise<TagUsage[]> {
    try {
      const { data, error } = await supabase.rpc("get_popular_tags", {
        p_user_id: userId,
        p_limit: limit,
      })

      if (error) {
        console.error("Error fetching popular tags:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getPopularTags:", error)
      throw error
    }
  }

  // Create a new note
  static async createNote(userId: string, noteData: CreateNoteData): Promise<Note> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            user_id: userId,
            ...noteData,
            tags: noteData.tags || [],
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Error creating note:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in createNote:", error)
      throw error
    }
  }

  // Update an existing note
  static async updateNote(noteData: UpdateNoteData): Promise<Note> {
    try {
      const { id, ...updateData } = noteData

      const { data, error } = await supabase.from("notes").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Error updating note:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in updateNote:", error)
      throw error
    }
  }

  // Toggle note pinned status
  static async toggleNotePinned(noteId: string): Promise<Note> {
    try {
      // First get the current note to know its pinned status
      const { data: currentNote, error: fetchError } = await supabase
        .from("notes")
        .select("pinned")
        .eq("id", noteId)
        .single()

      if (fetchError) {
        console.error("Error fetching current note:", fetchError)
        throw fetchError
      }

      // Toggle the pinned status
      const { data, error } = await supabase
        .from("notes")
        .update({ pinned: !currentNote.pinned })
        .eq("id", noteId)
        .select()
        .single()

      if (error) {
        console.error("Error toggling note pinned status:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in toggleNotePinned:", error)
      throw error
    }
  }

  // Delete a note
  static async deleteNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId)

      if (error) {
        console.error("Error deleting note:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in deleteNote:", error)
      throw error
    }
  }

  // Add tag to note
  static async addTagToNote(noteId: string, tag: string): Promise<Note> {
    try {
      // First get the current note to get existing tags
      const { data: currentNote, error: fetchError } = await supabase
        .from("notes")
        .select("tags")
        .eq("id", noteId)
        .single()

      if (fetchError) {
        console.error("Error fetching current note:", fetchError)
        throw fetchError
      }

      // Add the new tag if it doesn't exist
      const currentTags = currentNote.tags || []
      if (!currentTags.includes(tag)) {
        const updatedTags = [...currentTags, tag]

        const { data, error } = await supabase
          .from("notes")
          .update({ tags: updatedTags })
          .eq("id", noteId)
          .select()
          .single()

        if (error) {
          console.error("Error adding tag to note:", error)
          throw error
        }

        return data
      }

      return currentNote as Note
    } catch (error) {
      console.error("Error in addTagToNote:", error)
      throw error
    }
  }

  // Remove tag from note
  static async removeTagFromNote(noteId: string, tag: string): Promise<Note> {
    try {
      // First get the current note to get existing tags
      const { data: currentNote, error: fetchError } = await supabase
        .from("notes")
        .select("tags")
        .eq("id", noteId)
        .single()

      if (fetchError) {
        console.error("Error fetching current note:", fetchError)
        throw fetchError
      }

      // Remove the tag
      const currentTags = currentNote.tags || []
      const updatedTags = currentTags.filter((t: any) => t !== tag)

      const { data, error } = await supabase
        .from("notes")
        .update({ tags: updatedTags })
        .eq("id", noteId)
        .select()
        .single()

      if (error) {
        console.error("Error removing tag from note:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error in removeTagFromNote:", error)
      throw error
    }
  }

  // Get notes by color
  static async getNotesByColor(userId: string, color: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .eq("color", color)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error fetching notes by color:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getNotesByColor:", error)
      throw error
    }
  }

  // Bulk operations
  static async bulkUpdateNotes(updates: UpdateNoteData[]): Promise<Note[]> {
    try {
      const promises = updates.map((update) => this.updateNote(update))
      const results = await Promise.all(promises)
      return results
    } catch (error) {
      console.error("Error in bulkUpdateNotes:", error)
      throw error
    }
  }

  static async bulkDeleteNotes(noteIds: string[]): Promise<void> {
    try {
      const { error } = await supabase.from("notes").delete().in("id", noteIds)

      if (error) {
        console.error("Error bulk deleting notes:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in bulkDeleteNotes:", error)
      throw error
    }
  }

  // Export notes (for backup/export functionality)
  static async exportUserNotes(userId: string): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error exporting notes:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in exportUserNotes:", error)
      throw error
    }
  }

  // Get recent notes
  static async getRecentNotes(userId: string, limit = 10): Promise<Note[]> {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching recent notes:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Error in getRecentNotes:", error)
      throw error
    }
  }
}
