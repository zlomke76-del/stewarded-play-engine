// app/whitepapers/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "White Papers | Moral Clarity AI",
  description:
    "A curated collection of Moral Clarity AI white papers examining physical, ethical, and epistemic limits of safety, harm reduction, and truth enforcement.",
  robots: {
    index: true,
    follow: true,
  },
};

type WhitePaper = {
  slug: string;
  title: string;
  subtitle: string;
};

const CONCEPTUAL_PAPERS: WhitePaper[] = [
  {
    slug: "materials-with-causal-memory",
    title: "Materials with Causal Memory",
    subtitle:
      "Physical systems that irreversibly encode history, exposure, or misuse into material structure.",
  },
  {
    slug: "geometry-driven-pathogen-surfaces",
    title: "Geometry-Driven Pathogen Surfaces",
    subtitle:
      "How surface geometry alone can influence pathogen behavior without chemistry or claims of elimination.",
  },
  {
    slug: "passive-aerosol-suppression",
    title: "Passive Aerosol Suppression",
    subtitle:
      "Regime-bounded evaluation of materials that reduce aerosol transmission without filtration or airflow control.",
  },
  {
    slug: "passive-environmental-witnesses",
    title: "Passive Environmental Witnesses",
    subtitle:
      "Materials that record environmental exposure as physical evidence rather than data or reports.",
  },
  {
    slug: "passive-source-control",
    title: "Passive Source Control",
    subtitle:
      "Reducing emitted harm at the source through intrinsic material behavior, not user compliance.",
  },
  {
    slug: "phase-selective-cooling",
    title: "Phase-Selective Cooling",
    subtitle:
      "Thermal regulation through phase behavior rather than active energy expenditure.",
  },
];

const ANCHORED_PET_PAPERS: WhitePaper[] = [
  {
    slug: "sulfonated-aromatic-diacid-pet",
    title: "Sulfonated Aromatic Diacid–PET Copolymer",
    subtitle: "Anchored fixed-charge PET with durability-gated hygiene capability.",
  },
  {
    slug: "phosphonate-diol-pet",
    title: "Phosphonate-Diol–PET Copolymer",
    subtitle: "Covalently retained phosphonate PET for non-leaching flame retardancy.",
  },
  {
    slug: "carboxylic-acid-modified-pet",
    title: "Carboxylic Acid–Modified PET",
    subtitle: "Pendant-acid PET for enhanced chemical resistance and container life.",
  },
  {
    slug: "quaternary-ammonium-grafted-pet",
    title: "Quaternary Ammonium–Grafted PET",
    subtitle: "Extraction-stable cationic PET surfaces with antimicrobial potential.",
  },
  {
    slug: "peg-diacid-pet",
    title: "PEG-Diacid PET Copolymer",
    subtitle: "Hydration-stable PEG incorporation for flexible, biocompatible PET.",
  },
  {
    slug: "imidazolium-functional-pet",
    title: "Imidazolium-Functional PET Graft",
    subtitle: "Salt-stable ionic PET for membranes and sensing.",
  },
  {
    slug: "zwitterion-modified-pet",
    title: "Zwitterion-Modified PET",
    subtitle: "Anti-fouling PET surfaces gated by hot-water extraction stability.",
  },
  {
    slug: "cyanate-ester-pet",
    title: "Cyanate Ester–PET Copolymer",
    subtitle: "Thermally durable PET via low-level cyanate anchoring.",
  },
  {
    slug: "allyl-sulfate-grafted-pet",
    title: "Allyl Sulfate Grafted PET",
    subtitle: "Anchored sulfate PET for filtration and ion-exchange applications.",
  },
  {
    slug: "epoxy-modified-pet",
    title: "Epoxy-Modified PET",
    subtitle: "Epoxy-diacid PET enabling adhesion and barrier enhancement.",
  },
];

const ADVANCED_ANCHORED_PET_PAPERS: WhitePaper[] = [
  {
    slug: "bio-based-diacid-pet",
    title: "Bio-Based Diacid PET Copolymer (FDCA)",
    subtitle: "Renewable diacid PET supporting lower-carbon polymer supply chains.",
  },
  {
    slug: "biguanide-diacid-antimicrobial-pet",
    title: "Biguanide Diacid–Functional Antimicrobial PET",
    subtitle: "Anchored antimicrobial PET without leachable additives.",
  },
  {
    slug: "citric-acid-modified-pet",
    title: "Citric Acid–Modified PET",
    subtitle:
      "Controlled hydrolytic susceptibility enabling predictable end-of-life pathways.",
  },
  {
    slug: "gallic-acid-antioxidant-pet",
    title: "Gallic Acid–Antioxidant PET",
    subtitle: "Intrinsic antioxidant PET for extended shelf life and stability.",
  },
  {
    slug: "edta-ligand-functional-pet",
    title: "EDTA-Ligand Functional PET",
    subtitle: "Covalently anchored chelation for heavy-metal remediation.",
  },
  {
    slug: "catechol-bearing-pet",
    title: "Catechol-Bearing PET",
    subtitle: "Adhesion-enhanced PET inspired by mussel chemistry.",
  },
  {
    slug: "self-healing-diels-alder-pet",
    title: "Self-Healing PET via Diels–Alder Chemistry",
    subtitle: "Dynamic covalent PET enabling crack repair and life extension.",
  },
  {
    slug: "polyamine-co2-capture-pet",
    title: "Polyamine-Functional PET for CO₂ Capture",
    subtitle:
      "Solid-state CO₂ capture from concentrated streams or controlled air-contact systems.",
  },
  {
    slug: "lignin-derived-aromatic-pet",
    title: "Lignin-Derived Aromatic PET Copolymer",
    subtitle: "Renewable aromatics from bio-refinery waste streams.",
  },
  {
    slug: "ionic-liquid-antistatic-pet",
    title: "Ionic Liquid–Mimic Antistatic PET",
    subtitle: "Durable antistatic PET without migrating additives.",
  },
];

export default function WhitePapersIndexPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif tracking-tight">White Papers</h1>
        <p className="mt-4 text-sm opacity-80">
          Public research notes from Moral Clarity AI examining where physics,
          ethics, and institutional reality diverge.
        </p>
      </header>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-medium">Conceptual Papers</h2>
        <div className="space-y-6">
          {CONCEPTUAL_PAPERS.map((paper) => (
            <Link
              key={paper.slug}
              href={`/whitepapers/${paper.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-neutral-600 hover:bg-neutral-900"
            >
              <h3 className="text-xl font-medium text-neutral-100">
                {paper.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                {paper.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-medium">
          Anchored PET White Papers
        </h2>
        <div className="space-y-6">
          {ANCHORED_PET_PAPERS.map((paper) => (
            <Link
              key={paper.slug}
              href={`/whitepapers/${paper.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-neutral-600 hover:bg-neutral-900"
            >
              <h3 className="text-xl font-medium text-neutral-100">
                {paper.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                {paper.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-medium">
          Advanced Anchored PET Candidates
        </h2>
        <div className="space-y-6">
          {ADVANCED_ANCHORED_PET_PAPERS.map((paper) => (
            <Link
              key={paper.slug}
              href={`/whitepapers/${paper.slug}`}
              className="block rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-neutral-600 hover:bg-neutral-900"
            >
              <h3 className="text-xl font-medium text-neutral-100">
                {paper.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                {paper.subtitle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-16 text-center text-xs text-neutral-500">
        These papers are regime-bounded, survivability-gated, and intentionally
        limited. Inclusion does not imply readiness, deployment, or universal
        applicability.
      </footer>
    </main>
  );
}
