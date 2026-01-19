"use client";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items = [] }: { items?: Crumb[] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-neutral-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "text-white" : ""}>{item.label}</span>
              )}
              {!last && <span className="text-neutral-600">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
