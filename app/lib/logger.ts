// app/lib/logger.ts
export function logInfo(msg: string, extra?: Record<string, any>) {
  try {
    console.log(`[INFO] ${msg}`, extra || "");
  } catch {}
}
export function logWarn(msg: string, extra?: Record<string, any>) {
  try {
    console.warn(`[WARN] ${msg}`, extra || "");
  } catch {}
}
export function logError(msg: string, extra?: Record<string, any>) {
  try {
    console.error(`[ERROR] ${msg}`, extra || "");
  } catch {}
}
