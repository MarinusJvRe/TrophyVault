import Layout from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Filter, SlidersHorizontal, ChevronDown, Calendar, Ruler, MapPin, Box, Loader2, Clock, Lock, UserPlus, UserMinus, Star, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Trophy, UserPreferences } from "@shared/schema";
import { useTheme } from "@/lib/theme-context";
import AddTrophyDialog from "@/components/AddTrophyDialog";
import TrophyARViewer from "@/components/TrophyARViewer";
import UsageBanner from "@/components/UsageBanner";
import UpgradePrompt from "@/components/UpgradePrompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

import wallLodge from "@/assets/wall-lodge.png";
import wallManor from "@/assets/wall-manor-texture.png";
import wallMinimal from "@/assets/wall-minimal.png";

const WALL_TEXTURES: Record<string, { src: string; opacity: string }> = {
  lodge: { src: wallLodge, opacity: "opacity-[0.08]" },
  manor: { src: wallManor, opacity: "opacity-[0.10]" },
  minimal: { src: wallMinimal, opacity: "opacity-[0.06]" },
};

interface PublicRoomData {
  private: boolean;
  followStatus: "none" | "pending" | "following";
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  preferences?: { theme: string };
  trophies?: (Trophy & { badge?: { rank: number; badge: string } | null })[];
  rating?: { avgScore: number; totalRatings: number };
}

