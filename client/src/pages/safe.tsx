import Layout from "@/components/Layout";
import { weapons, Weapon } from "@/lib/mock-data";
import { Plus, Search, Crosshair, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Safe() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWeapons = weapons.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8" />
              The Safe
            </h1>
            <p className="text-muted-foreground max-w-md">
              Manage your armory. Track details for every rifle, bow, and muzzleloader in your collection.
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search safe..." 
                className="pl-9 bg-card border-border/50 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Weapon</span>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New Placeholder - specific style for Safe */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="group min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer bg-card/30"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif font-bold text-foreground mb-1">Add to Safe</h3>
            <p className="text-sm text-muted-foreground">Register a new firearm or bow</p>
          </motion.div>

          {filteredWeapons.map((weapon, i) => (
            <WeaponCard key={weapon.id} weapon={weapon} index={i} />
          ))}
        </div>
      </div>
    </Layout>
  );
}

function WeaponCard({ weapon, index }: { weapon: Weapon, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.1 }}
    >
      <Card className="bg-card border-border/40 overflow-hidden hover:border-primary/50 transition-all group h-full">
        <div className="relative h-48 bg-black/40">
           {weapon.imageUrl ? (
             <img src={weapon.imageUrl} alt={weapon.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-secondary/10">
               <Crosshair className="h-12 w-12 text-muted-foreground/30" />
             </div>
           )}
           <div className="absolute top-3 right-3">
             <Badge variant="secondary" className="bg-background/80 backdrop-blur-md border border-white/10">
               {weapon.type}
             </Badge>
           </div>
        </div>
        
        <CardContent className="p-5">
          <h3 className="text-xl font-serif font-bold text-foreground mb-1">{weapon.name}</h3>
          <div className="text-sm text-primary font-medium mb-4">{weapon.make} {weapon.model}</div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
             {weapon.caliber && (
               <div className="flex justify-between border-b border-border/40 pb-2">
                 <span>Caliber</span>
                 <span className="text-foreground">{weapon.caliber}</span>
               </div>
             )}
             {weapon.optic && (
               <div className="flex justify-between border-b border-border/40 pb-2">
                 <span>Optic</span>
                 <span className="text-foreground">{weapon.optic}</span>
               </div>
             )}
             {weapon.notes && (
               <div className="pt-2 italic text-xs opacity-70">
                 "{weapon.notes}"
               </div>
             )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
