import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TrophyRoom from "@/pages/trophy-room";
import TrophyDetail from "@/pages/trophy-detail";
import Placeholder from "@/pages/placeholder";
import Onboarding from "@/pages/onboarding";
import Safe from "@/pages/safe";
import Community from "@/pages/community";
import Profile from "@/pages/profile";
import { Button } from "@/components/ui/button";
import themeLodge from "./assets/theme-lodge.png";
import trophyVaultLogo from "@assets/1771685444234_edit_63733598053289_1771685576340.png";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/trophies" component={TrophyRoom} />
      <Route path="/trophies/:id" component={TrophyDetail} />
      <Route path="/safe" component={Safe} />
      <Route path="/community" component={Community} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function LandingPage() {
  return (
    <div className="flex h-screen w-full">
      <div className="hidden md:flex w-1/2 relative items-center justify-center bg-black">
        <img
          src={themeLodge}
          alt="TrophyVault"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
        <div className="relative z-10 p-12 max-w-lg">
          <div className="mb-8">
            <img src={trophyVaultLogo} alt="TrophyVault" className="h-24 w-auto" data-testid="img-logo-landing-desktop" />
          </div>
          <p className="text-xl text-white/80 font-light leading-relaxed">
            Your digital trophy room, enhanced with AI identification and 3D modeling.
            Track your achievements with precision and elegance.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="md:hidden mb-12">
          <img src={trophyVaultLogo} alt="TrophyVault" className="h-20 w-auto mx-auto" data-testid="img-logo-landing-mobile" />
        </div>

        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              Preserve the Legacy
            </h2>
            <p className="text-muted-foreground text-lg">
              Sign in to access your trophy room and manage your collection.
            </p>
          </div>

          <a href="/api/login" data-testid="link-login">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide text-lg py-6">
              Sign In with Replit
            </Button>
          </a>

          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AuthGate />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
