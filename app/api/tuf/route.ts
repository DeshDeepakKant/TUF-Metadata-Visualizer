import { NextResponse } from 'next/server';

interface FetchMetadataParams {
  url: string;
  file: string;
}

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const file = searchParams.get('file');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing repository URL' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Missing metadata file name' },
        { status: 400 }
      );
    }

    // Build the complete URL, ensuring proper formatting
    const baseUrl = url.endsWith('/') ? url : `${url}/`;
    const completeUrl = `${baseUrl}${file}`;

    console.log(`Fetching TUF metadata from: ${completeUrl}`);
    
    // Fetch the file from the remote repository
    const response = await fetch(completeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch metadata: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the JSON data
    const data = await response.json();
    
    // Return the TUF metadata
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching TUF metadata:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 