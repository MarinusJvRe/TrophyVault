import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Home, Feather, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

const THEMES = [
  {
    id: "lodge",
    name: "Timber Ridge",
    description: "Rugged timber, warm stone, mountain air. A sanctuary for the serious hunter.",
    image: themeLodge,
    icon: Mountain
  },
  {
    id: "manor",
    name: "Safari Manor",
    description: "Thatch, khaki canvas, and luxury leather. The gentleman's retreat.",
    image: themeManor,
    icon: Home
  },
  {
    id: "minimal",
    name: "Alpine Gallery",
    description: "Concrete, glass, and light. A museum for your finest moments.",
    image: themeMinimal,
    icon: Feather
  }
] as const;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState<string>("lodge");
  const [formData, setFormData] = useState({
    pursuit: "",
    scoring: "sci",
    units: "imperial",
    huntingLocations: [] as string[],
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/preferences", data);
    },
    onSuccess: () => {
      setTheme(selectedTheme as any);
      setLocation("/");
    },
  });

  const toggleLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      huntingLocations: prev.huntingLocations.includes(loc)
        ? prev.huntingLocations.filter(l => l !== loc)
        : [...prev.huntingLocations, loc],
    }));
  };

  const handleFinish = () => {
    setTheme(selectedTheme as any);
    savePreferencesMutation.mutate({
      theme: selectedTheme,
      pursuit: formData.pursuit,
      scoringSystem: formData.scoring,
      units: formData.units,
      huntingLocations: formData.huntingLocations,
    });
    setLocation("/");
  };

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={selectedTheme}
            src={THEMES.find(t => t.id === selectedTheme)?.image}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto">
        
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Set the Atmosphere</h1>
              <p className="text-white/60 text-lg max-w-xl mx-auto">
                Your trophy room is a reflection of your journey. Choose the aesthetic that honors your legacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {THEMES.map((theme) => (
                <div 
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  data-testid={`button-theme-${theme.id}`}
                  className={cn(
                    "cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all duration-300 h-[300px]",
                    selectedTheme === theme.id 
                      ? "border-primary scale-105 shadow-2xl shadow-primary/20" 
                      : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                  )}
                >
                  <img src={theme.image} alt={theme.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex justify-between items-end mb-2">
                      <h3 className="text-xl font-serif font-bold">{theme.name}</h3>
                      {selectedTheme === theme.id && (
                        <div className="bg-primary rounded-full p-1">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">{theme.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <Button 
                size="lg" 
                onClick={() => setStep(2)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-serif"
                data-testid="button-next-step"
              >
                Next Step <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">Tailor Your Experience</h1>
              <p className="text-white/60">
                Help us customize your dashboard and tools.
              </p>
            </div>

            <div className="space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10">
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80 uppercase tracking-wider">Primary Pursuit</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Big Game", "Plains Game", "Waterfowl", "Alpine"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({...formData, pursuit: option})}
                      data-testid={`button-pursuit-${option.toLowerCase().replace(/\s/g, '-')}`}
                      className={cn(
                        "py-3 px-4 rounded-lg text-sm border transition-all",
                        formData.pursuit === option
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80 uppercase tracking-wider">Scoring System</label>
                <div className="grid grid-cols-3 gap-3">
                  {["SCI", "Boone & Crockett", "Rowland Ward"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({...formData, scoring: option})}
                      data-testid={`button-scoring-${option.toLowerCase().replace(/\s/g, '-')}`}
                      className={cn(
                        "py-3 px-4 rounded-lg text-sm border transition-all",
                        formData.scoring === option
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80 uppercase tracking-wider">Measurement Units</label>
                <div className="flex gap-4 p-1 bg-white/5 rounded-lg border border-white/10 w-fit">
                  {["Imperial", "Metric"].map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData({...formData, units: option.toLowerCase()})}
                      data-testid={`button-units-${option.toLowerCase()}`}
                      className={cn(
                        "py-2 px-6 rounded-md text-sm transition-all",
                        formData.units === option.toLowerCase()
                          ? "bg-white/20 text-white shadow-sm"
                          : "text-white/50 hover:text-white"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/80 uppercase tracking-wider">Where do you hunt?</label>
                <p className="text-xs text-white/40">Select all that apply</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {[
                    "Southern Africa - Bushveld",
                    "Southern Africa - Plains",
                    "Africa - Other",
                    "North America - High Country",
                    "North America - Midwest",
                    "North America - Deep Woods",
                    "North America - Plains",
                    "Europe - Alpine",
                    "Europe - Nordic",
                    "Other",
                  ].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => toggleLocation(loc)}
                      data-testid={`button-location-${loc.toLowerCase().replace(/[\s-]/g, '-')}`}
                      className={cn(
                        "flex items-center gap-2 py-2 px-3 rounded-lg text-xs border text-left transition-all",
                        formData.huntingLocations.includes(loc)
                          ? "bg-primary/20 border-primary/50 text-white"
                          : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                        formData.huntingLocations.includes(loc) ? "bg-primary border-primary" : "border-white/30"
                      )}>
                        {formData.huntingLocations.includes(loc) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-between mt-10">
              <Button 
                variant="ghost" 
                onClick={() => setStep(1)}
                className="text-white/60 hover:text-white"
                data-testid="button-back"
              >
                Back
              </Button>
              <Button 
                size="lg" 
                onClick={handleFinish}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-serif"
                data-testid="button-finish"
                disabled={savePreferencesMutation.isPending}
              >
                {savePreferencesMutation.isPending ? "Saving..." : "Enter TrophyVault"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
