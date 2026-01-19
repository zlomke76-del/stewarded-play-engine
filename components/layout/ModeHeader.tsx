"use client";

// ------------------------------------------------------------
// ModeHeader.tsx
// ------------------------------------------------------------
// Visual-only header for mode identity and role framing.
// No logic, no state.
// ------------------------------------------------------------

import React from "react";

type Role = {
  label: string;
  description?: string;
};

type Props = {
  title: string;
  roles?: Role[];
  onShare?: () => void;
};

export default function ModeHeader({
  title,
  roles = [],
  onShare,
}: Props) {
  return (
    <header className="demo-header">
      <div className="mode-title">
        <h1>{title}</h1>

        {roles.length > 0 && (
          <div className="mode-roles">
            {roles.map((role, i) => (
              <div key={i} className="mode-role">
                <strong>{role.label}</strong>
                {role.description && (
                  <span className="role-desc">
                    {role.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {onShare && (
        <button onClick={onShare} className="share-btn">
          🔗 Share
        </button>
      )}
    </header>
  );
}
