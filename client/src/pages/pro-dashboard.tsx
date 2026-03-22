import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, Users, DollarSign, TrendingUp, Tag, Copy, Check, ExternalLink, Briefcase } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/posthog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProProfile, Trophy } from "@shared/schema";

export default function ProDashboard() {
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ProProfile>({
    queryKey: ["/api/pro/profile"],
  });

  const { data: referralData } = useQuery<{
    referrals: any[];
    stats: { totalReferrals: number; convertedReferrals: number; pendingPayout: number };
    referralCode: string;
    referralLink: string;
  }>({
    queryKey: ["/api/pro/referrals"],
    enabled: !!profile,
  });

  const { data: tagData } = useQuery<{
    totalTags: number;
    recentTags: Trophy[];
  }>({
    queryKey: ["/api/pro/tags"],
    enabled: !!profile,
  });

  const handleCopyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(`${window.location.origin}${referralData.referralLink}`);
      setCopied(true);
      trackEvent("referral_link_shared", {
        referralCode: referralData.referralCode,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-serif font-bold text-foreground mb-2">Pro Dashboard</h2>
            <p className="text-sm text-muted-foreground">You need a Pro profile to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const ENTITY_LABELS: Record<string, string> = {
    outfitter: "Outfitter",
    professional_hunter: "Professional Hunter",
    taxidermist: "Taxidermist",
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">Pro Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30" data-testid="badge-pro">
              <Briefcase className="h-2.5 w-2.5" />
              {ENTITY_LABELS[profile.entityType] || "Pro"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{profile.businessName}</p>
        </motion.header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border/40">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground" data-testid="stat-total-referrals">{referralData?.stats.totalReferrals || 0}</div>
                <div className="text-xs text-muted-foreground">Total Referrals</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border/40">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground" data-testid="stat-converted-referrals">{referralData?.stats.convertedReferrals || 0}</div>
                <div className="text-xs text-muted-foreground">Converted</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border/40">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground" data-testid="stat-pending-payout">${(referralData?.stats.pendingPayout || 0).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Pending Payout</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border/40">
              <CardContent className="p-4 text-center">
                <Tag className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground" data-testid="stat-total-tags">{tagData?.totalTags || 0}</div>
                <div className="text-xs text-muted-foreground">Hunt Tags</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="bg-card border-border/40">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5 text-primary" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/30 rounded-lg border border-border/40 px-3 py-2.5 text-sm text-muted-foreground font-mono truncate" data-testid="text-referral-link">
                  {referralData ? `${window.location.origin}${referralData.referralLink}` : "Loading..."}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1.5 shrink-0"
                  data-testid="button-copy-referral"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this link to earn referral bonuses when users sign up.</p>
            </CardContent>
          </Card>
        </motion.div>

        {tagData && tagData.recentTags.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-lg">
                  <Tag className="h-5 w-5 text-primary" />
                  Recent Hunt Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tagData.recentTags.map((trophy) => (
                    <div key={trophy.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/20 border border-border/20" data-testid={`tag-trophy-${trophy.id}`}>
                      {trophy.imageUrl && (
                        <img src={trophy.renderImageUrl || trophy.glbPreviewUrl || trophy.imageUrl} alt={trophy.species} className="h-10 w-10 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{trophy.species}</div>
                        <div className="text-xs text-muted-foreground">{trophy.location || trophy.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
