// app/viewer/page.tsx
import { Suspense } from 'react';
import ViewerClient from './viewer-client';

// Hard stop: never pre-render this route
export const dynamic = 'force-dynamic';
export const revalidate = false;
export const fetchCache = 'force-no-store';
// (optional) keep on Node runtime so client code can import edge-unsafe libs safely
export const runtime = 'nodejs';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-zinc-200">
      Loading viewer…
    </div>}>
      <ViewerClient />
    </Suspense>
  );
}
