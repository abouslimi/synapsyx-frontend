import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { signOutRedirect } from "@/lib/authUtils";
import {
  BookOpen,
  Calendar,
  Dumbbell,
  ClipboardCheck,
  TrendingUp,
  Bot,
  BookMarked,
  Home,
  LogOut,
  ChevronDown,
  Settings,
  Library,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user } = useAuth();
  const auth = useOIDCAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  console.log('Sidebar render - user:', !!user, 'auth:', auth.isAuthenticated);

  const navigation = [
    {
      name: "Tableau de Bord",
      href: "/",
      icon: Home,
      current: location === "/",
    },
    {
      name: "Apprendre",
      href: "/learn",
      icon: BookOpen,
      current: location === "/learn",
    },
    {
      name: "Organiser",
      href: "/organize",
      icon: Calendar,
      current: location === "/organize",
    },
    {
      name: "Pratiquer",
      href: "/practice",
      icon: Dumbbell,
      current: location === "/practice",
    },
    {
      name: "Se Tester",
      href: "/test",
      icon: ClipboardCheck,
      current: location === "/test",
    },
    {
      name: "Mes Statistiques",
      href: "/statistics",
      icon: TrendingUp,
      current: location === "/statistics",
    },
    {
      name: "IA Tuteur",
      href: "/ai-tutor",
      icon: Bot,
      current: location === "/ai-tutor",
      badge: "Nouveau",
    },
    {
      name: "Bibliothèque",
      href: "/bibliotheque",
      icon: Library,
      current: location === "/bibliotheque",
    },
    {
      name: "Blog",
      href: "/blog",
      icon: BookMarked,
      current: location === "/blog",
    },
  ];

  const getUserInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    console.log('Logout button clicked');
    alert('Logout button clicked!'); // Simple test to see if click works
    
    try {
      // Get the access token from the auth context
      const token = auth.user?.access_token;
      console.log('Token available:', !!token);
      
      // Use the enhanced logout that calls server first, then Cognito
      await signOutRedirect(token);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0" data-testid="sidebar">
      <div className="flex flex-col flex-grow bg-card border-r border-border pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4" data-testid="logo">
          <div className="flex items-center">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <img
              src="/static/logo.svg"
              alt="logo"
              className="w-5 h-5 text-primary-foreground"
            />
          </div>
            <span className="ml-3 text-xl font-bold text-foreground">SynapsyX</span>
            <span className="ml-1 text-sm text-muted-foreground">AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1 px-2 space-y-1" data-testid="navigation">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "text-foreground hover:bg-muted group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                item.current && "bg-primary text-primary-foreground"
              )}
              data-testid={`nav-item-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="text-muted-foreground mr-3 flex-shrink-0 h-5 w-5" />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-block py-0.5 px-2 text-xs bg-accent text-accent-foreground rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 px-4" data-testid="user-profile">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center w-full text-left hover:bg-muted rounded-md p-2 transition-colors"
              data-testid="user-profile-button"
            >
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {getUserInitials(user)}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.year || 'Étudiant'}
                </p>
              </div>
              <ChevronDown 
                className={cn(
                  "ml-2 h-4 w-4 text-muted-foreground transition-transform",
                  isUserDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <Link 
                    href="/user-profile"
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    data-testid="profile-button"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Mon profil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    data-testid="logout-button"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
