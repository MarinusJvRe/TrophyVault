import { createContext, useContext, useEffect, useState } from "react";

type Theme = "lodge" | "manor" | "minimal";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  backgrounds: Record<Theme, string>;
}

// We'll import these dynamically in the component to avoid circular deps with the generated assets
// For now, we define the interface
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("trophy_vault_theme") as Theme) || "lodge";
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("trophy_vault_theme", newTheme);
    
    // Update CSS variables based on theme
    const root = document.documentElement;
    
    if (newTheme === "minimal") {
      root.style.setProperty("--background", "210 20% 98%");
      root.style.setProperty("--foreground", "220 40% 10%");
      root.style.setProperty("--card", "0 0% 100%");
      root.style.setProperty("--card-foreground", "220 40% 10%");
      root.style.setProperty("--primary", "220 10% 20%");
      root.style.setProperty("--primary-foreground", "210 20% 98%");
      root.style.setProperty("--secondary", "210 15% 92%");
      root.style.setProperty("--secondary-foreground", "220 40% 10%");
      root.style.setProperty("--muted", "220 10% 94%");
      root.style.setProperty("--muted-foreground", "220 10% 40%");
      root.style.setProperty("--accent", "210 15% 92%");
      root.style.setProperty("--accent-foreground", "220 40% 10%");
      root.style.setProperty("--border", "220 10% 88%");
      root.style.setProperty("--input", "220 10% 88%");
      root.style.setProperty("--ring", "220 10% 20%");
    } else if (newTheme === "manor") {
      root.style.setProperty("--background", "25 20% 7%");
      root.style.setProperty("--foreground", "35 25% 90%");
      root.style.setProperty("--card", "25 18% 12%");
      root.style.setProperty("--card-foreground", "35 25% 90%");
      root.style.setProperty("--primary", "35 55% 50%");
      root.style.setProperty("--primary-foreground", "25 20% 7%");
      root.style.setProperty("--secondary", "25 15% 18%");
      root.style.setProperty("--secondary-foreground", "35 20% 85%");
      root.style.setProperty("--muted", "25 12% 18%");
      root.style.setProperty("--muted-foreground", "30 15% 55%");
      root.style.setProperty("--accent", "35 55% 50%");
      root.style.setProperty("--accent-foreground", "25 20% 7%");
      root.style.setProperty("--border", "25 12% 20%");
      root.style.setProperty("--input", "25 12% 20%");
      root.style.setProperty("--ring", "35 55% 50%");
    } else {
      // Default Timber Ridge (Dark) - Reset to CSS defaults
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--card-foreground");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--secondary-foreground");
      root.style.removeProperty("--muted");
      root.style.removeProperty("--muted-foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-foreground");
      root.style.removeProperty("--border");
      root.style.removeProperty("--input");
      root.style.removeProperty("--ring");
    }
  };

  // Pre-load logic or paths would go here
  const backgrounds = {
    lodge: "/assets/theme-lodge.png", // Will be replaced by actual imports
    manor: "/assets/theme-manor.png",
    minimal: "/assets/theme-minimal.png"
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, backgrounds }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
