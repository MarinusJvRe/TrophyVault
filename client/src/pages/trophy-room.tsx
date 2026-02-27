import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, SlidersHorizontal, ChevronDown, Calendar } from "lucide-react";
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
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.location.toLowerCase().includes(searchTerm.toLowerCase());
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
        <div className="relative p-6 md:p-12 max-w-7xl mx-auto min-h-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2">The Vault</h1>
            <p className="text-muted-foreground max-w-md">
              Your curated collection of achievements. Each trophy is preserved with 
              detailed scoring data and immersive imagery.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search trophies..." 
                className="pl-9 bg-card border-border/50 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-trophies"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-border/50 bg-card text-muted-foreground hover:text-foreground" data-testid="button-filter">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
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
            
            <Button variant="outline" size="icon" className="border-border/50 bg-card text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => setDialogOpen(true)}
            className="group min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
            data-testid="button-add-trophy"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-primary font-light">+</span>
            </div>
            <h3 className="font-serif font-bold text-foreground mb-1">Add New Trophy</h3>
            <p className="text-sm text-muted-foreground">Upload photos for AI Analysis</p>
          </motion.div>

          {filteredTrophies.map((trophy, i) => (
            <Link key={trophy.id} href={`/trophies/${trophy.id}`}>
              <div className="cursor-pointer h-full">
                <TrophyCard trophy={trophy} index={i} />
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

function TrophyCard({ trophy, index }: { trophy: Trophy, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-card border border-border/40 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
      data-testid={`card-trophy-${trophy.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {trophy.imageUrl ? (
          <img 
            src={trophy.imageUrl} 
            alt={trophy.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-secondary/10 flex items-center justify-center">
            <span className="text-4xl text-muted-foreground/30">🏆</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {trophy.score && (
          <div className="absolute top-3 right-3">
            <div className="bg-background/80 backdrop-blur-md text-primary text-xs font-bold px-2 py-1 rounded border border-primary/20">
              {trophy.score}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
            <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{trophy.species}</div>
            <h3 className="text-lg font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{trophy.name}</h3>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
           <div className="flex items-center gap-1">
             <Filter className="h-3 w-3" /> {trophy.method}
           </div>
           <div className="flex items-center gap-1">
             <Calendar className="h-3 w-3" /> {new Date(trophy.date).getFullYear()}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
