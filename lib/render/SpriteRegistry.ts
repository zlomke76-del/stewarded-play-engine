// lib/render/SpriteRegistry.ts
// ------------------------------------------------------------
// SpriteRegistry (V1)
// ------------------------------------------------------------
// Pure mapping layer for assets in /public/assets/v1.
// Renderer reads from here; no gameplay logic.
// ------------------------------------------------------------

export const EnemySprites: Record<string, string> = {
  Archers: "/assets/v1/enemy_archers.png",
  Skirmishers: "/assets/v1/enemy_skirmishers.png",
  Brutes: "/assets/v1/enemy_brutes.png",
  Shields: "/assets/v1/enemy_shields.png",
  Stalkers: "/assets/v1/enemy_stalkers.png",
  Casters: "/assets/v1/enemy_casters.png",
  Drones: "/assets/v1/enemy_drones.png",
  Sentries: "/assets/v1/enemy_sentries.png",
  Wraiths: "/assets/v1/enemy_wraiths.png",
  "Grid Knights": "/assets/v1/enemy_grid_knights.png",
  "Firewall Wardens": "/assets/v1/enemy_firewall_warden.png",
  "Neon Hounds": "/assets/v1/enemy_unknown.png",
};

export const Projectiles = {
  arrow: "/assets/v1/proj_arrow.png",
  bolt: "/assets/v1/proj_energy_bolt.png",
};

export const Effects = {
  impact: "/assets/v1/fx_explosion.png",
  groundImpact: "/assets/v1/fx_ground_impact.png",
  miss: "/assets/v1/fx_miss.png",
  targetRing: "/assets/v1/fx_target_ring.png",
  portalRing: "/assets/v1/fx_portal_ring.png",
};

export function getEnemySprite(name: string | null | undefined) {
  const key = String(name ?? "").trim();
  return EnemySprites[key] ?? "/assets/v1/enemy_unknown.png";
}

export function guessEnemyArchetype(name: string | null | undefined): "archers" | "casters" | "melee" {
  const n = String(name ?? "").toLowerCase();
  if (n.includes("archer")) return "archers";
  if (n.includes("caster")) return "casters";
  return "melee";
}
