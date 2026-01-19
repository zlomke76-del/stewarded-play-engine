// app/components/IframeAutoResize.tsx
"use client";

/**
 * Sends the current document height to the parent window (e.g., Webflow)
 * so the iframe auto-resizes. It posts on load, resize, and DOM changes.
 *
 * Optionally set NEXT_PUBLIC_PARENT_ORIGINS to a comma-separated list
 * of allowed parent origins (e.g. "https://moral-clarity-ai-2-0.webflow.io,https://moral-clarity-ai.vercel.app").
 * If not set, it will post to "*" (less strict).
 */

import { useEffect } from "react";

const PING_EVENT = "mcat:height";

function getDocHeight() {
  const body = document.body;
  const html = document.documentElement;
  return Math.max(
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight
  );
}

export default function IframeAutoResize() {
  useEffect(() => {
    const origins =
      (process.env.NEXT_PUBLIC_PARENT_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const postHeight = () => {
      const height = getDocHeight();
      // If you provided an allowlist of parent origins, post to each.
      if (origins.length) {
        origins.forEach((origin) => {
          try {
            window.parent?.postMessage({ type: PING_EVENT, height }, origin);
          } catch (_) {}
        });
      } else {
        // Otherwise post to all (less strict, but convenient during setup).
        window.parent?.postMessage({ type: PING_EVENT, height }, "*");
      }
    };

    // Fire on load
    postHeight();

    // Fire on resize
    const onResize = () => postHeight();
    window.addEventListener("resize", onResize);

    // Fire when DOM changes size/content
    const mo = new MutationObserver(() => postHeight());
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    // Periodic keepalive (in case some browsers miss events)
    const interval = setInterval(postHeight, 1200);

    return () => {
      window.removeEventListener("resize", onResize);
      mo.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
