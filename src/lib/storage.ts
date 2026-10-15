import { supabase } from '@/lib/supabase'
import { resizeImage } from '@/lib/image'

const BUCKET = 'site-images'

/** Shrinks a photo and uploads it; returns its public URL. Staff only. */
export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const blob = await resizeImage(file, 1400, 0.82)
  const path = `${folder}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Best-effort removal of an image uploaded by uploadSiteImage. */
export async function removeSiteImage(url: string | null | undefined): Promise<void> {
  const marker = `/object/public/${BUCKET}/`
  const index = url?.indexOf(marker) ?? -1
  if (!url || index < 0) return
  await supabase.storage.from(BUCKET).remove([url.slice(index + marker.length)])
}
