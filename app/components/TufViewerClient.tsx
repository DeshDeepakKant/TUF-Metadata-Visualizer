'use client';

import React, { useEffect, useState } from 'react';
import RoleTable from './RoleTable';
import RepoInfo from './RepoInfo';
import { RoleInfo } from '../utils/types';

interface TufViewerClientProps {
    roles: RoleInfo[];
    version: string;
    error: string | null;
}

export default function TufViewerClient({ roles, version, error }: TufViewerClientProps) {
    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <h2>Loading TUF Repository Data</h2>
                <p style={{ color: 'red' }}>{error}</p>
                <p>Please check:</p>
                <ul>
                    <li>TUF metadata files exist in the public/metadata directory</li>
                    <li>The files contain valid JSON in the TUF format</li>
                    <li>The browser console for any network or JavaScript errors</li>
                </ul>
                <button 
                    onClick={() => window.location.reload()} 
                    style={{
                        padding: '0.5rem 1rem',
                        marginTop: '1rem',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <main style={{ padding: '1rem' }}>
            <h2>Repository State</h2>
            <RoleTable roles={roles} />
            <RepoInfo
                lastUpdated={new Date().toUTCString()}
                toolVersion={version}
            />
        </main>
    );
} 