export default function TrophyRoom({ userId }: { userId?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [arTrophy, setArTrophy] = useState<Trophy | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { theme: ownTheme } = useTheme();
  const { user: currentUser } = useAuth();
  const isViewingOther = !!userId && userId !== currentUser?.id;

  const { data: ownTrophies = [], isLoading: ownLoading } = useQuery<Trophy[]>({
    queryKey: ["/api/trophies"],
    enabled: !isViewingOther,
  });

  const { data: ownPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
    enabled: !isViewingOther,
  });

  const { data: publicRoom, isLoading: publicLoading } = useQuery<PublicRoomData>({
    queryKey: ["/api/room", userId],
    queryFn: async () => {
      const res = await fetch(`/api/room/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Room not found");
      return res.json();
    },
    enabled: isViewingOther,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room", userId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room", userId] });
    },
  });

  const trophies = isViewingOther ? (publicRoom?.trophies || []) : ownTrophies;
  const isLoading = isViewingOther ? publicLoading : ownLoading;

  const roomTheme = isViewingOther
    ? (publicRoom?.preferences?.theme || "lodge")
    : ownTheme;
  const wallTexture = WALL_TEXTURES[roomTheme] || WALL_TEXTURES.lodge;

  useEffect(() => {
    if (!isViewingOther && ownPreferences && ownPreferences.firstTrophyUploaded && !ownPreferences.upgradePromptShown && ownPreferences.accountTier === "free") {
      const aiTrophies = ownTrophies.filter(t => t.isAiAnalyzed);
      if (aiTrophies.length === 1) {
        setShowUpgrade(true);
        apiRequest("PUT", "/api/preferences", { upgradePromptShown: true }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
        }).catch(() => {});
      }
    }
  }, [ownPreferences, ownTrophies, isViewingOther]);

  const filteredTrophies = trophies.filter(t => {
    const matchesSearch = (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSpecies ? t.species === filterSpecies : true;
    return matchesSearch && matchesFilter;
  });

  const uniqueSpecies = Array.from(new Set(trophies.map(t => t.species)));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (isViewingOther && publicRoom?.private) {
    const ownerName = publicRoom.user.firstName
      ? `${publicRoom.user.firstName} ${publicRoom.user.lastName || ""}`.trim()
      : "This user";
    return (
      <Layout>
        <div className="p-4">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-4" onClick={() => window.history.back()} data-testid="button-back-private">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Avatar className="h-20 w-20 mb-4 border-2 border-border/50">
            <AvatarImage src={publicRoom.user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-card text-2xl font-serif">
              {ownerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-serif font-bold text-foreground mb-2" data-testid="text-private-room">This Room is Private</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            {ownerName}'s trophy room is private. Follow them to request access.
          </p>
          {currentUser && (
            <Button
              onClick={() => {
                if (publicRoom.followStatus === "following") {
                  unfollowMutation.mutate();
                } else {
                  followMutation.mutate();
                }
              }}
              disabled={followMutation.isPending || unfollowMutation.isPending || publicRoom.followStatus === "pending"}
              className="gap-2"
              data-testid="button-follow-private"
            >
              {publicRoom.followStatus === "pending" ? (
                <>
                  <Clock className="h-4 w-4" /> Request Pending
                </>
              ) : publicRoom.followStatus === "following" ? (
                <>
                  <UserMinus className="h-4 w-4" /> Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Follow
                </>
              )}
            </Button>
          )}
        </div>
      </Layout>
    );
  }

  const ownerName = isViewingOther && publicRoom?.user
    ? (publicRoom.user.firstName
        ? `${publicRoom.user.firstName} ${publicRoom.user.lastName || ""}`.trim()
        : `User ${publicRoom.user.id.slice(0, 6)}`)
    : null;

  return (
    <Layout>
      <div className="relative min-h-full">
        <div
          className={cn("absolute inset-0 bg-repeat bg-[length:512px_512px] pointer-events-none", wallTexture.opacity)}
          style={{ backgroundImage: `url(${wallTexture.src})` }}
          data-testid="wall-cladding-background"
        />
        <div className="relative p-4 md:p-8 max-w-7xl mx-auto min-h-full">

        {isViewingOther && publicRoom?.user && (
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-3" onClick={() => window.history.back()} data-testid="button-back-room">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarImage src={publicRoom.user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-card text-xl font-serif">
                {ownerName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-serif font-bold text-foreground" data-testid="text-room-owner-name">{ownerName}'s Trophy Room</h2>
              <div className="flex items-center gap-3 justify-center sm:justify-start mt-1">
                <span className="text-sm text-muted-foreground">{trophies.length} trophies</span>
                {publicRoom.rating && publicRoom.rating.totalRatings > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{publicRoom.rating.avgScore.toFixed(1)}</span>
                    <span>({publicRoom.rating.totalRatings})</span>
                  </div>
                )}
              </div>
            </div>
            {currentUser && (
              <Button
                variant={publicRoom.followStatus === "following" ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  if (publicRoom.followStatus === "following") {
                    unfollowMutation.mutate();
                  } else {
                    followMutation.mutate();
                  }
                }}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className="gap-1.5"
                data-testid="button-follow-room"
              >
                {publicRoom.followStatus === "following" ? (
                  <><UserMinus className="h-3.5 w-3.5" /> Following</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5" /> Follow</>
                )}
              </Button>
            )}
          </div>
          </div>
        )}

        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1">
              {isViewingOther ? "Trophy Room" : "The Trophy Room"}
            </h1>
            {!isViewingOther && (
              <p className="text-sm text-muted-foreground max-w-md">
                Your curated collection of achievements.
              </p>
            )}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search trophies..." 
                className="pl-9 bg-card border-border/50 focus:border-primary/50 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-trophies"
              />
            </div>
            
            {!isViewingOther && (
              <>
                <Link href="/trophies/map">
                  <Button variant="outline" size="sm" className="gap-1.5 border-border/50 bg-card text-muted-foreground hover:text-foreground h-9" data-testid="button-show-on-map">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Show on Map</span>
                  </Button>
                </Link>

                <Link href="/trophies/timeline">
                  <Button variant="outline" size="sm" className="gap-1.5 border-border/50 bg-card text-muted-foreground hover:text-foreground h-9" data-testid="button-show-timeline">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Timeline</span>
                  </Button>
                </Link>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-border/50 bg-card text-muted-foreground hover:text-foreground h-9" data-testid="button-filter">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Filter</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                <DropdownMenuLabel>Species</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => setFilterSpecies(null)}>
                  All Species
                </DropdownMenuItem>
                {uniqueSpecies.map(s => (
                  <DropdownMenuItem key={s} onClick={() => setFilterSpecies(s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {!isViewingOther && (
          <div className="mb-4">
            <UsageBanner onUpgradeClick={() => setShowUpgrade(true)} />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {!isViewingOther && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setDialogOpen(true)}
              className="group aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-lg p-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              data-testid="button-add-trophy"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span className="text-xl text-primary font-light">+</span>
              </div>
              <h3 className="font-serif text-sm font-bold text-foreground mb-0.5">Add Trophy</h3>
              <p className="text-xs text-muted-foreground">Upload for AI Analysis</p>
            </motion.div>
          )}

          {filteredTrophies.map((trophy, i) => (
            <Link key={trophy.id} href={isViewingOther ? `/room/${userId}/trophy/${trophy.id}` : `/trophies/${trophy.id}`}>
              <div className="cursor-pointer h-full">
                <WallMountCard trophy={trophy} index={i} onViewAR={(e) => { e.preventDefault(); e.stopPropagation(); setArTrophy(trophy); }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>

      {!isViewingOther && <AddTrophyDialog open={dialogOpen} onOpenChange={setDialogOpen} />}

      {!isViewingOther && (
        <UpgradePrompt
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          variant="first-trophy"
          currentTier={ownPreferences?.accountTier || "free"}
        />
      )}

      {arTrophy?.glbUrl && (
        <TrophyARViewer
          glbUrl={arTrophy.glbUrl}
          species={arTrophy.species}
          mountType={arTrophy.mountType || null}
          theme={roomTheme}
          onClose={() => setArTrophy(null)}
        />
      )}
    </Layout>
  );
}

function WallMountCard({ trophy, index, onViewAR }: { trophy: Trophy, index: number, onViewAR: (e: React.MouseEvent) => void }) {
  const displayImage = trophy.renderImageUrl || trophy.glbPreviewUrl || trophy.imageUrl;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative aspect-square bg-card border border-border/30 rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
      data-testid={`card-trophy-${trophy.id}`}
    >
      <div className="absolute inset-0">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={trophy.species}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <span className="text-3xl text-muted-foreground/20">🏆</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {trophy.glbUrl && (
          <button
            onClick={onViewAR}
            className="bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/30 flex items-center gap-0.5 hover:bg-primary transition-colors"
            data-testid={`button-ar-${trophy.id}`}
          >
            <Box className="h-2.5 w-2.5" />
            3D
          </button>
        )}
        {!trophy.glbUrl && trophy.imageUrl && trophy.createdAt && (Date.now() - new Date(trophy.createdAt).getTime() < 30 * 60 * 1000) && (
          <div className="bg-background/70 backdrop-blur-sm text-muted-foreground text-[10px] px-1.5 py-0.5 rounded border border-border/30 flex items-center gap-0.5">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            3D
          </div>
        )}
        {trophy.score && (
          <div className="bg-background/70 backdrop-blur-sm text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-0.5">
            <Ruler className="h-2.5 w-2.5" />
            {trophy.score}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5">
        <p className="text-white text-xs font-semibold uppercase tracking-wide truncate">{trophy.species}</p>
        <p className="text-white/70 text-[10px] truncate mt-0.5">{trophy.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-white/60 text-[10px]">
            {new Date(trophy.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          </span>
          {trophy.gender && (
            <span className="text-white/60 text-[10px] capitalize">{trophy.gender}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
