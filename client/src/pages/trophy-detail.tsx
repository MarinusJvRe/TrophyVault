import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft, Share2, Ruler, Target, MapPin, 
  Calendar, BadgeCheck, Camera, MessageCircle, Crosshair, X, Sword
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Trophy, Weapon } from "@shared/schema";

export default function TrophyDetail() {
  const [match, params] = useRoute("/trophies/:id");
  const { toast } = useToast();
  
  const { data: trophy, isLoading, error } = useQuery<Trophy>({
    queryKey: ["/api/trophies", params?.id],
    enabled: !!match && !!params?.id,
  });

  const { data: weapons = [] } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
    enabled: !!match,
  });

  const weapon = trophy?.weaponId ? weapons.find(w => w.id === trophy.weaponId) : null;

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

  if (!trophy) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Trophy not found</p>
        </div>
      </Layout>
    );
  }

  const handleShare = () => {
    const text = `Check out my ${trophy.species} trophy on TrophyVault! Score: ${trophy.score}.`;
    const url = `https://trophyvault.app/t/${trophy.id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "Preparing your trophy snapshot for sharing...",
    });
  };

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-12">
          <div className="relative">
            <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border/30">
              <Link href="/trophies">
                <Button variant="ghost" size="sm" className="gap-2 text-foreground hover:bg-card" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Vault
                </Button>
              </Link>
              <div className="flex gap-2">
                <Button onClick={handleShare} variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10" data-testid="button-share">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-4 pt-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-xl overflow-hidden bg-black/20 border border-border/30"
              >
                {trophy.imageUrl ? (
                  <img 
                    src={trophy.imageUrl} 
                    alt={trophy.species}
                    className="w-full max-h-[50vh] object-contain bg-black/10"
                    data-testid="img-trophy-photo"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-secondary/10">
                    <Camera className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 backdrop-blur-md text-xs">
                    <Camera className="w-3 h-3 mr-1" />
                    AI ANALYZED
                  </Badge>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="px-4 pt-6 space-y-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary tracking-widest uppercase">{trophy.species}</span>
                  {trophy.gender && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">{trophy.gender}</span>
                  )}
                </div>
                <h1 className="text-3xl font-serif font-bold text-foreground" data-testid="text-trophy-name">{trophy.name}</h1>
              </div>

              <div className="flex flex-wrap gap-3">
                {trophy.score && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
                    <TrophyIcon className="h-4 w-4 text-primary" />
                    <span className="font-semibold" data-testid="text-trophy-score">{trophy.score}</span>
                  </div>
                )}
                {trophy.method && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{trophy.method}</span>
                  </div>
                )}
                {trophy.shotDistance && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
                    <Crosshair className="h-4 w-4 text-muted-foreground" />
                    <span>{trophy.shotDistance}</span>
                  </div>
                )}
                {weapon && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50 text-sm">
                    <Sword className="h-4 w-4 text-muted-foreground" />
                    <span>{weapon.name}{weapon.caliber ? ` (${weapon.caliber})` : ""}</span>
                  </div>
                )}
              </div>

              <Button onClick={handleShare} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 font-medium" data-testid="button-share-whatsapp">
                <MessageCircle className="h-4 w-4" /> Share on WhatsApp
              </Button>

              <Separator className="bg-border/50" />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Hunt Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{trophy.date}</div>
                      <div className="text-xs text-muted-foreground">Date Taken</div>
                    </div>
                  </div>
                  {trophy.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{trophy.location}</div>
                        <div className="text-xs text-muted-foreground">Location</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">AI Analysis</h3>
                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
                  {trophy.score && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">TrophyVault Score</span>
                      <span className="font-mono text-primary font-semibold" data-testid="text-tv-score">
                        {trophy.score}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
                    <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Verified by TrophyVault AI algorithm against scoring database standards.</span>
                  </div>
                </div>
              </div>

              {trophy.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Trophy Notes</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
                    "{trophy.notes}"
                  </p>
                </div>
              )}

              {trophy.huntNotes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Hunt Notes</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
                    "{trophy.huntNotes}"
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-border/50 flex gap-4">
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-serif" data-testid="button-certificate">
                  Generate Official Certificate
                </Button>
                <Button variant="outline" className="border-border/50 text-foreground hover:bg-card" data-testid="button-edit">
                  Edit
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
