import siteMetadata from '../metadata.json'

type MetaEntry = { title: string; description: string }
type MetaPath = keyof typeof siteMetadata

/**
 * Per-route <title> and <meta description>, read from metadata.json.
 * Used as each route's `head()` so search engines and AI crawlers see an
 * accurate title/description for that specific page instead of the
 * site-wide default.
 *
 * `noindex: true` adds a robots meta tag asking crawlers not to index the
 * page — for internal pages like /admin that aren't useful search/AI
 * content and shouldn't show up in results even though they're reachable.
 */
export function pageMeta(path: MetaPath, options?: { noindex?: boolean }) {
  const entry: MetaEntry = siteMetadata[path]
  const meta: Record<string, string>[] = [{ title: entry.title }, { name: 'description', content: entry.description }]
  if (options?.noindex) meta.push({ name: 'robots', content: 'noindex, nofollow' })
  return { meta }
}
