type EventMap = Record<string, string>;
export const TELEMETRY_EVENTS: EventMap = {
  "public.hero.cta_click": "Public → Hero CTA",
  "product.thread.create": "Product → Thread Created",
  "product.memory.write": "Memory → Write Event",
};

export function track(event: keyof typeof TELEMETRY_EVENTS, data?: Record<string, unknown>) {
  // No-op placeholder honoring CSP; wire to your analytics later
  if (typeof window !== "undefined") {
    console.debug("telemetry:", event, data ?? {});
  }
}
