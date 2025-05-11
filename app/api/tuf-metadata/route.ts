import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to fetch TUF metadata from a remote URL
 * This helps avoid CORS issues and provides better error handling
 */
export async function GET(request: NextRequest) {
    // Get the repository URL and filename from query parameters
    const searchParams = request.nextUrl.searchParams;
    const repoUrl = searchParams.get('url');
    const filename = searchParams.get('file');

    // Validate parameters
    if (!repoUrl || !filename) {
        return NextResponse.json(
            { error: 'Missing required parameters: url and file' },
            { status: 400 }
        );
    }

    try {
        // Construct the full URL
        const url = new URL(filename, repoUrl).toString();
        
        // Fetch the metadata
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });
        
        if (!response.ok) {
            return NextResponse.json(
                { 
                    error: `Failed to fetch ${filename}`, 
                    status: response.status,
                    statusText: response.statusText
                },
                { status: response.status }
            );
        }
        
        // Return the metadata
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching TUF metadata:', error);
        return NextResponse.json(
            { error: `Error fetching metadata: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
} 