import { queryClient, getAbsoluteUrl } from "./queryClient";

export function isUnauthorizedError(error: any): boolean {
  return error?.message?.includes('401') || 
         error?.message?.includes('Unauthorized') ||
         error?.status === 401;
}

export async function logout(logoutType: 'local' | 'cognito' = 'cognito') {
  try {
    // Clear all cached queries first
    queryClient.clear();
    
    if (logoutType === 'cognito') {
      // For Cognito logout, redirect to the enhanced logout endpoint
      // This will handle both local session cleanup and Cognito hosted UI logout
      window.location.href = getAbsoluteUrl('/api/logout');
    } else {
      // For local logout only, call the local logout endpoint
      const response = await fetch(getAbsoluteUrl('/api/logout/local'), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Redirect to home page
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, clear the local state and redirect
    queryClient.clear();
    window.location.href = '/';
  }
}

// Convenience functions for different logout types
export async function logoutLocal() {
  return logout('local');
}

export async function logoutCognito() {
  return logout('cognito');
}

// Helper function to get Cognito logout URL for SPA
export function getCognitoLogoutUrl(): string {
  const clientId = "6c69v8akat6b5k0t54s6fm1a87";
  const logoutUri = window.location.origin;
  const cognitoDomain = "https://eu-central-1gxkwo2hs9.auth.eu-central-1.amazoncognito.com";
  
  const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  console.log('Cognito logout URL:', logoutUrl);
  
  return logoutUrl;
}

// Helper function for SPA logout that calls server first, then redirects to Cognito
export async function signOutRedirect(token?: string) {
  console.log('signOutRedirect called with token:', !!token);
  
  try {
    // First, call the server logout endpoint to clear server-side session
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Calling server logout endpoint...');
    const response = await fetch(getAbsoluteUrl('/api/logout'), {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    console.log('Server logout response:', response.status);
    if (!response.ok) {
      console.warn('Server logout failed, proceeding with Cognito logout anyway');
    }
  } catch (error) {
    console.error('Error calling server logout:', error);
    // Continue with Cognito logout even if server call fails
  }

  // Then redirect to Cognito hosted UI logout for complete session cleanup
  console.log('Redirecting to Cognito logout...');
  window.location.href = getCognitoLogoutUrl();
}