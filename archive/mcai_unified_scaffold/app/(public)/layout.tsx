export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* AdGate mounts here in Public only */}
      {children}
    </div>
  );
}
