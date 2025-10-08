import { useState, useEffect } from "react";
import { Bell, Moon, Sun, Globe, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const [isDark, setIsDark] = useState(false);
  const [greeting, setGreeting] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    // Initialize theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Update greeting
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.firstName || 'Étudiant';
    
    let greetingText;
    if (hour < 12) greetingText = `Bonjour, ${name}!`;
    else if (hour < 18) greetingText = `Bon après-midi, ${name}!`;
    else greetingText = `Bonsoir, ${name}!`;
    
    setGreeting(greetingText);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const getSubtitle = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Prêt pour une nouvelle journée d'apprentissage?";
    if (hour < 18) return "Comment se passent vos révisions?";
    return "Prêt pour une soirée d'étude productive?";
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3" data-testid="topbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-foreground hover:text-muted-foreground"
            data-testid="mobile-menu-button"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-4 lg:ml-0">
            <h1 className="text-2xl font-bold text-foreground" data-testid="greeting">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="subtitle">
              {getSubtitle()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-muted-foreground hover:text-foreground"
              data-testid="notifications-button"
              disabled
            >
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-xs text-destructive-foreground hidden">
              3
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground"
            data-testid="theme-toggle"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-muted-foreground hover:text-foreground"
            data-testid="language-toggle"
            disabled
          >
            <Globe className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
