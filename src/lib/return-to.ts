// Where to go back to after logging in. Remembered on this device (not in the
// URL) so it survives Google login and the sign-up confirmation email, which
// both land on /orders.

const KEY = 'edenReturnTo'
/** A remembered page older than this is ignored. */
const MAX_AGE_MS = 60 * 60 * 1000

export function rememberReturnTo(path: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }))
  } catch {
    /* ignore storage failures */
  }
}

/** The remembered page (only same-site paths), cleared once read. */
export function takeReturnTo(): string | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    window.localStorage.removeItem(KEY)
    if (!raw) return null
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown }
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return null
    if (typeof at !== 'number' || Date.now() - at > MAX_AGE_MS) return null
    return path
  } catch {
    return null
  }
}

/** Supabase Auth messages a customer may see, in plain Korean. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일이나 비밀번호가 맞지 않습니다. 한 번 더 확인해 주시기 바랍니다.'
  if (m.includes('email not confirmed')) return '아직 이메일 인증을 하지 않았습니다. 가입할 때 받은 메일의 링크를 누르시면 로그인할 수 있습니다.'
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일입니다. 이 이메일로 로그인하시면 됩니다.'
  if (m.includes('password should be at least') || m.includes('weak password')) return '비밀번호는 6자 이상이어야 합니다.'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return '이메일 주소를 다시 확인해 주시기 바랍니다.'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) return '요청이 많아 잠시 막혔습니다. 몇 분 뒤 다시 시도하시면 됩니다.'
  if (m.includes('failed to fetch') || m.includes('network')) return '인터넷 연결을 확인하고 다시 시도해 주시기 바랍니다.'
  return message
}

const TAB_KEY = 'edenOrderTab'

/** Which order tab the customer last used, for "주문 마저 하기" links. */
export function rememberOrderTab(path: '/order' | '/parents') {
  try {
    window.localStorage.setItem(TAB_KEY, path)
  } catch {
    /* ignore storage failures */
  }
}

export function lastOrderTab(): '/order' | '/parents' {
  try {
    return window.localStorage.getItem(TAB_KEY) === '/parents' ? '/parents' : '/order'
  } catch {
    return '/order'
  }
}
