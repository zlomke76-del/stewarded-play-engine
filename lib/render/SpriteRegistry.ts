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
  "Neon Hounds": "/assets/v1/enemy_unknown.png"
};

export const Effects = {
  arrow: "/assets/v1/proj_arrow.png",
  bolt: "/assets/v1/proj_energy_bolt.png",
  impact: "/assets/v1/fx_explosion.png",
  groundImpact: "/assets/v1/fx_ground_impact.png",
  miss: "/assets/v1/fx_miss.png",
  portal: "/assets/v1/fx_portal_ring.png",
  target: "/assets/v1/fx_target_ring.png"
};

export function getEnemySprite(name: string) {
  return EnemySprites[name] ?? "/assets/v1/enemy_unknown.png";
}
