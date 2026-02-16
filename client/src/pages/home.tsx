import Layout from "@/components/Layout";
import { trophies, heroImage } from "@/lib/mock-data";
import { ArrowRight, Trophy, MapPin, Calendar, Activity } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  const featuredTrophies = trophies.filter(t => t.featured);

  return (
    <Layout>
      <div className="min-h-full pb-10">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
          <img 
            src={heroImage} 
            alt="Lodge" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12 max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md mb-4">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-xs font-medium text-primary tracking-wider uppercase">AI Analysis Ready</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight">
                Preserve the Legacy.<br/>
                <span className="text-white/80 italic font-light">Honor the Hunt.</span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl mb-8 font-light">
                Your digital trophy room, enhanced with AI identification and 3D modeling. 
                Track your achievements with precision and elegance.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-serif tracking-wide">
                  <Link href="/trophies">View Trophy Room</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                  Start New Expedition
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-16 relative z-30 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            icon={Trophy} 
            label="Total Trophies" 
            value="24" 
            subtext="+3 this season" 
            delay={0.1}
          />
          <StatCard 
            icon={MapPin} 
            label="Countries Hunted" 
            value="06" 
            subtext="Last: South Africa" 
            delay={0.2}
          />
          <StatCard 
            icon={Activity} 
            label="Average Score" 
            value="92.4" 
            subtext="Top 10% of users" 
            delay={0.3}
          />
        </div>

        {/* Featured Section */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Recent Harvests</h2>
              <p className="text-muted-foreground mt-1">Latest additions to your collection</p>
            </div>
            <Link href="/trophies">
              <span className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors">
                View All <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredTrophies.map((trophy, index) => (
              <FeaturedCard key={trophy.id} trophy={trophy} index={index} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ icon: Icon, label, value, subtext, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5 }}
    >
      <Card className="bg-card/90 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-serif font-bold mt-2 text-foreground">{value}</h3>
              <p className="text-xs text-primary mt-1">{subtext}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FeaturedCard({ trophy, index }: { trophy: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 + (index * 0.1) }}
      className="group relative h-[400px] overflow-hidden rounded-xl border border-border/50 bg-card"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity" />
      <img 
        src={trophy.imageUrl} 
        alt={trophy.name} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      <div className="relative z-20 h-full flex flex-col justify-end p-6 md:p-8">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">
              {trophy.species}
            </span>
            <span className="text-xs text-white/70 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {new Date(trophy.date).getFullYear()}
            </span>
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-white mb-2">{trophy.name}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {trophy.location}
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              {trophy.score}
            </div>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button variant="link" className="text-primary p-0 h-auto font-serif italic hover:no-underline">
              View full analysis &rarr;
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
