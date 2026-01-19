"use client";

import { useEffect, useState } from "react";

type Toast = {
  id: number;
  text: string;
};

let idCounter = 1;

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handleToastEvent(e: CustomEvent<{ text: string }>) {
      const toast: Toast = {
        id: idCounter++,
        text: e.detail.text,
      };

      setToasts((t) => [...t, toast]);

      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 3000);
    }

    window.addEventListener("toast", handleToastEvent as EventListener);

    return () => {
      window.removeEventListener("toast", handleToastEvent as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 space-y-2 z-[99999]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="px-4 py-2 bg-white/10 text-white rounded-lg shadow-lg border border-white/20 backdrop-blur"
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}

