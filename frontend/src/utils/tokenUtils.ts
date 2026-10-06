export function tokenIsExpired(token: string | null, graceSecs = 30): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 < Date.now() + graceSecs * 1000;
  } catch {
    return true;
  }
}

export function tokenPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}