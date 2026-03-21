import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Palette, Globe, Target, Ruler, Eye, Check, Mountain, Home, Feather, LogOut, Camera, Crown, Zap, Shield, Briefcase, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";
import type { UserPreferences, ProProfile } from "@shared/schema";
import UsageBanner from "@/components/UsageBanner";
import UpgradePrompt from "@/components/UpgradePrompt";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

const THEMES = [
  { id: "lodge", name: "Timber Ridge", description: "Rugged timber, warm stone, mountain air.", image: themeLodge, icon: Mountain },
  { id: "manor", name: "Safari Manor", description: "Thatch, khaki canvas, and luxury leather.", image: themeManor, icon: Home },
  { id: "minimal", name: "Alpine Gallery", description: "Concrete, glass, and light.", image: themeMinimal, icon: Feather },
];

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "\u{1F1E6}\u{1F1EB}" },
  { code: "AL", name: "Albania", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "DZ", name: "Algeria", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "AD", name: "Andorra", flag: "\u{1F1E6}\u{1F1E9}" },
  { code: "AO", name: "Angola", flag: "\u{1F1E6}\u{1F1F4}" },
  { code: "AG", name: "Antigua and Barbuda", flag: "\u{1F1E6}\u{1F1EC}" },
  { code: "AR", name: "Argentina", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "AM", name: "Armenia", flag: "\u{1F1E6}\u{1F1F2}" },
  { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "AT", name: "Austria", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "AZ", name: "Azerbaijan", flag: "\u{1F1E6}\u{1F1FF}" },
  { code: "BS", name: "Bahamas", flag: "\u{1F1E7}\u{1F1F8}" },
  { code: "BH", name: "Bahrain", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "BD", name: "Bangladesh", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "BB", name: "Barbados", flag: "\u{1F1E7}\u{1F1E7}" },
  { code: "BY", name: "Belarus", flag: "\u{1F1E7}\u{1F1FE}" },
  { code: "BE", name: "Belgium", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "BZ", name: "Belize", flag: "\u{1F1E7}\u{1F1FF}" },
  { code: "BJ", name: "Benin", flag: "\u{1F1E7}\u{1F1EF}" },
  { code: "BT", name: "Bhutan", flag: "\u{1F1E7}\u{1F1F9}" },
  { code: "BO", name: "Bolivia", flag: "\u{1F1E7}\u{1F1F4}" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "\u{1F1E7}\u{1F1E6}" },
  { code: "BW", name: "Botswana", flag: "\u{1F1E7}\u{1F1FC}" },
  { code: "BR", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "BN", name: "Brunei", flag: "\u{1F1E7}\u{1F1F3}" },
  { code: "BG", name: "Bulgaria", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "BF", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}" },
  { code: "BI", name: "Burundi", flag: "\u{1F1E7}\u{1F1EE}" },
  { code: "KH", name: "Cambodia", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "CM", name: "Cameroon", flag: "\u{1F1E8}\u{1F1F2}" },
  { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "CV", name: "Cape Verde", flag: "\u{1F1E8}\u{1F1FB}" },
  { code: "CF", name: "Central African Republic", flag: "\u{1F1E8}\u{1F1EB}" },
  { code: "TD", name: "Chad", flag: "\u{1F1F9}\u{1F1E9}" },
  { code: "CL", name: "Chile", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CN", name: "China", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CO", name: "Colombia", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "KM", name: "Comoros", flag: "\u{1F1F0}\u{1F1F2}" },
  { code: "CG", name: "Congo", flag: "\u{1F1E8}\u{1F1EC}" },
  { code: "CR", name: "Costa Rica", flag: "\u{1F1E8}\u{1F1F7}" },
  { code: "HR", name: "Croatia", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "CU", name: "Cuba", flag: "\u{1F1E8}\u{1F1FA}" },
  { code: "CY", name: "Cyprus", flag: "\u{1F1E8}\u{1F1FE}" },
  { code: "CZ", name: "Czech Republic", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "DK", name: "Denmark", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "DJ", name: "Djibouti", flag: "\u{1F1E9}\u{1F1EF}" },
  { code: "DM", name: "Dominica", flag: "\u{1F1E9}\u{1F1F2}" },
  { code: "DO", name: "Dominican Republic", flag: "\u{1F1E9}\u{1F1F4}" },
  { code: "EC", name: "Ecuador", flag: "\u{1F1EA}\u{1F1E8}" },
  { code: "EG", name: "Egypt", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "SV", name: "El Salvador", flag: "\u{1F1F8}\u{1F1FB}" },
  { code: "GQ", name: "Equatorial Guinea", flag: "\u{1F1EC}\u{1F1F6}" },
  { code: "ER", name: "Eritrea", flag: "\u{1F1EA}\u{1F1F7}" },
  { code: "EE", name: "Estonia", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "SZ", name: "Eswatini", flag: "\u{1F1F8}\u{1F1FF}" },
  { code: "ET", name: "Ethiopia", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "FJ", name: "Fiji", flag: "\u{1F1EB}\u{1F1EF}" },
  { code: "FI", name: "Finland", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "GA", name: "Gabon", flag: "\u{1F1EC}\u{1F1E6}" },
  { code: "GM", name: "Gambia", flag: "\u{1F1EC}\u{1F1F2}" },
  { code: "GE", name: "Georgia", flag: "\u{1F1EC}\u{1F1EA}" },
  { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "GH", name: "Ghana", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "GR", name: "Greece", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "GD", name: "Grenada", flag: "\u{1F1EC}\u{1F1E9}" },
  { code: "GT", name: "Guatemala", flag: "\u{1F1EC}\u{1F1F9}" },
  { code: "GN", name: "Guinea", flag: "\u{1F1EC}\u{1F1F3}" },
  { code: "GW", name: "Guinea-Bissau", flag: "\u{1F1EC}\u{1F1FC}" },
  { code: "GY", name: "Guyana", flag: "\u{1F1EC}\u{1F1FE}" },
  { code: "HT", name: "Haiti", flag: "\u{1F1ED}\u{1F1F9}" },
  { code: "HN", name: "Honduras", flag: "\u{1F1ED}\u{1F1F3}" },
  { code: "HU", name: "Hungary", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "IS", name: "Iceland", flag: "\u{1F1EE}\u{1F1F8}" },
  { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ID", name: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "IR", name: "Iran", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IQ", name: "Iraq", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "IE", name: "Ireland", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "IL", name: "Israel", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "JM", name: "Jamaica", flag: "\u{1F1EF}\u{1F1F2}" },
  { code: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "JO", name: "Jordan", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "KZ", name: "Kazakhstan", flag: "\u{1F1F0}\u{1F1FF}" },
  { code: "KE", name: "Kenya", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "KI", name: "Kiribati", flag: "\u{1F1F0}\u{1F1EE}" },
  { code: "KW", name: "Kuwait", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "KG", name: "Kyrgyzstan", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "LA", name: "Laos", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "LV", name: "Latvia", flag: "\u{1F1F1}\u{1F1FB}" },
  { code: "LB", name: "Lebanon", flag: "\u{1F1F1}\u{1F1E7}" },
  { code: "LS", name: "Lesotho", flag: "\u{1F1F1}\u{1F1F8}" },
  { code: "LR", name: "Liberia", flag: "\u{1F1F1}\u{1F1F7}" },
  { code: "LY", name: "Libya", flag: "\u{1F1F1}\u{1F1FE}" },
  { code: "LI", name: "Liechtenstein", flag: "\u{1F1F1}\u{1F1EE}" },
  { code: "LT", name: "Lithuania", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "LU", name: "Luxembourg", flag: "\u{1F1F1}\u{1F1FA}" },
  { code: "MG", name: "Madagascar", flag: "\u{1F1F2}\u{1F1EC}" },
  { code: "MW", name: "Malawi", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "MY", name: "Malaysia", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "MV", name: "Maldives", flag: "\u{1F1F2}\u{1F1FB}" },
  { code: "ML", name: "Mali", flag: "\u{1F1F2}\u{1F1F1}" },
  { code: "MT", name: "Malta", flag: "\u{1F1F2}\u{1F1F9}" },
  { code: "MH", name: "Marshall Islands", flag: "\u{1F1F2}\u{1F1ED}" },
  { code: "MR", name: "Mauritania", flag: "\u{1F1F2}\u{1F1F7}" },
  { code: "MU", name: "Mauritius", flag: "\u{1F1F2}\u{1F1FA}" },
  { code: "MX", name: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "FM", name: "Micronesia", flag: "\u{1F1EB}\u{1F1F2}" },
  { code: "MD", name: "Moldova", flag: "\u{1F1F2}\u{1F1E9}" },
  { code: "MC", name: "Monaco", flag: "\u{1F1F2}\u{1F1E8}" },
  { code: "MN", name: "Mongolia", flag: "\u{1F1F2}\u{1F1F3}" },
  { code: "ME", name: "Montenegro", flag: "\u{1F1F2}\u{1F1EA}" },
  { code: "MA", name: "Morocco", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "MZ", name: "Mozambique", flag: "\u{1F1F2}\u{1F1FF}" },
  { code: "MM", name: "Myanmar", flag: "\u{1F1F2}\u{1F1F2}" },
  { code: "NA", name: "Namibia", flag: "\u{1F1F3}\u{1F1E6}" },
  { code: "NR", name: "Nauru", flag: "\u{1F1F3}\u{1F1F7}" },
  { code: "NP", name: "Nepal", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "NZ", name: "New Zealand", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "NI", name: "Nicaragua", flag: "\u{1F1F3}\u{1F1EE}" },
  { code: "NE", name: "Niger", flag: "\u{1F1F3}\u{1F1EA}" },
  { code: "NG", name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "KP", name: "North Korea", flag: "\u{1F1F0}\u{1F1F5}" },
  { code: "MK", name: "North Macedonia", flag: "\u{1F1F2}\u{1F1F0}" },
  { code: "NO", name: "Norway", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "OM", name: "Oman", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "PK", name: "Pakistan", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "PW", name: "Palau", flag: "\u{1F1F5}\u{1F1FC}" },
  { code: "PA", name: "Panama", flag: "\u{1F1F5}\u{1F1E6}" },
  { code: "PG", name: "Papua New Guinea", flag: "\u{1F1F5}\u{1F1EC}" },
  { code: "PY", name: "Paraguay", flag: "\u{1F1F5}\u{1F1FE}" },
  { code: "PE", name: "Peru", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "PH", name: "Philippines", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "PL", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "PT", name: "Portugal", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "QA", name: "Qatar", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "RO", name: "Romania", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "RU", name: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "RW", name: "Rwanda", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "\u{1F1F0}\u{1F1F3}" },
  { code: "LC", name: "Saint Lucia", flag: "\u{1F1F1}\u{1F1E8}" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "\u{1F1FB}\u{1F1E8}" },
  { code: "WS", name: "Samoa", flag: "\u{1F1FC}\u{1F1F8}" },
  { code: "SM", name: "San Marino", flag: "\u{1F1F8}\u{1F1F2}" },
  { code: "ST", name: "Sao Tome and Principe", flag: "\u{1F1F8}\u{1F1F9}" },
  { code: "SA", name: "Saudi Arabia", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "SN", name: "Senegal", flag: "\u{1F1F8}\u{1F1F3}" },
  { code: "RS", name: "Serbia", flag: "\u{1F1F7}\u{1F1F8}" },
  { code: "SC", name: "Seychelles", flag: "\u{1F1F8}\u{1F1E8}" },
  { code: "SL", name: "Sierra Leone", flag: "\u{1F1F8}\u{1F1F1}" },
  { code: "SG", name: "Singapore", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "SK", name: "Slovakia", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "SI", name: "Slovenia", flag: "\u{1F1F8}\u{1F1EE}" },
  { code: "SB", name: "Solomon Islands", flag: "\u{1F1F8}\u{1F1E7}" },
  { code: "SO", name: "Somalia", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "ZA", name: "South Africa", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "KR", name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "SS", name: "South Sudan", flag: "\u{1F1F8}\u{1F1F8}" },
  { code: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "LK", name: "Sri Lanka", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "SD", name: "Sudan", flag: "\u{1F1F8}\u{1F1E9}" },
  { code: "SR", name: "Suriname", flag: "\u{1F1F8}\u{1F1F7}" },
  { code: "SE", name: "Sweden", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Switzerland", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "SY", name: "Syria", flag: "\u{1F1F8}\u{1F1FE}" },
  { code: "TW", name: "Taiwan", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "TJ", name: "Tajikistan", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "TZ", name: "Tanzania", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "TH", name: "Thailand", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "TL", name: "Timor-Leste", flag: "\u{1F1F9}\u{1F1F1}" },
  { code: "TG", name: "Togo", flag: "\u{1F1F9}\u{1F1EC}" },
  { code: "TO", name: "Tonga", flag: "\u{1F1F9}\u{1F1F4}" },
  { code: "TT", name: "Trinidad and Tobago", flag: "\u{1F1F9}\u{1F1F9}" },
  { code: "TN", name: "Tunisia", flag: "\u{1F1F9}\u{1F1F3}" },
  { code: "TR", name: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "TM", name: "Turkmenistan", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "TV", name: "Tuvalu", flag: "\u{1F1F9}\u{1F1FB}" },
  { code: "UG", name: "Uganda", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "UA", name: "Ukraine", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "AE", name: "United Arab Emirates", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "UY", name: "Uruguay", flag: "\u{1F1FA}\u{1F1FE}" },
  { code: "UZ", name: "Uzbekistan", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "VU", name: "Vanuatu", flag: "\u{1F1FB}\u{1F1FA}" },
  { code: "VA", name: "Vatican City", flag: "\u{1F1FB}\u{1F1E6}" },
  { code: "VE", name: "Venezuela", flag: "\u{1F1FB}\u{1F1EA}" },
  { code: "VN", name: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "YE", name: "Yemen", flag: "\u{1F1FE}\u{1F1EA}" },
  { code: "ZM", name: "Zambia", flag: "\u{1F1FF}\u{1F1F2}" },
  { code: "ZW", name: "Zimbabwe", flag: "\u{1F1FF}\u{1F1FC}" },
];
const SCORING_SYSTEMS = ["SCI", "Boone & Crockett", "Rowland Ward"];

