import {
  BadgeIndianRupee,
  Camera,
  ClipboardList,
  MapPinned,
  Pill,
  Radio,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth";

const detectionHighlights = [
  { label: "Detected object", value: "Medicine bottle" },
  { label: "Confidence", value: "96.4%" },
  { label: "Status", value: "Ready for audio guidance" },
];

const activityFeed = [
  "Live preview is stable and ready for object detection.",
  "Audio guidance can be triggered after a successful scan.",
  "Use live feed mode for continuous updates while moving the camera.",
];

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

export default function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, logout, user } = useAuth();

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
                        Position the object inside the frame, then choose a
                        one-time detection or switch to live feed mode.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/80 px-4 py-2 text-forest">
                      <Camera className="h-4 w-4" />
                      <span className="font-outfit text-sm font-medium uppercase tracking-[0.18em]">
                        Camera Ready
                      </span>
                    </div>
                  </div>

                  <div className="relative rounded-[2rem] border-4 border-forest bg-[linear-gradient(145deg,rgba(87,112,79,0.14),rgba(247,232,189,0.7))] p-4 sm:p-5">
                    <div className="rounded-[1.5rem] border border-forest/20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),rgba(87,112,79,0.2))] p-4 sm:p-6">
                      <div className="flex min-h-[32rem] flex-col rounded-[1.25rem] border border-dashed border-forest/35 bg-black/10 p-4 sm:min-h-[36rem] sm:p-5">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-black/55 px-3 py-1 font-inter text-xs uppercase tracking-[0.2em] text-white">
                            Preview
                          </span>
                          <span className="rounded-full bg-forest px-3 py-1 font-inter text-xs uppercase tracking-[0.2em] text-white">
                            Active
                          </span>
                        </div>

                        <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
                          <div className="relative flex h-44 w-full max-w-[26rem] items-center justify-center rounded-[1.5rem] border-2 border-white/70 bg-white/20 sm:h-56">
                            <div className="absolute inset-4 rounded-[1.2rem] border-2 border-dashed border-forest/45" />
                            <div className="rounded-full bg-white/85 p-5 text-forest shadow-lg">
                              <ScanSearch className="h-10 w-10 sm:h-12 sm:w-12" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 grid gap-3 sm:mt-4 sm:grid-cols-2">
                          <button
                            type="button"
                            className="inline-flex min-h-[4.75rem] items-center justify-center gap-3 rounded-full bg-forest px-6 py-4 text-center font-outfit text-lg font-semibold tracking-[0.16em] text-white transition-colors hover:bg-forest/90"
                          >
                            <ScanSearch className="h-5 w-5" />
                            OBJECT DETECTION
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-[4.75rem] items-center justify-center gap-3 rounded-full border-4 border-forest bg-white/70 px-6 py-4 text-center font-outfit text-lg font-semibold tracking-[0.16em] text-forest transition-colors hover:bg-forest/10"
                          >
                            <Radio className="h-5 w-5" />
                            LIVE FEED
                          </button>
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
