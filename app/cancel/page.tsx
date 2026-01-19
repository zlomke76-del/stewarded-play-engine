"use client";
import { motion } from "framer-motion";

export default function CancelPage() {
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
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          padding: "48px 36px",
          textAlign: "center",
          maxWidth: 520,
          boxShadow: "0 0 30px rgba(0,0,0,0.25)",
        }}
      >
        <img
          src="/anchor-logo.svg"
          alt="Moral Clarity Anchor Logo"
          style={{ width: 64, marginBottom: 16, opacity: 0.9 }}
        />

        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Checkout Cancelled</h1>

        <p style={{ opacity: 0.85, fontSize: 16, lineHeight: 1.6 }}>
          No worries — your card was not charged.
        </p>
      </motion.div>
    </main>
  );
}
