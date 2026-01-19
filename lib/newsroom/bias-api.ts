export async function fetchBiasDashboard() {
  const r = await fetch("/api/news/bias-dashboard", {
    method: "GET",
    cache: "no-store",
  });

  if (!r.ok) {
    console.error("Bias dashboard fetch error", await r.text());
    return null;
  }

  return r.json();
}
