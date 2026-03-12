import { useQuery } from "@tanstack/react-query";
import { Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageData {
  tier: string;
  monthly: { totalCost: number; aiAnalyses: number; models3d: number; renders: number };
  lifetime: { aiAnalyses: number; models3d: number };
  limits: { maxAiAnalyses: number | null; max3dModels: number | null; maxManualTrophies: number | null; monthlyCostCap: number | null };
  remaining: { aiAnalyses: number | null; models3d: number | null; monthlyBudget: number | null };
}

export default function UsageBanner({ onUpgradeClick }: { onUpgradeClick?: () => void }) {
  const { data: usage } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  if (!usage) return null;

  const { tier, remaining, lifetime, limits } = usage;

  if (tier === "free") {
    const aiUsed = lifetime.aiAnalyses;
    const aiMax = limits.maxAiAnalyses || 3;
    const modelsUsed = lifetime.models3d;
    const modelsMax = limits.max3dModels || 1;
    const nearLimit = aiUsed >= aiMax - 1 || modelsUsed >= modelsMax;
    const atLimit = aiUsed >= aiMax && modelsUsed >= modelsMax;

    if (aiUsed === 0 && modelsUsed === 0) return null;

    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs",
        atLimit ? "bg-destructive/10 border-destructive/30 text-destructive" :
        nearLimit ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
        "bg-primary/5 border-primary/20 text-muted-foreground"
      )} data-testid="banner-usage">
        {atLimit ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Zap className="h-3.5 w-3.5 shrink-0" />}
        <span>
          AI Analyses: {aiUsed}/{aiMax} used
          {" · "}
          3D Models: {modelsUsed}/{modelsMax} used
        </span>
        {nearLimit && onUpgradeClick && (
          <button onClick={onUpgradeClick} className="ml-auto text-primary hover:underline font-medium" data-testid="button-usage-upgrade">
            Upgrade
          </button>
        )}
      </div>
    );
  }

  if (tier === "paid" || tier === "pro") {
    const budget = usage.remaining.monthlyBudget;
    const cap = usage.limits.monthlyCostCap || 0;
    const used = cap - (budget || 0);
    const pct = cap > 0 ? (used / cap) * 100 : 0;
    const nearLimit = pct >= 80;

    if (pct < 20) return null;

    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs",
        nearLimit ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-primary/5 border-primary/20 text-muted-foreground"
      )} data-testid="banner-usage">
        <Zap className="h-3.5 w-3.5 shrink-0" />
        <div className="flex-1">
          <span>Monthly budget: ${used.toFixed(2)}/${cap.toFixed(2)} used</span>
          <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", nearLimit ? "bg-amber-500" : "bg-primary")} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
