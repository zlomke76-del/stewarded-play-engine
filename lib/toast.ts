// lib/toast.ts
// Simple global toast emitter for Moral Clarity AI
// Usage: toast("Message created") anywhere in client components

export function toast(text: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("mca:toast", { detail: { text } }));
}
