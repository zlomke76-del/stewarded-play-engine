"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getGlbPathForPortrait } from "./helpers";
import type { PortraitType } from "./types";
import ModelViewerBootstrap from "./ModelViewerBootstrap";

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
  const [modelViewerReady, setModelViewerReady] = useState(false);

  const glbPath = useMemo(
    () => getGlbPathForPortrait(species, className, portrait),
    [species, className, portrait]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    function checkReady() {
      if (cancelled) return;

      const ready = Boolean(window.customElements?.get("model-viewer"));
      if (ready) {
        setModelViewerReady(true);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(checkReady, 150);
      }
    }

    checkReady();

    return () => {
      cancelled = true;
    };
  }, []);

  const shouldRenderModel = Boolean(
    glbPath && modelViewerReady && !imageFailed
  );

  if (shouldRenderModel && glbPath) {
    return (
      <div
        style={{
          width: "100%",
          height,
          position: "relative",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.05), rgba(0,0,0,0.02))",
        }}
      >
        <ModelViewerBootstrap />

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
          autoplay: true,
          style: {
            width: "100%",
            height: "100%",
            display: "block",
            background: "transparent",
          },
          onError: () => {
            setImageFailed(true);
          },
        })}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
      }}
    >
      <ModelViewerBootstrap />

      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
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
    </div>
  );
}
