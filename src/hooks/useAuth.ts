import { useQuery } from "@tanstack/react-query";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { getQueryFn } from "@/lib/queryClient";

export function useAuthQuery<T>(queryKey: string[], options?: {
  on401?: "returnNull" | "throw";
  enabled?: boolean;
}) {
  const auth = useOIDCAuth();
  
  return useQuery<T>({
    queryKey,
    queryFn: getQueryFn<T>({ 
      on401: options?.on401 || "returnNull",
      token: auth.user?.access_token 
    }),
    enabled: auth.isAuthenticated && (options?.enabled !== false),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAuth() {
  const auth = useOIDCAuth();
  
  // Debug logging for OIDC user profile
  if (auth.user) {
    console.log('OIDC user profile:', auth.user.profile);
    console.log('OIDC user profile email:', auth.user.profile?.email);
  }
  
  // Transform the auth object to match the expected interface
  const user = auth.user ? {
    id: auth.user.profile?.sub,
    email: auth.user.profile?.email,
    firstName: auth.user.profile?.given_name,
    lastName: auth.user.profile?.family_name,
    authProvider: 'cognito',
    subscriptionTier: 'free',
    verified: auth.user.profile?.email_verified || false,
    suspended: false,
    profileImageUrl: auth.user.profile?.picture,
    university: null,
    cls: null,
    year: null,
  } : null;

  // Check if user profile is incomplete
  const isProfileIncomplete = (user: any) => {
    if (!user) return false;
    return !user.firstName || !user.lastName || !user.university || !user.cls;
  };

  // Check if user needs email verification
  const needsEmailVerification = (user: any) => {
    if (!user) return false;
    // Only email auth provider users need verification
    // Other providers (Google, Facebook, Apple) are automatically verified
    return user.authProvider === 'email' && !user.verified;
  };

  return {
    user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isProfileIncomplete: isProfileIncomplete(user),
    needsEmailVerification: needsEmailVerification(user),
    // Expose auth methods
    signinRedirect: auth.signinRedirect,
    signoutRedirect: auth.signoutRedirect,
    removeUser: auth.removeUser,
  };
}