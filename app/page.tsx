'use client';

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import RoleTable from './components/RoleTable';
import RepoInfo from './components/RepoInfo';
import { loadTufData } from './utils/loadTufData';
import TufViewerClient from './components/TufViewerClient';
import { RoleInfo } from './utils/types';

export default function Home() {
    const [data, setData] = useState<{
        roles: RoleInfo[];
        version: string;
        error: string | null;
    }>({
        roles: [],
        version: "",
        error: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await loadTufData();
                setData(result);
                
                // If there's an error, show the custom not-found page
                if (result.error) {
                    console.error('Error loading TUF data:', result.error);
                    // Can't call notFound() in client component, so we'll just show the error
                }
            } catch (err) {
                console.error('Unexpected error in Home page:', err);
                setData({
                    roles: [],
                    version: "",
                    error: "Failed to load TUF data"
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading TUF data...</div>;
    }

    if (data.error) {
        return <div>Error: {data.error}</div>;
    }

    // Render the client component with the data
    return <TufViewerClient roles={data.roles} version={data.version} error={data.error} />;
} 