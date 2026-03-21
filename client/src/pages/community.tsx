import Layout from "@/components/Layout";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy as TrophyIcon, Medal, Star, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Eye, Crosshair, UsersRound, Lock, Target, ThumbsUp, MessageCircle, Box, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

const FEED_PAGE_SIZE = 20;
const LEADERBOARD_PAGE_SIZE = 20;

interface FeedTrophy {
  trophy: {
    id: string;
    userId: string;
    species: string;
    name: string;
    date: string;
    location: string | null;
    score: string | null;
    imageUrl: string | null;
    renderImageUrl: string | null;
    glbUrl: string | null;
    glbPreviewUrl: string | null;
    isAiAnalyzed: boolean;
    createdAt: string | null;
  };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  applaudCount: number;
  score: string | null;
}

interface FeedResponse {
  items: FeedTrophy[];
  total: number;
  userApplauds: string[];
}

interface LeaderboardEntry {
  trophyId: string;
  trophyName: string;
  species: string;
  score: string;
  rank: number;
  location: string | null;
  imageUrl: string | null;
  glbPreviewUrl: string | null;
  renderImageUrl: string | null;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  badge?: { rank: number; badge: string } | null;
}

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

function TrophyFeedCard({
  item,
  isApplauded,
  onApplaud,
  onUnApplaud,
  isFollowed,
  onFollow,
  onUnfollow,
  isAuthenticated,
  currentUserId,
}: {
  item: FeedTrophy;
  isApplauded: boolean;
  onApplaud: (trophyId: string) => void;
  onUnApplaud: (trophyId: string) => void;
  isFollowed: boolean;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  isAuthenticated: boolean;
  currentUserId?: string;
}) {
  const { trophy, user, applaudCount } = item;
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : `User ${user.id.slice(0, 6)}`;
  const heroImage = trophy.renderImageUrl || trophy.imageUrl || trophy.glbPreviewUrl;
  const isOwnTrophy = currentUserId === user.id;
  const [localApplaudCount, setLocalApplaudCount] = useState(applaudCount);
  const [localApplauded, setLocalApplauded] = useState(isApplauded);

  useEffect(() => {
    setLocalApplaudCount(applaudCount);
  }, [applaudCount]);

  useEffect(() => {
    setLocalApplauded(isApplauded);
  }, [isApplauded]);

  const handleApplaud = () => {
    if (localApplauded) {
      setLocalApplauded(false);
      setLocalApplaudCount(c => Math.max(0, c - 1));
      onUnApplaud(trophy.id);
    } else {
      setLocalApplauded(true);
      setLocalApplaudCount(c => c + 1);
      onApplaud(trophy.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-border/30 bg-card shadow-lg"
      data-testid={`card-feed-trophy-${trophy.id}`}
    >
      <div className="relative">
        {heroImage ? (
          <img
            src={heroImage}
            alt={trophy.species}
            className="w-full aspect-[4/3] object-cover"
            data-testid={`img-feed-trophy-${trophy.id}`}
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-muted/30 flex items-center justify-center">
            <TrophyIcon className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <Link href={`/community/room/${user.id}`}>
              <div className="flex items-center gap-2 cursor-pointer" data-testid={`link-feed-user-${user.id}`}>
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs font-serif">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight drop-shadow">{userName}</p>
                  <p className="text-white/70 text-[11px] leading-tight drop-shadow">
                    {trophy.species} {trophy.location ? `• ${trophy.location}` : ""}
                  </p>
                </div>
              </div>
            </Link>

            {!isOwnTrophy && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-[11px] gap-1 rounded-full border",
                  isFollowed
                    ? "bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white"
                    : "bg-primary/80 text-white border-primary hover:bg-primary hover:text-white"
                )}
                onClick={() => isFollowed ? onUnfollow(user.id) : onFollow(user.id)}
                data-testid={`button-follow-${user.id}`}
              >
                {isFollowed ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {isFollowed ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>

        {trophy.score && trophy.isAiAnalyzed && (
          <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg" data-testid={`badge-score-${trophy.id}`}>
            AI Verified Score: {trophy.score}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-xs font-medium drop-shadow">
            {trophy.species} {trophy.location ? `• ${trophy.location}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/20">
        <div className="flex items-center gap-3">
          <button
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              localApplauded ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
            )}
            onClick={handleApplaud}
            disabled={!isAuthenticated}
            data-testid={`button-applaud-${trophy.id}`}
          >
            <ThumbsUp className={cn("h-4 w-4", localApplauded && "fill-primary")} />
            <span>Applaud</span>
            {localApplaudCount > 0 && <span className="text-xs">{localApplaudCount.toLocaleString()}</span>}
          </button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/50 cursor-default" data-testid={`button-comment-${trophy.id}`}>
            <MessageCircle className="h-4 w-4" />
            <span>0</span>
          </div>
        </div>

        {trophy.glbUrl && (
          <Link href={`/community/room/${user.id}`}>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" data-testid={`button-view3d-${trophy.id}`}>
              <Box className="h-3.5 w-3.5" />
              View in 3D
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

const MOCK_GROUPS = [
  { id: "1", name: "Jones Family Rocky Mountains 2025", members: 6, trophies: 14, region: "Rocky Mountains, CO" },
  { id: "2", name: "Safari Brothers Limpopo 2025", members: 4, trophies: 22, region: "Limpopo, South Africa" },
  { id: "3", name: "Nordic Elk Hunters Club", members: 12, trophies: 38, region: "Northern Norway" },
];

export default function Community() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [feedMode, setFeedMode] = useState<"global" | "following">("global");
  const [feedSearch, setFeedSearch] = useState("");
  const [feedSort, setFeedSort] = useState("newest");
  const [debouncedFeedSearch, setDebouncedFeedSearch] = useState("");
  const feedSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [leaderboardPage, setLeaderboardPage] = useState(0);

  const handleFeedSearchChange = (value: string) => {
    setFeedSearch(value);
    if (feedSearchTimeout.current) clearTimeout(feedSearchTimeout.current);
    feedSearchTimeout.current = setTimeout(() => {
      setDebouncedFeedSearch(value);
    }, 300);
  };

  const feedQueryParams = `?mode=${feedMode}&sort=${feedSort}&limit=${FEED_PAGE_SIZE}${debouncedFeedSearch ? `&species=${encodeURIComponent(debouncedFeedSearch)}&region=${encodeURIComponent(debouncedFeedSearch)}` : ""}`;

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["/api/community/feed", feedQueryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
      if (token) {
        headers["X-Auth-Token"] = token;
      }
      const res = await fetch(`/api/community/feed${feedQueryParams}&offset=${pageParam}`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
  });

  const allFeedItems = feedData?.pages.flatMap(p => p.items) ?? [];
  const allUserApplauds = new Set(feedData?.pages.flatMap(p => p.userApplauds) ?? []);

  const { data: followingList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/following"],
    enabled: isAuthenticated,
  });
  const followingSet = new Set(followingList);

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const applaudMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("POST", `/api/community/applaud/${trophyId}`);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const unApplaudMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("DELETE", `/api/community/applaud/${trophyId}`);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: speciesList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/species"],
  });

  const { data: locationsList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/locations"],
  });

  const leaderboardQueryKey = selectedSpecies
    ? ["/api/community/leaderboard", `?species=${encodeURIComponent(selectedSpecies)}&limit=${LEADERBOARD_PAGE_SIZE}&offset=${leaderboardPage * LEADERBOARD_PAGE_SIZE}${selectedRegion ? `&region=${encodeURIComponent(selectedRegion)}` : ""}`]
    : null;

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{ entries: LeaderboardEntry[]; total: number }>({
    queryKey: leaderboardQueryKey!,
    enabled: !!selectedSpecies,
  });

  const leaderboardEntries = leaderboardData?.entries ?? [];
  const leaderboardTotal = leaderboardData?.total ?? 0;
  const totalLeaderboardPages = Math.ceil(leaderboardTotal / LEADERBOARD_PAGE_SIZE);

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-full">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Community
          </h1>
          <p className="text-muted-foreground max-w-md">
            Browse trophy photos, applaud great hunts, and follow your favorite hunters.
          </p>
        </motion.header>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="bg-card border border-border/40 mb-8">
            <TabsTrigger value="feed" className="font-serif" data-testid="tab-feed">Legacy Feed</TabsTrigger>
            <TabsTrigger value="leaderboards" className="font-serif" data-testid="tab-leaderboards">Species Leaderboards</TabsTrigger>
            <TabsTrigger value="groups" className="font-serif" data-testid="tab-groups">My Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={feedMode === "global" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedMode("global")}
                  className="rounded-full"
                  data-testid="button-feed-global"
                >
                  Global Feed
                </Button>
                <Button
                  variant={feedMode === "following" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedMode("following")}
                  className="rounded-full"
                  disabled={!isAuthenticated}
                  data-testid="button-feed-following"
                >
                  Following
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search species or region..."
                    className="pl-9 bg-card border-border/50 h-9 text-sm"
                    value={feedSearch}
                    onChange={(e) => handleFeedSearchChange(e.target.value)}
                    data-testid="input-search-feed"
                  />
                </div>
                <Select value={feedSort} onValueChange={setFeedSort}>
                  <SelectTrigger className="w-[180px] bg-card border-border/50 h-9" data-testid="select-sort-feed">
                    <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="most_applauded">Most Applauded</SelectItem>
                    <SelectItem value="highest_score">Highest Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {feedLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : allFeedItems.length > 0 ? (
              <div className="max-w-2xl mx-auto space-y-6">
                {allFeedItems.map((item, i) => (
                  <TrophyFeedCard
                    key={`${item.trophy.id}-${i}`}
                    item={item}
                    isApplauded={allUserApplauds.has(item.trophy.id)}
                    onApplaud={(id) => applaudMutation.mutate(id)}
                    onUnApplaud={(id) => unApplaudMutation.mutate(id)}
                    isFollowed={followingSet.has(item.user.id)}
                    onFollow={(id) => followMutation.mutate(id)}
                    onUnfollow={(id) => unfollowMutation.mutate(id)}
                    isAuthenticated={isAuthenticated}
                    currentUserId={currentUser?.id}
                  />
                ))}

                <div ref={loadMoreRef} className="py-4 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  )}
                  {!hasNextPage && allFeedItems.length > 0 && (
                    <p className="text-sm text-muted-foreground">You've reached the end</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">
                  {feedMode === "following" ? "No trophies from users you follow" : "No trophies found"}
                </p>
                <p className="text-sm mt-1">
                  {feedMode === "following"
                    ? "Follow some hunters to see their trophies here"
                    : debouncedFeedSearch
                      ? "Try a different search term"
                      : "Be the first to share a trophy!"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboards" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Select value={selectedSpecies} onValueChange={(v) => { setSelectedSpecies(v); setLeaderboardPage(0); }}>
                <SelectTrigger className="w-full sm:w-[240px] bg-card border-border/50 h-9" data-testid="select-species">
                  <TrophyIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select a species..." />
                </SelectTrigger>
                <SelectContent>
                  {speciesList.map((sp: string) => (
                    <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v === "__all__" ? "" : v); setLeaderboardPage(0); }}>
                <SelectTrigger className="w-full sm:w-[240px] bg-card border-border/50 h-9" data-testid="select-region">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All regions</SelectItem>
                  {locationsList.map((loc: string) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedSpecies ? (
              <div className="text-center py-16 text-muted-foreground">
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">Select a species to view leaderboard</p>
                <p className="text-sm mt-1">Choose from the dropdown above to see top trophies ranked by score</p>
              </div>
            ) : leaderboardLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leaderboardEntries.length > 0 ? (
              <>
                <Card className="bg-card border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-serif text-primary flex items-center gap-2">
                      <Medal className="h-5 w-5" />
                      Top {selectedSpecies} by Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {leaderboardEntries.map((entry, i) => {
                        const entryName = entry.firstName ? `${entry.firstName} ${entry.lastName || ""}`.trim() : `User ${entry.userId?.slice(0, 6)}`;
                        return (
                          <motion.div
                            key={entry.trophyId}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-primary/5 transition-colors",
                                entry.badge?.rank && entry.badge.rank <= 3 ? "border-primary/30" : ""
                              )}
                              data-testid={`row-leaderboard-${entry.rank}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold",
                                  entry.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                                  entry.rank === 2 ? "bg-gray-400/20 text-gray-400" :
                                  entry.rank === 3 ? "bg-amber-700/20 text-amber-700" : "text-muted-foreground bg-card"
                                )}>
                                  {entry.rank}
                                </div>

                                {(entry.renderImageUrl || entry.glbPreviewUrl || entry.imageUrl) && (
                                  <div className="h-10 w-10 rounded overflow-hidden border border-border/30 shrink-0">
                                    <img src={entry.renderImageUrl || entry.glbPreviewUrl || entry.imageUrl!} alt={entry.species} className="w-full h-full object-cover" />
                                  </div>
                                )}

                                <div>
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    {entry.trophyName}
                                    {entry.badge && <RankBadge badge={entry.badge} />}
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{entryName}</span>
                                    {entry.location && (
                                      <>
                                        <span>·</span>
                                        <span>{entry.location}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="font-mono font-bold text-sm text-primary">{entry.score}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {totalLeaderboardPages > 1 && (
                      <div className="flex items-center justify-center gap-4 pt-4 mt-4 border-t border-border/30">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLeaderboardPage(p => Math.max(0, p - 1))}
                          disabled={leaderboardPage === 0}
                          data-testid="button-leaderboard-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground" data-testid="text-leaderboard-page">
                          Page {leaderboardPage + 1} of {totalLeaderboardPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLeaderboardPage(p => Math.min(totalLeaderboardPages - 1, p + 1))}
                          disabled={leaderboardPage >= totalLeaderboardPages - 1}
                          data-testid="button-leaderboard-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">No scored trophies found for {selectedSpecies}</p>
                <p className="text-sm mt-1">
                  {selectedRegion ? "Try removing the region filter" : "No trophies have scores recorded for this species yet"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Coming Soon</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Create or join hunting groups with shared trophy rooms
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_GROUPS.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: parseInt(group.id) * 0.1 }}
                >
                  <Card className="bg-card border-border/40 h-full relative overflow-hidden" data-testid={`card-group-${group.id}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardContent className="p-5 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-lg">
                            <UsersRound className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-serif font-semibold leading-tight">{group.name}</h3>
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {group.region}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{group.members} members</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TrophyIcon className="h-3.5 w-3.5 text-primary" />
                          <span>{group.trophies} trophies</span>
                        </div>
                      </div>

                      <div className="flex -space-x-2 mt-4">
                        {Array.from({ length: Math.min(group.members, 5) }).map((_, j) => (
                          <div
                            key={j}
                            className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                          >
                            {String.fromCharCode(65 + j)}
                          </div>
                        ))}
                        {group.members > 5 && (
                          <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-medium text-primary">
                            +{group.members - 5}
                          </div>
                        )}
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-4 gap-2 opacity-50 cursor-not-allowed" disabled data-testid={`button-join-group-${group.id}`}>
                        <Lock className="h-3.5 w-3.5" />
                        Join Group
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="bg-primary/5 border-primary/20 max-w-lg">
              <CardContent className="p-5">
                <h3 className="font-serif font-semibold text-sm mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  What are Groups?
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Create a group for your hunting trip (e.g. "Jones Family Rocky Mountains 2025")
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Share a communal trophy room with your group members
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Add your existing trophies to the group room, or load trophies on behalf of others
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    Group trophies can be added to your individual trophy room too
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
