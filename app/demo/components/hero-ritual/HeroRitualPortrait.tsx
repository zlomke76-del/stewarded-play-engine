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
  combatMode?: boolean;
};

function getViewerTuning(height: number | string, combatMode: boolean) {
  const numericHeight =
    typeof height === "number"
      ? height
      : typeof height === "string" && height.endsWith("px")
        ? Number.parseInt(height, 10)
        : null;

  if (combatMode) {
    if (numericHeight !== null && numericHeight >= 420) {
      return {
        cameraOrbit: "18deg 78deg 2.28m",
        fieldOfView: "23deg",
        minCameraOrbit: "18deg 74deg 2.28m",
        maxCameraOrbit: "18deg 82deg 2.28m",
        minFieldOfView: "23deg",
        maxFieldOfView: "23deg",
        posterScale: "scale(1.1)",
        stagePaddingTop: "0%",
        pedestalHeight: "22%",
        pedestalWidth: "64%",
        modelScale: "scale(1.08)",
        allowCameraControls: false,
        allowZoom: false,
        autoRotate: false,
        rotationPerSecond: "0deg",
      };
    }

    return {
      cameraOrbit: "18deg 78deg 2.14m",
      fieldOfView: "24deg",
      minCameraOrbit: "18deg 74deg 2.14m",
      maxCameraOrbit: "18deg 82deg 2.14m",
      minFieldOfView: "24deg",
      maxFieldOfView: "24deg",
      posterScale: "scale(1.08)",
      stagePaddingTop: "0%",
      pedestalHeight: "20%",
      pedestalWidth: "62%",
      modelScale: "scale(1.04)",
      allowCameraControls: false,
      allowZoom: false,
      autoRotate: false,
      rotationPerSecond: "0deg",
    };
  }

  if (numericHeight !== null && numericHeight >= 380) {
    return {
      cameraOrbit: "0deg 78deg 2.46m",
      fieldOfView: "24deg",
      minCameraOrbit: "auto 62deg 2.18m",
      maxCameraOrbit: "auto 92deg 2.82m",
      minFieldOfView: "18deg",
      maxFieldOfView: "30deg",
      posterScale: "scale(1.03)",
      stagePaddingTop: "1%",
      pedestalHeight: "20%",
      pedestalWidth: "60%",
      modelScale: "scale(0.89)",
      allowCameraControls: true,
      allowZoom: false,
      autoRotate: true,
      rotationPerSecond: "8deg",
    };
  }

  return {
    cameraOrbit: "0deg 78deg 2.22m",
    fieldOfView: "25deg",
    minCameraOrbit: "auto 62deg 1.98m",
    maxCameraOrbit: "auto 92deg 2.58m",
    minFieldOfView: "19deg",
    maxFieldOfView: "31deg",
    posterScale: "scale(1.0)",
    stagePaddingTop: "2%",
    pedestalHeight: "18%",
    pedestalWidth: "58%",
    modelScale: "scale(0.93)",
    allowCameraControls: true,
    allowZoom: false,
    autoRotate: true,
    rotationPerSecond: "8deg",
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
  combatMode = false,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);

  const glbPath = useMemo(
    () => getGlbPathForPortrait(species, className, portrait),
    [species, className, portrait]
  );

  const tuning = useMemo(() => getViewerTuning(height, combatMode), [height, combatMode]);

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
          background: combatMode
            ? "radial-gradient(circle at 50% 24%, rgba(255,223,170,0.12), rgba(255,223,170,0.03) 22%, rgba(0,0,0,0) 42%), radial-gradient(circle at 50% 74%, rgba(120,86,48,0.20), rgba(0,0,0,0) 45%), linear-gradient(180deg, rgba(18,16,18,0.98) 0%, rgba(12,10,12,0.98) 58%, rgba(8,8,10,1) 100%)"
            : "radial-gradient(circle at 50% 26%, rgba(255,223,170,0.10), rgba(255,223,170,0.02) 22%, rgba(0,0,0,0) 42%), radial-gradient(circle at 50% 70%, rgba(120,86,48,0.18), rgba(0,0,0,0) 45%), linear-gradient(180deg, rgba(22,18,16,0.96) 0%, rgba(14,11,10,0.98) 58%, rgba(10,8,8,1) 100%)",
        }}
      >
        <ModelViewerBootstrap />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: combatMode
              ? "radial-gradient(circle at 50% 84%, rgba(255,183,92,0.14), rgba(255,183,92,0.05) 18%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 18%, rgba(255,235,205,0.08), rgba(255,235,205,0) 28%)"
              : "radial-gradient(circle at 50% 84%, rgba(255,183,92,0.12), rgba(255,183,92,0.04) 18%, rgba(0,0,0,0) 40%), radial-gradient(circle at 50% 18%, rgba(255,235,205,0.08), rgba(255,235,205,0) 28%)",
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
            background: combatMode
              ? "radial-gradient(circle, rgba(255,195,110,0.22) 0%, rgba(160,104,48,0.18) 32%, rgba(28,18,12,0.12) 58%, rgba(0,0,0,0) 76%)"
              : "radial-gradient(circle, rgba(255,195,110,0.18) 0%, rgba(160,104,48,0.16) 32%, rgba(28,18,12,0.10) 58%, rgba(0,0,0,0) 76%)",
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: combatMode
              ? "inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 -80px 90px rgba(0,0,0,0.26), inset 0 36px 60px rgba(255,240,220,0.03)"
              : "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 -90px 100px rgba(0,0,0,0.34), inset 0 40px 70px rgba(255,240,220,0.03)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            paddingTop: tuning.stagePaddingTop,
            transform: tuning.modelScale,
            transformOrigin: combatMode ? "center bottom" : "center center",
          }}
        >
          {React.createElement("model-viewer" as any, {
            src: glbPath,
            alt,
            "camera-controls": tuning.allowCameraControls,
            "touch-action": "pan-y",
            "interaction-prompt": "none",
            "shadow-intensity": "1.15",
            exposure: combatMode ? "1.12" : "1.08",
            "environment-image": "neutral",
            "camera-orbit": tuning.cameraOrbit,
            "field-of-view": tuning.fieldOfView,
            "min-camera-orbit": tuning.minCameraOrbit,
            "max-camera-orbit": tuning.maxCameraOrbit,
            "min-field-of-view": tuning.minFieldOfView,
            "max-field-of-view": tuning.maxFieldOfView,
            "disable-pan": true,
            "disable-zoom": !tuning.allowZoom,
            "auto-rotate": tuning.autoRotate,
            "auto-rotate-delay": 0,
            "rotation-per-second": tuning.rotationPerSecond,
            style: {
              width: "100%",
              height: "100%",
              display: "block",
              background: "transparent",
              pointerEvents: combatMode ? "none" : "auto",
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
          objectPosition: combatMode ? "center 16%" : objectPosition,
          display: "block",
          transform: combatMode ? "scale(1.08)" : "scale(1)",
          transformOrigin: "center center",
        }}
        onError={(e) => {
          const img = e.currentTarget;
          if (!fallbackImageSrc) return;
          if (img.src.endsWith(fallbackImageSrc)) return;

          setImageFailed(true);
          img.onerror = null;
          img.src = fallbackImageSrc;
          img.style.objectPosition = combatMode ? "center 16%" : objectPosition;
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: combatMode
            ? "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.10) 44%, rgba(0,0,0,0.18) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 48%, rgba(0,0,0,0.24) 100%)",
        }}
      />
    </div>
  );
}
