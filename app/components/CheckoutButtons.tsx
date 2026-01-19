"use client";

type StartProps = { priceId: string; label?: string };

export function StartCheckoutButton({ priceId, label = "Start" }: StartProps) {
  const onClick = async () => {
    try {
      // Use Webflow site as the return base if provided
      const returnBase =
        process.env.NEXT_PUBLIC_RETURN_BASE_URL || window.location.origin;

      // send people back to Webflow with a friendly banner
      const successUrl = `${returnBase}/?checkout=success`;
      const cancelUrl = `${returnBase}/?checkout=canceled`;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceId, successUrl, cancelUrl }),
      });

      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || "Checkout failed");

      window.open(json.url, "_blank"); // or window.location.href = json.url
    } catch (e: any) {
      alert(e?.message ?? "Could not start checkout.");
      console.error("[checkout]", e);
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        background: "#1f6fff",
        color: "#fff",
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export function ManageBillingButton() {
  const onClick = async () => {
    try {
      const res = await fetch("/api/stripe/checkout?mode=billing", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error(json?.error || "Missing portal URL");
      window.open(json.url, "_blank");
    } catch (e: any) {
      alert(e?.message ?? "Could not open billing portal.");
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,.08)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,.12)",
        cursor: "pointer",
      }}
    >
      Manage billing
    </button>
  );
}
