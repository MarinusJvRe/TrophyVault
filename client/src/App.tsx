import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";
import { capturePageView, identifyUser } from "@/lib/posthog";
import type { UserPreferences } from "@shared/schema";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TrophyRoom from "@/pages/trophy-room";
import TrophyDetail from "@/pages/trophy-detail";
import Placeholder from "@/pages/placeholder";
import Onboarding from "@/pages/onboarding";
import Safe from "@/pages/safe";
import Community from "@/pages/community";
import PublicRoom from "@/pages/public-room";
import Profile from "@/pages/profile";
import TrophyMap from "@/pages/trophy-map";
import TrophyTimeline from "@/pages/trophy-timeline";
import LandingPage from "@/pages/landing";
import PricingPage from "@/pages/pricing";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import ContactPage from "@/pages/contact";
import ProDashboard from "@/pages/pro-dashboard";
import SplashScreen from "@/components/SplashScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Chrome, Apple } from "lucide-react";
import { setAuthToken } from "@/lib/auth-token";
import { motion, AnimatePresence } from "framer-motion";
import themeLodge from "./assets/theme-lodge.png";
import trophyVaultLogo from "@assets/honor_hunt_logo_v2.png";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" } },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}

function usePageViewTracking() {
  const [location] = useLocation();
  useEffect(() => {
    capturePageView(location);
  }, [location]);
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/">{() => <AnimatedPage><Home /></AnimatedPage>}</Route>
        <Route path="/onboarding">{() => <AnimatedPage><Onboarding /></AnimatedPage>}</Route>
        <Route path="/trophies">{() => <AnimatedPage><TrophyRoom /></AnimatedPage>}</Route>
        <Route path="/trophies/map">{() => <AnimatedPage><TrophyMap /></AnimatedPage>}</Route>
        <Route path="/trophies/timeline">{() => <AnimatedPage><TrophyTimeline /></AnimatedPage>}</Route>
        <Route path="/trophies/:id">{() => <AnimatedPage><TrophyDetail /></AnimatedPage>}</Route>
        <Route path="/safe">{() => <AnimatedPage><Safe /></AnimatedPage>}</Route>
        <Route path="/community">{() => <AnimatedPage><Community /></AnimatedPage>}</Route>
        <Route path="/community/room/:userId">{() => <AnimatedPage><PublicRoom /></AnimatedPage>}</Route>
        <Route path="/profile">{() => <AnimatedPage><Profile /></AnimatedPage>}</Route>
        <Route path="/pro">{() => <AnimatedPage><ProDashboard /></AnimatedPage>}</Route>
        <Route>{() => <AnimatedPage><NotFound /></AnimatedPage>}</Route>
      </Switch>
    </AnimatePresence>
  );
}

