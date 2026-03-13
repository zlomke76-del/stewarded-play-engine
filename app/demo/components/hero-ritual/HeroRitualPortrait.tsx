"use client";

import React, { useMemo, useState } from "react";
import { getGlbPathForPortrait } from "./helpers";
import type { PortraitType } from "./types";

type Props = {
  species: string;
  className: string;
  portrait: PortraitType;
  imageSrc: string;
  fallbackImageSrc?: string;
  alt: string;
  height: number | string;
  objectPosition: string;
};

export default function HeroRitualPortrait({
  species,
  className,
  portrait,
  imageSrc,
  fallbackImageSrc,
  alt,
  height,
  objectPosition,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  const glbPath = useMemo(
    () => getGlbPathForPortrait(species, className, portrait),
    [species, className, portrait]
  );

  const canUseModelViewer = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.customElements?.get("model-viewer"));
  }, []);

  const shouldRenderModel = Boolean(glbPath && canUseModelViewer && !imageFailed);

  if (shouldRenderModel && glbPath) {
    return (
      <div
        style={{
          width: "100%",
          height,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.04), rgba(0,0,0,0.02))",
        }}
      >
        {React.createElement("model-viewer" as any, {
          src: glbPath,
          alt,
          "camera-controls": true,
          "touch-action": "pan-y",
          "interaction-prompt": "none",
          "shadow-intensity": "1",
          exposure: "1",
          "environment-image": "neutral",
          "camera-orbit": "0deg 82deg 2.2m",
          "field-of-view": "28deg",
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
          },
        })}
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      style={{
        width: "100%",
        height,
        objectFit: "cover",
        objectPosition,
        display: "block",
      }}
      onError={(e) => {
        const img = e.currentTarget;
        if (!fallbackImageSrc) return;
        if (img.src.endsWith(fallbackImageSrc)) return;

        setImageFailed(true);
        img.onerror = null;
        img.src = fallbackImageSrc;
        img.style.objectPosition = objectPosition;
      }}
    />
  );
}
