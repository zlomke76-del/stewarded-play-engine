export function evaluateResearchRelevance(
  researchContext: any[],
  userMessage: string
): {
  present: boolean;
  relevant: boolean;
} {
  if (!Array.isArray(researchContext) || researchContext.length === 0) {
    return { present: false, relevant: false };
  }

  const message = userMessage.toLowerCase();

  // VERY conservative keyword overlap
  const researchText = JSON.stringify(researchContext).toLowerCase();

  const overlap =
    message.split(/\W+/).filter((w) => w.length > 4 && researchText.includes(w))
      .length > 0;

  return {
    present: true,
    relevant: overlap,
  };
}
