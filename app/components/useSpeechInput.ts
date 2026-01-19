"use client";

import { useRef, useState } from "react";

type UseSpeechInputArgs = {
  onText: (text: string) => void;
  onError?: (msg: string) => void;
};

export function useSpeechInput({
  onText,
  onError,
}: UseSpeechInputArgs) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  function toggleMic() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      onError?.("🎤 Microphone not supported in this browser.");
      return;
    }

    // Stop listening
    if (listening) {
      try {
        recogRef.current?.stop();
      } catch {}
      setListening(false);
      return;
    }

    // Start listening
    const sr = new SR();
    sr.lang = "en-US";

    sr.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      onText(text);
    };

    sr.onend = () => {
      setListening(false);
    };

    recogRef.current = sr;
    sr.start();
    setListening(true);
  }

  return {
    listening,
    toggleMic,
  };
}
