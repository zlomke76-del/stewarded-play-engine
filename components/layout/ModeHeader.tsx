"use client";

// ------------------------------------------------------------
// ModeHeader.tsx
// ------------------------------------------------------------
// Visual-only header for mode identity and role framing.
// No logic, no state.
// Now supports optional hiding of title/roles/share for pages that
// already provide their own hero.
//
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

  // Visibility controls (defaults preserve current behavior)
  showTitle?: boolean; // default true
  showRoles?: boolean; // default true (only applies if roles exist)
  showShare?: boolean; // default true (only applies if onShare exists)

  // Optional content slot (right side), if you ever want a custom action row later
  rightSlot?: React.ReactNode;
};

export default function ModeHeader({
  title,
  roles = [],
  onShare,
  showTitle = true,
  showRoles = true,
  showShare = true,
  rightSlot,
}: Props) {
  const shouldShowRoles = showRoles && roles.length > 0;
  const shouldShowShare = showShare && !!onShare;

  // If everything is hidden AND no rightSlot, render nothing.
  // (prevents empty space when a page wants a full-bleed hero)
  if (!showTitle && !shouldShowRoles && !shouldShowShare && !rightSlot) {
    return null;
  }

  return (
    <header className="demo-header">
      <div className="mode-title">
        {showTitle && <h1>{title}</h1>}

        {shouldShowRoles && (
          <div className="mode-roles">
            {roles.map((role, i) => (
              <div key={i} className="mode-role">
                <strong>{role.label}</strong>
                {role.description && <span className="role-desc">{role.description}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {rightSlot ? <div className="mode-right">{rightSlot}</div> : null}

      {shouldShowShare && (
        <button onClick={onShare} className="share-btn" type="button">
          🔗 Share
        </button>
      )}
    </header>
  );
}
