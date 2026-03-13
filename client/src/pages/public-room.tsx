import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  ArrowLeft, Star, MapPin, Calendar, Camera, Trophy as TrophyIcon,
  X, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import wallLodge from "@/assets/wall-lodge.png";
import wallManor from "@/assets/wall-manor-texture.png";
import wallMinimal from "@/assets/wall-minimal.png";

const WALL_TEXTURES: Record<string, { src: string; opacity: string }> = {
  lodge: { src: wallLodge, opacity: "opacity-[0.08]" },
  manor: { src: wallManor, opacity: "opacity-[0.10]" },
  minimal: { src: wallMinimal, opacity: "opacity-[0.06]" },
};

function RankBadge({ badge }: { badge: { rank: number; badge: string } }) {
  const colors = {
    gold: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
    silver: "bg-gray-400/20 text-gray-400 border-gray-400/40",
    bronze: "bg-amber-700/20 text-amber-700 border-amber-700/40",
    top10: "bg-primary/20 text-primary border-primary/40",
  };
  const colorClass = colors[badge.badge as keyof typeof colors] || colors.top10;

  return (
    <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold", colorClass)} data-testid={`badge-rank-${badge.rank}`}>
      <TrophyIcon className="h-2.5 w-2.5" />
      #{badge.rank}
    </div>
  );
}

function StarRating({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={cn(
            "transition-colors",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
          data-testid={`button-star-${n}`}
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              (hover || value) >= n ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function PublicRoom() {
  const [match, params] = useRoute("/community/room/:userId");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrophy, setSelectedTrophy] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState(0);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/community/room", params?.userId],
    enabled: !!match && !!params?.userId,
  });

  const rateMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiRequest("POST", "/api/community/rate", {
        roomOwnerId: params?.userId,
        score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/room", params?.userId] });
      toast({ title: "Rating submitted", description: "Thanks for rating this trophy room!" });
    },
    onError: (error: Error) => {
      toast({ title: "Rating failed", description: error.message, variant: "destructive" });
    },
  });

  const handleRate = (score: number) => {
    setRatingValue(score);
    rateMutation.mutate(score);
  };

  if (!match) return <div>Not found</div>;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full flex-col gap-4">
          <p className="text-muted-foreground">Room not found or is private</p>
          <Link href="/community">
            <Button variant="outline" data-testid="button-back-to-community">Back to Community</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const { user: roomOwner, preferences, trophies: roomTrophies, rating } = data;
  const wallTexture = WALL_TEXTURES[preferences?.theme || "lodge"] || WALL_TEXTURES.lodge;
  const ownerName = roomOwner.firstName
    ? `${roomOwner.firstName} ${roomOwner.lastName || ""}`.trim()
    : `User ${roomOwner.id.slice(0, 6)}`;

  const isOwnRoom = currentUser && (currentUser as any).id === roomOwner.id;

  const huntLocations = (roomTrophies || [])
    .filter((t: any) => t.location)
    .map((t: any) => t.location);
  const uniqueLocations = Array.from(new Set(huntLocations));

  return (
    <Layout>
      <div className="relative min-h-full">
        <div
          className={cn("absolute inset-0 bg-repeat bg-[length:512px_512px] pointer-events-none", wallTexture.opacity)}
          style={{ backgroundImage: `url(${wallTexture.src})` }}
        />
        <div className="relative p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/community">
                <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-community">
                  <ArrowLeft className="h-4 w-4" />
                  Community
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={roomOwner.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-serif">
                    {ownerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl md:text-2xl font-serif font-bold text-primary" data-testid="text-room-owner-name">{ownerName}'s Trophy Room</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{roomTrophies?.length || 0} trophies</span>
                    {rating && rating.totalRatings > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {Number(rating.avgScore).toFixed(1)} ({rating.totalRatings})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!isOwnRoom && currentUser && (
              <Card className="bg-card/80 border-border/40">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-sm font-medium text-muted-foreground">Rate this room:</div>
                  <StarRating
                    value={ratingValue}
                    onChange={handleRate}
                    disabled={rateMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}
          </header>

          {uniqueLocations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Hunt Locations</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueLocations.map((loc, i) => (
                  <Badge key={i} variant="outline" className="border-primary/30 text-primary gap-1">
                    <MapPin className="h-3 w-3" />
                    {loc as string}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {(roomTrophies || []).map((trophy: any, i: number) => (
              <motion.div
                key={trophy.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative aspect-square bg-card border border-border/30 rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedTrophy(trophy)}
                data-testid={`card-public-trophy-${trophy.id}`}
              >
                <div className="absolute inset-0">
                  {(trophy.glbPreviewUrl || trophy.imageUrl) ? (
                    <img
                      src={trophy.glbPreviewUrl || trophy.imageUrl}
                      alt={trophy.species}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
                      <TrophyIcon className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>

                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                  {trophy.badge && <RankBadge badge={trophy.badge} />}
                  {trophy.score && (
                    <div className="bg-background/70 backdrop-blur-sm text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20">
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

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {(!roomTrophies || roomTrophies.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-serif text-lg">No trophies to display</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedTrophy && (
          <TrophyDetailModal trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}

function TrophyDetailModal({ trophy, onClose }: { trophy: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border/50 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-trophy-detail"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-card/90 backdrop-blur-md border-b border-border/30">
          <h2 className="font-serif font-bold text-lg text-primary">{trophy.species}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {(trophy.glbPreviewUrl || trophy.imageUrl) && (
            <div className="rounded-lg overflow-hidden border border-border/30">
              <img
                src={trophy.glbPreviewUrl || trophy.imageUrl}
                alt={trophy.species}
                className="w-full max-h-[40vh] object-contain bg-black/10"
                data-testid="img-modal-trophy"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary tracking-widest uppercase">{trophy.species}</span>
              {trophy.gender && (
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">{trophy.gender}</span>
              )}
              {trophy.badge && <RankBadge badge={trophy.badge} />}
            </div>
            <h3 className="text-xl font-serif font-bold" data-testid="text-modal-trophy-name">{trophy.name}</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {trophy.score && (
              <Badge variant="outline" className="border-primary/30 text-primary gap-1">
                <TrophyIcon className="h-3 w-3" />
                {trophy.score}
              </Badge>
            )}
            <Badge variant="outline" className="border-border/50 gap-1">
              <Calendar className="h-3 w-3" />
              {trophy.date}
            </Badge>
            {trophy.location && (
              <Badge variant="outline" className="border-border/50 gap-1">
                <MapPin className="h-3 w-3" />
                {trophy.location}
              </Badge>
            )}
          </div>

          {trophy.huntNotes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">Hunt Notes</h4>
              <p className="text-sm text-foreground/80 bg-background/50 p-3 rounded-lg border border-border/30">
                {trophy.huntNotes}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
