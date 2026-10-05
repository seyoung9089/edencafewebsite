// The deployment URL is public client configuration, not a secret.
// A build environment can override it with VITE_CONVEX_URL.
export const CONVEX_URL =
  import.meta.env.VITE_CONVEX_URL ||
  'https://avid-ostrich-769.eu-west-1.convex.cloud'
