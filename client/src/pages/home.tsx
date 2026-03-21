import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, MapPin, Calendar, Activity, Star, Crosshair, Shield, Award, Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";
import type { Trophy as TrophyType } from "@shared/schema";
import CommunityFeed from "@/components/CommunityFeed";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";
import trophyVaultLogo from "@assets/honor_hunt_logo_v2.png";

interface LeaderboardBadge {
  species: string;
  rank: number;
  badge: "gold" | "silver" | "bronze" | "top10";
}

interface Stats {
  totalHunts: number;
  qualifyingTrophies: number;
  scoringSystem: string;
  speciesCollected: number;
  recentSpecies: string | null;
  roomRating: number | null;
  roomRatingSource: "community" | "none";
  roomRatingCount: number;
  roomVisibility: string;
  weaponCount: number;
  furthestShot: string | null;
  furthestShotSpecies: string | null;
  accountTier: "free" | "paid" | "pro";
  leaderboardBadges: LeaderboardBadge[];
}

export default function Home() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data: trophies = [], isLoading: trophiesLoading } = useQuery<TrophyType[]>({
    queryKey: ["/api/trophies"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const sortedByUpload = [...trophies].sort((a, b) =>
    new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );
  const featuredTrophy = trophies.find(t => t.featured) || sortedByUpload[0] || null;

  const currentHero = theme === "manor" ? themeManor 
                     : theme === "minimal" ? themeMinimal 
                     : themeLodge;

  const isLoading = trophiesLoading || statsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const badges = stats?.leaderboardBadges || [];
  const hasBadges = badges.length > 0;
  const sortedBadges = [...badges].sort((a, b) => a.rank - b.rank);

  const badgeColors: Record<string, string> = {
    gold: "text-yellow-500",
    silver: "text-gray-400",
    bronze: "text-amber-700",
    top10: "text-primary",
  };

  const roomRating = stats?.roomRating;
  const roomRatingSource = stats?.roomRatingSource ?? "none";
  const isPrivate = (stats?.roomVisibility ?? "private") === "private";

  let ratingValue = "—";
  if (!isPrivate && roomRating !== null && roomRating !== undefined && roomRatingSource === "community") {
    ratingValue = roomRating.toFixed(1);
  } else if (!isPrivate) {
    ratingValue = "—";
  }

  return (
    <Layout>
      <div className="min-h-full pb-10">
        <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent z-10"></div>
          
          <motion.img 
            key={theme}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            src={currentHero} 
            alt="Lodge" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-center pt-12 md:pt-20 p-6 md:p-12 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className={`text-2xl md:text-6xl font-serif font-bold mb-2 md:mb-4 leading-tight ${theme === "minimal" ? "text-foreground" : "text-white drop-shadow-lg"}`} data-testid="text-hero-heading">
                Preserve your Legacy.<br/>
                <span className={`italic font-light ${theme === "minimal" ? "text-foreground/80" : "text-white/90"}`}>Honor the Hunt.</span>
              </h1>
              <p className={`text-sm md:text-lg max-w-xl mb-1 font-light mx-auto ${theme === "minimal" ? "text-muted-foreground" : "text-white/90 drop-shadow-md"}`} data-testid="text-hero-subtitle">
                {user?.firstName ? `${user.firstName}'s hunts at a glance.` : "Your hunts at a glance."}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-4 md:mt-6"
            >
              <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-12 md:h-20 w-auto opacity-90 drop-shadow-lg" data-testid="img-logo-dashboard-hero" />
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 mt-6 relative z-30">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          >
            <StatCard icon={Activity} label="Hunts" value={String(stats?.totalHunts ?? 0)} />
            <StatCard icon={Trophy} label="Qualifying Trophies" value={String(stats?.qualifyingTrophies ?? 0)} />
            <StatCard icon={MapPin} label="Species Collected" value={String(stats?.speciesCollected ?? 0)} />
            <StatCard icon={Star} label="Room Rating" value={ratingValue} />
            <StatCard icon={Shield} label="Weapons in Safe" value={String(stats?.weaponCount ?? 0)} />
            <StatCard icon={Crosshair} label="Furthest Shot" value={stats?.furthestShot || "—"} />
          </motion.div>
        </div>

        {hasBadges && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 mt-4 relative z-30">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-lg border border-[hsl(38_40%_55%_/_0.25)] bg-card/50 p-4"
            >
              <div className="flex flex-wrap items-center gap-3 justify-center">
                {sortedBadges.map((b, i) => {
                  const color = badgeColors[b.badge] || badgeColors.top10;
                  return (
                    <div
                      key={`${b.species}-${b.rank}`}
                      className="flex items-center gap-1.5"
                      data-testid={`medal-badge-${b.rank}-${i}`}
                    >
                      <Award className={`h-7 w-7 md:h-9 md:w-9 ${color}`} />
                      <span className={`text-xs md:text-sm font-bold ${color}`}>#{b.rank} {b.species}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}

        {featuredTrophy && (
          <div className="max-w-7xl mx-auto px-4 md:px-12 mt-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    Featured Trophy
                  </h2>
                </div>
                <Link href={`/trophies/${featuredTrophy.id}`}>
                  <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors">
                    View Details <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
              <FeaturedCard trophy={featuredTrophy} />
            </motion.div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 md:px-12 mt-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Community Feed
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Latest trophies from the community</p>
              </div>
              <Link href="/community">
                <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors">
                  View All <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
            <CommunityFeed />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div
      className="rounded-lg border border-[hsl(38_40%_55%_/_0.25)] bg-card/60 p-4 flex flex-col items-center text-center gap-2"
      data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xl font-serif font-bold text-foreground">{value}</span>
    </div>
  );
}

function FeaturedCard({ trophy }: { trophy: TrophyType }) {
  return (
    <Link href={`/trophies/${trophy.id}`}>
      <div
        className="group relative h-[280px] md:h-[350px] overflow-hidden rounded-xl border border-border/50 bg-card cursor-pointer"
        data-testid={`card-featured-trophy-${trophy.id}`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity" />
        {trophy.imageUrl && (
          <img 
            src={trophy.imageUrl} 
            alt={trophy.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        
        <div className="relative z-20 h-full flex flex-col justify-end p-5 md:p-8">
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">
                {trophy.species}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {new Date(trophy.date).getFullYear()}
              </span>
            </div>
            
            <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-2">{trophy.name}</h3>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {trophy.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {trophy.location}
                </div>
              )}
              {trophy.score && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  {trophy.score}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
