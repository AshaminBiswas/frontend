import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// ─── Auto-Reload on Stale Deployment / Chunk Load Failure ─────────────────────
// When a new version is deployed to Vercel, old chunks are removed.
// If a customer has an older tab open, dynamic imports will fail with MIME/network errors.
// This automatically reloads the page to fetch the fresh bundle seamlessly.
if (typeof window !== "undefined") {
  const CHUNK_RELOAD_KEY = "prc_storefront_last_chunk_reload";
  const triggerAutoReload = (reason: string) => {
    try {
      const lastReload = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0", 10);
      const now = Date.now();
      if (now - lastReload > 10000) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
        console.warn(`[PRC AutoReload] Reloading storefront due to stale deployment chunk: ${reason}`);
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    triggerAutoReload("vite:preloadError");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event?.reason?.message || String(event?.reason || "");
    if (
      msg.includes("dynamically imported module") ||
      msg.includes("Expected a JavaScript-or-Wasm module script") ||
      msg.includes("Strict MIME type checking") ||
      msg.includes("Failed to load module script")
    ) {
      event.preventDefault();
      triggerAutoReload(msg);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);