import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy as TrophyIcon, Medal, Star, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Eye, Crosshair, UsersRound, Lock, Target } from "lucide-react";
import CommunityFeed from "@/components/CommunityFeed";
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
import { useState, useRef } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const LEADERBOARD_PAGE_SIZE = 20;

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

const MOCK_GROUPS = [
  { id: "1", name: "Jones Family Rocky Mountains 2025", members: 6, trophies: 14, region: "Rocky Mountains, CO" },
  { id: "2", name: "Safari Brothers Limpopo 2025", members: 4, trophies: 22, region: "Limpopo, South Africa" },
  { id: "3", name: "Nordic Elk Hunters Club", members: 12, trophies: 38, region: "Northern Norway" },
];

export default function Community() {
  const { isAuthenticated } = useAuth();

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

            <CommunityFeed feedMode={feedMode} feedSort={feedSort} debouncedSearch={debouncedFeedSearch} />
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
                                    <Link href={`/room/${entry.userId}`}>
                                      <span className="hover:text-primary cursor-pointer transition-colors" data-testid={`link-leaderboard-user-${entry.userId}`}>{entryName}</span>
                                    </Link>
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
