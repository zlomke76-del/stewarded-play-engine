export function injectSlash(text: string, desired?: "Neutral"|"Guidance"|"Ministry") {
  if (!desired) return text;
  return `/mode:${desired.toLowerCase()} ` + text;
}
