import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, SlidersHorizontal, ChevronDown, Calendar, Ruler } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Trophy } from "@shared/schema";
import { useTheme } from "@/lib/theme-context";
import AddTrophyDialog from "@/components/AddTrophyDialog";

import wallLodge from "@/assets/wall-lodge.png";
import wallManor from "@/assets/wall-manor-texture.png";
import wallMinimal from "@/assets/wall-minimal.png";

const WALL_TEXTURES: Record<string, { src: string; opacity: string }> = {
  lodge: { src: wallLodge, opacity: "opacity-[0.08]" },
  manor: { src: wallManor, opacity: "opacity-[0.10]" },
  minimal: { src: wallMinimal, opacity: "opacity-[0.06]" },
};

export default function TrophyRoom() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { theme } = useTheme();
  const wallTexture = WALL_TEXTURES[theme] || WALL_TEXTURES.lodge;

  const { data: trophies = [], isLoading } = useQuery<Trophy[]>({
    queryKey: ["/api/trophies"],
  });

  const filteredTrophies = trophies.filter(t => {
    const matchesSearch = (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.location || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSpecies ? t.species === filterSpecies : true;
    return matchesSearch && matchesFilter;
  });

  const uniqueSpecies = Array.from(new Set(trophies.map(t => t.species)));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-full">
        <div
          className={cn("absolute inset-0 bg-repeat bg-[length:512px_512px] pointer-events-none", wallTexture.opacity)}
          style={{ backgroundImage: `url(${wallTexture.src})` }}
          data-testid="wall-cladding-background"
        />
        <div className="relative p-4 md:p-8 max-w-7xl mx-auto min-h-full">
        <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-1">The Vault</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Your curated collection of achievements.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search trophies..." 
                className="pl-9 bg-card border-border/50 focus:border-primary/50 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-trophies"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-border/50 bg-card text-muted-foreground hover:text-foreground h-9" data-testid="button-filter">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Filter</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                <DropdownMenuLabel>Species</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => setFilterSpecies(null)}>
                  All Species
                </DropdownMenuItem>
                {uniqueSpecies.map(s => (
                  <DropdownMenuItem key={s} onClick={() => setFilterSpecies(s)}>
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setDialogOpen(true)}
            className="group aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-lg p-3 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            data-testid="button-add-trophy"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <span className="text-xl text-primary font-light">+</span>
            </div>
            <h3 className="font-serif text-sm font-bold text-foreground mb-0.5">Add Trophy</h3>
            <p className="text-xs text-muted-foreground">Upload for AI Analysis</p>
          </motion.div>

          {filteredTrophies.map((trophy, i) => (
            <Link key={trophy.id} href={`/trophies/${trophy.id}`}>
              <div className="cursor-pointer h-full">
                <WallMountCard trophy={trophy} index={i} />
              </div>
            </Link>
          ))}
        </div>
      </div>
      </div>

      <AddTrophyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}

function WallMountCard({ trophy, index }: { trophy: Trophy, index: number }) {
  const displayImage = trophy.renderImageUrl || trophy.imageUrl;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative aspect-square bg-card border border-border/30 rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
      data-testid={`card-trophy-${trophy.id}`}
    >
      <div className="absolute inset-0">
        {displayImage ? (
          <img 
            src={displayImage} 
            alt={trophy.species}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <span className="text-3xl text-muted-foreground/20">🏆</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {trophy.score && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-background/70 backdrop-blur-sm text-primary text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-0.5">
            <Ruler className="h-2.5 w-2.5" />
            {trophy.score}
          </div>
        </div>
      )}

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
    </motion.div>
  );
}
