import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AuthUser {
  id?: string;
  email: string;
  fullName: string;
  role: "user" | "helper";
  familyCode?: string;
  shareCode?: string; // Unique shareable code for this user
  homeLocation?: { lat: number; lng: number };
  currentLocation?: { lat: number; lng: number };
  isInsideGeofence?: boolean;
  helperAccessCodes?: string[]; // Codes this helper has access to
}

interface LoginPayload {
  email: string;
  password: string;
  role?: "user" | "helper";
}

interface SignupPayload {
  email: string;
  fullName: string;
  password: string;
  role?: "user" | "helper";
  familyCode?: string;
}

interface AuthContextValue {
  isReady: boolean;
  user: AuthUser | null;
  login: (payload: LoginPayload) => AuthUser;
  signup: (payload: SignupPayload) => AuthUser;
  logout: () => void;
}

const AUTH_STORAGE_KEY = "detectify-user-session";

const AuthContext = createContext<AuthContextValue | null>(null);

function buildNameFromEmail(email: string) {
  const [localPart = "Detectify User"] = email.split("@");

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function saveUser(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsReady(true);
      return;
    }

    const savedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser) as AuthUser);
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      user,
      login: ({ email, password, role = "user" }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password.trim()) {
          throw new Error("Enter both your email and password to continue.");
        }

        const nextUser: AuthUser = {
          id: `user_${Date.now()}`,
          email: normalizedEmail,
          fullName: buildNameFromEmail(normalizedEmail),
          role: role,
          shareCode: role === "user" ? generateShareCode() : undefined,
        };

        setUser(nextUser);
        saveUser(nextUser);
        return nextUser;
      },
      signup: ({ email, fullName, password, role = "user", familyCode }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = fullName.trim();

        if (!normalizedName || !normalizedEmail || !password.trim()) {
          throw new Error("Complete all fields before creating your account.");
        }

        const nextUser: AuthUser = {
          id: `user_${Date.now()}`,
          email: normalizedEmail,
          fullName: normalizedName,
          role: role,
          familyCode: familyCode,
          shareCode: role === "user" ? generateShareCode() : undefined,
          helperAccessCodes: role === "helper" ? [] : undefined,
        };

        setUser(nextUser);
        saveUser(nextUser);
        return nextUser;
      },
      logout: () => {
        setUser(null);
        saveUser(null);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
