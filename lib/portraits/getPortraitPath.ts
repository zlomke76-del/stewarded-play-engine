export function getPortraitPath(
  species: string,
  className: string,
  portrait: "Male" | "Female"
) {
  const s = species.replace(/\s+/g, "")
  const c = className.replace(/\s+/g, "")

  return `/assets/V2/${s}_${c}_${portrait}.png`
}
