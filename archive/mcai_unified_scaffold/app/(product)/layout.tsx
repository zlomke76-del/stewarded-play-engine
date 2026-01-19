export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* No ads here; entitlement-driven UI only */}
      {children}
    </div>
  );
}
