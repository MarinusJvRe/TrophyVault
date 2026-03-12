import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Zap, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  variant?: "first-trophy" | "limit-hit" | "leaderboard";
  currentTier?: string;
}

const TIER_FEATURES = {
  free: {
    name: "Free",
    features: ["3 AI-analyzed trophies", "1 3D model", "25 manual trophies", "Private/Public room"],
  },
  paid: {
    name: "Paid",
    price: "$9.99/mo",
    features: ["~100 AI analyses/month", "Unlimited 3D models", "Unlimited manual trophies", "Leaderboard eligible", "Full community features"],
  },
  pro: {
    name: "Pro",
    price: "$19.99/mo",
    features: ["~200 AI analyses/month", "Everything in Paid", "Pro badge & profile", "Referral dashboard", "Business tools"],
  },
};

export default function UpgradePrompt({ open, onClose, variant = "first-trophy", currentTier = "free" }: UpgradePromptProps) {
  if (!open) return null;

  const titles: Record<string, { heading: string; sub: string }> = {
    "first-trophy": {
      heading: "You Just Experienced the Magic",
      sub: "AI species identification, scoring analysis, and 3D modeling — all from a single photo. Unlock the full experience.",
    },
    "limit-hit": {
      heading: "You've Reached Your Limit",
      sub: "Upgrade your plan to continue using AI analysis and 3D modeling features.",
    },
    leaderboard: {
      heading: "Join the Leaderboard",
      sub: "Paid and Pro members can verify their identity and compete on the leaderboard.",
    },
  };

  const { heading, sub } = titles[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border/40 rounded-2xl max-w-lg w-full p-6 md:p-8 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-close-upgrade"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-2" data-testid="text-upgrade-heading">{heading}</h2>
            <p className="text-sm text-muted-foreground">{sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className={cn(
              "rounded-xl border p-4 transition-all",
              currentTier !== "free" ? "border-primary bg-primary/5" : "border-border/40"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-serif font-bold text-sm">{TIER_FEATURES.paid.name}</h3>
                <span className="text-xs text-primary font-medium ml-auto">{TIER_FEATURES.paid.price}</span>
              </div>
              <ul className="space-y-1.5">
                {TIER_FEATURES.paid.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                data-testid="button-upgrade-paid"
                onClick={onClose}
              >
                Upgrade to Paid
              </Button>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-amber-500" />
                <h3 className="font-serif font-bold text-sm">{TIER_FEATURES.pro.name}</h3>
                <span className="text-xs text-amber-500 font-medium ml-auto">{TIER_FEATURES.pro.price}</span>
              </div>
              <ul className="space-y-1.5">
                {TIER_FEATURES.pro.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-amber-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full mt-4 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-sm"
                data-testid="button-upgrade-pro"
                onClick={onClose}
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground">
            Payment integration coming soon. Contact us to upgrade your account.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
