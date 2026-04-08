import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AuthUser {
  email: string;
  fullName: string;
  role: "user";
}

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  fullName: string;
  password: string;
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
      login: ({ email, password }) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password.trim()) {
          throw new Error("Enter both your email and password to continue.");
        }

        const nextUser: AuthUser = {
          email: normalizedEmail,
          fullName: buildNameFromEmail(normalizedEmail),
          role: "user",
        };

        setUser(nextUser);
        saveUser(nextUser);
        return nextUser;
      },
      signup: ({ email, fullName, password }) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = fullName.trim();

        if (!normalizedName || !normalizedEmail || !password.trim()) {
          throw new Error("Complete all fields before creating your account.");
        }

        const nextUser: AuthUser = {
          email: normalizedEmail,
          fullName: normalizedName,
          role: "user",
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
