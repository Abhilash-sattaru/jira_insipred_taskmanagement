import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthState, Role } from "@/types";
import { mockUsers } from "@/data/mockData";
import { loginRequest } from "@/lib/api";

interface AuthContextType extends AuthState {
  login: (employeeId: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: Role) => boolean;
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

      // Attempt to enrich user with employee details from mock data when available
      if (user) {
        // Normalize to mock employee id format if numeric (e.g. 1 -> EMP001)
        let lookupId = String(user.e_id);
        if (/^[0-9]+$/.test(lookupId)) {
          lookupId = `EMP${String(Number(lookupId)).padStart(3, "0")}`;
        }

        // Try to find matching mock employee
        const { mockEmployees } = await import("@/data/mockData");
        const emp = mockEmployees.find(
          (e) => e.e_id === lookupId || e.e_id === user.e_id
        );
        if (emp) {
          user.employee = emp as any;
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
      value={{ ...authState, login, logout, hasRole, updateUserAvatar }}
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
