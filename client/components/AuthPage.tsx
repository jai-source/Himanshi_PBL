import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Navbar from "./Navbar";

interface AuthPageProps {
  mode: "user" | "helper";
}

export default function AuthPage({ mode }: AuthPageProps) {
  const isUser = mode === "user";
  const navigate = useNavigate();
  const location = useLocation();
  const { isReady, login, signup, user } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFamilyCode, setSignupFamilyCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  const accentClass = isUser
    ? "bg-forest text-white"
    : "border-4 border-forest text-forest";

  const subtitle = isUser
    ? "Sign in to use Detectify as a user, or create an account to get started."
    : "Sign in to assist users, or create an account to join the helper team.";

  const redirectPath = useMemo(() => {
    if (!isUser) {
      return "/dashboard";
    }

    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? "/dashboard";
  }, [isUser, location.state]);

  useEffect(() => {
    if (isReady && isUser && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [isReady, isUser, navigate, redirectPath, user]);

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      login({
        email: loginEmail,
        password: loginPassword,
        role: isUser ? "user" : "helper",
      });
      setLoginError("");
      navigate(isUser ? redirectPath : "/helper/dashboard", { replace: true });
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Unable to sign you in.",
      );
    }
  }

  function handleSignupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isUser && !signupFamilyCode.trim()) {
      setSignupError("Family code is required for helpers.");
      return;
    }

    try {
      signup({
        email: signupEmail,
        fullName: signupName,
        password: signupPassword,
        role: isUser ? "user" : "helper",
        familyCode: signupFamilyCode || undefined,
      });
      setSignupError("");
      navigate(isUser ? "/dashboard" : "/helper/dashboard", { replace: true });
    } catch (error) {
      setSignupError(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
    }
  }

  return (
    <div className="min-h-screen detectify-bg flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 md:px-16 md:py-16 flex items-center justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-10 flex flex-col gap-6 justify-between lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div
                className={`mb-5 inline-flex items-center rounded-full px-5 py-2 ${accentClass}`}
              >
                <span className="font-outfit text-sm font-medium uppercase tracking-[0.35em] md:text-base">
                  {isUser ? "USER" : "HELPER"}
                </span>
              </div>
              <h1 className="font-outfit text-5xl font-bold leading-none text-black capitalize sm:text-6xl md:text-7xl xl:text-[88px]">
                {isUser ? "welcome back" : "join as helper"}
              </h1>
              <p className="mt-5 max-w-2xl font-outfit text-lg font-medium leading-normal text-white/90 sm:text-xl md:text-2xl">
                {subtitle}
              </p>
            </div>

            <Link
              to={isUser ? "/helper" : "/user"}
              className="self-start rounded-full border border-forest px-6 py-3 font-outfit font-medium text-forest transition-colors hover:bg-forest/10 lg:self-auto"
            >
              Switch to {isUser ? "Helper" : "User"}
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-[2rem] border border-white/30 bg-white/30 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
              <div className="mb-5 inline-flex rounded-full bg-forest px-4 py-2 text-white">
                <span className="font-outfit text-sm font-medium uppercase tracking-[0.3em]">
                  Login
                </span>
              </div>
              <h2 className="mb-2 font-outfit text-3xl font-semibold text-black">
                Sign in
              </h2>
              <p className="mb-6 font-outfit text-base text-black/70">
                Use your existing credentials to continue.
              </p>

              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <label className="block">
                  <span className="mb-2 block font-inter text-sm text-black/70">
                    Email address
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-inter text-sm text-black/70">
                    Password
                  </span>
                  <input
                    type="password"
                    placeholder="********"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                </label>
                {loginError ? (
                  <p className="font-inter text-sm text-red-700">{loginError}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-full bg-forest px-6 py-4 font-outfit text-xl font-semibold tracking-[0.18em] text-white transition-colors hover:bg-forest/90"
                >
                  LOGIN
                </button>
                <Link
                  to="/"
                  className="block text-center font-outfit text-base font-medium text-forest underline underline-offset-4 transition-colors hover:text-forest/80"
                >
                  Return to Home
                </Link>
              </form>
            </section>

            <section className="rounded-[2rem] border-4 border-forest bg-[#F7E8BD]/50 p-6 shadow-[0_20px_60px_rgba(56,74,51,0.12)] backdrop-blur-sm sm:p-8">
              <div className="mb-5 inline-flex rounded-full border-2 border-forest bg-white/30 px-4 py-2 text-forest">
                <span className="font-outfit text-sm font-medium uppercase tracking-[0.3em]">
                  Signup
                </span>
              </div>
              <h2 className="mb-2 font-outfit text-3xl font-semibold text-black">
                Create account
              </h2>
              <p className="mb-6 font-outfit text-base text-black/70">
                Join the platform and set up your profile.
              </p>

              <form className="space-y-4" onSubmit={handleSignupSubmit}>
                <label className="block">
                  <span className="mb-2 block font-inter text-sm text-black/70">
                    Full name
                  </span>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-inter text-sm text-black/70">
                    Email address
                  </span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block font-inter text-sm text-black/70">
                    Password
                  </span>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                  />
                </label>
                {!isUser && (
                  <label className="block">
                    <span className="mb-2 block font-inter text-sm text-black/70">
                      Family Code
                    </span>
                    <input
                      type="text"
                      placeholder="Enter family code"
                      value={signupFamilyCode}
                      onChange={(event) => setSignupFamilyCode(event.target.value)}
                      className="w-full rounded-2xl border border-forest/20 bg-white/80 px-4 py-3 font-inter text-base text-black placeholder:text-black/35 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
                    />
                    <p className="mt-1 font-inter text-xs text-black/60">
                      Helper must use the same family code as protected users
                    </p>
                  </label>
                )}
                {signupError ? (
                  <p className="font-inter text-sm text-red-700">{signupError}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-full border-4 border-forest px-6 py-4 font-outfit text-xl font-semibold tracking-[0.18em] text-forest transition-colors hover:bg-forest/10"
                >
                  SIGN UP
                </button>
                <Link
                  to="/"
                  className="block text-center font-outfit text-base font-medium text-forest underline underline-offset-4 transition-colors hover:text-forest/80"
                >
                  Return to Home
                </Link>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
