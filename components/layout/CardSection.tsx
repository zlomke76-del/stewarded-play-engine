"use client";

// ------------------------------------------------------------
// CardSection.tsx
// ------------------------------------------------------------
// Pure visual wrapper for content blocks.
// No logic, no state, no assumptions.
// ------------------------------------------------------------

import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export default function CardSection({
  title,
  children,
  className = "",
}: Props) {
  return (
    <section className={`card fade-in ${className}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
