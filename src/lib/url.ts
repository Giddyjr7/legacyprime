export function ensureProtocol(maybeUrl?: string): string {
  if (!maybeUrl) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(maybeUrl)) return maybeUrl;
  if (maybeUrl.startsWith('//')) return window.location.protocol + maybeUrl;
  if (maybeUrl.includes('localhost') || maybeUrl.includes('127.0.0.1')) {
    return `http://${maybeUrl}`;
  }
  return `https://${maybeUrl}`;
}

export function safeNewURL(path: string, base?: string): string {
  try {
    if (!path) {
      // If path is empty, return base as a fallback
      return base ? ensureProtocol(base) : '';
    }
    if (base) {
      const normalizedBase = ensureProtocol(base);
      // Use the URL constructor which handles relative paths correctly
      return new URL(path, normalizedBase).toString();
    }
    // If no base provided but path is absolute, ensure protocol
    return ensureProtocol(path);
  } catch (err) {
    // Fallback: concatenate safely
    const b = base ? ensureProtocol(base).replace(/\/+$|:\/\/$/, '') : '';
    const p = path.replace(/^\/+/, '');
    if (b) return `${b.replace(/\/$/, '')}/${p}`;
    return path;
  }
}

export function joinUrl(base: string, path: string): string {
  if (!base && !path) return '';
  if (!base) return path;
  const normalizedBase = ensureProtocol(base).replace(/\/$/, '');
  const normalizedPath = path ? path.replace(/^\//, '') : '';
  return `${normalizedBase}/${normalizedPath}`;
}
