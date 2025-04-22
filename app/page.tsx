import React from 'react';
import { loadTufData } from './utils/loadTufData';
import TufViewerClient from './components/TufViewerClient';

export default async function Home() {
    try {
        // Load TUF data using the server action
        const { roles, version, error } = await loadTufData();

        // Render the client component with the data, even if there's an error
        // The client component will handle the error state
        return <TufViewerClient roles={roles} version={version} error={error} />;
    } catch (err: any) {
        console.error('Unexpected error in Home page:', err);
        return (
            <TufViewerClient 
                roles={[]} 
                version="TUF-JS Viewer v0.1.0" 
                error={`Unexpected error: ${err?.message || 'Unknown error'}`} 
            />
        );
    }
} 