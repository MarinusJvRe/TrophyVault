import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Palette, MapPin, Target, Ruler, Eye, Check, Mountain, Home, Feather, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { UserPreferences } from "@shared/schema";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

const THEMES = [
  { id: "lodge", name: "Timber Ridge", description: "Rugged timber, warm stone, mountain air.", image: themeLodge, icon: Mountain },
  { id: "manor", name: "Safari Manor", description: "Victorian elegance meets African wilderness.", image: themeManor, icon: Home },
  { id: "minimal", name: "Alpine Gallery", description: "Concrete, glass, and light.", image: themeMinimal, icon: Feather },
];

const HUNTING_LOCATIONS = [
  "Southern Africa - Bushveld",
  "Southern Africa - Plains",
  "Southern Africa - Coastal",
  "East Africa - Savanna",
  "North America - High Country",
  "North America - Midwest",
  "North America - Deep Woods",
  "North America - Plains",
  "Europe - Alpine",
  "Europe - Nordic",
  "Other",
];

const PURSUITS = ["Big Game", "Plains Game", "Waterfowl", "Alpine"];
const SCORING_SYSTEMS = ["SCI", "Boone & Crockett", "Rowland Ward"];

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const [selectedTheme, setSelectedTheme] = useState<"lodge" | "manor" | "minimal">(theme);
  const [pursuit, setPursuit] = useState("");
  const [scoringSystem, setScoringSystem] = useState("SCI");
  const [units, setUnits] = useState("imperial");
  const [huntingLocations, setHuntingLocations] = useState<string[]>([]);
  const [roomVisibility, setRoomVisibility] = useState("private");

  useEffect(() => {
    if (preferences) {
      setSelectedTheme((preferences.theme || "lodge") as "lodge" | "manor" | "minimal");
      setPursuit(preferences.pursuit || "");
      setScoringSystem(preferences.scoringSystem || "SCI");
      setUnits(preferences.units || "imperial");
      setHuntingLocations(preferences.huntingLocations || []);
      setRoomVisibility(preferences.roomVisibility || "private");
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    setTheme(selectedTheme as any);
    saveMutation.mutate({
      theme: selectedTheme,
      pursuit,
      scoringSystem,
      units,
      huntingLocations,
      roomVisibility,
    });
  };

  const toggleLocation = (loc: string) => {
    setHuntingLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-full space-y-8 pb-24">
        <header>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <User className="h-8 w-8" />
            Profile & Settings
          </h1>
          <p className="text-muted-foreground">Manage your account, preferences, and trophy room settings.</p>
        </header>

        <Card className="bg-card border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover" data-testid="img-profile-avatar" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30" data-testid="img-profile-avatar">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-serif font-bold text-foreground" data-testid="text-profile-name">
                  {user?.firstName || ""} {user?.lastName || ""}
                </h2>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id as "lodge" | "manor" | "minimal")}
                  data-testid={`button-theme-${t.id}`}
                  className={cn(
                    "cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all duration-300 h-[180px]",
                    selectedTheme === t.id
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-border/40 hover:border-border opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={t.image} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-serif font-bold text-white">{t.name}</h3>
                      {selectedTheme === t.id && (
                        <div className="bg-primary rounded-full p-0.5">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-white/70 mt-1">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              About Your Hunting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Primary Pursuit</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PURSUITS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setPursuit(option)}
                    data-testid={`button-pursuit-${option.toLowerCase().replace(/\s/g, '-')}`}
                    className={cn(
                      "py-3 px-4 rounded-lg text-sm border transition-all",
                      pursuit === option
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-card border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-border/30" />

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Scoring System</label>
              <div className="grid grid-cols-3 gap-3">
                {SCORING_SYSTEMS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setScoringSystem(option)}
                    data-testid={`button-scoring-${option.toLowerCase().replace(/[&\s]/g, '-')}`}
                    className={cn(
                      "py-3 px-4 rounded-lg text-sm border transition-all",
                      scoringSystem === option
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-card border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-border/30" />

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <Ruler className="h-4 w-4 inline mr-2" />
                Measurement Units
              </label>
              <div className="flex gap-3 p-1 bg-muted/30 rounded-lg border border-border/40 w-fit">
                {["Imperial", "Metric"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setUnits(option.toLowerCase())}
                    data-testid={`button-units-${option.toLowerCase()}`}
                    className={cn(
                      "py-2 px-6 rounded-md text-sm transition-all",
                      units === option.toLowerCase()
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Favourite Hunting Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Select all regions where you typically hunt.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HUNTING_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  data-testid={`button-location-${loc.toLowerCase().replace(/[\s-]/g, '-')}`}
                  className={cn(
                    "flex items-center gap-3 py-3 px-4 rounded-lg text-sm border text-left transition-all",
                    huntingLocations.includes(loc)
                      ? "bg-primary/10 border-primary/50 text-foreground"
                      : "bg-card border-border/40 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    huntingLocations.includes(loc) ? "bg-primary border-primary" : "border-border/60"
                  )}>
                    {huntingLocations.includes(loc) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {loc}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Trophy Room Sharing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/40">
              <div>
                <div className="font-medium text-foreground">Public Trophy Room</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Allow other hunters to view and rate your trophy room in the Community section.
                </div>
              </div>
              <Switch
                checked={roomVisibility === "public"}
                onCheckedChange={(checked) => setRoomVisibility(checked ? "public" : "private")}
                data-testid="switch-room-visibility"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif flex-1"
            data-testid="button-save-profile"
          >
            {saveMutation.isPending ? "Saving..." : "Save All Settings"}
          </Button>
          <a href="/api/logout" className="sm:w-auto">
            <Button size="lg" variant="outline" className="w-full gap-2 border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/50" data-testid="button-profile-logout">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </a>
        </div>
      </div>
    </Layout>
  );
}
