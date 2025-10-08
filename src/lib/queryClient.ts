import { QueryClient, type QueryFunction } from "@tanstack/react-query";

// API base URL configuration
const API_BASE_URL = 'http://localhost:5001';

// Helper function to convert relative URLs to absolute URLs
export function getAbsoluteUrl(url: string): string {
  if (url.startsWith('http')) {
    return url; // Already absolute
  }
  
  const result = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  console.log('getAbsoluteUrl:', { input: url, output: result, API_BASE_URL });
  return result;
}


async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  token?: string,
): Promise<Response> {
  const absoluteUrl = getAbsoluteUrl(url);
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(absoluteUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Helper function for authenticated API requests with token from OIDC context
export async function authenticatedApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  token?: string,
): Promise<Response> {
  // If no token provided, try to get it from localStorage or sessionStorage
  let authToken = token;
  if (!authToken) {
    try {
      // Try to get token from OIDC context stored in localStorage
      const oidcStorage = localStorage.getItem('oidc.user:https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_GxKWo2hS9:6c69v8akat6b5k0t54s6fm1a87');
      if (oidcStorage) {
        const parsed = JSON.parse(oidcStorage);
        authToken = parsed.access_token;
      }
    } catch (error) {
      console.warn('Could not retrieve token from storage:', error);
    }
  }
  
  return apiRequest(method, url, data, authToken);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  token?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, token }) =>
  async ({ queryKey }) => {
    const relativeUrl = queryKey.join("/") as string;
    const absoluteUrl = getAbsoluteUrl(relativeUrl);
    
    console.log('getQueryFn URL construction:', { 
      queryKey, 
      relativeUrl, 
      absoluteUrl, 
      isDev: import.meta.env.DEV,
      API_BASE_URL 
    });
    
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('Making authenticated request to:', absoluteUrl, 'with token:', token.substring(0, 20) + '...');
    } else {
      console.log('Making unauthenticated request to:', absoluteUrl);
    }
    
    const res = await fetch(absoluteUrl, {
      headers,
      credentials: "include",
    });

    console.log('Response status:', res.status, 'for URL:', absoluteUrl);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Returning null due to 401 error');
      return null;
    }

    await throwIfResNotOk(res);
    const result = await res.json();
    console.log('Response data:', result);
    return result;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
