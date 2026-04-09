import { useCallback, useRef, useState } from "react";

interface SpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechSynthesis(options: SpeechSynthesisOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(typeof window !== "undefined" && "speechSynthesis" in window);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { rate = 1, pitch = 1, volume = 1 } = options;

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        setError("Speech Synthesis not supported in this browser");
        return;
      }

      // Cancel any existing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        setError(event.error);
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, volume]
  );

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.resume();
    }
  }, [isSpeaking]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    error,
  };
}
