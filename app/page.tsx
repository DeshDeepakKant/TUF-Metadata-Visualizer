'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadTufData } from './utils/loadTufData';
import TufViewerClient from './components/TufViewerClient';
import { RoleInfo } from './utils/types';

export default function Home() {
    const searchParams = useSearchParams();
    const remoteUrl = searchParams.get('url') || undefined;
    
    const [data, setData] = useState<{
        roles: RoleInfo[],
        version: string,
        error: string | null
    }>({
        roles: [],
        version: '',
        error: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await loadTufData(remoteUrl);
                setData(result);
            } catch (err) {
                console.error('Unexpected error in Home page:', err);
                setData({
                    roles: [],
                    version: '',
                    error: `Failed to load TUF data: ${err instanceof Error ? err.message : String(err)}`
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [remoteUrl]);

    if (loading) {
        return <div>Loading TUF data...</div>;
    }

    // If there's an error or no data, show the client with the error
    return <TufViewerClient 
        roles={data.roles} 
        version={data.version || '0.1.0'} 
        error={data.error}
        initialRemoteUrl={remoteUrl} 
    />;
} 