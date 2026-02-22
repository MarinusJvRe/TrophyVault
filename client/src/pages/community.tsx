import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Star, Users, ArrowUpRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Community() {
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<any[]>({
    queryKey: ["/api/community/rooms"],
  });

  const { data: myRoomRating, isLoading: ratingLoading } = useQuery<any>({
    queryKey: ["/api/my-room-rating"],
  });

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-full">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Community
          </h1>
          <p className="text-muted-foreground max-w-md">
            Compare your achievements, rate other trophy rooms, and climb the global leaderboards.
          </p>
        </header>

        <Tabs defaultValue="leaderboards" className="w-full">
          <TabsList className="bg-card border border-border/40 mb-8">
            <TabsTrigger value="leaderboards" className="font-serif" data-testid="tab-leaderboards">Global Leaderboards</TabsTrigger>
            <TabsTrigger value="ratemyroom" className="font-serif" data-testid="tab-ratemyroom">Rate My Room</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboards" className="space-y-6">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <LeaderboardCard 
                  title="Public Rooms" 
                  entries={rooms.map((room: any, i: number) => ({
                    rank: i + 1,
                    name: room.firstName ? `${room.firstName} ${room.lastName || ""}`.trim() : `User ${room.userId?.slice(0, 6)}`,
                    score: room.avgScore ? `${Number(room.avgScore).toFixed(1)}/5` : "No ratings",
                    location: room.theme || "Default",
                  }))}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-serif text-lg">No public rooms yet</p>
                <p className="text-sm mt-1">Make your room public in settings to appear here</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ratemyroom">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {roomsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : rooms.length > 0 ? (
                  <Card className="bg-card border-border/40 overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-serif font-bold mb-4">Public Rooms to Explore</h3>
                      <div className="space-y-4">
                        {rooms.slice(0, 5).map((room: any, i: number) => (
                          <div key={room.userId || i} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-primary/5 transition-colors">
                            <div>
                              <div className="text-sm font-medium" data-testid={`text-room-name-${i}`}>
                                {room.firstName ? `${room.firstName} ${room.lastName || ""}`.trim() : `User ${room.userId?.slice(0, 6)}`}
                              </div>
                              <div className="text-xs text-muted-foreground">{room.theme || "Default"} theme</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {room.avgScore && (
                                <Badge variant="outline" className="border-primary/30 text-primary">
                                  {Number(room.avgScore).toFixed(1)}/5
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border/40 overflow-hidden">
                    <CardContent className="p-6 text-center py-16">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No public rooms available to rate</p>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-primary/5 border-primary/20">
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

                     {ratingLoading ? (
                       <div className="flex items-center justify-center py-4">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                       </div>
                     ) : (
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
                     )}

                     <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10" data-testid="button-share-whatsapp">
                       <Share2 className="h-4 w-4" /> Share to WhatsApp
                     </Button>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function LeaderboardCard({ title, entries }: { title: string, entries: any[] }) {
  return (
    <Card className="bg-card border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry: any, i: number) => (
            <div key={i} className={cn("flex items-center justify-between p-2 rounded", entry.isUser ? "bg-primary/10 border border-primary/20" : "")} data-testid={`row-leaderboard-${i}`}>
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold", 
                  entry.rank === 1 ? "bg-yellow-500/20 text-yellow-500" : 
                  entry.rank === 2 ? "bg-gray-400/20 text-gray-400" : 
                  entry.rank === 3 ? "bg-amber-700/20 text-amber-700" : "text-muted-foreground"
                )}>
                  {entry.rank}
                </div>
                <div>
                  <div className="text-sm font-medium">{entry.name}</div>
                  <div className="text-xs text-muted-foreground">{entry.location}</div>
                </div>
              </div>
              <div className="font-mono font-bold text-sm">{entry.score}</div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground hover:text-primary" data-testid="button-view-ranking">
          View Full Ranking <ArrowUpRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
