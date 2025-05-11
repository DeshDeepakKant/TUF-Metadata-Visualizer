import React from 'react';
import { notFound } from 'next/navigation';
import RoleTable from './components/RoleTable';
import RepoInfo from './components/RepoInfo';
import { loadTufData } from './utils/loadTufData';
import TufViewerClient from './components/TufViewerClient';

export default async function Home() {
    try {
        // Load TUF data using the server action
        const { roles, version, error } = await loadTufData();

        // If there's an error, show the custom not-found page
        if (error) {
            console.error('Error loading TUF data:', error);
            notFound();
        }

        // Render the client component with the data
        return <TufViewerClient roles={roles} version={version} error={null} />;
    } catch (err) {
        console.error('Unexpected error in Home page:', err);
        notFound();
    }
} 