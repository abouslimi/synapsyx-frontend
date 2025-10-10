import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth as useOIDCAuth } from "react-oidc-context";
import { getQueryFn, registerCognitoUser } from "@/lib/queryClient";
import type { CognitoRegistrationRequest, UserResponse } from "@/lib/apiConfig";
import { useState, useEffect } from "react";

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
  const [registeredUser, setRegisteredUser] = useState<UserResponse | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  // Debug logging for OIDC user profile
  if (auth.user) {
    console.log('OIDC user profile:', auth.user.profile);
    console.log('OIDC user profile email:', auth.user.profile?.email);
  }

  // Registration mutation
  const registrationMutation = useMutation({
    mutationFn: async (registrationData: CognitoRegistrationRequest) => {
      return registerCognitoUser(registrationData, auth.user?.access_token || '');
    },
    onSuccess: (data: UserResponse) => {
      console.log('User registered successfully:', data);
      setRegisteredUser(data);
      setIsRegistering(false);
      setHasAttemptedRegistration(true);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
      setIsRegistering(false);
      setHasAttemptedRegistration(true);
      // If user already exists (409), that's okay - they're already registered
      if (error.message?.includes('409') || error.message?.includes('already exists')) {
        console.log('User already registered, continuing...');
        setRegisteredUser(null); // Will trigger profile fetch
      }
    },
  });

  // Fetch user profile first to check if user exists
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: getQueryFn<UserResponse>({ 
      on401: "returnNull",
      token: auth.user?.access_token 
    }),
    enabled: auth.isAuthenticated && !isRegistering && !registrationMutation.isPending,
    retry: false,
  });

  // Check if user needs registration - only if profile fetch failed with 404 (user doesn't exist)
  const needsRegistration = auth.isAuthenticated && 
    auth.user && 
    !registeredUser && 
    !isRegistering && 
    !hasAttemptedRegistration &&
    profileError?.message?.includes('404');

  // Auto-register user only when they don't exist in our system (404 from profile fetch)
  useEffect(() => {
    if (needsRegistration && auth.user?.profile) {
      console.log('User not found in system (404), attempting to register new user with Cognito profile...');
      setIsRegistering(true);
      
      const profile = auth.user.profile;
      const registrationData: CognitoRegistrationRequest = {
        aud: Array.isArray(profile.aud) ? profile.aud[0] : (profile.aud || ''),
        cognito_username: (profile as any)['cognito:username'] || profile.preferred_username || '',
        email: profile.email || '',
        email_verified: profile.email_verified?.toString() || 'false',
        exp: typeof profile.exp === 'number' ? profile.exp : 0,
        family_name: profile.family_name || null,
        given_name: profile.given_name || null,
        iat: typeof profile.iat === 'number' ? profile.iat : 0,
        iss: profile.iss || '',
        sub: profile.sub || '',
        token_use: (profile as any).token_use || 'id',
        username: profile.preferred_username || profile.email || '',
        name: profile.name || null,
        picture: profile.picture || null,
        cognito_groups: Array.isArray((profile as any)['cognito:groups']) ? (profile as any)['cognito:groups'] : null,
        identities: typeof (profile as any).identities === 'string' ? (profile as any).identities : null,
        origin_jti: typeof (profile as any).origin_jti === 'string' ? (profile as any).origin_jti : null,
        event_id: typeof (profile as any).event_id === 'string' ? (profile as any).event_id : null,
      };

      registrationMutation.mutate(registrationData);
    }
  }, [needsRegistration, auth.user?.profile]);

  // Use registered user data or profile data
  const user = registeredUser || userProfile;

  // Transform the auth object to match the expected interface
  const transformedUser = user ? {
    id: user.user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    authProvider: user.auth_provider,
    subscriptionTier: 'free',
    verified: user.verified,
    suspended: user.suspended,
    profileImageUrl: user.profile_image_url,
    university: user.university,
    cls: user.level,
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
    return (user.authProvider as string) in ['email', 'cognito'] && !user.verified;
  };

  // Reset registration attempt flag when user logs out
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setHasAttemptedRegistration(false);
      setRegisteredUser(null);
    }
  }, [auth.isAuthenticated]);

  return {
    user: transformedUser,
    isLoading: auth.isLoading || isRegistering || profileLoading,
    isAuthenticated: auth.isAuthenticated,
    isProfileIncomplete: isProfileIncomplete(transformedUser),
    needsEmailVerification: needsEmailVerification(transformedUser),
    isRegistering,
    hasAttemptedRegistration,
    // Expose auth methods
    signinRedirect: auth.signinRedirect,
    signoutRedirect: auth.signoutRedirect,
    removeUser: auth.removeUser,
  };
}