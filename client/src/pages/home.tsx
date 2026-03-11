import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, MapPin, Calendar, Activity, Star, Crosshair, Shield } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";
import type { Trophy as TrophyType } from "@shared/schema";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";
import trophyVaultLogo from "@assets/honor_the_hunt_logo_final.png";

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

  const featuredTrophy = trophies.find(t => t.featured) || null;

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

  const scoringLabel = stats?.scoringSystem === "Rowland Ward" ? "RW" 
    : stats?.scoringSystem === "Boone & Crockett" ? "B&C" 
    : "SCI";

  const sortedTrophies = [...trophies].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupedByYear: Record<string, TrophyType[]> = {};
  sortedTrophies.forEach(t => {
    const year = new Date(t.date).getFullYear().toString();
    if (!groupedByYear[year]) groupedByYear[year] = [];
    groupedByYear[year].push(t);
  });

  // Sort years in descending order (latest first), and sort trophies within each year by date descending
  const sortedYears = Object.keys(groupedByYear)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map(year => ({
      year,
      trophies: groupedByYear[year].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }));

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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-4 md:mb-6"
            >
              <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-16 md:h-28 w-auto opacity-90 drop-shadow-lg" data-testid="img-logo-dashboard-hero" />
            </motion.div>
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
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 mt-4 md:-mt-10 relative z-30 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          <StatCard 
            icon={Activity} 
            label="Hunts" 
            value={String(stats?.totalHunts ?? 0).padStart(2, "0")} 
            subtext="Total animals recorded" 
            delay={0.1}
          />
          <StatCard 
            icon={Trophy} 
            label="Qualifying Trophies" 
            value={String(stats?.qualifyingTrophies ?? 0).padStart(2, "0")} 
            subtext={`Meeting ${scoringLabel} minimums`} 
            delay={0.15}
          />
          <StatCard 
            icon={MapPin} 
            label="Species Collected" 
            value={String(stats?.speciesCollected ?? 0).padStart(2, "0")} 
            subtext={stats?.recentSpecies ? `Last: ${stats.recentSpecies}` : "No species yet"} 
            delay={0.2}
          />
          <RatingCard
            rating={stats?.roomRating ?? null}
            source={stats?.roomRatingSource ?? "none"}
            ratingCount={stats?.roomRatingCount ?? 0}
            roomVisibility={stats?.roomVisibility ?? "private"}
            delay={0.25}
          />
          <StatCard 
            icon={Shield} 
            label="Weapons in Safe" 
            value={String(stats?.weaponCount ?? 0).padStart(2, "0")} 
            subtext="Firearms & bows" 
            delay={0.3}
          />
          <StatCard 
            icon={Crosshair} 
            label="Furthest Shot" 
            value={stats?.furthestShot || "—"} 
            subtext={stats?.furthestShotSpecies || "No shots recorded"} 
            delay={0.35}
          />
        </div>

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
                <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">Trophy Timeline</h2>
                <p className="text-muted-foreground text-sm mt-1">Your hunting journey over time</p>
              </div>
              <Link href="/trophies">
                <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors">
                  View All <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            {sortedTrophies.length > 0 ? (
              <div className="space-y-8">
                {sortedYears.map(({ year, trophies: yearTrophies }) => (
                  <div key={year}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg font-serif font-bold text-primary">{year}</span>
                      <div className="flex-1 h-px bg-border/50"></div>
                      <span className="text-xs text-muted-foreground">{yearTrophies.length} {yearTrophies.length === 1 ? "hunt" : "hunts"}</span>
                    </div>
                    <div className="relative pl-6 md:pl-8 border-l-2 border-primary/20 space-y-4">
                      {yearTrophies.map((trophy, i) => (
                        <TimelineEntry key={trophy.id} trophy={trophy} index={i} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">No trophies yet</p>
                <p className="text-sm mt-1">Upload your first trophy to start your timeline</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, subtext, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-xl border-border/10 shadow-2xl h-full">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider truncate">{label}</p>
              <h3 className="text-xl md:text-2xl font-serif font-bold mt-1 text-foreground truncate" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</h3>
              <p className="text-[10px] md:text-xs text-primary mt-0.5 truncate">{subtext}</p>
            </div>
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg ml-2 shrink-0">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" data-testid="star-rating-display">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.min(1, Math.max(0, rating - (star - 1)));
        return (
          <div key={star} className="relative h-4 w-4 md:h-5 md:w-5">
            <Star className="absolute inset-0 h-4 w-4 md:h-5 md:w-5 text-primary/20" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-4 w-4 md:h-5 md:w-5 text-primary fill-primary" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingCard({ rating, source, ratingCount, roomVisibility, delay }: { rating: number | null; source: string; ratingCount: number; roomVisibility: string; delay: number }) {
  const isPrivate = roomVisibility === "private";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-xl border-border/10 shadow-2xl h-full">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[10px] md:text-xs font-medium uppercase tracking-wider">Room Rating</p>
              {isPrivate ? (
                <>
                  <div className="mt-1 h-[1.75rem] md:h-[2rem] flex items-center" data-testid="text-stat-room-rating">
                    <StarRating rating={0} />
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Unrated · Private</p>
                </>
              ) : rating !== null && source === "community" ? (
                <>
                  <div className="mt-1 h-[1.75rem] md:h-[2rem] flex items-center" data-testid="text-stat-room-rating">
                    <StarRating rating={rating} />
                  </div>
                  <p className="text-[10px] md:text-xs text-primary mt-0.5">{rating.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}</p>
                </>
              ) : (
                <>
                  <div className="mt-1 h-[1.75rem] md:h-[2rem] flex items-center" data-testid="text-stat-room-rating">
                    <StarRating rating={0} />
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">Unrated · No ratings yet</p>
                </>
              )}
            </div>
            <div className="p-2 md:p-3 bg-primary/10 rounded-lg ml-2 shrink-0">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
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

function TimelineEntry({ trophy, index }: { trophy: TrophyType; index: number }) {
  const dateStr = new Date(trophy.date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/trophies/${trophy.id}`}>
        <div className="relative group cursor-pointer">
          <div className="absolute -left-[calc(1.5rem+5px)] md:-left-[calc(2rem+5px)] top-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10"></div>

          <Card className="bg-card/80 border-border/30 hover:border-primary/30 transition-colors overflow-hidden">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3 md:gap-4">
                {trophy.imageUrl ? (
                  <img
                    src={trophy.imageUrl}
                    alt={trophy.species}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shrink-0 border border-border/30"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-border/30">
                    <Trophy className="h-5 w-5 text-primary/50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-primary uppercase tracking-wider">{dateStr}</span>
                    {trophy.featured && <Star className="h-3 w-3 text-primary fill-primary" />}
                  </div>
                  <h4 className="text-sm font-serif font-bold text-foreground truncate">{trophy.species}</h4>
                  {trophy.name && (
                    <p className="text-xs text-muted-foreground truncate">{trophy.name}</p>
                  )}
                </div>
                {trophy.score && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-serif font-bold text-primary">{trophy.score}</p>
                    <p className="text-[10px] text-muted-foreground">Score</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Link>
    </motion.div>
  );
}
