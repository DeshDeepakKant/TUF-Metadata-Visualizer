'use client';

import React, { useEffect, useState } from 'react';
import RoleTable from './RoleTable';
import RepoInfo from './RepoInfo';
import RepoSelector from './RepoSelector';
import { RoleInfo } from '../utils/types';
import { loadTufData } from '../utils/loadTufData';

interface TufViewerClientProps {
    roles: RoleInfo[];
    version: string;
    error: string | null;
}

export default function TufViewerClient({ roles: initialRoles, version: initialVersion, error: initialError }: TufViewerClientProps) {
    const [roles, setRoles] = useState<RoleInfo[]>(initialRoles);
    const [version, setVersion] = useState<string>(initialVersion);
    const [error, setError] = useState<string | null>(initialError);
    const [loading, setLoading] = useState<boolean>(false);
    const [repositoryUrl, setRepositoryUrl] = useState<string>('');
    
    const handleRepositorySelect = async (url: string) => {
        setLoading(true);
        setError(null);
        
        try {
            // Call the server action to load data from the selected repository
            const result = await loadTufData({ repositoryUrl: url });
            
            if (result.error) {
                setError(result.error);
                setRoles([]);
            } else {
                setRoles(result.roles);
                setVersion(result.version);
                setRepositoryUrl(url);
            }
        } catch (err: any) {
            setError(`Failed to load repository: ${err.message || 'Unknown error'}`);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Show repository selector if:
    // - There's an error
    // - OR user explicitly selects a repository
    // - OR user navigates directly to the page
    const showRepoSelector = error !== null || repositoryUrl !== '' || initialRoles.length === 0;
    
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">TUF Repository Error</h2>
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md">
                    {error}
                </div>
                
                <h3 className="text-lg font-semibold mb-2">Select a different repository:</h3>
                <RepoSelector onSelectRepository={handleRepositorySelect} loading={loading} />
            </div>
        );
    }
    
    // Get spec_version from the first role (assuming it's the same for all)
    const specVersion = roles[0]?.specVersion;

    return (
        <div className="container mx-auto p-4">
            {showRepoSelector && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">TUF Repository Selection</h2>
                    <RepoSelector onSelectRepository={handleRepositorySelect} loading={loading} />
                </div>
            )}
            
            {roles.length > 0 && (
                <div className="space-y-4">
                    {repositoryUrl && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
                            Currently viewing: <strong>{repositoryUrl}</strong>
                            <button 
                                className="ml-4 text-blue-600 underline hover:text-blue-800"
                                onClick={() => handleRepositorySelect(repositoryUrl)}
                            >
                                Change Repository
                            </button>
                        </div>
                    )}
                    
                    {specVersion && (
                        <div className="text-sm text-gray-600">
                            TUF Specification Version: {specVersion}
                        </div>
                    )}
                    
                    <RoleTable roles={roles} />
                    
                    <RepoInfo
                        lastUpdated={new Date().toUTCString()}
                        toolVersion={version}
                    />
                </div>
            )}
        </div>
    );
} 
