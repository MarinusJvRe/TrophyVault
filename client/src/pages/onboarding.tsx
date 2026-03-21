import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { trackEvent } from "@/lib/posthog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight, Home, Feather, Mountain, Crosshair, Briefcase, ArrowLeft, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationSearch } from "@/components/LocationSearch";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

const THEMES = [
  { id: "lodge", name: "Timber Ridge", description: "Rugged timber, warm stone, mountain air.", image: themeLodge, icon: Mountain },
  { id: "manor", name: "Safari Manor", description: "Thatch, khaki canvas, and luxury leather.", image: themeManor, icon: Home },
  { id: "minimal", name: "Alpine Gallery", description: "Concrete, glass, and light.", image: themeMinimal, icon: Feather },
] as const;

const PRO_ENTITY_TYPES = [
  { id: "outfitter_ph", label: "Outfitters and Professional Hunters", description: "Guide hunts, outfitting services, or licensed PH" },
  { id: "taxidermist", label: "Taxidermist", description: "Preserve and mount trophies" },
  { id: "ranch_game_farm", label: "Ranch or Game Farm", description: "Operate a hunting ranch or game farm" },
];

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "Sao Tome and Principe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState<"hunter" | "professional" | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("lodge");
  const [formData, setFormData] = useState({
    nationality: "",
    scoring: "sci",
    units: "imperial",
  });
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [proData, setProData] = useState({
    entityType: "",
    businessName: "",
    businessHandle: "",
    location: "",
  });

  const filteredCountries = useMemo(() => {
    if (!nationalitySearch) return COUNTRIES;
    const q = nationalitySearch.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
  }, [nationalitySearch]);

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/preferences", data);
    },
    onSuccess: () => {
      setTheme(selectedTheme as any);
      sessionStorage.removeItem("isNewUser");
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      setLocation("/trophies");
    },
    onError: () => {
      setTheme(selectedTheme as any);
      sessionStorage.removeItem("isNewUser");
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      setLocation("/trophies");
    },
  });

  const createProProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/pro/profile", data);
    },
  });

  const handleFinish = async () => {
    setTheme(selectedTheme as any);

    let proProfileCreated = false;
    if (userType === "professional" && proData.entityType && proData.businessName) {
      try {
        await createProProfileMutation.mutateAsync({
          entityType: proData.entityType,
          businessName: proData.businessName,
          businessHandle: proData.businessHandle,
          location: proData.location || undefined,
        });
        proProfileCreated = true;
      } catch (err) {
        console.error("Pro profile creation failed:", err);
      }
    }

    trackEvent("onboarding_completed", {
      userType: userType === "professional" ? "professional" : "hunter",
      theme: selectedTheme,
      nationality: formData.nationality,
      scoringSystem: formData.scoring,
      units: formData.units,
      proProfileCreated,
    });

    savePreferencesMutation.mutate({
      theme: selectedTheme,
      nationality: formData.nationality,
      scoringSystem: formData.scoring,
      units: formData.units,
      userType: userType === "professional" ? "professional" : "hunter",
      onboardingCompleted: true,
    });
  };

  const totalSteps = userType === "professional" ? 4 : 3;
  const getStepLabel = () => {
    if (step === 0) return "Welcome";
    if (userType === "professional") {
      if (step === 1) return "Your Business";
      if (step === 2) return "Theme";
      if (step === 3) return "Preferences";
    } else {
      if (step === 1) return "Theme";
      if (step === 2) return "Preferences";
    }
    return "";
  };

  const selectedCountry = COUNTRIES.find(c => c.code === formData.nationality);

  return (
    <div className="h-[100dvh] w-full bg-black text-white overflow-hidden relative">
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

      <div className="relative z-10 h-full flex flex-col overflow-y-auto">
        {step > 0 && (
          <div className="px-4 pt-4 flex items-center gap-3">
            <div className="flex gap-1 flex-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < step ? "bg-primary" : "bg-white/20")} />
              ))}
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">{getStepLabel()}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex-1 flex flex-col items-center justify-center px-4 py-6 sm:px-6 md:p-12 max-w-lg mx-auto"
            >
              <div className="text-center mb-8 md:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold mb-3 md:mb-4">Welcome to Honor The Hunt</h1>
                <p className="text-white/60 text-sm md:text-lg max-w-md mx-auto">
                  Tell us about yourself so we can tailor your experience.
                </p>
              </div>

              <div className="w-full space-y-4 max-w-sm">
                <button
                  onClick={() => { setUserType("hunter"); setStep(1); }}
                  data-testid="button-user-type-hunter"
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left",
                    "border-white/10 hover:border-primary/50 hover:bg-white/5"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Crosshair className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">Hunter</h3>
                    <p className="text-white/50 text-sm">Track and preserve your hunting legacy</p>
                  </div>
                </button>

                <button
                  onClick={() => { setUserType("professional"); setStep(1); }}
                  data-testid="button-user-type-professional"
                  className={cn(
                    "w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left",
                    "border-white/10 hover:border-primary/50 hover:bg-white/5"
                  )}
                >
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Briefcase className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg">Industry Professional</h3>
                    <p className="text-white/50 text-sm">Outfitter, Professional Hunter, or Taxidermist</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && userType === "professional" && (
            <motion.div
              key="step-pro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex-1 flex flex-col px-4 py-6 sm:px-6 md:p-12 max-w-2xl mx-auto"
            >
              <div className="text-center mb-6 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-2">Your Business</h1>
                <p className="text-white/60 text-sm md:text-base">Set up your professional profile</p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                <div className="space-y-5 md:space-y-6 bg-white/5 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10">
                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">What do you do?</label>
                    <div className="space-y-2">
                      {PRO_ENTITY_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setProData({ ...proData, entityType: type.id })}
                          data-testid={`button-entity-type-${type.id}`}
                          className={cn(
                            "w-full flex items-center gap-3 py-3 px-4 rounded-lg text-left border transition-all",
                            proData.entityType === type.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          <div>
                            <div className="text-sm font-medium">{type.label}</div>
                            <div className="text-xs opacity-70">{type.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">Business Name</label>
                    <Input
                      value={proData.businessName}
                      onChange={(e) => setProData({ ...proData, businessName: e.target.value })}
                      placeholder="e.g., Safari Outfitters LLC"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-business-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">Handle</label>
                    <Input
                      value={proData.businessHandle}
                      onChange={(e) => setProData({ ...proData, businessHandle: e.target.value })}
                      placeholder="@yourbusiness"
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      data-testid="input-business-handle"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">Location</label>
                    <LocationSearch
                      value={proData.location}
                      onChange={(loc, _lat, _lng) => setProData({ ...proData, location: loc })}
                      placeholder="e.g., Limpopo, South Africa"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 pb-2 gap-4">
                <Button variant="ghost" onClick={() => setStep(0)} className="text-white/60 hover:text-white" data-testid="button-back">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!proData.entityType || !proData.businessName || !proData.businessHandle}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-serif"
                  data-testid="button-next-step"
                >
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {((step === 1 && userType === "hunter") || (step === 2 && userType === "professional")) && (
            <motion.div
              key="step-theme"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex-1 flex flex-col px-4 py-6 sm:px-6 md:p-12 max-w-5xl mx-auto"
            >
              <div className="text-center mb-6 md:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold mb-2 md:mb-4">Set the Atmosphere</h1>
                <p className="text-white/60 text-sm md:text-lg max-w-xl mx-auto">
                  Choose the aesthetic that honors your legacy.
                </p>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 min-h-0">
                {THEMES.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      data-testid={`button-theme-${theme.id}`}
                      className={cn(
                        "cursor-pointer group relative rounded-xl overflow-hidden border-2 transition-all duration-300",
                        "h-[120px] sm:h-[160px] md:h-[280px]",
                        selectedTheme === theme.id
                          ? "border-primary scale-[1.02] md:scale-105 shadow-2xl shadow-primary/20"
                          : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={theme.image} alt={theme.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                      <div className="absolute inset-0 flex items-center md:items-end p-4 md:p-6">
                        <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0 w-full">
                          <Icon className="w-6 h-6 md:hidden shrink-0 text-white/80" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-0 md:mb-2">
                              <h3 className="text-base md:text-xl font-serif font-bold">{theme.name}</h3>
                              {selectedTheme === theme.id && (
                                <div className="bg-primary rounded-full p-1 ml-2">
                                  <Check className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed hidden sm:block">{theme.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 md:pt-8 pb-2">
                <Button variant="ghost" onClick={() => setStep(userType === "professional" ? 1 : 0)} className="text-white/60 hover:text-white" data-testid="button-back">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button
                  size="lg"
                  onClick={() => setStep(userType === "professional" ? 3 : 2)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-serif"
                  data-testid="button-next-step"
                >
                  Next Step <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {((step === 2 && userType === "hunter") || (step === 3 && userType === "professional")) && (
            <motion.div
              key="step-prefs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex-1 flex flex-col px-4 py-6 sm:px-6 md:p-12 max-w-2xl mx-auto"
            >
              <div className="text-center mb-4 md:mb-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-2 md:mb-4">Tailor Your Experience</h1>
                <p className="text-white/60 text-sm md:text-base">
                  Customize your dashboard and tools.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                <div className="space-y-5 md:space-y-8 bg-white/5 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl border border-white/10">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">
                      <Globe className="h-4 w-4 inline mr-2" />
                      Nationality
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      <Input
                        value={nationalitySearch}
                        onChange={(e) => setNationalitySearch(e.target.value)}
                        placeholder="Search countries..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-9"
                        data-testid="input-nationality-search"
                      />
                    </div>
                    {selectedCountry && (
                      <div className="flex items-center gap-2 py-1.5 px-3 bg-primary/20 border border-primary/50 rounded-lg text-sm w-fit">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span>{selectedCountry.name}</span>
                        <button
                          onClick={() => setFormData({ ...formData, nationality: "" })}
                          className="ml-1 text-white/50 hover:text-white"
                          data-testid="button-clear-nationality"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[140px] md:max-h-[160px] overflow-y-auto pr-1">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setFormData({ ...formData, nationality: country.code });
                            setNationalitySearch("");
                          }}
                          data-testid={`button-nationality-${country.code.toLowerCase()}`}
                          className={cn(
                            "flex items-center gap-2 py-2 px-3 rounded-lg text-xs border text-left transition-all",
                            formData.nationality === country.code
                              ? "bg-primary/20 border-primary/50 text-white"
                              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                          )}
                        >
                          <span className="text-base shrink-0">{country.flag}</span>
                          <span className="truncate">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">Scoring System</label>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {["SCI", "Boone & Crockett", "Rowland Ward"].map((option) => (
                        <button
                          key={option}
                          onClick={() => setFormData({...formData, scoring: option})}
                          data-testid={`button-scoring-${option.toLowerCase().replace(/\s/g, '-')}`}
                          className={cn(
                            "py-2.5 md:py-3 px-2 md:px-4 rounded-lg text-[11px] md:text-sm border transition-all",
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

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-xs md:text-sm font-medium text-white/80 uppercase tracking-wider">Measurement Units</label>
                    <div className="flex gap-2 md:gap-4 p-1 bg-white/5 rounded-lg border border-white/10 w-fit">
                      {["Imperial", "Metric"].map((option) => (
                        <button
                          key={option}
                          onClick={() => setFormData({...formData, units: option.toLowerCase()})}
                          data-testid={`button-units-${option.toLowerCase()}`}
                          className={cn(
                            "py-2 px-4 md:px-6 rounded-md text-xs md:text-sm transition-all",
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
                </div>

                <div className="mt-4 md:mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm">
                  <p className="text-xs md:text-sm text-white/70 italic leading-relaxed">
                    This is a space for hunters who are proud of what they do. We stand for ethical, responsible hunting as a force for conservation, connection, and tradition. If you share that belief — welcome home. If not, we kindly ask you to look elsewhere.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 pb-2 gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(userType === "professional" ? 2 : 1)}
                  className="text-white/60 hover:text-white"
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button
                  size="lg"
                  onClick={handleFinish}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 md:px-8 font-serif flex-1 sm:flex-none"
                  data-testid="button-finish"
                  disabled={savePreferencesMutation.isPending || createProProfileMutation.isPending}
                >
                  {(savePreferencesMutation.isPending || createProProfileMutation.isPending) ? "Saving..." : "Enter Honor The Hunt"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
