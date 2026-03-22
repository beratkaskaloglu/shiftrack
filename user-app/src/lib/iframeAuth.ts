let embedToken: string | null = null;

export function initIframeAuth(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    embedToken = token;
  }
}

export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getEmbedToken(): string | null {
  return embedToken;
}
