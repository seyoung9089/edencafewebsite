import { ConvexError } from 'convex/values'

/** Extracts a readable message from a Convex mutation/action failure. */
export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ConvexError) {
    return typeof e.data === 'string' ? e.data : fallback
  }
  if (e instanceof Error) return e.message
  return fallback
}
