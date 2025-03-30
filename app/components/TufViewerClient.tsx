'use client';

import React from 'react';
import { RoleInfo } from '../utils/types';
import RoleTable from './RoleTable';
import RepoInfo from './RepoInfo';

interface TufViewerClientProps {
    roles: RoleInfo[];
    version: string;
    error: string | null;
}

export default function TufViewerClient({ roles, version, error }: TufViewerClientProps) {
    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <h2>Error</h2>
                <p style={{ color: 'red' }}>{error}</p>
                <p>Please check:</p>
                <ul>
                    <li>TUF metadata files (root.json, timestamp.json, snapshot.json, targets.json) exist in the public/metadata directory</li>
                    <li>The files contain valid JSON in the TUF format</li>
                    <li>The browser console for any network or JavaScript errors</li>
                </ul>
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