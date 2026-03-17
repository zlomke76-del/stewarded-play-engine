"use client";

import { useMemo } from "react";
import { getPortraitPath } from "@/lib/portraits/getPortraitPath";
import HeroStatusBar from "../HeroStatusBar";
import HeroRitualPortrait from "../hero-ritual/HeroRitualPortrait";
import ProgressionBanner from "./ProgressionBanner";

type HeroView = {
  name: string;
  species: string;
  className: string;
  portrait: "Male" | "Female";
  level: number;
  hpCurrent: number;
  hpMax: number;
  ac: number;
  initiativeMod: number;
  xpCurrent: number;
  xpToNextLevel: number;
  attackBonus: number;
  attributes: Record<
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma",
    number
  >;
  skills: Array<{
    id: string;
    label: string;
    value: number;
    attribute:
      | "strength"
      | "dexterity"
      | "constitution"
      | "intelligence"
      | "wisdom"
      | "charisma";
  }>;
  classFeatures: string[];
  weapon: {
    name: string;
    category: string;
    trait: string;
    damage: string;
  } | null;
  armor: {
    name: string;
    category: string;
    acBase: number;
  } | null;
};

function HeaderHeroVisual(props: {
  hero: {
    name: string;
    species: string;
    className: string;
    portrait: "Male" | "Female";
  };
}) {
  const { hero } = props;

  const fallbackImageSrc = getPortraitPath("Human", "Warrior", hero.portrait);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 12,
        position: "relative",
        background:
          "radial-gradient(circle at 50% 24%, rgba(255,196,118,0.14), rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.14) 100%)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -18px 22px rgba(0,0,0,0.18)",
      }}
    >
      <HeroRitualPortrait
        species={hero.species}
        className={hero.className}
        portrait={hero.portrait}
        imageSrc={fallbackImageSrc}
        fallbackImageSrc={fallbackImageSrc}
        alt={`${hero.name} portrait`}
        height="100%"
        objectPosition="center top"
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.20) 100%)",
        }}
      />
    </div>
  );
}

type Props = {
  hero: HeroView;
  demo: any;
  showProgressionBanner: boolean;
};

export default function GameplayHeaderSection({
  hero,
  demo,
  showProgressionBanner,
}: Props) {
  const heroHeaderVisual = useMemo(() => {
    return <HeaderHeroVisual hero={hero} />;
  }, [hero]);

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
        flexShrink: 0,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <HeroStatusBar
        heroName={hero.name}
        species={hero.species}
        className={hero.className}
        level={hero.level}
        hpCurrent={hero.hpCurrent}
        hpMax={hero.hpMax}
        ac={hero.ac}
        initiativeMod={hero.initiativeMod}
        heroVisual={heroHeaderVisual}
        xpCurrent={hero.xpCurrent}
        xpToNextLevel={hero.xpToNextLevel}
        attributes={hero.attributes}
        skills={hero.skills}
        classFeatures={hero.classFeatures}
        weapon={hero.weapon}
        armor={hero.armor}
        attackBonus={hero.attackBonus}
      />

      {showProgressionBanner ? <ProgressionBanner demo={demo} /> : null}
    </div>
  );
}
