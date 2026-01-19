"use client";

import { useEffect, useRef } from "react";

export type Stop = {
  id: string;
  title: string;
  location?: string;
  date?: string;
  imageUrl?: string;   // e.g. "/Journey/west_coast.jpg"
  caption?: string;
  promptNote?: string; // for Arthur’s Pass necklace note
  travel?: "plane" | "car";
};

export default function JourneyPlanner({ stops }: { stops: Stop[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("show")),
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const Icon = ({ type }: { type?: "plane" | "car" }) => {
    if (!type) return null;
    const src = type === "plane" ? "/Journey/icon/plane.svg" : "/Journey/icon/car.svg";
    const alt = type === "plane" ? "Plane" : "Car";
    return <img className="icon" src={src} alt={alt} width={22} height={22} />;
  };

  return (
    <section ref={ref} className="journey">
      <h1 className="title">New Zealand Journey</h1>

      <ol className="timeline">
        {stops.map((s, i) => (
          <li key={s.id} className="item reveal">
            <div className="rail">
              {i > 0 && <span className="line" aria-hidden="true" />}
              <span className="dot" aria-hidden="true" />
              <span className="travel"><Icon type={s.travel} /></span>
            </div>

            <article className="card">
              {s.imageUrl && (
                <div className="media">
                  <img src={s.imageUrl} alt={s.caption || s.title} loading="lazy" />
                </div>
              )}
              <div className="meta">
                <h2 className="stopTitle">{s.title}</h2>
                {(s.location || s.date) && (
                  <p className="subtle">
                    {s.location}{s.location && s.date ? " • " : ""}{s.date}
                  </p>
                )}
                {s.caption && <p className="body">{s.caption}</p>}
                {s.promptNote && <p className="note">💬 {s.promptNote}</p>}
              </div>
            </article>
          </li>
        ))}
      </ol>

      <style jsx>{`
        .journey{--panel:#12161c;--muted:#8ea0b5;--text:#e8eef6;--accent:#7aa2ff;
          padding:48px 20px 80px;background:linear-gradient(180deg,#0a0d12,#0b0e12);color:var(--text)}
        .title{font-size:clamp(28px,2.4vw,40px);font-weight:700;letter-spacing:.3px;text-align:center;margin:0 0 28px}
        .timeline{width:min(980px,100%);margin:0 auto;list-style:none;padding:0}
        .item{display:grid;grid-template-columns:42px 1fr;gap:16px;align-items:flex-start;margin-bottom:28px}
        .reveal{opacity:0;transform:translateY(14px);transition:opacity .6s ease,transform .6s ease}
        .reveal.show{opacity:1;transform:none}
        .rail{position:relative;display:grid;place-items:center;padding-top:2px}
        .line{position:absolute;top:-28px;bottom:16px;width:2px;background:linear-gradient(180deg,#1b2230,#2a3446)}
        .dot{width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(122,162,255,.18);z-index:2}
        .travel{position:absolute;top:-26px;background:#0e131a;border:1px solid #1f2a3b;border-radius:10px;padding:6px 8px;box-shadow:0 6px 18px rgba(0,0,0,.35)}
        .icon{display:block;width:22px;height:22px;opacity:.9}
        .card{background:var(--panel);border:1px solid #1e2633;border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(0,0,0,.35)}
        .media img{width:100%;display:block;object-fit:cover;aspect-ratio:16/9;filter:contrast(1.02) saturate(1.02)}
        .meta{padding:16px 18px 18px}
        .stopTitle{margin:0 0 4px;font-size:clamp(18px,1.4vw,22px);line-height:1.2}
        .subtle{margin:0 0 10px;color:var(--muted);font-size:14px}
        .body{margin:0 0 10px;line-height:1.55}
        .note{margin:8px 0 0;padding:10px 12px;border-radius:10px;background:#0e131a;border:1px dashed #2a3751;color:#b6c6dc;font-size:14px}
        @media (max-width:640px){.item{grid-template-columns:30px 1fr}.travel{top:-24px;padding:5px 7px}.icon{width:18px;height:18px}}
      `}</style>
    </section>
  );
}
