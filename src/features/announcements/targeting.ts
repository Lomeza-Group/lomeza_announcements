export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false
  }

  return new Date(expiresAt).getTime() <= new Date().getTime()
}
