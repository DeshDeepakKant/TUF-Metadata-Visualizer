import React from 'react';
import { notFound } from 'next/navigation';
import { loadTufData } from './utils/loadTufData';
import TufViewerClient from './components/TufViewerClient';

interface HomeProps {
    searchParams: {
        url?: string;
    };
}

export default async function Home({ searchParams }: HomeProps) {
    try {
        // Check if a remote URL is provided in the search params
        const remoteUrl = searchParams.url;
        
        // If no URL is provided and we know metadata folder is missing,
        // show empty state with the UI to allow URL input
        if (!remoteUrl) {
            // Return the client component with empty data
            // This will show the input box for remote URL
            return <TufViewerClient 
                roles={[]} 
                version={process.env.VERSION || '0.1.0'} 
                error={null}
                initialRemoteUrl={undefined}
            />;
        }
        
        // If a URL is provided, try to load metadata from there
        const { roles, version, error } = await loadTufData(remoteUrl);

        // If there's an error, show the client with the error
        if (error) {
            console.error('Error loading TUF data:', error);
            return <TufViewerClient 
                roles={[]} 
                version={version} 
                error={error}
                initialRemoteUrl={remoteUrl}
            />;
        }

        // Render the client component with the data
        return <TufViewerClient 
            roles={roles} 
            version={version} 
            error={null} 
            initialRemoteUrl={remoteUrl}
        />;
    } catch (err) {
        console.error('Unexpected error in Home page:', err);
        return <TufViewerClient 
            roles={[]} 
            version={process.env.VERSION || '0.1.0'} 
            error={`Unexpected error: ${err instanceof Error ? err.message : String(err)}`}
            initialRemoteUrl={searchParams.url}
        />;
    }
} 