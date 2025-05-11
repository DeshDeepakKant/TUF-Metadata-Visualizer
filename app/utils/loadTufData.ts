'use server';

import { createTufRepository } from './tufClient';
import { RoleInfo } from './types';

export async function loadTufData(): Promise<{
    roles: RoleInfo[],
    version: string,
    error: string | null
}> {
    try {
        console.log('Starting to load TUF data...');

        // Load TUF repository data
        const repository = await createTufRepository();
        console.log('Repository created successfully');

        const roleInfo = repository.getRoleInfo();
        console.log(`Loaded ${roleInfo.length} roles`);

        // If no roles found, return an error
        if (roleInfo.length === 0) {
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