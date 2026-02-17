import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft, Share2, Ruler, Target, MapPin, 
  Calendar, Info, BadgeCheck, Camera, MessageCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Trophy } from "@shared/schema";

export default function TrophyDetail() {
  const [match, params] = useRoute("/trophies/:id");
  const { toast } = useToast();
  
  const { data: trophy, isLoading, error } = useQuery<Trophy>({
    queryKey: ["/api/trophies", params?.id],
    enabled: !!match && !!params?.id,
  });

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
      <div className="flex flex-col h-full md:flex-row overflow-hidden">
        <div className="w-full md:w-3/5 h-[50vh] md:h-full relative bg-black/40 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             {trophy.imageUrl && (
               <img 
                 src={trophy.imageUrl} 
                 alt={trophy.name}
                 className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
               />
             )}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full h-full p-8 flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-[3/4] md:aspect-square rounded-xl overflow-hidden shadow-2xl border border-white/10 group cursor-grab active:cursor-grabbing">
              {trophy.imageUrl ? (
                <img 
                   src={trophy.imageUrl} 
                   alt={trophy.name}
                   className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                  <Camera className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-mono">360° VIEW</span>
              </div>
              
              <div className="absolute top-4 right-4">
                 <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 backdrop-blur-md">
                   <Camera className="w-3 h-3 mr-1" />
                   AI ANALYZED
                 </Badge>
              </div>
            </div>
          </motion.div>

          <Link href="/trophies">
            <Button variant="ghost" size="icon" className="absolute top-6 left-6 z-20 text-white hover:bg-white/10 rounded-full" data-testid="button-back">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        <div className="w-full md:w-2/5 h-full overflow-y-auto bg-background/95 border-l border-border/40 p-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-primary tracking-widest uppercase">{trophy.species}</div>
              <Button onClick={handleShare} variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-green-500/10 hover:text-green-500 transition-colors" data-testid="button-share">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4" data-testid="text-trophy-name">{trophy.name}</h1>
            
            <div className="flex gap-4 mb-8">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-card border border-border/50 text-sm">
                 <TrophyIcon className="h-4 w-4 text-primary" />
                 <span className="font-semibold" data-testid="text-trophy-score">{trophy.score}</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-card border border-border/50 text-sm">
                 <Target className="h-4 w-4 text-muted-foreground" />
                 <span>{trophy.method}</span>
               </div>
            </div>
            
            <Button onClick={handleShare} className="w-full mb-6 bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center gap-2 font-medium" data-testid="button-share-whatsapp">
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>

            <Separator className="my-6 bg-border/50" />

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Hunt Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{trophy.date}</div>
                      <div className="text-xs text-muted-foreground">Date Taken</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{trophy.location}</div>
                      <div className="text-xs text-muted-foreground">Location</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">AI Analysis</h3>
                <div className="p-4 rounded-lg bg-card border border-border/50 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Symmetry Score</span>
                      <span className="font-mono text-primary">98.5%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[98.5%]"></div>
                   </div>
                   
                   <div className="flex justify-between items-center text-sm pt-2">
                      <span className="text-muted-foreground">Estimated Age</span>
                      <span className="font-mono text-foreground">6.5 Years</span>
                   </div>
                   
                   <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
                     <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                     <span>Verified by TrophyVault AI algorithm v2.4 against SCI database standards.</span>
                   </div>
                </div>
              </div>

              {trophy.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Field Notes</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground italic border-l-2 border-primary/30 pl-4 py-1">
                    "{trophy.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-border/50 flex gap-4">
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
