import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Trophy, MapPin, Calendar, Activity, Star } from "lucide-react";
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
import trophyVaultLogo from "@assets/1771685444234_edit_63733598053289_1771685576340.png";

export default function Home() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data: trophies = [], isLoading: trophiesLoading } = useQuery<TrophyType[]>({
    queryKey: ["/api/trophies"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalHunts: number;
    totalTrophies: number;
    speciesCollected: number;
    recentSpecies: string | null;
    roomRating: number | null;
    roomRatingSource: "community" | "auto";
    roomRatingCount: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const featuredTrophies = trophies.filter(t => t.featured);

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

  return (
    <Layout>
      <div className="min-h-full pb-10">
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10"></div>
          
          <motion.img 
            key={theme}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            src={currentHero} 
            alt="Lodge" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12 max-w-5xl mx-auto">
            <div className="absolute top-6 right-6 md:top-8 md:right-8">
              <img src={trophyVaultLogo} alt="TrophyVault" className="h-12 md:h-16 w-auto opacity-80" data-testid="img-logo-dashboard-hero" />
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className={`text-4xl md:text-6xl font-serif font-bold mb-4 leading-tight ${theme === "minimal" ? "text-foreground" : "text-white drop-shadow-lg"}`} data-testid="text-hero-heading">
                Preserve your Legacy.<br/>
                <span className={`italic font-light ${theme === "minimal" ? "text-foreground/80" : "text-white/90"}`}>Honor the Hunt.</span>
              </h1>
              <p className={`text-lg max-w-xl mb-2 font-light ${theme === "minimal" ? "text-muted-foreground" : "text-white/90 drop-shadow-md"}`} data-testid="text-hero-subtitle">
                {user?.firstName ? `${user.firstName}'s hunts at a glance.` : "Your hunts at a glance."}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-8 md:-mt-16 relative z-30 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatCard 
            icon={Activity} 
            label="Total Hunts" 
            value={String(stats?.totalHunts ?? 0).padStart(2, "0")} 
            subtext={`${stats?.totalHunts ?? 0} animals recorded`} 
            delay={0.1}
          />
          <StatCard 
            icon={Trophy} 
            label="Total Trophies" 
            value={String(stats?.totalTrophies ?? 0).padStart(2, "0")} 
            subtext="Qualifying scored animals" 
            delay={0.2}
          />
          <StatCard 
            icon={MapPin} 
            label="Species Collected" 
            value={String(stats?.speciesCollected ?? 0).padStart(2, "0")} 
            subtext={stats?.recentSpecies ? `Last: ${stats.recentSpecies}` : "No species yet"} 
            delay={0.3}
          />
          <RatingCard
            rating={stats?.roomRating ?? null}
            source={stats?.roomRatingSource ?? "auto"}
            ratingCount={stats?.roomRatingCount ?? 0}
            delay={0.4}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Recent Harvests</h2>
              <p className="text-muted-foreground mt-1">Latest additions to your collection</p>
            </div>
            <Link href="/trophies">
              <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors">
                View All <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          {featuredTrophies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredTrophies.map((trophy, index) => (
                <FeaturedCard key={trophy.id} trophy={trophy} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-serif text-lg">No featured trophies yet</p>
              <p className="text-sm mt-1">Mark trophies as featured to showcase them here</p>
            </div>
          )}
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
      <Card className="bg-card/90 backdrop-blur-xl border-border/10 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-foreground" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>{value}</h3>
              <p className="text-xs text-primary mt-1">{subtext}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
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
          <div key={star} className="relative h-5 w-5">
            <Star className="absolute inset-0 h-5 w-5 text-primary/20" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-5 w-5 text-primary fill-primary" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RatingCard({ rating, source, ratingCount, delay }: { rating: number | null; source: string; ratingCount: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-xl border-border/10 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Room Rating</p>
              {rating !== null ? (
                <>
                  <div className="mt-2 h-[2.25rem] flex items-center" data-testid="text-stat-room-rating">
                    <StarRating rating={rating} />
                  </div>
                  <p className="text-xs text-primary mt-1">
                    {source === "community"
                      ? `${rating.toFixed(1)} · public rating`
                      : `${rating.toFixed(1)} · private room rating`}
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-2 h-[2.25rem] flex items-center" data-testid="text-stat-room-rating">
                    <StarRating rating={0} />
                  </div>
                  <p className="text-xs text-primary mt-1">Add trophies to earn a rating</p>
                </>
              )}
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Star className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeaturedCard({ trophy, index }: { trophy: TrophyType, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + (index * 0.1) }}
      className="group relative h-[400px] overflow-hidden rounded-xl border border-border/50 bg-card"
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
      
      <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-8">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">
              {trophy.species}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(trophy.date).getFullYear()}
            </span>
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-foreground mb-2">{trophy.name}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {trophy.location}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {trophy.score}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="link" className="text-primary p-0 h-auto font-serif italic hover:no-underline">
              View full analysis &rarr;
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
