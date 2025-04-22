'use client';

import React, { useEffect, useState } from 'react';
import RoleTable from './RoleTable';
import RepoInfo from './RepoInfo';
import RepositorySelector from './RepositorySelector';
import { RoleInfo } from '../utils/types';
import { createRemoteTufRepository } from '../utils/remoteTufClient';

interface TufViewerClientProps {
    roles: RoleInfo[];
    version: string;
    error: string | null;
}

export default function TufViewerClient({ roles: initialRoles, version, error: initialError }: TufViewerClientProps) {
    const [roles, setRoles] = useState<RoleInfo[]>(initialRoles);
    const [error, setError] = useState<string | null>(initialError);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [repoSource, setRepoSource] = useState<string>('local');
    const [remoteUrl, setRemoteUrl] = useState<string>('');

    /**
     * Load data from a remote TUF repository
     */
    const loadRemoteRepository = async (url: string) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Use our CORS proxy for remote repositories
            const corsProxyUrl = '/api/cors-proxy?url=';
            
            // Create and initialize the remote repository
            const repository = await createRemoteTufRepository(url, corsProxyUrl);
            
            // Get role info from the repository
            const roleInfo = repository.getRoleInfo();
            
            if (roleInfo.length === 0) {
                setError('No roles found in the remote repository.');
                setRoles([]);
            } else {
                setRoles(roleInfo);
                setRepoSource('remote');
                setRemoteUrl(url);
            }
        } catch (error) {
            console.error('Error loading remote repository:', error);
            setError(`Failed to load remote repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setRoles([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle when a remote repository is selected
     */
    const handleRepositorySelected = (url: string) => {
        loadRemoteRepository(url);
    };

    /**
     * Switch back to the local repository
     */
    const switchToLocalRepository = () => {
        setRoles(initialRoles);
        setError(initialError);
        setRepoSource('local');
        setRemoteUrl('');
    };

    if (error) {
        return (
            <div className="space-y-4">
                <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Loading TUF Repository Data</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <p className="mb-2">Please check:</p>
                    <ul className="list-disc pl-6 mb-4">
                        <li>TUF metadata files exist in the specified location</li>
                        <li>The files contain valid JSON in the TUF format</li>
                        <li>The browser console for any network or JavaScript errors</li>
                    </ul>
                    
                    {repoSource === 'remote' && (
                        <button 
                            onClick={switchToLocalRepository}
                            className="mr-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                        >
                            Switch to Local Repository
                        </button>
                    )}
                    
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        Retry Loading
                    </button>
                </div>
                
                <RepositorySelector 
                    onRepositorySelected={handleRepositorySelected}
                    isLoading={isLoading}
                />
            </div>
        );
    }

    // Get spec_version from the first role (assuming it's the same for all)
    const specVersion = roles[0]?.specVersion;

    return (
        <div className="space-y-4">
            {repoSource === 'remote' && remoteUrl && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-blue-800">Remote Repository</p>
                            <p className="text-sm text-blue-600 truncate">{remoteUrl}</p>
                        </div>
                        <button
                            onClick={switchToLocalRepository}
                            className="px-3 py-1 bg-white hover:bg-gray-100 text-blue-700 text-sm rounded-md border border-blue-300 transition-colors"
                        >
                            Switch to Local
                        </button>
                    </div>
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
            
            {repoSource === 'local' && (
                <RepositorySelector 
                    onRepositorySelected={handleRepositorySelected}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
} 
