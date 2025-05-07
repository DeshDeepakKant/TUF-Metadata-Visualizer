'use client';

import { RoleInfo } from './types';
import fs from 'fs';
import path from 'path';

// Define a type for the delegated role
interface DelegatedRole {
    name: string;
    keyids: string[];
    threshold: number;
    paths?: string[];
    terminating?: boolean;
}

// Client-side function to load TUF data from static files or remote URL
export async function loadTufData(remoteUrl?: string): Promise<{
    roles: RoleInfo[],
    version: string,
    error: string | null
}> {
    try {
        console.log('Starting to load TUF data from client-side...');

        // If remoteUrl is provided, use it to fetch metadata
        const baseUrl = remoteUrl ? 
            (remoteUrl.endsWith('/') ? remoteUrl : `${remoteUrl}/`) : 
            '/metadata/';

        // Load the metadata files via fetch
        const [rootData, timestampData, snapshotData, targetsData] = await Promise.all([
            fetch(`${baseUrl}root.json`).then(res => {
                if (!res.ok) throw new Error(`Failed to fetch root.json: ${res.status} ${res.statusText}`);
                return res.json();
            }).catch(err => {
                console.error('Error fetching root.json:', err);
                return null;
            }),
            fetch(`${baseUrl}timestamp.json`).then(res => {
                if (!res.ok) throw new Error(`Failed to fetch timestamp.json: ${res.status} ${res.statusText}`);
                return res.json();
            }).catch(err => {
                console.error('Error fetching timestamp.json:', err);
                return null;
            }),
            fetch(`${baseUrl}snapshot.json`).then(res => {
                if (!res.ok) throw new Error(`Failed to fetch snapshot.json: ${res.status} ${res.statusText}`);
                return res.json();
            }).catch(err => {
                console.error('Error fetching snapshot.json:', err);
                return null;
            }),
            fetch(`${baseUrl}targets.json`).then(res => {
                if (!res.ok) throw new Error(`Failed to fetch targets.json: ${res.status} ${res.statusText}`);
                return res.json();
            }).catch(err => {
                console.error('Error fetching targets.json:', err);
                return null;
            }),
        ]);

        // Check if we have the basic metadata files
        if (!rootData || !timestampData || !snapshotData || !targetsData) {
            console.error('Failed to load one or more metadata files');
            return {
                roles: [],
                version: "TUF-JS Viewer v0.1.0",
                error: `Failed to load TUF metadata files. ${remoteUrl ? 
                    `Check that the URL ${remoteUrl} contains valid TUF metadata.` : 
                    'Make sure metadata files exist in the public/metadata directory.'}`
            };
        }

        // Extract role information
        const roles: RoleInfo[] = [];

        // Add root role
        if (rootData.signed) {
            roles.push({
                role: 'root',
                expires: rootData.signed.expires || 'Unknown',
                signers: {
                    required: rootData.signed.roles?.root?.threshold || 0,
                    total: rootData.signed.roles?.root?.keyids?.length || 0,
                    keyids: rootData.signed.roles?.root?.keyids || []
                },
                jsonLink: `${baseUrl}root.json`,
                version: rootData.signed.version,
                specVersion: rootData.signed.spec_version
            });
        }

        // Add timestamp role
        if (timestampData.signed) {
            roles.push({
                role: 'timestamp',
                expires: timestampData.signed.expires || 'Unknown',
                signers: {
                    required: rootData.signed.roles?.timestamp?.threshold || 0,
                    total: rootData.signed.roles?.timestamp?.keyids?.length || 0,
                    keyids: rootData.signed.roles?.timestamp?.keyids || []
                },
                jsonLink: `${baseUrl}timestamp.json`,
                version: timestampData.signed.version,
                specVersion: timestampData.signed.spec_version
            });
        }

        // Add snapshot role
        if (snapshotData.signed) {
            roles.push({
                role: 'snapshot',
                expires: snapshotData.signed.expires || 'Unknown',
                signers: {
                    required: rootData.signed.roles?.snapshot?.threshold || 0,
                    total: rootData.signed.roles?.snapshot?.keyids?.length || 0,
                    keyids: rootData.signed.roles?.snapshot?.keyids || []
                },
                jsonLink: `${baseUrl}snapshot.json`,
                version: snapshotData.signed.version,
                specVersion: snapshotData.signed.spec_version
            });
        }

        // Add targets role
        if (targetsData.signed) {
            roles.push({
                role: 'targets',
                expires: targetsData.signed.expires || 'Unknown',
                signers: {
                    required: rootData.signed.roles?.targets?.threshold || 0,
                    total: rootData.signed.roles?.targets?.keyids?.length || 0,
                    keyids: rootData.signed.roles?.targets?.keyids || []
                },
                jsonLink: `${baseUrl}targets.json`,
                version: targetsData.signed.version,
                specVersion: targetsData.signed.spec_version,
                targets: targetsData.signed.targets || {},
                delegations: targetsData.signed.delegations || undefined
            });
        }

        // Check for delegated roles in snapshot metadata
        if (snapshotData.signed && snapshotData.signed.meta) {
            const delegatedRoles = Object.keys(snapshotData.signed.meta)
                .filter(key => 
                    key !== 'root.json' && 
                    key !== 'timestamp.json' && 
                    key !== 'snapshot.json' && 
                    key !== 'targets.json' && 
                    key.endsWith('.json'));
            
            // Load delegated roles
            for (const roleFile of delegatedRoles) {
                try {
                    const roleName = roleFile.replace('.json', '');
                    const roleData = await fetch(`${baseUrl}${roleFile}`).then(res => {
                        if (!res.ok) throw new Error(`Failed to fetch ${roleFile}: ${res.status} ${res.statusText}`);
                        return res.json();
                    }).catch(err => {
                        console.error(`Error fetching ${roleFile}:`, err);
                        return null;
                    });
                    
                    if (roleData && roleData.signed) {
                        // Find the delegation info in the targets metadata
                        const delegationInfo = targetsData.signed.delegations?.roles?.find(
                            (r: DelegatedRole) => r.name === roleName
                        );
                        
                        roles.push({
                            role: roleName,
                            expires: roleData.signed.expires || 'Unknown',
                            signers: {
                                required: delegationInfo?.threshold || 0,
                                total: delegationInfo?.keyids?.length || 0,
                                keyids: delegationInfo?.keyids || []
                            },
                            jsonLink: `${baseUrl}${roleFile}`,
                            version: roleData.signed.version,
                            specVersion: roleData.signed.spec_version,
                            targets: roleData.signed.targets || {}
                        });
                    }
                } catch (err) {
                    console.error(`Error loading delegated role ${roleFile}:`, err);
                }
            }
        }

        // If no roles found, return an error
        if (roles.length === 0) {
            console.log('No roles found in the repository');
            return {
                roles: [],
                version: "TUF-JS Viewer v0.1.0",
                error: `No TUF roles found. ${remoteUrl ? 
                    `Check that the URL ${remoteUrl} contains valid TUF metadata.` : 
                    'Make sure metadata files exist in the public/metadata directory.'}`
            };
        }

        // Using a hardcoded version since we can't rely on the tuf-js package
        const version = "TUF-JS v3.0.1";

        return {
            roles,
            version,
            error: null
        };
    } catch (err: any) {
        console.error('Failed to load TUF data:', err);
        const errorMessage = err?.message || 'Unknown error';
        console.error('Error details:', errorMessage);

        return {
            roles: [],
            version: "TUF-JS Viewer v0.1.0",
            error: `Failed to load TUF repository data: ${errorMessage}`
        };
    }
}

