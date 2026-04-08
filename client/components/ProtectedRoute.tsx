import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="min-h-screen detectify-bg flex items-center justify-center px-6">
        <div className="rounded-[2rem] border border-white/30 bg-white/30 px-8 py-6 text-center backdrop-blur-sm">
          <p className="font-outfit text-xl text-black">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/user" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
