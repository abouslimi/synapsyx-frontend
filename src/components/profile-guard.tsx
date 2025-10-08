import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const [, setLocation] = useLocation();
  const { isLoading, isAuthenticated, isProfileIncomplete, needsEmailVerification } = useAuth();

  useEffect(() => {
    // Only redirect if user is authenticated, not loading, and has issues
    if (isAuthenticated && !isLoading) {
      // Priority 1: Email verification (for email auth provider users)
      if (needsEmailVerification && window.location.pathname !== "/email-verification") {
        setLocation("/email-verification");
        return;
      }
      
      // Priority 2: Profile completion (only if email is verified)
      if (!needsEmailVerification && isProfileIncomplete && window.location.pathname !== "/user-profile") {
        setLocation("/user-profile");
        return;
      }
    }
  }, [isAuthenticated, isLoading, isProfileIncomplete, needsEmailVerification, setLocation]);

  return <>{children}</>;
}
