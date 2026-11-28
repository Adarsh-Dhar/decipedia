import { createClient } from '@/lib/supabase/client'

export type SavedDraft = {
  id: string
  title: string
  summary: string
  topic: string
  tags: string[]
  references: string[]
  content: string
  article_slug: string | null
  saved_at: string
}

export async function getSavedArticleSlugs(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return []

  const { data, error } = await supabase.from('bookmarks').select('article_slug').eq('user_id', user.id)
  if (error) throw error
  return data.map((bookmark: { article_slug: string }) => bookmark.article_slug)
}

export async function toggleSavedArticle(slug: string, saved: boolean) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return false

  const result = saved
    ? await supabase.from('bookmarks').delete().eq('article_slug', slug).eq('user_id', user.id)
    : await supabase.from('bookmarks').upsert({ user_id: user.id, article_slug: slug }, { onConflict: 'user_id,article_slug' })
  if (result.error) throw result.error
  return true
}

export async function listUserDrafts(): Promise<SavedDraft[]> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return []

  const { data, error } = await supabase.from('drafts').select('id,title,summary,topic,tags,references,content,article_slug,saved_at').eq('user_id', user.id).order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function saveUserDraft(draft: Omit<SavedDraft, 'saved_at'>) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return false

  const { error } = await supabase.from('drafts').upsert({
    ...draft,
    references: draft.references ?? [],
    article_slug: draft.article_slug ?? null,
    user_id: user.id,
    saved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) throw error
  return true
}

export async function removeUserDraft(id: string) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return

  const { error } = await supabase.from('drafts').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
}

export async function getUserTheme(): Promise<'light' | 'dark' | 'system' | null> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return null

  const { data, error } = await supabase.from('user_preferences').select('theme').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return data?.theme ?? 'system'
}

export async function saveUserTheme(theme: 'light' | 'dark' | 'system') {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return false

  const { error } = await supabase.from('user_preferences').upsert({ user_id: user.id, theme, updated_at: new Date().toISOString() })
  if (error) throw error
  return true
}

export async function getOwnProfile() {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return null

  const { data, error } = await supabase.from('profiles').select('display_name,bio,wallet_address').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data
}

export async function saveOwnProfile(profile: { display_name: string; bio: string }) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) return false

  const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() })
  if (error) throw error
  return true
}
