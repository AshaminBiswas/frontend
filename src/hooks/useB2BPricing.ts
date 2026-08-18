import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { isB2BUser } from "../utils/pricing";
import {
  fetchB2BPricingMatrix,
  invalidateB2BPricingCache,
  readStoredB2BPricing,
  B2BPricingCache
} from "../services/b2bPricingService";

// How often to silently poll for price updates in the background (ms)
const POLL_INTERVAL_MS = 20 * 1000; // every 20 seconds

/**
 * Hook that keeps B2B custom prices in sync with the admin panel in real-time.
 *
 * Zero-Flicker Architecture:
 *  1. Synchronous First Paint — Reads persistent localStorage cache during initial state creation.
 *     No flash of base/sale prices on initial load or page refresh.
 *  2. Silent Background Sync — Silently revalidates in the background and updates cache seamlessly.
 *  3. BroadcastChannel ("prc_b2b_pricing_channel") — Instant 0ms sync when
 *     changes are saved in the admin panel on the same device/browser.
 *  4. LocalStorage storage event ("prc_b2b_pricing_updated") — Instant cross-tab sync.
 *  5. Visibility change listener — Instant sync when the user switches tabs.
 *  6. Shared in-memory request deduplication — Zero duplicate API calls.
 */
export function useB2BPricing(): { prices: Record<string, any> } | null {
  const { user } = useAuth();

  // Initialize state SYNCHRONOUSLY from persistent storage to guarantee zero-flicker on first paint & refresh
  const [b2bCache, setB2BCache] = useState<B2BPricingCache | null>(() => {
    if (!user || !isB2BUser(user)) return null;
    return readStoredB2BPricing(user.id);
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (!user || !isB2BUser(user)) {
      setB2BCache(null);
    } else {
      const stored = readStoredB2BPricing(user.id);
      if (stored) {
        setB2BCache(stored);
      }
    }
  }, [user?.id]);

  const fetchFresh = useCallback(async (bust = false) => {
    if (!user || !isB2BUser(user)) {
      setB2BCache(null);
      return;
    }
    if (bust) invalidateB2BPricingCache(user.id);
    const cache = await fetchB2BPricingMatrix(user.id);
    if (cache) {
      setB2BCache(cache);
    }
  }, [user?.id]);

  // ── 1. Silent Background Verification on Mount / User change ──────────────
  useEffect(() => {
    if (!user || !isB2BUser(user)) {
      setB2BCache(null);
      return;
    }
    fetchFresh(false);
  }, [user?.id, fetchFresh]);

  // ── 2. Background polling every 20 seconds ────────────────────────────────
  useEffect(() => {
    if (!user || !isB2BUser(user)) return;

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFresh(false);
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
        fetchFresh(false);
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
