import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { isB2BUser } from "../utils/pricing";
import { fetchB2BPricingMatrix, invalidateB2BPricingCache } from "../services/b2bPricingService";

// How often to silently poll for price updates in the background (ms)
const POLL_INTERVAL_MS = 15 * 1000; // every 15 seconds

/**
 * Hook that keeps B2B custom prices in sync with the admin panel in real-time.
 *
 * Real-time synchronization mechanisms:
 *  1. BroadcastChannel ("prc_b2b_pricing_channel") — Instant 0ms sync when
 *     changes are saved in the admin panel on the same device/browser.
 *  2. LocalStorage storage event ("prc_b2b_pricing_updated") — Instant cross-tab sync.
 *  3. Visibility change listener — Instant sync when the user switches tabs.
 *  4. Periodic polling (15s) — Catches updates from other devices/users.
 *  5. Shared in-memory request deduplication — Zero duplicate API calls.
 */
export function useB2BPricing(): { prices: Record<string, any> } | null {
  const { user } = useAuth();
  const [b2bCache, setB2BCache] = useState<{ prices: Record<string, any> } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFresh = useCallback(async (bust = false) => {
    if (!user || !isB2BUser(user)) {
      setB2BCache(null);
      return;
    }
    if (bust) invalidateB2BPricingCache();
    const cache = await fetchB2BPricingMatrix(user.id);
    setB2BCache(cache);
  }, [user?.id]);

  // ── 1. Initial fetch on mount / user change ───────────────────────────────
  useEffect(() => {
    if (!user || !isB2BUser(user)) {
      setB2BCache(null);
      return;
    }
    fetchFresh(true);
  }, [user?.id]);

  // ── 2. Background polling every 15 seconds ────────────────────────────────
  useEffect(() => {
    if (!user || !isB2BUser(user)) return;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFresh(true);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user?.id, fetchFresh]);

  // ── 3. Instant re-fetch on tab focus (visibilitychange) ───────────────────
  useEffect(() => {
    if (!user || !isB2BUser(user)) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFresh(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.id, fetchFresh]);

  // ── 4. Instant 0ms Cross-Tab Real-time BroadcastChannel & Storage events ───
  useEffect(() => {
    if (!user || !isB2BUser(user)) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "prc_b2b_pricing_updated") {
        fetchFresh(true);
      }
    };

    const handleCustomEvent = () => {
      fetchFresh(true);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("prc_b2b_pricing_updated", handleCustomEvent);

    let channel: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("prc_b2b_pricing_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "B2B_PRICING_UPDATED") {
            fetchFresh(true);
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("prc_b2b_pricing_updated", handleCustomEvent);
      if (channel) channel.close();
    };
  }, [user?.id, fetchFresh]);

  return b2bCache;
}
