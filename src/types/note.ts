export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color: string
  pinned: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CreateNoteData {
  title: string
  content: string
  color: string
  pinned?: boolean
  tags?: string[]
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  id: string
}

export interface NoteFilters {
  pinned?: boolean
  color?: string
  tag?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface NoteStats {
  total_notes: number
  pinned_notes: number
  recent_notes: number
  total_tags: number
  top_tags: Record<string, number>
  by_color: Record<string, number>
}

export interface SearchResult extends Note {
  rank: number
}

export interface TagUsage {
  tag: string
  usage_count: number
}
