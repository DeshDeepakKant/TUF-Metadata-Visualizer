'use client';

import { RoleInfo } from './types';

// Define a type for the delegated role
interface DelegatedRole {
    name: string;
    keyids: string[];
    threshold: number;
    paths?: string[];
    terminating?: boolean;
}

// Client-side function to load TUF data from static files
export async function loadTufData(): Promise<{
    roles: RoleInfo[],
    version: string,
    error: string | null
}> {
    try {
        console.log('Starting to load TUF data from client-side...');

        // Load the metadata files via fetch
        const [rootData, timestampData, snapshotData, targetsData] = await Promise.all([
            fetch('/metadata/root.json').then(res => res.json()).catch(() => null),
            fetch('/metadata/timestamp.json').then(res => res.json()).catch(() => null),
            fetch('/metadata/snapshot.json').then(res => res.json()).catch(() => null),
            fetch('/metadata/targets.json').then(res => res.json()).catch(() => null),
        ]);

        // Check if we have the basic metadata files
        if (!rootData || !timestampData || !snapshotData || !targetsData) {
            console.error('Failed to load one or more metadata files');
            return {
                roles: [],
                version: "TUF-JS Viewer v0.1.0",
                error: 'Failed to load TUF metadata files. Make sure they exist in the public/metadata directory.'
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
                jsonLink: '/metadata/root.json',
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
                jsonLink: '/metadata/timestamp.json',
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
                jsonLink: '/metadata/snapshot.json',
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
                jsonLink: '/metadata/targets.json',
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
                    const roleData = await fetch(`/metadata/${roleFile}`).then(res => res.json()).catch(() => null);
                    
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
                            jsonLink: `/metadata/${roleFile}`,
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
                error: 'No TUF roles found. Make sure metadata files exist in the public/metadata directory.'
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