function AuthPage() {
  const initialMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: providers } = useQuery<{ google: boolean; apple: boolean }>({
    queryKey: ["/api/auth/providers"],
    queryFn: async () => {
      const res = await fetch("/api/auth/providers");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      const messages: Record<string, string> = {
        invalid_state: "Authentication session expired. Please try again.",
        token_exchange_failed: "Failed to complete sign-in. Please try again.",
        userinfo_failed: "Could not retrieve your account info. Please try again.",
        no_email: "No email address was provided. Please use an account with an email.",
        no_token: "No authentication token received. Please try again.",
        oauth_failed: "Sign-in failed. Please try again.",
      };
      setError(messages[oauthError] || "Sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setIsSubmitting(false);
          return;
        }

        const referralCode = sessionStorage.getItem("referralCode") || undefined;
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, firstName, lastName, referralCode }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.message || "Registration failed");
          setIsSubmitting(false);
          return;
        }

        const userData = await res.json();
        if (userData.authToken) setAuthToken(userData.authToken);
        sessionStorage.setItem("isNewUser", "true");
        queryClient.setQueryData(["/api/auth/user"], userData);
        toast({ title: "Account created", description: "Welcome to Honor The Hunt!" });
        setLocation("/");
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.message || "Login failed");
          setIsSubmitting(false);
          return;
        }

        const userData = await res.json();
        if (userData.authToken) setAuthToken(userData.authToken);
        queryClient.setQueryData(["/api/auth/user"], userData);
        setLocation("/");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div className="hidden lg:flex w-1/2 relative items-center justify-center bg-black">
        <img
          src={themeLodge}
          alt="Honor The Hunt"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        <div className="relative z-10 p-12 max-w-lg">
          <div className="mb-8">
            <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-10 w-auto" data-testid="img-logo-landing-desktop" />
          </div>
          <p className="text-xl text-white/80 font-light leading-relaxed">
            Your digital trophy room, enhanced with AI identification and 3D modeling.
            Track your achievements with precision and elegance.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-[#1a1a1a] overflow-y-auto">
        <div className="lg:hidden mb-4">
          <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-16 w-auto mx-auto" data-testid="img-logo-landing-mobile" />
          <p className="text-center text-white/80 font-serif text-lg mt-2 tracking-wide">Honor the Hunt</p>
        </div>

        <div className="max-w-sm w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <h2 className="text-2xl font-serif font-bold text-white mb-2" data-testid="text-auth-heading">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-white/60 text-sm">
                {mode === "signin" ? "Sign in to access your trophy room" : "Start preserving your hunting legacy"}
              </p>
            </motion.div>
          </AnimatePresence>

          {(providers?.google || providers?.apple) && (
            <>
              <div className="space-y-3">
                {providers?.google && (
                  <Button
                    variant="outline"
                    className="w-full bg-white text-gray-800 border-white/20 hover:bg-white/90 font-medium py-5"
                    onClick={() => window.location.href = "/api/auth/google"}
                    data-testid="button-google-signin"
                  >
                    <Chrome className="h-5 w-5 mr-2" />
                    Continue with Google
                  </Button>
                )}

                {providers?.apple && (
                  <Button
                    variant="outline"
                    className="w-full bg-black text-white border-white/20 hover:bg-black/80 font-medium py-5"
                    onClick={() => window.location.href = "/api/auth/apple"}
                    data-testid="button-apple-signin"
                  >
                    <Apple className="h-5 w-5 mr-2" />
                    Continue with Apple
                  </Button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1a1a] px-3 text-white/40 uppercase tracking-wider">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-white/70 text-xs">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#b87333]"
                    placeholder="John"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-white/70 text-xs">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#b87333]"
                    placeholder="Doe"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-xs">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#b87333] pl-10"
                  placeholder="you@example.com"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/70 text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#b87333] pr-10"
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Enter your password"}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-white/70 text-xs">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#b87333]"
                  placeholder="Confirm your password"
                  data-testid="input-confirm-password"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center" data-testid="text-auth-error">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#b87333] hover:bg-[#a0622d] text-white font-serif tracking-wide text-base py-5"
              data-testid="button-submit-auth"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-white/50">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(""); }}
                  className="text-[#b87333] hover:text-[#d4935f] font-medium"
                  data-testid="button-switch-to-signup"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("signin"); setError(""); }}
                  className="text-[#b87333] hover:text-[#d4935f] font-medium"
                  data-testid="button-switch-to-signin"
                >
                  Sign In
                </button>
              </>
            )}
          </p>

          <p className="text-xs text-white/30 text-center">
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-[#b87333]/60 hover:text-[#b87333]" data-testid="link-auth-terms">terms of service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-[#b87333]/60 hover:text-[#b87333]" data-testid="link-auth-privacy">privacy policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicRouter() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/">{() => <LandingPage />}</Route>
        <Route path="/login">{() => <AuthPage />}</Route>
        <Route path="/pricing">{() => <PricingPage />}</Route>
        <Route path="/terms">{() => <TermsPage />}</Route>
        <Route path="/privacy">{() => <PrivacyPage />}</Route>
        <Route path="/contact">{() => <ContactPage />}</Route>
        <Route path="/join">{() => <AuthPage />}</Route>
        <Route>{() => <LandingPage />}</Route>
      </Switch>
    </AnimatePresence>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const isNewUser = sessionStorage.getItem("isNewUser") === "true";
  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
    enabled: !!user,
  });

  const publicPages = ["/pricing", "/terms", "/privacy", "/contact", "/join"];
  const isPublicPage = publicPages.includes(location);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      sessionStorage.setItem("referralCode", ref);
    }

    const oauthSuccess = params.get("oauth");
    if (oauthSuccess === "success") {
      if (params.get("newUser") === "true") {
        sessionStorage.setItem("isNewUser", "true");
      }
      window.history.replaceState({}, "", window.location.pathname);
      fetch("/api/auth/token", { method: "POST", credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.authToken) setAuthToken(data.authToken);
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        })
        .catch(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        });
    }
  }, []);

  usePageViewTracking();

  useEffect(() => {
    if (user) {
      identifyUser(String(user.id), {
        tier: preferences?.accountTier || "free",
      });
    }
  }, [user, preferences]);

  if (isPublicPage) {
    return (
      <AnimatePresence mode="wait">
        <Switch key={location}>
          <Route path="/pricing">{() => <PricingPage />}</Route>
          <Route path="/terms">{() => <TermsPage />}</Route>
          <Route path="/privacy">{() => <PrivacyPage />}</Route>
          <Route path="/contact">{() => <ContactPage />}</Route>
        </Switch>
      </AnimatePresence>
    );
  }

  if (isLoading || (user && isNewUser && prefsLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a1a1a]">
        <div className="w-8 h-8 border-2 border-[#b87333] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    if (location === "/login") {
      return <AuthPage />;
    }
    return <PublicRouter />;
  }

  if (isNewUser && (!preferences || !(preferences as any).pursuit)) {
    return <Onboarding />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <SplashScreen>
            <AuthGate />
          </SplashScreen>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
