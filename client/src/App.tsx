import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import TrophyRoom from "@/pages/trophy-room";
import TrophyDetail from "@/pages/trophy-detail";
import Placeholder from "@/pages/placeholder";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trophies" component={TrophyRoom} />
      <Route path="/trophies/:id" component={TrophyDetail} />
      <Route path="/expeditions">
        <Placeholder title="Expedition Planner" />
      </Route>
      <Route path="/identify">
        <Placeholder title="AI Species ID" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
