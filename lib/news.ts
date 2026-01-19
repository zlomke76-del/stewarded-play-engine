// lib/news.ts
// Stable interface for delivering a structured news digest to Solace.

import { getNewsDigest as fetchDigest } from "./news-cache";

export async function getNewsDigest() {
  const digest = await fetchDigest();

  return {
    date: digest?.date ?? null,
    stories: digest?.stories ?? [],
    domainStats: digest?.domainStats ?? {},
    errors: digest?.errors ?? [],
  };
}
