// API Test Utility
// This file provides utilities to test API connectivity and CORS issues

import { API_BASE_URL, API_ENDPOINTS } from './apiConfig';
import { authenticatedApiRequest } from './queryClient';

export interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'cors_error';
  message: string;
  response?: any;
  error?: string;
}

export async function testApiEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  token?: string
): Promise<ApiTestResult> {
  try {
    console.log(`Testing ${method} ${endpoint}...`);
    
    const response = await authenticatedApiRequest(method, endpoint, undefined, token);
    const data = await response.json();
    
    return {
      endpoint,
      status: 'success',
      message: 'API call successful',
      response: data
    };
  } catch (error: any) {
    console.error(`Error testing ${endpoint}:`, error);
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      return {
        endpoint,
        status: 'cors_error',
        message: 'CORS error detected',
        error: error.message
      };
    }
    
    return {
      endpoint,
      status: 'error',
      message: 'API call failed',
      error: error.message
    };
  }
}

export async function testAiChatApi(token?: string): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test basic API connectivity
  results.push(await testApiEndpoint('/health', 'GET'));
  
  // Test AI chat endpoints
  results.push(await testApiEndpoint(API_ENDPOINTS.AI_CHAT, 'GET', token));
  results.push(await testApiEndpoint(API_ENDPOINTS.AI_CHAT_SESSION, 'GET', token));
  results.push(await testApiEndpoint(API_ENDPOINTS.AI_SIMILARITY_SEARCH, 'POST', token));
  
  return results;
}

export function logApiTestResults(results: ApiTestResult[]): void {
  console.group('🔍 API Test Results');
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'cors_error' ? '🚫' : '❌';
    console.log(`${icon} ${result.endpoint}: ${result.message}`);
    
    if (result.error) {
      console.error(`   Error: ${result.error}`);
    }
    
    if (result.response) {
      console.log(`   Response:`, result.response);
    }
  });
  
  console.groupEnd();
}

// Helper function to test CORS specifically
export async function testCorsConfiguration(): Promise<void> {
  console.log('🔍 Testing CORS configuration...');
  
  try {
    // Test a simple fetch to the API base URL
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CORS test successful:', data);
    } else {
      console.error('❌ CORS test failed:', response.status, response.statusText);
    }
  } catch (error: any) {
    console.error('❌ CORS test error:', error.message);
    
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.error('🚫 CORS is blocking the request. Check server CORS configuration.');
    }
  }
}
