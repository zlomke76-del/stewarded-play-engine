// lib/portraits/getEnemyPortraitPath.ts

export function getEnemyPortraitPath(enemyName: string) {
  const n = (enemyName ?? "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "");

  return `/assets/V2/Enemy/Enemy_${n}.png`;
}
