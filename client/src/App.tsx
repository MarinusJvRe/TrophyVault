import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TrophyRoom from "@/pages/trophy-room";
import TrophyDetail from "@/pages/trophy-detail";
import Placeholder from "@/pages/placeholder";
import Onboarding from "@/pages/onboarding";
import Safe from "@/pages/safe";
import Community from "@/pages/community";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/trophies" component={TrophyRoom} />
      <Route path="/trophies/:id" component={TrophyDetail} />
      <Route path="/safe" component={Safe} />
      <Route path="/community" component={Community} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
