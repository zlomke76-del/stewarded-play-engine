export default function AdGate({ disabled = false }: { disabled?: boolean }) {
  if (disabled) return null;
  return <div id="ad-slot" aria-label="Sponsored" />;
}
