import {
  BadgeIndianRupee,
  Camera,
  ClipboardList,
  ImagePlus,
  LoaderCircle,
  MapPinned,
  Pill,
  Radio,
  ScanSearch,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LocationMap from "@/components/LocationMap";
import { useAuth } from "@/lib/auth";
import type { CurrencyDetectionResponse, ObjectDetectionResponse, Detection } from "@shared/api";
import { useUpdateLocation, useSetHomeLocation, useGeofenceStatus, useAutoLocationTracking, useUserLiveLocation } from "@/hooks/use-location";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    speechRecognition: any;
  }
}

const utilityCards = [
  {
    title: "Currency Detection",
    description: "Identify notes quickly with guided spoken confirmation.",
    icon: BadgeIndianRupee,
    tone: "bg-white/75",
  },
  {
    title: "Medicine Detection",
    description: "Recognize packaging and labels before taking action.",
    icon: Pill,
    tone: "bg-[#F7E8BD]/70",
  },
  {
    title: "History",
    description: "Review your recent detections and jump back into them.",
    icon: ClipboardList,
    tone: "bg-white/75",
  },
  {
    title: "Map",
    description: "Check nearby help points and accessible destinations.",
    icon: MapPinned,
    tone: "bg-[#F7E8BD]/70",
  },
];

