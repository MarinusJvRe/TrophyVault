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
      root.style.setProperty("--primary", "220 10% 20%"); // Dark Slate
      root.style.setProperty("--primary-foreground", "210 20% 98%");
      root.style.setProperty("--border", "220 10% 90%");
      root.style.setProperty("--muted", "220 10% 94%");
    } else if (newTheme === "manor") {
      root.style.setProperty("--background", "38 35% 93%");
      root.style.setProperty("--foreground", "25 30% 12%");
      root.style.setProperty("--card", "35 30% 89%");
      root.style.setProperty("--card-foreground", "25 30% 12%");
      root.style.setProperty("--primary", "35 60% 35%");
      root.style.setProperty("--primary-foreground", "38 35% 95%");
      root.style.setProperty("--border", "35 20% 78%");
      root.style.setProperty("--muted", "35 20% 82%");
    } else {
      // Default Timber Ridge (Dark) - Reset to CSS defaults
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--card");
      root.style.removeProperty("--card-foreground");
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
      root.style.removeProperty("--border");
      root.style.removeProperty("--muted");
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
