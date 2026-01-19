export default function ModesRow() {
  // Create / Next Steps / Red Team (always visible in thread view)
  const modes = ["Create", "Next Steps", "Red Team"];
  return (
    <div className="sticky top-0 z-10 flex gap-2 p-2 border-b bg-white/70 backdrop-blur">
      {modes.map(m => (
        <button key={m} className="rounded-xl px-3 py-2 shadow-sm" aria-pressed={m === "Create"}>
          {m}
        </button>
      ))}
    </div>
  );
}