const TIER_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
  free: { label: "Free", color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border/40", icon: User },
  paid: { label: "Paid", color: "text-primary", bgColor: "bg-primary/20", borderColor: "border-primary/30", icon: Zap },
  pro: { label: "Pro", color: "text-amber-500", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/30", icon: Crown },
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const { data: proProfile } = useQuery<ProProfile>({
    queryKey: ["/api/pro/profile"],
  });

  const [selectedTheme, setSelectedTheme] = useState<"lodge" | "manor" | "minimal">(theme);
  const [nationality, setNationality] = useState("");
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [scoringSystem, setScoringSystem] = useState("SCI");
  const [units, setUnits] = useState("imperial");
  const [roomVisibility, setRoomVisibility] = useState("private");

  const filteredCountries = useMemo(() => {
    if (!nationalitySearch) return COUNTRIES;
    const q = nationalitySearch.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
  }, [nationalitySearch]);

  useEffect(() => {
    if (preferences) {
      setSelectedTheme((preferences.theme || "lodge") as "lodge" | "manor" | "minimal");
      setNationality(preferences.nationality || "");
      setScoringSystem(preferences.scoringSystem || "SCI");
      setUnits(preferences.units || "imperial");
      setRoomVisibility(preferences.roomVisibility || "private");
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload photo.", variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/verify-leaderboard", {
        realName: `${user?.firstName} ${user?.lastName}`,
        hasProfilePhoto: !!(preferences?.profileImageUrl || user?.profileImageUrl),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({ title: "Verified", description: "You are now eligible for the leaderboard." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Verification failed.", variant: "destructive" });
    },
  });

  const autoSave = (overrides: Record<string, any>) => {
    const data = {
      theme: selectedTheme,
      nationality,
      scoringSystem,
      units,
      roomVisibility,
      ...overrides,
    };
    saveMutation.mutate(data);
  };

  const handleThemeSelect = (id: "lodge" | "manor" | "minimal") => {
    setSelectedTheme(id);
    setTheme(id);
    autoSave({ theme: id });
  };

  const handleNationalitySelect = (code: string) => {
    setNationality(code);
    setNationalitySearch("");
    autoSave({ nationality: code });
  };

  const handleScoringSelect = (option: string) => {
    setScoringSystem(option);
    autoSave({ scoringSystem: option });
  };

  const handleUnitsSelect = (option: string) => {
    setUnits(option);
    autoSave({ units: option });
  };

  const handleVisibilityChange = (checked: boolean) => {
    const val = checked ? "public" : "private";
    setRoomVisibility(val);
    autoSave({ roomVisibility: val });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const profileImage = preferences?.profileImageUrl || user?.profileImageUrl;
  const accountTier = preferences?.accountTier || "free";
  const tierConfig = TIER_CONFIG[accountTier] || TIER_CONFIG.free;
  const TierIcon = tierConfig.icon;

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
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <User className="h-8 w-8" />
            Profile & Settings
          </h1>
          <p className="text-muted-foreground">Manage your account, preferences, and trophy room settings.</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
        <Card className="bg-card border-border/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={handlePhotoClick} data-testid="button-upload-photo">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-20 w-20 rounded-full border-2 border-primary/30 object-cover" data-testid="img-profile-avatar" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30" data-testid="img-profile-avatar">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </div>
                {uploadMutation.isPending && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-profile-photo"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-serif font-bold text-foreground" data-testid="text-profile-name">
                      {user?.firstName || ""} {user?.lastName || ""}
                    </h2>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                      tierConfig.bgColor, tierConfig.color, "border", tierConfig.borderColor
                    )} data-testid="badge-membership">
                      <TierIcon className="h-2.5 w-2.5" />
                      {tierConfig.label}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/50"
                    data-testid="button-profile-logout"
                    onClick={() => logout()}
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-profile-email">{user?.email || ""}</p>
                {accountTier === "free" && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    data-testid="button-profile-upgrade"
                  >
                    <Zap className="h-3 w-3" /> Upgrade your plan
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <UsageBanner onUpgradeClick={() => setShowUpgrade(true)} />
        </motion.div>

        {proProfile && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.17, ease: "easeOut" }}
          >
            <Card className="bg-card border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground text-sm">{proProfile.businessName}</div>
                      <div className="text-xs text-muted-foreground">Pro Dashboard — referrals, tags, and business tools</div>
                    </div>
                  </div>
                  <Link href="/pro">
                    <Button variant="outline" size="sm" className="gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10" data-testid="button-go-pro-dashboard">
                      Dashboard <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(accountTier === "paid" || accountTier === "pro") && !preferences?.leaderboardVerified && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
          >
            <Card className="bg-card border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="font-medium text-foreground text-sm">Leaderboard Verification</div>
                      <div className="text-xs text-muted-foreground">
                        Verify your identity to appear on leaderboards. Confirm your real name and add a profile photo.
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => verifyMutation.mutate()}
                    disabled={verifyMutation.isPending || !profileImage}
                    className="gap-1.5"
                    data-testid="button-verify-leaderboard"
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Verify"}
                  </Button>
                </div>
                {!profileImage && (
                  <p className="text-xs text-amber-500 mt-2 ml-8">Upload a profile photo first to verify.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {preferences?.leaderboardVerified && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
          >
            <Card className="bg-card border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">Leaderboard Verified</div>
                    <div className="text-xs text-muted-foreground">Your identity is verified. You can appear on leaderboards.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        >
        <Card className="bg-card border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">Public Trophy Room</div>
                  <div className="text-xs text-muted-foreground">
                    Allow others to view and rate your room.
                  </div>
                </div>
              </div>
              <Switch
                checked={roomVisibility === "public"}
                onCheckedChange={handleVisibilityChange}
                data-testid="switch-room-visibility"
              />
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="space-y-8"
        >
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
                  onClick={() => handleThemeSelect(t.id as "lodge" | "manor" | "minimal")}
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
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <Globe className="h-4 w-4 inline mr-2" />
                Nationality
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={nationalitySearch}
                  onChange={(e) => setNationalitySearch(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full bg-muted/30 border border-border/40 text-foreground placeholder:text-muted-foreground rounded-lg py-2 pl-9 pr-3 text-sm"
                  data-testid="input-nationality-search"
                />
              </div>
              {nationality && (
                <div className="flex items-center gap-2 py-1.5 px-3 bg-primary/10 border border-primary/50 rounded-lg text-sm w-fit">
                  <span className="text-lg">{COUNTRIES.find(c => c.code === nationality)?.flag}</span>
                  <span>{COUNTRIES.find(c => c.code === nationality)?.name}</span>
                  <button
                    onClick={() => { setNationality(""); autoSave({ nationality: "" }); }}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    data-testid="button-clear-nationality"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleNationalitySelect(country.code)}
                    data-testid={`button-nationality-${country.code.toLowerCase()}`}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3 rounded-lg text-sm border text-left transition-all",
                      nationality === country.code
                        ? "bg-primary/10 border-primary/50 text-foreground"
                        : "bg-card border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-base shrink-0">{country.flag}</span>
                    <span className="truncate">{country.name}</span>
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
                    onClick={() => handleScoringSelect(option)}
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
                    onClick={() => handleUnitsSelect(option.toLowerCase())}
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
        </motion.div>

      </div>

      <UpgradePrompt
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        variant="limit-hit"
        currentTier={accountTier}
      />
    </Layout>
  );
}
