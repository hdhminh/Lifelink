const SESSION_STORAGE_KEY = 'lifelink.authSession'

export function readAuthenticatedSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.warn('[authSessionStorage] Could not read session metadata:', err)
    return null
  }
}

export function writeAuthenticatedSession(meta) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(meta))
}

export function clearAuthenticatedSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function markAuthenticatedSession(role = 'donor') {
  const now = Date.now()
  writeAuthenticatedSession({
    loginAt: now,
    lastActivityAt: now,
    role: role === 'admin' ? 'admin' : 'donor'
  })
}
