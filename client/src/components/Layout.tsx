import { Trophy, Calendar, User, Settings, LogOut, Shield, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/hooks/use-auth";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";

const navItems = [
  { icon: Calendar, label: "Dashboard", href: "/" },
  { icon: Trophy, label: "Trophy Room", href: "/trophies" },
  { icon: Shield, label: "The Safe", href: "/safe" },
  { icon: Users, label: "Community", href: "/community" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const bgImage = theme === "manor" ? themeManor 
                 : theme === "minimal" ? themeMinimal 
                 : themeLodge;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden transition-colors duration-700">
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
           <Link href="/profile">
             <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="h-8 w-8 rounded-full border border-primary/30 object-cover"
                    data-testid="img-avatar"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium" data-testid="text-username">
                    {user?.firstName || ""} {user?.lastName || ""}
                  </span>
                  <span className="text-xs text-muted-foreground">View Profile</span>
                </div>
             </div>
           </Link>
           
           <a href="/api/logout">
             <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" data-testid="button-logout">
               <LogOut className="h-3 w-3" /> Sign Out
             </button>
           </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] mix-blend-overlay" style={{backgroundImage: `url(${bgImage})`, backgroundSize: 'cover'}}></div>
        
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/40">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1 cursor-pointer py-2 px-3" data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
                </div>
              </Link>
            );
          })}
          <Link href="/profile">
            <div className="flex flex-col items-center gap-1 cursor-pointer py-2 px-3" data-testid="mobile-nav-profile">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Profile" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User className={cn("h-5 w-5", location === "/profile" ? "text-primary" : "text-muted-foreground")} />
              )}
              <span className={cn("text-[10px] font-medium", location === "/profile" ? "text-primary" : "text-muted-foreground")}>Profile</span>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}
