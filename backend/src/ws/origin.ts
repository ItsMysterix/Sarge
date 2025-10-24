export function isAllowedOrigin(origin: string | undefined, allowlist?: string[]): boolean {
  if (!origin) return false;
  try {
    const normalized = origin.trim().toLowerCase();

    // If an allowlist is provided, allow exact or prefix match
    if (allowlist && allowlist.length > 0) {
      const list = allowlist.map((o) => o.trim().toLowerCase()).filter(Boolean);
      return list.some((allowed) => normalized === allowed || normalized.startsWith(allowed));
    }

    // Default policy: allow localhost and 127.0.0.1 (any port, http or https)
    if (normalized.startsWith('http://localhost') ||
        normalized.startsWith('https://localhost') ||
        normalized.startsWith('http://127.0.0.1') ||
        normalized.startsWith('https://127.0.0.1')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
