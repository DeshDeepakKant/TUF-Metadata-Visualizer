'use server';

import { createTufRepository } from './tufClient';
import { createRemoteTufRepository } from './remoteRepository';
import { RoleInfo } from './types';

interface LoadTufDataOptions {
    repositoryUrl?: string;
}

export async function loadTufData(options: LoadTufDataOptions = {}): Promise<{
    roles: RoleInfo[],
    version: string,
    error: string | null
}> {
    try {
        console.log('Starting to load TUF data...');
        const { repositoryUrl } = options;
        
        let repository;
        
        // If a repository URL is provided, try to load from that URL
        if (repositoryUrl && repositoryUrl !== '/metadata/') {
            console.log(`Loading from remote repository: ${repositoryUrl}`);
            repository = await createRemoteTufRepository(repositoryUrl);
        } else {
            // Otherwise, load from local filesystem
            console.log('Loading from local repository');
            repository = await createTufRepository();
        }
        
        console.log('Repository created successfully');

        const roleInfo = repository.getRoleInfo();
        console.log(`Loaded ${roleInfo.length} roles`);

        // If no roles found, return an error
        if (roleInfo.length === 0) {
            console.log('No roles found in the repository');
            return {
                roles: [],
                version: "TUF-JS Viewer v0.1.0",
                error: 'No TUF roles found. Make sure metadata files exist in the repository.'
            };
        }

        // Using a hardcoded version since we can't rely on the tuf-js package
        const version = "TUF-JS v3.0.1";

        return {
            roles: roleInfo,
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