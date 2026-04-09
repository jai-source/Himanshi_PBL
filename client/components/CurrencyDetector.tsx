import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";

interface CurrencyDetectionResult {
  note: string;
  confidence: number;
  status: string;
  detections: Array<{
    label: string;
    confidence: number;
    box: [number, number, number, number];
  }>;
}

export function CurrencyDetector({ speakPending, onSpoke }: { speakPending: boolean; onSpoke: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CurrencyDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });
  const animationFrameRef = useRef<number>();
  const lastDetectionRef = useRef(0);
  const { speak } = useSpeechSynthesis({ rate: 1.2 });

  useEffect(() => {
    if (speakPending && result && result.note !== "No Matches") {
      const message = `Detected ${result.note} note with ${result.confidence}% confidence`;
      speak(message);
      onSpoke();
    }
  }, [speakPending, result, speak, onSpoke]);

  useEffect(() => {
    if (!isRunning) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setIsRunning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !videoRef.current || !canvasRef.current) return;

    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Only detect if not currently detecting and at least 500ms since last detection
        const now = Date.now();
        if (!isDetecting && now - lastDetectionRef.current > 500) {
          setIsDetecting(true);
          lastDetectionRef.current = now;

          // Get frame data and send to backend
          const imageData = canvas.toDataURL("image/jpeg", 0.8);

          try {
            setErrorMessage(null);
            const response = await fetch("/api/detect/currency", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageData }),
            });

            const text = await response.text();
            const payload = text ? JSON.parse(text) : null;

            if (!response.ok) {
              throw new Error(
                payload?.error || payload?.message || "Currency detection failed.",
              );
            }

            if (!payload) {
              throw new Error("Currency detection returned an empty response.");
            }

            const detection = payload as CurrencyDetectionResult;
            setResult(detection);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Currency detection failed.";
            console.error("Error detecting currency:", message);
            setErrorMessage(message);
          } finally {
            setIsDetecting(false);
          }
        }

        // Draw bounding boxes
        if (result?.detections) {
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 2;
          ctx.font = "16px Arial";
          ctx.fillStyle = "#00FF00";

          result.detections.forEach((detection) => {
            const [x1, y1, x2, y2] = detection.box;
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            ctx.fillText(
              `${detection.label} ${detection.confidence}%`,
              x1,
              y1 - 5
            );
          });
        }

        // FPS counter
        fpsCounterRef.current.count++;
        const fpsNow = Date.now();
        const elapsed = fpsNow - fpsCounterRef.current.lastTime;

        if (elapsed > 1000) {
          setFps(fpsCounterRef.current.count);
          fpsCounterRef.current.count = 0;
          fpsCounterRef.current.lastTime = fpsNow;
        }

        setFrameCount((prev) => prev + 1);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isDetecting, result]);

  return (
    <div className="w-full space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="hidden"
          onLoadedMetadata={() => setIsRunning(true)}
        />
        <canvas ref={canvasRef} className="w-full aspect-video bg-black rounded-lg" />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          FPS: {fps} | Detections: {result?.detections?.length || 0} | Frame: {frameCount}
        </div>
        <Button
          onClick={() => setIsRunning(!isRunning)}
          variant={isRunning ? "destructive" : "default"}
        >
          {isRunning ? "Stop Detection" : "Start Detection"}
        </Button>
      </div>

      {result && result.detections && result.detections.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Detected Currency:</h3>
          <div className="grid grid-cols-2 gap-2">
            {result.detections.map((detection, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{detection.label}:</span>{" "}
                <span className="text-green-600">{detection.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span className="font-medium">Currency detection error:</span> {errorMessage}
        </div>
      )}

      {isDetecting && (
        <div className="text-center text-gray-500 text-sm">Detecting...</div>
      )}
    </div>
  );
}
