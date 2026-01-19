import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edge of Practice — Thermal Cycling Stability in PC/Glass Fiber | Moral Clarity AI",
  description:
    "Tests whether interfacial micro-slip in short glass fiber PC mitigates thermal fatigue.",
  robots: { index: true, follow: true },
};

export default function PCGlassThermalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Thermal Fatigue Mitigation via Interfacial Micro-Slip in PC/Glass Fiber</h1>

        <h2>Assumption under test</h2>
        <p>
          Thermal cycling damage in polycarbonate is dominated by bulk thermal expansion mismatch.
        </p>

        <h2>Edge of Practice experiment</h2>
        <p>
          Subject PC with 10 wt% short, untreated glass fiber to 500–1,000 thermal cycles
          (−20 °C ↔ 80 °C), inspecting for crack initiation and modulus drift.
        </p>

        <h2>Failure condition</h2>
        <p>
          Earlier cracking, whitening, or modulus degradation than neat PC.
        </p>

        <h2>Pass criterion</h2>
        <p>
          Delayed crack onset or reduced modulus drift relative to neat PC.
        </p>

        <hr />
        <p><em>Status:</em> Final · Mid-Cycle</p>
      </article>
    </main>
  );
}
