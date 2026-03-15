// lib/portraits/getPortraitPath.ts
export function getPortraitPath(
  _species: string,
  _className: string,
  portrait: "Male" | "Female"
) {
  return portrait === "Female"
    ? "/assets/portraits/fallback_female.png"
    : "/assets/portraits/fallback_male.png";
}
