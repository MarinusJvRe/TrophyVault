import Layout from "@/components/Layout";
import { Trophy, Medal, Star, Users, ArrowUpRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Community() {
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
            <TabsTrigger value="leaderboards" className="font-serif">Global Leaderboards</TabsTrigger>
            <TabsTrigger value="ratemyroom" className="font-serif">Rate My Room</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <LeaderboardCard 
                 title="Top Whitetail (B&C)" 
                 entries={[
                   { rank: 1, name: "J. Smith", score: "210 3/8", location: "Iowa, USA" },
                   { rank: 2, name: "A. Mueller", score: "204 1/8", location: "Kansas, USA" },
                   { rank: 3, name: "Hunter Doe", score: "198 2/8", location: "Ohio, USA", isUser: true },
                 ]}
               />
               <LeaderboardCard 
                 title="Top Kudu (SCI)" 
                 entries={[
                   { rank: 1, name: "P. Botha", score: "68\"", location: "Limpopo, RSA" },
                   { rank: 2, name: "S. Johnson", score: "64\"", location: "Eastern Cape, RSA" },
                   { rank: 3, name: "M. Weber", score: "62\"", location: "Namibia" },
                 ]}
               />
               <LeaderboardCard 
                 title="Room Rating" 
                 entries={[
                   { rank: 1, name: "Lodge 42", score: "9.8/10", location: "Classic Manor" },
                   { rank: 2, name: "Alpine_King", score: "9.7/10", location: "Alpine Gallery" },
                   { rank: 3, name: "Hunter Doe", score: "9.5/10", location: "Modern Lodge", isUser: true },
                 ]}
               />
            </div>
          </TabsContent>

          <TabsContent value="ratemyroom">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Featured Room to Rate */}
                <Card className="bg-card border-border/40 overflow-hidden">
                  <div className="relative h-64">
                    <img src="/assets/theme-manor.png" className="w-full h-full object-cover" alt="Room to rate" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-background/80 backdrop-blur-md text-foreground hover:bg-background/90">
                        Classic Manor
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold">The Royal Study</h3>
                        <p className="text-sm text-muted-foreground">Owned by @HighlandStalker</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Share2 className="h-4 w-4" /> Share
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Rate this room:</div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} className="text-muted-foreground hover:text-primary transition-colors">
                              <Star className="h-6 w-6" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full">Submit Rating</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* User's Room Status */}
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
                         <Badge variant="outline" className="border-green-500 text-green-500">Live</Badge>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-background/50 rounded-lg border border-border/40 text-center">
                         <div className="text-2xl font-bold font-serif text-primary">9.5</div>
                         <div className="text-xs text-muted-foreground uppercase tracking-wide">Avg Score</div>
                       </div>
                       <div className="p-4 bg-background/50 rounded-lg border border-border/40 text-center">
                         <div className="text-2xl font-bold font-serif text-primary">128</div>
                         <div className="text-xs text-muted-foreground uppercase tracking-wide">Ratings</div>
                       </div>
                     </div>

                     <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
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
          {entries.map((entry, i) => (
            <div key={i} className={cn("flex items-center justify-between p-2 rounded", entry.isUser ? "bg-primary/10 border border-primary/20" : "")}>
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
        <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground hover:text-primary">
          View Full Ranking <ArrowUpRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper to avoid circular dependency since we're not using the cn utility from lib here directly in the snippet above
// but actually we are importing it.
import { cn } from "@/lib/utils";
