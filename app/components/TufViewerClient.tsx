'use client';

import React, { useEffect, useState, useMemo } from 'react';
import RoleTable from './RoleTable';
import RepoInfo from './RepoInfo';
import RootVersionSelector from './RootVersionSelector';
import { RoleInfo } from '../utils/types';
import styled from 'styled-components';
import { loadTufDataAction } from '../actions';
import TufTreeViews from './TufTreeViews';
import ExampleUrls from './ExampleUrls';

// Styled components
const SectionDivider = styled.div`
  height: 1px;
  background-color: var(--border);
  margin: 2rem 0;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

interface TufViewerClientProps {
    roles: RoleInfo[];
    version: string;
    error: string | null;
    initialRemoteUrl?: string;
}

export default function TufViewerClient({ 
    roles: initialRoles, 
    version, 
    error: initialError,
    initialRemoteUrl
}: TufViewerClientProps) {
    const [roles, setRoles] = useState<RoleInfo[]>(initialRoles);
    const [error, setError] = useState<string | null>(initialError);
    const [remoteUrl, setRemoteUrl] = useState<string | undefined>(initialRemoteUrl);
    const [loading, setLoading] = useState(false);
    const [showTreeViews, setShowTreeViews] = useState(false);
    
    // Handle remote URL changes
    const handleRemoteUrlChange = async (url: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const result = await loadTufDataAction(url);
            if (result.error) {
                setError(result.error);
            } else {
                setRoles(result.roles);
                setRemoteUrl(url);
            }
        } catch (err) {
            setError(`Failed to load data from ${url}: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div style={{ 
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Loading TUF Repository</h2>
                    <p style={{ marginBottom: '2rem' }}>Please wait while we fetch metadata from the remote repository...</p>
                    
                    <div style={{
                        display: 'inline-block',
                        width: '50px',
                        height: '50px',
                        border: '3px solid rgba(0, 112, 243, 0.2)',
                        borderRadius: '50%',
                        borderTop: '3px solid #0070f3',
                        animation: 'spin 1s linear infinite',
                    }}></div>
                    
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ 
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                    <h2 style={{ marginBottom: '1rem' }}>Error Loading TUF Repository</h2>
                    <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
                    
                    <div style={{ 
                        textAlign: 'left', 
                        marginBottom: '2rem',
                        padding: '1rem',
                        backgroundColor: '#f8f8f8',
                        borderRadius: '4px'
                    }}>
                        <p>Please check:</p>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                            <li>TUF metadata files exist in the {remoteUrl ? 'remote repository' : 'public/metadata directory'}</li>
                            <li>The files contain valid JSON in the TUF format</li>
                            <li>The browser console for any network or JavaScript errors</li>
                            {remoteUrl && <li>CORS is properly configured on the remote server</li>}
                        </ul>
                    </div>
                    
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as HTMLFormElement).querySelector('input');
                        if (input && input.value) {
                            let url = input.value.trim();
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                            }
                            if (!url.endsWith('/')) {
                                url += '/';
                            }
                            handleRemoteUrlChange(url);
                        }
                    }} style={{ width: '100%' }}>
                        <input 
                            type="url" 
                            placeholder="Enter URL (e.g., https://tuf-repo-cdn.sigstore.dev/)" 
                            defaultValue={remoteUrl || ''}
                            style={{
                                padding: '0.75rem 1rem',
                                width: '100%',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                            required 
                        />
                        <button 
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#0070f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Try Again
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
    // If we have no roles and no error, this is likely the first load
    // Show only the URL input form
    if (roles.length === 0) {
        return (
            <div style={{ 
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '500px', width: '100%' }}>
                    <h2 style={{ marginBottom: '1rem' }}>TUF Repository Viewer</h2>
                    <p style={{ marginBottom: '2rem' }}>Please provide a remote TUF repository URL to load metadata.</p>
                    
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as HTMLFormElement).querySelector('input');
                        if (input && input.value) {
                            let url = input.value.trim();
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                            }
                            if (!url.endsWith('/')) {
                                url += '/';
                            }
                            handleRemoteUrlChange(url);
                        }
                    }} style={{ width: '100%' }}>
                        <input 
                            type="url" 
                            placeholder="Enter URL (e.g., https://tuf-repo-cdn.sigstore.dev/)" 
                            defaultValue={remoteUrl || ''}
                            style={{
                                padding: '0.75rem 1rem',
                                width: '100%',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                marginBottom: '1rem',
                                fontSize: '1rem'
                            }}
                            required 
                        />
                        <button 
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#0070f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Load Repository
                        </button>
                    </form>

                    <ExampleUrls onUrlClick={handleRemoteUrlChange} />
                </div>
            </div>
        );
    }

    // Get spec_version from the first role (assuming it's the same for all)
    const specVersion = roles[0]?.specVersion;

    return (
        <div className="space-y-4">
            {specVersion && (
                <div className="text-sm text-gray-600">
                    TUF Specification Version: {specVersion}
                </div>
            )}

            {/* Current TUF Roles Section */}
            <SectionTitle>TUF Repository Roles</SectionTitle>
            <RoleTable roles={roles} />
            
            {/* Root Version Diff Section */}
            <SectionDivider />
            <SectionTitle>Root Version Diff</SectionTitle>
            <RootVersionSelector remoteUrl={remoteUrl} />
            
            {/* Tree Visualizations Section */}
            <SectionDivider />
            <div>
                <SectionTitle>
                    TUF Metadata Visualizations
                </SectionTitle>
                
                {!showTreeViews ? (
                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <button 
                            onClick={() => setShowTreeViews(true)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#0070f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Show TUF Metadata Visualizations
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', margin: '1rem 0 2rem' }}>
                        <button 
                            onClick={() => setShowTreeViews(false)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                backgroundColor: '#e4e4e4',
                                color: '#333',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Hide Visualizations
                        </button>
                    </div>
                )}
                
                {showTreeViews && <TufTreeViews roles={roles} />}
            </div>
        </div>
    );
}