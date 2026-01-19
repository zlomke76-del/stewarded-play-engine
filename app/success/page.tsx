"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);

  // Mount-based animation (safe, deterministic)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0b0b",
        color: "#fff",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          padding: "48px 36px",
          textAlign: "center",
          maxWidth: 520,
          boxShadow: "0 0 30px rgba(0,0,0,0.25)",

          /* animation replacement */
          opacity: mounted ? 1 : 0,
          transform: mounted
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.97)",
          transition: "opacity 600ms ease, transform 600ms ease",
        }}
      >
        <img
          src="/anchor-logo.svg"
          alt="Moral Clarity Anchor Logo"
          style={{ width: 64, marginBottom: 16, opacity: 0.9 }}
        />

        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Subscription Activated
        </h1>

        <p style={{ opacity: 0.85, fontSize: 16, lineHeight: 1.6 }}>
          Thank you for joining <strong>Moral Clarity AI</strong>.
          <br />
          Your account has been successfully upgraded.
        </p>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/app"
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "#5c7cfa",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Dashboard
          </a>

          <a
            href="/subscribe"
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            View Plans
          </a>
        </div>

        <p style={{ marginTop: 32, opacity: 0.5, fontSize: 12 }}>
          “Anchored insight. Guided by principle.”
          <br />— The Moral Clarity AI Team
        </p>
      </div>
    </main>
  );
}
