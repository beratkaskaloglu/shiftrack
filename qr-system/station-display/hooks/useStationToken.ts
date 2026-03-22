import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCurrentToken, generateNewToken, type TokenResponse } from "../lib/api";

const POLL_INTERVAL_MS = 2000; // Check token status every 2 seconds
const EXPIRY_REFRESH_THRESHOLD_MS = 30_000; // Regenerate when less than 30s remain

interface UseStationTokenResult {
  token: TokenResponse | null;
  loading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
}

export function useStationToken(stationId: string): UseStationTokenResult {
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentTokenRef = useRef<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const refreshToken = useCallback(async () => {
    try {
      setError(null);
      const newToken = await generateNewToken(stationId);
      setToken(newToken);
      currentTokenRef.current = newToken.token;
    } catch {
      setError("Yeni token üretilemedi");
    }
  }, [stationId]);

  const checkAndRefresh = useCallback(async () => {
    try {
      const current = await fetchCurrentToken(stationId);

      // Token changed (someone scanned it) — update state
      if (current.token !== currentTokenRef.current) {
        setToken(current);
        currentTokenRef.current = current.token;
      }

      // Regenerate if nearing expiry
      const timeLeft = new Date(current.expires_at).getTime() - Date.now();
      if (timeLeft < EXPIRY_REFRESH_THRESHOLD_MS) {
        await refreshToken();
      }
    } catch {
      setError("Token durumu alınamadı");
    }
  }, [stationId, refreshToken]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        const t = await fetchCurrentToken(stationId);
        if (!cancelled) {
          setToken(t);
          currentTokenRef.current = t.token;
        }
      } catch {
        if (!cancelled) setError("İstasyon token alınamadı");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  // Polling loop
  useEffect(() => {
    if (!token) return;

    pollRef.current = setInterval(checkAndRefresh, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, checkAndRefresh]);

  return { token, loading, error, refreshToken };
}
