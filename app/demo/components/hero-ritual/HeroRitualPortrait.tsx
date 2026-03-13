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

function getViewerTuning(height: number | string) {
  const numericHeight =
    typeof height === "number"
      ? height
      : typeof height === "string" && height.endsWith("px")
        ? Number.parseInt(height, 10)
        : null;

  if (numericHeight !== null && numericHeight >= 380) {
    return {
      cameraOrbit: "0deg 78deg 1.92m",
      fieldOfView: "24deg",
      minCameraOrbit: "auto 62deg 1.7m",
      maxCameraOrbit: "auto 92deg 2.3m",
      minFieldOfView: "18deg",
      maxFieldOfView: "30deg",
      posterScale: "scale(1.1)",
      stagePaddingTop: "1%",
      pedestalHeight: "20%",
      pedestalWidth: "60%",
      modelScale: "scale(1.0)",
    };
  }

  return {
    cameraOrbit: "0deg 78deg 2.02m",
    fieldOfView: "25deg",
    minCameraOrbit: "auto 62deg 1.8m",
    maxCameraOrbit: "auto 92deg 2.4m",
    minFieldOfView: "19deg",
    maxFieldOfView: "31deg",
    posterScale: "scale(1.04)",
    stagePaddingTop: "2%",
    pedestalHeight: "18%",
    pedestalWidth: "58%",
    modelScale: "scale(0.98)",
  };
}

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

  const tuning = useMemo(() => getViewerTuning(height), [height]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

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

  const shouldRenderModel = Boolean(glbPath && modelViewerReady && !imageFailed);

  if (shouldRenderModel && glbPath) {
    return (
      <div
        style={{
          width: "100%",
          height,
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 50% 26%, rgba(255,223,170,0.10), rgba(255,223,170,0.02) 22%, rgba(0,0,0,0) 42%), radial-gradient(circle at 50% 70%, rgba(120,86,48,0.18), rgba(0,0,0,0) 45%), linear-gradient(180deg, rgba(22,18,16,0.96) 0%, rgba(14,11,10,0.98) 58%, rgba(10,8,8,1) 100%)",
        }}
      >
        <ModelViewerBootstrap />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 84%, rgba(255,183,92,0.12), rgba(255,183,92,0.04) 18%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 18%, rgba(255,235,205,0.08), rgba(255,235,205,0) 28%)",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-2%",
            transform: "translateX(-50%)",
            width: tuning.pedestalWidth,
            height: tuning.pedestalHeight,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,195,110,0.18) 0%, rgba(160,104,48,0.16) 32%, rgba(28,18,12,0.10) 58%, rgba(0,0,0,0) 76%)",
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -90px 100px rgba(0,0,0,0.34), inset 0 40px 70px rgba(255,240,220,0.03)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            paddingTop: tuning.stagePaddingTop,
            transform: tuning.modelScale,
            transformOrigin: "center center",
          }}
        >
          {React.createElement("model-viewer" as any, {
            src: glbPath,
            alt,
            "camera-controls": true,
            "touch-action": "pan-y",
            "interaction-prompt": "none",
            "shadow-intensity": "1.15",
            exposure: "1.08",
            "environment-image": "neutral",
            "camera-orbit": tuning.cameraOrbit,
            "field-of-view": tuning.fieldOfView,
            "min-camera-orbit": tuning.minCameraOrbit,
            "max-camera-orbit": tuning.maxCameraOrbit,
            "min-field-of-view": tuning.minFieldOfView,
            "max-field-of-view": tuning.maxFieldOfView,
            "disable-pan": true,
            "disable-zoom": false,
            "auto-rotate": true,
            "auto-rotate-delay": 0,
            "rotation-per-second": "8deg",
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
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
        overflow: "hidden",
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

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 48%, rgba(0,0,0,0.24) 100%)",
        }}
      />
    </div>
  );
}
