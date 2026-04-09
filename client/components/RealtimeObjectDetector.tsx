import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";

interface Detection {
  label: string;
  confidence: number;
  box: [number, number, number, number];
}

export function RealtimeObjectDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });
  const animationFrameRef = useRef<number>();
  const { speak } = useSpeechSynthesis({ rate: 1.2 });
  const lastSpokeRef = useRef<string>("");

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

        // Get frame data and send to backend
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        try {
          const response = await fetch("/api/detect/objects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.detections && Array.isArray(result.detections)) {
              setDetections(result.detections);

              // Announce new detections
              const detectionText = result.detections
                .map(
                  (d: Detection) =>
                    `${d.label} with ${d.confidence}% confidence`
                )
                .join(", ");

              if (
                detectionText &&
                detectionText !== lastSpokeRef.current &&
                result.detections.some((d: Detection) => d.confidence > 50)
              ) {
                speak(`Detected ${detectionText}`);
                lastSpokeRef.current = detectionText;
              }
            }
          }
        } catch (err) {
          console.error("Error sending frame:", err);
        }

        // Draw bounding boxes
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.font = "16px Arial";
        ctx.fillStyle = "#FF0000";

        detections.forEach((detection) => {
          const [x1, y1, x2, y2] = detection.box;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          ctx.fillText(
            `${detection.label} ${detection.confidence}%`,
            x1,
            y1 - 5
          );
        });

        // FPS counter
        fpsCounterRef.current.count++;
        const now = Date.now();
        const elapsed = now - fpsCounterRef.current.lastTime;

        if (elapsed > 1000) {
          setFps(fpsCounterRef.current.count);
          fpsCounterRef.current.count = 0;
          fpsCounterRef.current.lastTime = now;
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
  }, [isRunning, detections, speak]);

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
        <canvas
          ref={canvasRef}
          className="w-full aspect-video bg-black rounded-lg"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-600">
          FPS: {fps} | Detections: {detections.length} | Frame: {frameCount}
        </div>
        <Button
          onClick={() => setIsRunning(!isRunning)}
          variant={isRunning ? "destructive" : "default"}
        >
          {isRunning ? "Stop Detection" : "Start Detection"}
        </Button>
      </div>

      {detections.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Detected Objects:</h3>
          <div className="grid grid-cols-2 gap-2">
            {detections.map((detection, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{detection.label}:</span>{" "}
                <span className="text-green-600">{detection.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
