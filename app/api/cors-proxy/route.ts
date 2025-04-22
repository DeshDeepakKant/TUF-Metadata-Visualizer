import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple CORS proxy for Next.js API routes
 * This allows us to fetch from remote TUF repositories that don't have CORS enabled
 * 
 * Usage: /api/cors-proxy?url=https://example.com/path/to/resource
 */
export async function GET(request: NextRequest) {
  // Get the target URL from the query parameter
  const url = request.nextUrl.searchParams.get('url');
  
  // Return an error if no URL is provided
  if (!url) {
    return NextResponse.json(
      { error: 'No URL provided' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch the resource from the target URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // If the fetch failed, return an error
    if (!response.ok) {
      return NextResponse.json(
        { error: `Error fetching resource: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    // Return any errors that occurred during the fetch
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to proxy request: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 