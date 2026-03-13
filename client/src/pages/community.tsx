import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy as TrophyIcon, Medal, Star, Users, ArrowUpRight, Share2, Search, ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Filter } from "lucide-react";
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
import { useState } from "react";
import { Link } from "wouter";

const PAGE_SIZE = 20;

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

export default function Community() {
  const [roomSearch, setRoomSearch] = useState("");
  const [roomSort, setRoomSort] = useState<string>("rating");
  const [roomPage, setRoomPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [leaderboardPage, setLeaderboardPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setRoomSearch(value);
    setRoomPage(0);
    clearTimeout((window as any).__communitySearchTimeout);
    (window as any).__communitySearchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const roomsQueryKey = ["/api/community/rooms", `?limit=${PAGE_SIZE}&offset=${roomPage * PAGE_SIZE}&sort=${roomSort}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`];
  const { data: roomsData, isLoading: roomsLoading } = useQuery<{ rooms: any[]; total: number }>({
    queryKey: roomsQueryKey,
  });

  const rooms = roomsData?.rooms ?? [];
  const roomsTotal = roomsData?.total ?? 0;
  const totalRoomPages = Math.ceil(roomsTotal / PAGE_SIZE);

  const { data: myRoomRating } = useQuery<any>({
    queryKey: ["/api/my-room-rating"],
  });

  const { data: speciesList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/species"],
  });

  const { data: locationsList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/locations"],
  });

  const leaderboardQueryKey = selectedSpecies
    ? ["/api/community/leaderboard", `?species=${encodeURIComponent(selectedSpecies)}&limit=${PAGE_SIZE}&offset=${leaderboardPage * PAGE_SIZE}${selectedRegion ? `&region=${encodeURIComponent(selectedRegion)}` : ""}`]
    : null;

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{ entries: any[]; total: number }>({
    queryKey: leaderboardQueryKey!,
    enabled: !!selectedSpecies,
  });

  const leaderboardEntries = leaderboardData?.entries ?? [];
  const leaderboardTotal = leaderboardData?.total ?? 0;
  const totalLeaderboardPages = Math.ceil(leaderboardTotal / PAGE_SIZE);

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
            Compare your achievements, rate other trophy rooms, and climb the global leaderboards.
          </p>
        </motion.header>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="bg-card border border-border/40 mb-8">
            <TabsTrigger value="rooms" className="font-serif" data-testid="tab-rooms">Public Rooms</TabsTrigger>
            <TabsTrigger value="leaderboards" className="font-serif" data-testid="tab-leaderboards">Species Leaderboards</TabsTrigger>
            <TabsTrigger value="ratemyroom" className="font-serif" data-testid="tab-ratemyroom">My Room</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9 bg-card border-border/50 h-9 text-sm"
                  value={roomSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  data-testid="input-search-rooms"
                />
              </div>
              <Select value={roomSort} onValueChange={(v) => { setRoomSort(v); setRoomPage(0); }}>
                <SelectTrigger className="w-[180px] bg-card border-border/50 h-9" data-testid="select-sort-rooms">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="trophies">Most Trophies</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roomsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : rooms.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {rooms.map((room: any, i: number) => {
                    const name = room.firstName ? `${room.firstName} ${room.lastName || ""}`.trim() : `User ${room.userId?.slice(0, 6)}`;
                    return (
                      <Link key={room.userId} href={`/community/room/${room.userId}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <Card className="bg-card border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer h-full" data-testid={`card-room-${room.userId}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="h-10 w-10 border border-primary/20">
                                  <AvatarImage src={room.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm">
                                    {name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate" data-testid={`text-room-name-${i}`}>{name}</div>
                                  <div className="text-xs text-muted-foreground">{room.theme || "Default"} theme</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-primary/30 text-primary gap-1 text-[10px]">
                                    <TrophyIcon className="h-2.5 w-2.5" />
                                    {room.trophyCount} trophies
                                  </Badge>
                                </div>
                                {room.avgScore > 0 && (
                                  <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="h-3 w-3 fill-yellow-500" />
                                    <span className="font-semibold">{Number(room.avgScore).toFixed(1)}</span>
                                    <span className="text-muted-foreground">({room.totalRatings})</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                {totalRoomPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoomPage(p => Math.max(0, p - 1))}
                      disabled={roomPage === 0}
                      data-testid="button-rooms-prev"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground" data-testid="text-rooms-page">
                      Page {roomPage + 1} of {totalRoomPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoomPage(p => Math.min(totalRoomPages - 1, p + 1))}
                      disabled={roomPage >= totalRoomPages - 1}
                      data-testid="button-rooms-next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">No public rooms found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? "Try a different search term" : "Make your room public in settings to appear here"}
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
                      {leaderboardEntries.map((entry: any, i: number) => {
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
                                entry.badge?.rank <= 3 ? "border-primary/30" : ""
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

                                {(entry.glbPreviewUrl || entry.imageUrl) && (
                                  <div className="h-10 w-10 rounded overflow-hidden border border-border/30 shrink-0">
                                    <img src={entry.glbPreviewUrl || entry.imageUrl} alt={entry.species} className="w-full h-full object-cover" />
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

          <TabsContent value="ratemyroom">
            <Card className="bg-primary/5 border-primary/20 max-w-md">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Your Room Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/40">
                  <div>
                    <div className="font-medium">Public Visibility</div>
                    <div className="text-xs text-muted-foreground">Allow others to rate your room</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500 text-green-500" data-testid="badge-room-status">
                      {myRoomRating ? "Live" : "Private"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background/50 rounded-lg border border-border/40 text-center">
                    <div className="text-2xl font-bold font-serif text-primary" data-testid="text-avg-score">
                      {myRoomRating?.avgScore ? Number(myRoomRating.avgScore).toFixed(1) : "--"}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Score</div>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg border border-border/40 text-center">
                    <div className="text-2xl font-bold font-serif text-primary" data-testid="text-total-ratings">
                      {myRoomRating?.totalRatings ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Ratings</div>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10" data-testid="button-share-whatsapp">
                  <Share2 className="h-4 w-4" /> Share to WhatsApp
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
