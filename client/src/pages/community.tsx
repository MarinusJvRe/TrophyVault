import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy as TrophyIcon, Medal, Star, Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, MapPin, Eye, Crosshair, UsersRound, Lock, Target } from "lucide-react";
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

const ROOMS_PAGE_SIZE = 10;
const LEADERBOARD_PAGE_SIZE = 20;

interface PublicRoom {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  theme: string | null;
  pursuit: string | null;
  huntingLocations: string[] | null;
  avgScore: number;
  totalRatings: number;
  trophyCount: number;
  createdAt: string | null;
}

interface RoomDetailData {
  user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
  preferences: Record<string, unknown> | null;
  trophies: { id: string; species: string; name: string; score: string | null; location: string | null; imageUrl: string | null }[];
  rating: { avgScore: number; totalRatings: number };
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

function RoomDetailPanel({ room, rooms, onSelectIndex }: { room: PublicRoom; rooms: PublicRoom[]; onSelectIndex: (i: number) => void }) {
  const name = room.firstName ? `${room.firstName} ${room.lastName || ""}`.trim() : `User ${room.userId?.slice(0, 6)}`;
  const regions = room.huntingLocations?.filter(Boolean) ?? [];
  const pursuit = room.pursuit;

  const { data: roomData } = useQuery<RoomDetailData | null>({
    queryKey: ["/api/community/room", room.userId],
    queryFn: async () => {
      const res = await fetch(`/api/community/room/${room.userId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!room.userId,
  });

  const speciesHighlights = (() => {
    const trophyList = roomData?.trophies;
    if (!trophyList || trophyList.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const t of trophyList) {
      if (t.species) counts[t.species] = (counts[t.species] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([species, count]) => ({ species, count }));
  })();

  const touchStartX = useRef(0);
  const currentIndex = rooms.findIndex((r) => r.userId === room.userId);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        onSelectIndex(currentIndex < rooms.length - 1 ? currentIndex + 1 : 0);
      } else if (diff < 0) {
        onSelectIndex(currentIndex > 0 ? currentIndex - 1 : rooms.length - 1);
      }
    }
  }, [currentIndex, rooms.length, onSelectIndex]);

  return (
    <motion.div
      key={room.userId}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Card className="bg-card border-primary/20 shadow-lg shadow-primary/5" data-testid="card-room-detail">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-14 w-14 border-2 border-primary/30 shrink-0">
                <AvatarImage src={room.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-serif text-lg">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-serif font-semibold text-foreground truncate" data-testid="text-detail-name">{name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {pursuit && (
                    <Badge variant="outline" className="border-primary/30 text-primary gap-1 text-[11px]">
                      <Crosshair className="h-3 w-3" />
                      {pursuit}
                    </Badge>
                  )}
                  {regions.length > 0 && regions.slice(0, 3).map((loc: string, i: number) => (
                    <Badge key={i} variant="outline" className="border-border/50 text-muted-foreground gap-1 text-[11px]">
                      <MapPin className="h-3 w-3" />
                      {loc}
                    </Badge>
                  ))}
                  {regions.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">+{regions.length - 3} more</span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <TrophyIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{room.trophyCount}</span>
                    <span className="text-xs text-muted-foreground">trophies</span>
                  </div>
                  {room.avgScore > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{Number(room.avgScore).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({room.totalRatings} {room.totalRatings === 1 ? "rating" : "ratings"})</span>
                    </div>
                  )}
                </div>

                {speciesHighlights.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Top Species</p>
                    <div className="flex flex-wrap gap-1.5">
                      {speciesHighlights.map(({ species, count }) => (
                        <Badge key={species} variant="secondary" className="text-[10px] gap-1 bg-muted/80">
                          <TrophyIcon className="h-2.5 w-2.5" />
                          {species} ({count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 md:flex-col md:justify-center">
              <Link href={`/community/room/${room.userId}`}>
                <Button size="sm" className="gap-2" data-testid="button-view-room">
                  <Eye className="h-4 w-4" />
                  View Room
                </Button>
              </Link>
              <div className="text-[10px] text-muted-foreground md:text-center">
                {currentIndex + 1} of {rooms.length}
                <span className="md:hidden"> · Swipe to browse</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const MOCK_GROUPS = [
  { id: "1", name: "Jones Family Rocky Mountains 2025", members: 6, trophies: 14, region: "Rocky Mountains, CO" },
  { id: "2", name: "Safari Brothers Limpopo 2025", members: 4, trophies: 22, region: "Limpopo, South Africa" },
  { id: "3", name: "Nordic Elk Hunters Club", members: 12, trophies: 38, region: "Northern Norway" },
];

export default function Community() {
  const [roomSearch, setRoomSearch] = useState("");
  const [roomSort, setRoomSort] = useState<string>("rating");
  const [roomPage, setRoomPage] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [leaderboardPage, setLeaderboardPage] = useState(0);

  const handleSearchChange = (value: string) => {
    setRoomSearch(value);
    setRoomPage(0);
    setSelectedRoomIndex(0);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const roomsQueryKey = ["/api/community/rooms", `?limit=${ROOMS_PAGE_SIZE}&offset=${roomPage * ROOMS_PAGE_SIZE}&sort=${roomSort}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`];
  const { data: roomsData, isLoading: roomsLoading } = useQuery<{ rooms: PublicRoom[]; total: number }>({
    queryKey: roomsQueryKey,
  });

  const rooms = roomsData?.rooms ?? [];
  const roomsTotal = roomsData?.total ?? 0;
  const totalRoomPages = Math.ceil(roomsTotal / ROOMS_PAGE_SIZE);

  useEffect(() => {
    setSelectedRoomIndex(0);
  }, [roomPage, roomSort, debouncedSearch]);

  const selectedRoom = rooms[selectedRoomIndex] ?? rooms[0];

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
            Compare your achievements, rate other trophy rooms, and climb the global leaderboards.
          </p>
        </motion.header>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="bg-card border border-border/40 mb-8">
            <TabsTrigger value="rooms" className="font-serif" data-testid="tab-rooms">Public Rooms</TabsTrigger>
            <TabsTrigger value="leaderboards" className="font-serif" data-testid="tab-leaderboards">Species Leaderboards</TabsTrigger>
            <TabsTrigger value="groups" className="font-serif" data-testid="tab-groups">My Groups</TabsTrigger>
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
              <Select value={roomSort} onValueChange={(v) => { setRoomSort(v); setRoomPage(0); setSelectedRoomIndex(0); }}>
                <SelectTrigger className="w-[180px] bg-card border-border/50 h-9" data-testid="select-sort-rooms">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="trophies">Most Trophies</SelectItem>
                  <SelectItem value="ratings">Most Ratings</SelectItem>
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
                {selectedRoom && (
                  <RoomDetailPanel
                    room={selectedRoom}
                    rooms={rooms}
                    onSelectIndex={setSelectedRoomIndex}
                  />
                )}

                <Card className="bg-card border-border/40">
                  <CardContent className="p-0">
                    <div className="hidden md:grid grid-cols-[2.5fr_1.5fr_1fr_0.8fr_0.6fr_0.6fr] gap-2 px-4 py-2.5 border-b border-border/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <div>Hunter</div>
                      <div>Regions</div>
                      <div>Pursuit</div>
                      <div className="text-center">Trophies</div>
                      <div className="text-center">Rating</div>
                      <div className="text-right"># Ratings</div>
                    </div>

                    <div className="divide-y divide-border/20">
                      {rooms.map((room, i) => {
                        const name = room.firstName ? `${room.firstName} ${room.lastName || ""}`.trim() : `User ${room.userId?.slice(0, 6)}`;
                        const regions = room.huntingLocations?.filter(Boolean) ?? [];
                        const isSelected = i === selectedRoomIndex;

                        return (
                          <motion.div
                            key={room.userId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                          >
                            <div
                              className={cn(
                                "flex flex-col md:grid md:grid-cols-[2.5fr_1.5fr_1fr_0.8fr_0.6fr_0.6fr] gap-1 md:gap-2 px-4 py-3 cursor-pointer transition-all",
                                isSelected
                                  ? "bg-primary/8 border-l-2 border-l-primary"
                                  : "hover:bg-muted/50 border-l-2 border-l-transparent"
                              )}
                              onClick={() => setSelectedRoomIndex(i)}
                              data-testid={`row-room-${room.userId}`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                                  <AvatarImage src={room.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-serif text-xs">
                                    {name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium truncate" data-testid={`text-room-name-${i}`}>{name}</span>
                              </div>

                              <div className="hidden md:flex items-center gap-1 flex-wrap">
                                {regions.length > 0 ? regions.slice(0, 2).map((loc: string, j: number) => (
                                  <span key={j} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {loc}
                                  </span>
                                )) : (
                                  <span className="text-[10px] text-muted-foreground/50">—</span>
                                )}
                                {regions.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">+{regions.length - 2}</span>
                                )}
                              </div>

                              <div className="hidden md:flex items-center">
                                {room.pursuit ? (
                                  <span className="text-xs text-muted-foreground truncate">{room.pursuit}</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50">—</span>
                                )}
                              </div>

                              <div className="hidden md:flex items-center justify-center">
                                <Badge variant="outline" className="border-primary/30 text-primary gap-1 text-[10px]">
                                  <TrophyIcon className="h-2.5 w-2.5" />
                                  {room.trophyCount}
                                </Badge>
                              </div>

                              <div className="hidden md:flex items-center justify-center gap-1">
                                {room.avgScore > 0 ? (
                                  <>
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-semibold">{Number(room.avgScore).toFixed(1)}</span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50">—</span>
                                )}
                              </div>

                              <div className="hidden md:flex items-center justify-end">
                                <span className="text-xs text-muted-foreground">{room.totalRatings || 0}</span>
                              </div>

                              <div className="flex md:hidden items-center gap-3 text-xs text-muted-foreground pl-11 flex-wrap">
                                {room.pursuit && (
                                  <span className="flex items-center gap-1">
                                    <Crosshair className="h-3 w-3" />
                                    {room.pursuit}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <TrophyIcon className="h-3 w-3 text-primary" />
                                  {room.trophyCount}
                                </span>
                                {room.avgScore > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    {Number(room.avgScore).toFixed(1)} ({room.totalRatings})
                                  </span>
                                )}
                                {regions.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {regions[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {totalRoomPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoomPage(p => p === 0 ? totalRoomPages - 1 : p - 1)}
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
                      onClick={() => setRoomPage(p => p >= totalRoomPages - 1 ? 0 : p + 1)}
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

                                {(entry.renderImageUrl || entry.glbPreviewUrl || entry.imageUrl) && (
                                  <div className="h-10 w-10 rounded overflow-hidden border border-border/30 shrink-0">
                                    <img src={entry.renderImageUrl || entry.glbPreviewUrl || entry.imageUrl} alt={entry.species} className="w-full h-full object-cover" />
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