const initialDetection: CurrencyDetectionResponse = {
  note: "Waiting for scan",
  confidence: 0,
  status: "Upload a currency image to run the connected ML detector.",
  matchedTemplate: null,
  goodMatches: 0,
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, logout, user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detectionResult, setDetectionResult] =
    useState<CurrencyDetectionResponse>(initialDetection);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [currencyDetections, setCurrencyDetections] = useState<Detection[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Location hooks
  const { updateLocation } = useUpdateLocation();
  const { setHomeLocation } = useSetHomeLocation();
  const { isInsideGeofence, homeLocation } = useGeofenceStatus(user?.id);
  const { liveLocation } = useUserLiveLocation(user?.id); // Get live updates every 2 seconds
  useAutoLocationTracking(user?.id, user?.familyCode); // Auto-track location every 10 seconds
  const currentLocation = liveLocation?.currentLocation;
  const [isSettingHome, setIsSettingHome] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // Register user in the system when they load the dashboard
  useEffect(() => {
    if (user?.id && user?.email && user?.shareCode && user?.role === "user") {
      fetch("/api/location/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          shareCode: user.shareCode,
          familyCode: user.familyCode,
        }),
      });
    }
  }, [user?.id, user?.email, user?.shareCode]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
      setLiveDetections([]);
    }

    return () => stopCamera();
  }, [isCameraActive]);

  useEffect(() => {
    if (previewUrl && currencyDetections.length) {
      drawDetections(currencyDetections);
    }
  }, [previewUrl, currencyDetections]);

  useEffect(() => {
    if (isListening) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }

    return () => stopSpeechRecognition();
  }, [isListening]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCameraActive && videoRef.current) {
      interval = setInterval(detectObjects, 1000); // Detect every second
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCameraActive]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      setErrorMessage("Unable to access camera.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function startSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('detect money') || transcript.includes('object detection')) {
        handleDetectCurrency();
      }
    };

    recognition.onerror = () => {
      setErrorMessage("Speech recognition error.");
    };

    recognition.start();
    window.speechRecognition = recognition;
  }

  function stopSpeechRecognition() {
    if (window.speechRecognition) {
      window.speechRecognition.stop();
      window.speechRecognition = null;
    }
  }

  async function handleSetHomeLocation() {
    setIsSettingHome(true);
    setErrorMessage("");
    
    try {
      // Try using geolocation
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            { timeout: 5000, enableHighAccuracy: false }
          );
        });

        if (user?.id) {
          await setHomeLocation(user.id, position.latitude, position.longitude);
          setErrorMessage("");
          console.log("[UserDashboard] Home location set successfully via GPS");
        }
      } else {
        throw new Error("Geolocation not supported");
      }
    } catch (error) {
      console.log("[UserDashboard] Geolocation failed, showing manual input");
      setShowManualLocation(true);
    } finally {
      setIsSettingHome(false);
    }
  }

  async function handleSetManualLocation() {
    if (!manualLat || !manualLng) {
      setErrorMessage("Please enter both latitude and longitude");
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setErrorMessage("Invalid coordinates. Please enter valid numbers.");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErrorMessage("Invalid coordinates range. Latitude: -90 to 90, Longitude: -180 to 180");
      return;
    }

    try {
      if (user?.id) {
        await setHomeLocation(user.id, lat, lng);
        setErrorMessage("");
        setManualLat("");
        setManualLng("");
        setShowManualLocation(false);
        console.log("[UserDashboard] Home location set successfully via manual input");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to set home location";
      setErrorMessage(errorMsg);
      console.error("[UserDashboard] Error setting location:", error);
    }
  }

  async function handleSetDefaultLocation() {
    // Default location (New York)
    const defaultLat = 40.7128;
    const defaultLng = -74.006;

    try {
      if (user?.id) {
        await setHomeLocation(user.id, defaultLat, defaultLng);
        setErrorMessage("");
        setShowManualLocation(false);
        setManualLat("");
        setManualLng("");
        console.log("[UserDashboard] Home location set to default (New York)");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to set home location";
      setErrorMessage(errorMsg);
    }
  }

  function speakResult(result: CurrencyDetectionResponse) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      if (result.note === "No Matches") {
        utterance.text = "No currency detected.";
      } else {
        utterance.text = `Detected ${result.note} rupees with ${result.confidence} percent confidence.`;
      }
      window.speechSynthesis.speak(utterance);
    }
  }

  async function detectObjects() {
    if (!videoRef.current || !isCameraActive) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    try {
      const response = await fetch("/api/detect/objects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData }),
      });

      if (response.ok) {
        const result: ObjectDetectionResponse = await response.json();
        setLiveDetections(result.detections);
        drawDetections(result.detections);
      }
    } catch (error) {
      console.error("Live detection failed:", error);
    }
  }

  function drawDetections(detections: Detection[]) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const previewImage = previewImageRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sourceWidth = video?.videoWidth || previewImage?.naturalWidth || 0;
    const sourceHeight = video?.videoHeight || previewImage?.naturalHeight || 0;
    const displayWidth = video?.clientWidth || previewImage?.clientWidth || 0;
    const displayHeight = video?.clientHeight || previewImage?.clientHeight || 0;
    if (!sourceWidth || !sourceHeight || !displayWidth || !displayHeight) return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const scaleX = displayWidth / sourceWidth;
    const scaleY = displayHeight / sourceHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(detection => {
      const [x1, y1, x2, y2] = detection.box;
      const strokeColor = '#1f7a1f';
      const dx1 = x1 * scaleX;
      const dy1 = y1 * scaleY;
      const dx2 = x2 * scaleX;
      const dy2 = y2 * scaleY;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(dx1, dy1, dx2 - dx1, dy2 - dy1);

      ctx.fillStyle = strokeColor;
      ctx.font = '16px Arial';
      ctx.fillText(`${detection.label} ${detection.confidence}%`, dx1, dy1 - 6);
    });
  }

  async function handleDetectCurrency() {
    let imageData: string;

    if (isCameraActive && videoRef.current) {
      // Capture from camera
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setErrorMessage("Unable to capture image.");
        return;
      }
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      imageData = canvas.toDataURL('image/jpeg');
    } else if (selectedFile) {
      // Use uploaded file
      imageData = await fileToDataUrl(selectedFile);
    } else {
      setErrorMessage("Choose an image or enable camera before running currency detection.");
      return;
    }

    setIsDetecting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/detect/currency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageData }),
      });

      const text = await response.text();
      let payload: unknown = null;
      let parseError: Error | null = null;

      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (err) {
          parseError = err instanceof Error ? err : new Error(String(err));
        }
      }

      if (!response.ok) {
        const message =
          (payload as any)?.error ||
          (payload as any)?.message ||
          text ||
          `HTTP ${response.status}`;
        throw new Error(message);
      }

      if (!payload) {
        throw new Error(
          text ||
            "Currency detection returned an empty response. Check backend logs.",
        );
      }

      const result = payload as CurrencyDetectionResponse;
      setDetectionResult(result);
      setCurrencyDetections(result.detections ?? []);
      drawDetections(result.detections ?? []);
      speakResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);
      setErrorMessage(message);
    } finally {
      setIsDetecting(false);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage("");

    if (file) {
      setDetectionResult(initialDetection);
      setCurrencyDetections([]);
      setIsCameraActive(false); // Switch to file mode
    }
  }

  const detectionHighlights = [
    {
      label: "Detected note",
      value:
        detectionResult.note === "Waiting for scan"
          ? detectionResult.note
          : detectionResult.note === "No Matches"
            ? "No confident match"
            : `Rs. ${detectionResult.note}`,
    },
    { label: "Confidence", value: `${detectionResult.confidence}%` },
    { label: "Status", value: detectionResult.status },
  ];

  const activityFeed = [
    selectedFile
      ? `Selected image: ${selectedFile.name}`
      : "Choose a note image from your device to begin.",
    detectionResult.matchedTemplate
      ? `Model used: ${detectionResult.matchedTemplate}`
      : "The Object Detection button calls the external currencyd model on your desktop.",
    detectionResult.goodMatches > 0
      ? `Detections found: ${detectionResult.goodMatches}`
      : "A result appears once the external model finds a currency note.",
    isCameraActive
      ? `Live detection active: ${liveDetections.length} objects detected`
      : "Enable camera for live object detection.",
  ];

  if (isReady && !user) {
    return <Navigate to="/user" replace state={{ from: location }} />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen detectify-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 md:px-16 md:py-16">
        <div className="mx-auto max-w-6xl space-y-8">
          <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-white">
                  <span className="font-outfit text-sm font-medium uppercase tracking-[0.3em]">
                    Dashboard
                  </span>
                </div>
                <h1 className="mt-5 font-outfit text-4xl font-bold text-black sm:text-5xl md:text-6xl">
                  Welcome, {user.fullName}
                </h1>
                <p className="mt-4 max-w-2xl font-outfit text-lg text-black/75 sm:text-xl">
                  Use the camera preview to inspect objects, run a detection,
                  and review the latest result in one focused workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-full border border-forest px-6 py-3 font-outfit text-base font-medium tracking-[0.12em] text-forest transition-colors hover:bg-forest/10"
                >
                  GO HOME
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/user", { replace: true });
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 font-outfit text-base font-medium tracking-[0.12em] text-white transition-colors hover:bg-forest/90"
                >
                  LOG OUT
                </button>
              </div>
            </div>
          </section>

          {/* Share Code Section */}
          <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-outfit text-2xl font-bold text-black sm:text-3xl">
                  Share Code
                </h2>
                <p className="mt-2 font-outfit text-base text-black/70">
                  Give this code to helpers so they can track your location
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-forest px-6 py-3 text-center">
                  <p className="font-inter text-xs text-white/70 uppercase tracking-widest">
                    Your Code
                  </p>
                  <p className="font-outfit text-2xl font-bold text-white tracking-widest">
                    {user?.shareCode || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (user?.shareCode) {
                      navigator.clipboard.writeText(user.shareCode);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-full border-2 border-forest px-4 py-3 font-outfit font-semibold text-forest transition-colors hover:bg-forest/10"
                  title="Copy to clipboard"
                >
                  📋
                </button>
              </div>
            </div>
          </section>
          <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-outfit text-2xl font-bold text-black sm:text-3xl">
                  Safe Zone Status
                </h2>
                <p className="mt-2 font-outfit text-base text-black/70">
                  Monitor your location relative to your home zone
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className={`flex items-center gap-3 rounded-full px-4 py-3 ${
                  isInsideGeofence
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {isInsideGeofence ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-outfit font-semibold">Inside Safe Zone ✅</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-outfit font-semibold">Outside Safe Zone 🚨</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleSetHomeLocation}
                  disabled={isSettingHome}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-6 py-3 font-outfit text-base font-semibold text-white transition-colors hover:bg-forest/90 disabled:opacity-50"
                >
                  <MapPinned className="h-4 w-4" />
                  {isSettingHome ? "Setting..." : "Set Current as Home"}
                </button>
              </div>

              {/* Manual Location Input */}
              {showManualLocation && (
                <div className="mt-6 space-y-4 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
                  <div>
                    <p className="font-semibold text-gray-700 mb-3">GPS unavailable. Set location manually:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="e.g., 40.7128"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="e.g., -74.006"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetManualLocation}
                      className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Save Location
                    </button>
                    <button
                      onClick={handleSetDefaultLocation}
                      className="flex-1 rounded bg-gray-400 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                    >
                      Use Default (NY)
                    </button>
                    <button
                      onClick={() => {
                        setShowManualLocation(false);
                        setManualLat("");
                        setManualLng("");
                      }}
                      className="flex-1 rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Location Map Section */}
          <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
            <LocationMap
              homeLocation={homeLocation}
              currentLocation={currentLocation}
              isInsideGeofence={isInsideGeofence}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-white/30 bg-white/35 p-5 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-7">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-outfit text-3xl font-semibold text-black sm:text-4xl">
                        Camera Preview
                      </h2>
                      <p className="mt-2 font-inter text-sm leading-6 text-black/70 sm:text-base">
                        {isCameraActive 
                          ? "Live object detection is active. Green boxes show humans, red boxes show other objects. Click 'Object Detection' or say 'detect money' for currency detection."
                          : "Upload a currency note image, run the connected model, and review the result here."
                        }
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/80 px-4 py-2 text-forest">
                      <Camera className="h-4 w-4" />
                      <span className="font-outfit text-sm font-medium uppercase tracking-[0.18em]">
                        {isCameraActive ? "Camera Active" : "Camera Ready"}
                      </span>
                    </div>
                  </div>

                  <div className="relative rounded-[2rem] border-4 border-forest bg-[linear-gradient(145deg,rgba(87,112,79,0.14),rgba(247,232,189,0.7))] p-4 sm:p-5">
                    <div className="rounded-[1.5rem] border border-forest/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(87,112,79,0.2))] p-4 sm:p-6">
                      <div className="flex min-h-[32rem] flex-col rounded-[1.25rem] border border-dashed border-forest/35 bg-black/10 p-4 sm:min-h-[36rem] sm:p-5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-black/55 px-3 py-1 font-inter text-xs uppercase tracking-[0.2em] text-white">
                            {isCameraActive ? "Live Camera Feed" : "Uploaded Image"}
                          </span>
                          <span className="rounded-full bg-forest px-3 py-1 font-inter text-xs uppercase tracking-[0.2em] text-white">
                            Model Connected
                          </span>
                        </div>

                        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
                          <div className="relative flex h-44 w-full max-w-[26rem] items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-white/70 bg-white/20 sm:h-56">
                            <div className="absolute inset-4 rounded-[1.2rem] border-2 border-dashed border-forest/45" />
                            {isCameraActive ? (
                              <>
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="h-full w-full object-cover"
                                />
                                <canvas
                                  ref={canvasRef}
                                  className="absolute inset-0 h-full w-full pointer-events-none"
                                />
                              </>
                            ) : previewUrl ? (
                              <>
                                <img
                                  ref={previewImageRef}
                                  src={previewUrl}
                                  alt="Selected currency note preview"
                                  className="h-full w-full object-cover"
                                  onLoad={() => {
                                    if (currencyDetections.length) {
                                      drawDetections(currencyDetections);
                                    }
                                  }}
                                />
                                <canvas
                                  ref={canvasRef}
                                  className="absolute inset-0 h-full w-full pointer-events-none"
                                />
                              </>
                            ) : (
                              <div className="rounded-full bg-white/85 p-5 text-forest shadow-lg">
                                <ImagePlus className="h-10 w-10 sm:h-12 sm:w-12" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 grid gap-3 sm:mt-4 sm:grid-cols-2">
                          <label className="inline-flex min-h-[4.75rem] cursor-pointer items-center justify-center gap-3 rounded-full border-4 border-forest bg-white/70 px-6 py-4 text-center font-outfit text-lg font-semibold tracking-[0.16em] text-forest transition-colors hover:bg-forest/10">
                            <ImagePlus className="h-5 w-5" />
                            CHOOSE IMAGE
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
                              className="hidden"
                              onChange={handleFileSelection}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectCurrency}
                            disabled={isDetecting}
                            className="inline-flex min-h-[4.75rem] items-center justify-center gap-3 rounded-full bg-forest px-6 py-4 text-center font-outfit text-lg font-semibold tracking-[0.16em] text-white transition-colors hover:bg-forest/90 disabled:cursor-not-allowed disabled:bg-forest/60"
                          >
                            {isDetecting ? (
                              <LoaderCircle className="h-5 w-5 animate-spin" />
                            ) : (
                              <ScanSearch className="h-5 w-5" />
                            )}
                            {isDetecting ? "DETECTING..." : "OBJECT DETECTION"}
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setIsCameraActive(!isCameraActive)}
                            className={`inline-flex min-h-[3.75rem] items-center justify-center gap-3 rounded-full border-4 ${isCameraActive ? 'border-red-500 bg-red-500/10' : 'border-forest bg-white/70'} px-6 py-4 text-center font-outfit text-base font-semibold tracking-[0.16em] ${isCameraActive ? 'text-red-500' : 'text-forest'} transition-colors hover:bg-forest/10`}
                          >
                            <Camera className="h-5 w-5" />
                            {isCameraActive ? "STOP CAMERA" : "START CAMERA"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsListening(!isListening)}
                            className={`inline-flex min-h-[3.75rem] items-center justify-center gap-3 rounded-full border-4 ${isListening ? 'border-blue-500 bg-blue-500/10' : 'border-forest bg-white/70'} px-6 py-4 text-center font-outfit text-base font-semibold tracking-[0.16em] ${isListening ? 'text-blue-500' : 'text-forest'} transition-colors hover:bg-forest/10`}
                          >
                            <Radio className="h-5 w-5" />
                            {isListening ? "STOP LISTENING" : "VOICE COMMANDS"}
                          </button>
                        </div>
                        <div className="mt-3 rounded-[1.25rem] border border-forest/10 bg-white/75 px-4 py-4">
                          <p className="font-inter text-sm leading-6 text-black/70">
                            {errorMessage ||
                              (isListening ? "Listening for voice commands... Say 'detect money' or 'object detection'." : "Click 'Object Detection' or use voice commands to detect currency. Live detection shows humans and objects.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                {utilityCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <article
                      key={card.title}
                      className={`rounded-[1.75rem] border border-forest/15 p-5 shadow-[0_16px_40px_rgba(56,74,51,0.12)] ${card.tone}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="rounded-full bg-forest p-3 text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full border border-forest/20 px-3 py-1 font-inter text-[11px] uppercase tracking-[0.2em] text-forest">
                          Module
                        </span>
                      </div>
                      <h3 className="mt-5 font-outfit text-2xl font-semibold text-black">
                        {card.title}
                      </h3>
                      <p className="mt-2 font-inter text-sm leading-6 text-black/70">
                        {card.description}
                      </p>
                    </article>
                  );
                })}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border-4 border-forest bg-[#F7E8BD]/60 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-outfit text-3xl font-semibold text-black">
                      Detection Result
                    </h2>
                    <p className="mt-2 font-inter text-sm leading-6 text-black/70 sm:text-base">
                      The most recent object analysis appears here after a
                      preview capture or live feed update.
                    </p>
                  </div>
                  <div className="rounded-full bg-white/70 p-3 text-forest">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {detectionHighlights.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.5rem] border border-forest/15 bg-white/80 p-4"
                    >
                      <p className="font-inter text-xs uppercase tracking-[0.2em] text-black/45">
                        {item.label}
                      </p>
                      <p className="mt-2 font-outfit text-2xl font-semibold text-black">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
                <h2 className="font-outfit text-3xl font-semibold text-black">
                  Live Feed Notes
                </h2>
                <div className="mt-5 space-y-3">
                  {activityFeed.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border border-forest/10 bg-white/75 px-4 py-4"
                    >
                      <p className="font-inter text-sm leading-6 text-black/70">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
