import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceRecognition } from "@/hooks/use-voice-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { RealtimeObjectDetector } from "./RealtimeObjectDetector";
import { CurrencyDetector } from "./CurrencyDetector";
import { Mic, MicOff, AlertCircle } from "lucide-react";

type DetectionMode = "idle" | "objects" | "currency";

export function VoiceController() {
  const [mode, setMode] = useState<DetectionMode>("idle");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [speakCurrency, setSpeakCurrency] = useState(false);

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: isVoiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: "en-US",
    continuous: true,
    interimResults: true,
  });

  const { speak, isSupported: isSpeechSupported, error: speechError } = useSpeechSynthesis();

  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim();

    // Check for "open detectify" command
    if (
      lowerText.includes("open detectify") ||
      lowerText.includes("start detectify") ||
      lowerText.includes("open detection")
    ) {
      setMode("objects");
      speak("Opening real-time object detection");
      return true;
    }

    // Check for "currency" command
    if (
      lowerText.includes("see the currency") ||
      lowerText.includes("detect currency") ||
      lowerText.includes("detect money") ||
      lowerText.includes("check currency") ||
      lowerText.includes("currency detection")
    ) {
      setMode("currency");
      setSpeakCurrency(true);
      speak("Opening currency detection mode");
      return true;
    }

    // Check for "stop" command
    if (lowerText.includes("stop") || lowerText.includes("close")) {
      setMode("idle");
      speak("Stopping detection");
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (transcript && transcript.trim()) {
      const fullText = transcript + " " + interimTranscript;
      const isCommand = processCommand(fullText);

      if (isCommand) {
        resetTranscript();
        setCommandHistory((prev) => [fullText, ...prev.slice(0, 9)]);
      }
    }
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Voice Control Panel */}
      <div className="bg-gradient-to-r from-forest to-forest/80 text-white p-6 rounded-lg space-y-4">
        <h2 className="text-2xl font-bold">Voice-Controlled Detection System</h2>

        {/* Error Messages */}
        {voiceError && (
          <div className="bg-red-500/20 border border-red-300 p-3 rounded flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">{voiceError}</div>
          </div>
        )}

        {speechError && (
          <div className="bg-red-500/20 border border-red-300 p-3 rounded flex gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">{speechError}</div>
          </div>
        )}

        {!isVoiceSupported && (
          <div className="bg-yellow-500/20 border border-yellow-300 p-3 rounded">
            Voice recognition is not supported in your browser. Please use Chrome, Edge, or Firefox.
          </div>
        )}

        {/* Voice Input Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "secondary"}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Listening
                </>
              )}
            </Button>
            <span className="text-sm">
              Status: {isListening ? "🔴 Listening..." : "⚫ Not listening"}
            </span>
          </div>

          {/* Current Transcript */}
          {(transcript || interimTranscript) && (
            <div className="bg-white/10 p-3 rounded">
              <div className="text-sm font-semibold">Current Command:</div>
              <div className="mt-1">
                <span>{transcript}</span>
                <span className="text-white/60 italic">{interimTranscript}</span>
              </div>
            </div>
          )}

          {/* Mode Status */}
          <div className="bg-white/10 p-3 rounded">
            <div className="text-sm font-semibold">Current Mode:</div>
            <div className="mt-1 text-lg">
              {mode === "idle" && "⚫ Idle"}
              {mode === "objects" && "🟢 Object Detection Active"}
              {mode === "currency" && "🟡 Currency Detection Active"}
            </div>
          </div>

          {/* Voice Commands Help */}
          <div className="text-sm space-y-1">
            <div className="font-semibold">Available Commands:</div>
            <ul className="list-disc list-inside space-y-1 text-white/90">
            <li>"Open Detectify" - Start real-time object detection with bounding boxes</li>
            <li>"Detectify see the currency" - Start live currency detection with bounding boxes</li>
            <li>"Detect money" - Start live currency detection and speak the amount</li>
              <li>"Stop" - Stop the current detection mode</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Detection Views */}
      {mode === "objects" && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Real-Time Object Detection</h3>
          <RealtimeObjectDetector />
        </div>
      )}

      {mode === "currency" && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Currency Detection</h3>
          <CurrencyDetector speakPending={speakCurrency} onSpoke={() => setSpeakCurrency(false)} />
        </div>
      )}

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Recent Commands</h3>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDebug ? "Hide" : "Show"}
            </button>
          </div>
          {showDebug && (
            <ul className="space-y-1 text-sm">
              {commandHistory.map((cmd, idx) => (
                <li key={idx} className="text-gray-600">
                  • {cmd}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
