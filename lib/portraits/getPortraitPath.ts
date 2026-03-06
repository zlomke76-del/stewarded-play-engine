// lib/portraits/getPortraitPath.ts
export function getPortraitPath(
  species: string,
  className: string,
  portrait: "Male" | "Female"
) {
  const s = (species ?? "").trim().replace(/\s+/g, "");
  const c = (className ?? "").trim().replace(/\s+/g, "");

  const isHuman = !s || s.toLowerCase() === "human";

  if (isHuman) {
    return `/assets/V2/${c}_${portrait}.png`;
  }

  return `/assets/V2/${s}_${c}_${portrait}.png`;
}
