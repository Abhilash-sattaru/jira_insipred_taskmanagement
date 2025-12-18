import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Briefcase, Shield, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both Employee ID and Password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(employeeId, password);
      toast({
        title: "Welcome Back!",
        description: "Successfully logged in",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.message || "Invalid Employee ID or Password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { id: "1", role: "Admin", icon: Shield, password: "admin123" },
    { id: "2", role: "Manager", icon: Briefcase, password: "manager123" },
    { id: "4", role: "Developer", icon: Users, password: "dev123" },
  ];

  // Parallax refs and handlers
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const blob1Ref = useRef<HTMLDivElement | null>(null);
  const blob2Ref = useRef<HTMLDivElement | null>(null);
  const blob3Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    // tuning parameters
    const scrollFactor = 0.18; // background translate factor
    const blobFactors = [0.06, 0.04, 0.02]; // blobs vertical parallax multipliers
    const maxBlur = 6; // px

    const isDesktop = () => window.innerWidth >= 768;

    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (parallaxRef.current) {
          const translate = Math.round(y * scrollFactor);
          parallaxRef.current.style.transform = `translateY(${translate}px)`;
          const blur = Math.min(y / 120, maxBlur);
          parallaxRef.current.style.filter = `blur(${blur}px)`;
        }

        // blobs subtle vertical parallax
        const blobs = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
        blobs.forEach((b, i) => {
          if (!b) return;
          const t = Math.round(y * blobFactors[i]);
          b.style.transform = `translateY(${t}px)`;
        });
      });
    };

    // pointer parallax (desktop only)
    const handlePointer = (ev: PointerEvent) => {
      if (!isDesktop()) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (ev.clientX - cx) / cx; // -1 .. 1
      const dy = (ev.clientY - cy) / cy;

      // small translate for background and blobs
      if (parallaxRef.current) {
        const tx = dx * 10; // px
        const ty = dy * 10;
        parallaxRef.current.style.transform = `translateY(${
          (window.scrollY || 0) * scrollFactor
        }px) translate(${tx}px, ${ty}px)`;
      }
      const blobElems = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
      blobElems.forEach((b, i) => {
        if (!b) return;
        const factor = (i + 1) * 6; // responsiveness per blob
        const bx = dx * factor * (i + 1);
        const by = dy * factor * (i + 1);
        b.style.transform = `translate(${bx}px, ${
          Math.round((window.scrollY || 0) * blobFactors[i]) + by
        }px)`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointer);
    // initial
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Parallax background layer (fixed). Uses the provided UST image in public/ */}
      <div
        ref={parallaxRef}
        className="parallax-layer"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,8,15,0.15), rgba(6,8,15,0.05)), url('/ust%20bg.webp')",
        }}
      />

      {/* Left mask for contrast on medium+ screens */}
      <div className="hidden md:block login-left-mask" aria-hidden />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          ref={(el) => (blob1Ref.current = el as HTMLDivElement | null)}
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          ref={(el) => (blob2Ref.current = el as HTMLDivElement | null)}
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          ref={(el) => (blob3Ref.current = el as HTMLDivElement | null)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/5"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="glass-strong shadow-2xl border-border/40 max-w-md mx-auto">
          <CardHeader className="space-y-1 text-center pb-4 pt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 220 }}
              className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 shadow-glow border border-border/30"
            >
              <Briefcase className="w-9 h-9 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-2xl font-extrabold text-foreground">
              UST Employee Management
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-foreground">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  placeholder="Enter your Employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="bg-secondary/50 border-border focus:ring-2 focus:ring-primary/50"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border focus:ring-2 focus:ring-primary/50 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-5 shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">
                Demo Credentials (Password:{" "}
                <code className="bg-secondary px-1 rounded text-foreground">
                  password123
                </code>
                )
              </p>
              <div className="grid gap-2">
                {demoCredentials.map((cred, index) => {
                  const Icon = cred.icon;
                  return (
                    <motion.button
                      key={cred.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => {
                        setEmployeeId(cred.id);
                        setPassword(cred.password ?? "");
                      }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cred.role}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cred.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Click to fill
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Project details for clarity */}
              <div className="mt-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  Project: UST Employee Management
                </p>
                <p>Jira-inspired task management demo</p>
                <p>Repo: Abhilash-sattaru/jira_insipred_taskmanagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
