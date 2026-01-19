import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thermal–Wind Coupled Rectification for Directional Work | Moral Clarity AI",
  description:
    "A constructive physics experiment converting fluctuating wind into net work using diurnal thermal gradients.",
  openGraph: {
    title: "Thermal–Wind Coupled Rectification for Directional Work",
    description:
      "Harnessing atmospheric heat-engine effects to bias random wind into usable energy.",
    url: "https://moralclarity.ai/edge-of-practice/constructive-physics/thermal-wind-rectification",
    siteName: "Moral Clarity AI",
    type: "article",
  },
  robots: { index: true, follow: true },
};

export default function ThermalWindRectificationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Thermal–Wind Coupled Rectification for Directional Work</h1>

        <p className="lead">
          <strong>
            Daily thermal gradients can bias fluctuating wind flows into
            directional mechanical work without requiring steady wind
            conditions.
          </strong>
        </p>

        <h2>One-Sentence Discovery</h2>
        <p>
          Asymmetric thermal absorption structures can rectify stochastic wind
          motion into net directional work by coupling airflow with diurnal
          temperature-driven density gradients.
        </p>

        <h2>The Physical Mechanism</h2>
        <p>
          Differential heating across vertical or channelized structures
          creates localized pressure and density gradients. When ambient wind
          interacts with these gradients, oscillatory motion becomes biased in
          a preferred direction, allowing cumulative work extraction over
          thermal cycles.
        </p>

        <h2>New Scientific Object</h2>
        <p>
          <strong>Thermo-Anemometric Rectification Coefficient (TARC)</strong>: a
          metric describing how efficiently a system converts thermal gradients
          and fluctuating wind into net directional mechanical or electrical
          output.
        </p>

        <h2>Edge-of-Practice Experiment</h2>
        <p>
          Build two vertical membrane or channel systems—one thermally
          asymmetric, one symmetric. Measure net work output over multiple
          day–night cycles under identical wind exposure.
        </p>
        <p>
          <strong>Binary outcome:</strong> Persistent net directional work in
          the asymmetric system validates rectification.
        </p>

        <h2>Why This Matters</h2>
        <p>
          Makes wind energy viable in low, variable, or chaotic wind climates
          by leveraging predictable thermal cycles rather than relying on
          steady airflow.
        </p>
      </article>
    </main>
  );
}
