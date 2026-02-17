import { Trophy, Crosshair, Map, Calendar, User, Settings, LogOut, Shield, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

// Import theme images for the sidebar check
// In a real app we'd map these better, but for mockup simplicity:
import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { icon: Trophy, label: "Trophy Room", href: "/trophies" },
    { icon: Shield, label: "The Safe", href: "/safe" },
    { icon: Users, label: "Community", href: "/community" },
    { icon: Calendar, label: "Dashboard", href: "/" },
  ];

  // Map theme to background image for the main content area (if we want to show it slightly)
  // or we can use it for the sidebar texture
  const bgImage = theme === "manor" ? themeManor 
                 : theme === "minimal" ? themeMinimal 
                 : themeLodge;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden transition-colors duration-700">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/80 backdrop-blur-xl hidden md:flex flex-col relative z-20">
        <div className="p-6">
          <h1 className="font-serif text-2xl font-bold tracking-wider text-primary flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            TROPHY<span className="text-foreground">VAULT</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-4 px-2 tracking-widest uppercase opacity-70">Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/40">
           <div className="text-xs font-medium text-muted-foreground mb-4 px-2 tracking-widest uppercase opacity-70">Profile</div>
           <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Hunter Doe</span>
                <span className="text-xs text-muted-foreground">Pro Member</span>
              </div>
           </div>
           
           <div className="flex gap-2 mt-2">
             <Link href="/onboarding">
               <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors">
                 <Settings className="h-3 w-3" /> Theme
               </button>
             </Link>
             <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
               <LogOut className="h-3 w-3" />
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Subtle texture overlay based on theme */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{backgroundImage: `url(${bgImage})`, backgroundSize: 'cover'}}></div>
        
        {children}
      </main>
    </div>
  );
}
