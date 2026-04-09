import Navbar from "@/components/Navbar";
import { VoiceController } from "@/components/VoiceController";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function VoiceDetection() {
  const { isReady, user } = useAuth();
  const location = useLocation();

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
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="rounded-[2rem] border border-white/30 bg-white/35 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
            <div>
              <div className="inline-flex items-center rounded-full bg-forest px-4 py-2 text-white">
                <span className="font-outfit text-sm font-medium uppercase tracking-[0.3em]">
                  Voice Control
                </span>
              </div>
              <h1 className="mt-5 font-outfit text-4xl font-bold text-black sm:text-5xl md:text-6xl">
                Voice-Controlled Detection
              </h1>
              <p className="mt-4 max-w-2xl font-outfit text-lg text-black/75 sm:text-xl">
                Use voice commands to control real-time object detection and currency identification. 
                Simply speak your commands and the system will respond accordingly.
              </p>
            </div>
          </section>

          <VoiceController />
        </div>
      </main>
    </div>
  );
}
