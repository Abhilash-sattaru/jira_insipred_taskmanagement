import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState, Role } from "@/types";
import {
  loginRequest,
  fetchEmployees,
  fetchMyEmployees,
  fetchEmployee,
} from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
  refreshUser: () => Promise<void>;
  updateUserAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (
    employeeId: string,
    password: string
  ): Promise<boolean> => {
    try {
      const resp = await loginRequest(employeeId, password);
      const token = resp.access_token;

      // Try decode JWT payload to extract e_id and role (if token is a JWT)
      let user: User | null = null;
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          user = {
            e_id: String(payload.e_id ?? employeeId),
            roles: [String(payload.role ?? "DEVELOPER") as Role],
            status: "ACTIVE",
          } as User;
        }
      } catch {
        // fallback to a minimal user object
        user = {
          e_id: employeeId,
          roles: ["DEVELOPER"],
          status: "ACTIVE",
        } as User;
      }

      // Attempt to enrich user with their own employee details from backend when available
      if (user) {
        try {
          // Prefer numeric id from token (or fallback to provided employeeId).
          // Accept formats like 1 or "EMP001" — try to extract numeric portion.
          const rawId = String(user.e_id ?? employeeId);
          let numericId = Number(rawId);
          if (Number.isNaN(numericId)) {
            const m = rawId.match(/(\d+)/);
            numericId = m ? Number(m[0]) : NaN;
          }
          if (!Number.isNaN(numericId)) {
            const emp = await fetchEmployee(numericId, token);
            if (emp) user.employee = { ...emp, e_id: String(emp.e_id) } as any;
          }
        } catch {
          // ignore enrichment failure - best-effort
        }
      }

      localStorage.setItem("auth_token", token);
      if (user) localStorage.setItem("auth_user", JSON.stringify(user));

      setAuthState({ user, token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      console.error("Login error", err);
      // Rethrow so UI can show server-provided error messages
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    const token = authState.token;
    const user = authState.user;
    if (!token || !user) return;
    try {
      const rawId = String(user.e_id);
      let numericId = Number(rawId);
      if (Number.isNaN(numericId)) {
        const m = rawId.match(/(\d+)/);
        numericId = m ? Number(m[0]) : NaN;
      }
      if (!Number.isNaN(numericId)) {
        const emp = await fetchEmployee(numericId, token);
        if (emp) {
          const updatedUser = {
            ...user,
            employee: { ...emp, e_id: String(emp.e_id) },
          } as User;
          localStorage.setItem("auth_user", JSON.stringify(updatedUser));
          setAuthState((prev) => ({ ...prev, user: updatedUser }));
        }
      }
    } catch (e) {
      // ignore enrichment failure
    }
  };

  const hasRole = (role: Role): boolean => {
    return authState.user?.roles.includes(role) ?? false;
  };

  const updateUserAvatar = (avatar: string) => {
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        employee: authState.user.employee
          ? { ...authState.user.employee, avatar }
          : undefined,
      };
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      setAuthState((prev) => ({ ...prev, user: updatedUser }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        hasRole,
        refreshUser,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
