"use client";

export default function Disclaimer() {
  return (
    <div
      style={{
        marginTop: 18,
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="muted"
        style={{
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        <strong style={{ letterSpacing: 0.2 }}>System Notice</strong>
        <div style={{ height: 6 }} />
        <div>
          This software provides a system-agnostic facilitation framework for human-led tabletop role-playing sessions.
          It does not reproduce, automate, or emulate any proprietary game systems, rulesets, content, or narrative.
        </div>
      </div>
    </div>
  );
}
