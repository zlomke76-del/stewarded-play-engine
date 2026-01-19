// app/viewer/viewer-client.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// react-pdf only on the client
const ReactPDF = dynamic(async () => {
  const mod = await import('react-pdf');
  return {
    default: mod,
    Document: mod.Document,
    Page: mod.Page,
    pdfjs: mod.pdfjs,
  } as any;
}, { ssr: false });

export default function ViewerClient() {
  const params = useSearchParams();
  const src = params?.get('url') ?? '';

  const [pdfReady, setPdfReady] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mod: any = await import('react-pdf');
        const { pdfjs } = mod;
        // Use a CDN worker that matches the installed pdfjs version
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
        setPdfReady(true);
      } catch (e: any) {
        setErr(e?.message || 'Failed to initialize PDF engine.');
      }
    })();
  }, []);

  const hasSrc = useMemo(() => typeof src === 'string' && src.length > 0, [src]);

  return (
    <main className="min-h-screen bg-[#0b1220] text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Document Viewer</h1>
          <a
            href="/"
            className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Back
          </a>
        </header>

        {!hasSrc ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-sm text-zinc-300">
              Provide a PDF via query param, e.g.:{' '}
              <code className="text-zinc-200">/viewer?url=/files/sample.pdf</code>
            </p>
          </div>
        ) : err ? (
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-200">
            Error: {err}
          </div>
        ) : !pdfReady ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
            Loading PDF engine…
          </div>
        ) : (
          <PDFFrame src={src} onPages={(n) => setNumPages(n)} onError={(m) => setErr(m)} />
        )}

        {numPages ? (
          <div className="mt-3 text-xs text-zinc-400">{numPages} page(s)</div>
        ) : null}
      </div>
    </main>
  );
}

function PDFFrame({
  src,
  onPages,
  onError,
}: {
  src: string;
  onPages: (n: number) => void;
  onError: (m: string) => void;
}) {
  const [Doc, setDoc] = useState<any>(null);
  const [Page, setPage] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const mod: any = await import('react-pdf');
        setDoc(() => mod.Document);
        setPage(() => mod.Page);
      } catch (e: any) {
        onError(e?.message || 'Failed to load PDF components.');
      }
    })();
  }, [onError]);

  if (!Doc || !Page) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        Preparing viewer…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <Doc
        file={src}
        onLoadSuccess={(meta: any) => onPages(meta.numPages)}
        onLoadError={(e: any) => onError(e?.message || 'Failed to load PDF.')}
        loading={<div className="p-4">Loading document…</div>}
        error={<div className="p-4 text-red-300">Could not open this PDF.</div>}
      >
        <AutoPager Page={Page} />
      </Doc>
    </div>
  );
}

function AutoPager({ Page }: { Page: any }) {
  const [pages, setPages] = useState<number>(1);
  useEffect(() => setPages(8), []);
  return (
    <div className="flex flex-col items-center gap-4">
      {Array.from({ length: pages }).map((_, i) => (
        <Page
          key={i}
          pageNumber={i + 1}
          width={920}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={<div className="p-4">Rendering page {i + 1}…</div>}
        />
      ))}
    </div>
  );
}
