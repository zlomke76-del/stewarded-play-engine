export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 tracking-tight text-white">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