// Function to get a list of available root versions
export async function getAvailableRootVersions(remoteUrl?: string): Promise<{ version: number; path: string }[]> {
    try {
        const baseUrl = remoteUrl ? 
            (remoteUrl.endsWith('/') ? remoteUrl : `${remoteUrl}/`) : 
            '/metadata/';
            
        // Try to fetch the root.json file first to get the current version
        const rootResponse = await fetch(`${baseUrl}root.json`);
        if (!rootResponse.ok) {
            throw new Error(`Failed to fetch root.json: ${rootResponse.status} ${rootResponse.statusText}`);
        }
        
        const rootData = await rootResponse.json();
        const currentVersion = rootData.signed?.version;
        
        if (!currentVersion) {
            throw new Error('Invalid root.json: missing version');
        }
        
        // Create a list with the current version
        const versions = [
            { version: currentVersion, path: `${baseUrl}root.json` }
        ];
        
        // Try to fetch previous versions if they exist
        for (let v = 1; v < currentVersion; v++) {
            try {
                const versionedUrl = `${baseUrl}${v}.root.json`;
                const response = await fetch(versionedUrl, { method: 'HEAD' });
                
                if (response.ok) {
                    versions.push({ version: v, path: versionedUrl });
                }
            } catch (e) {
                // Ignore errors for previous versions that don't exist
                console.log(`Version ${v} not found, skipping`);
            }
        }
        
        // Sort by version in descending order
        return versions.sort((a, b) => b.version - a.version);
    } catch (error) {
        console.error('Error getting root versions:', error);
        return [];
    }
}

export async function loadRootByVersion(version: number, remoteUrl?: string): Promise<any> {
    try {
        const baseUrl = remoteUrl ? 
            (remoteUrl.endsWith('/') ? remoteUrl : `${remoteUrl}/`) : 
            '/metadata/';
            
        // Determine the URL based on version
        const url = version === 0 ? 
            `${baseUrl}root.json` : 
            `${baseUrl}${version}.root.json`;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Error loading root version ${version}:`, error);
        throw error;
    }
} 