import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy as TrophyIcon, Medal, Users, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import MyGroups, { useGroupInviteCount } from "@/components/MyGroups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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


export default function Community() {
  const inviteCount = useGroupInviteCount();

  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [selectedNationality, setSelectedNationality] = useState<string>("");
  const [leaderboardPage, setLeaderboardPage] = useState(0);

  const { data: speciesList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/species"],
  });

  const { data: nationalitiesList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/nationalities"],
  });

  const leaderboardQueryKey = selectedSpecies
    ? ["/api/community/leaderboard", `?species=${encodeURIComponent(selectedSpecies)}&limit=${LEADERBOARD_PAGE_SIZE}&offset=${leaderboardPage * LEADERBOARD_PAGE_SIZE}${selectedNationality ? `&nationality=${encodeURIComponent(selectedNationality)}` : ""}`]
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

        <Tabs defaultValue="leaderboards" className="w-full">
          <TabsList className="bg-card border border-border/40 mb-8">
            <TabsTrigger value="leaderboards" className="font-serif" data-testid="tab-leaderboards">Species Leaderboards</TabsTrigger>
            <TabsTrigger value="groups" className="font-serif relative" data-testid="tab-groups">
              My Groups
              {inviteCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground" data-testid="badge-tab-invite-count">
                  {inviteCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

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

              <Select value={selectedNationality} onValueChange={(v) => { setSelectedNationality(v === "__all__" ? "" : v); setLeaderboardPage(0); }}>
                <SelectTrigger className="w-full sm:w-[240px] bg-card border-border/50 h-9" data-testid="select-nationality">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All nationalities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All nationalities</SelectItem>
                  {nationalitiesList.map((nat: string) => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
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
                  {selectedNationality ? "Try removing the nationality filter" : "No trophies have scores recorded for this species yet"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <MyGroups />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
