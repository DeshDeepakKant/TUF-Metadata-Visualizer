'use server';

import { createTufRepository } from './tufClient';
import { RoleInfo } from './types';
import fs from 'fs';
import path from 'path';

// Function to load TUF data
export async function loadTufData(remoteUrl?: string): Promise<{ roles: RoleInfo[], version: string, error: string | null }> {
    try {
        // Check for metadata directory if no remoteUrl provided
        if (!remoteUrl) {
            const metadataDir = path.join(process.cwd(), 'public', 'metadata');
            if (!fs.existsSync(metadataDir)) {
                return { 
                    roles: [], 
                    version: process.env.VERSION || '0.1.0', 
                    error: `Metadata directory not found. Please provide a remote URL or create a directory at ${metadataDir}`
                };
            }
        } else {
            // Validate the remote URL format
            try {
                // Test URL by attempting to fetch timestamp.json
                const testUrl = new URL('timestamp.json', remoteUrl).toString();
                const response = await fetch(testUrl, { next: { revalidate: 0 } });
                
                if (!response.ok) {
                    return {
                        roles: [],
                        version: process.env.VERSION || '0.1.0',
                        error: `Failed to fetch timestamp.json from ${remoteUrl}: ${response.status} ${response.statusText}`
                    };
                }
            } catch (urlError) {
                return {
                    roles: [],
                    version: process.env.VERSION || '0.1.0',
                    error: `Invalid URL or network error: ${urlError instanceof Error ? urlError.message : String(urlError)}`
                };
            }
        }
        
        const repository = await createTufRepository(remoteUrl);
        const roles = repository.getRoleInfo();
        
        // Get version for display
        const version = process.env.VERSION || '0.1.0';
        
        return { roles, version, error: null };
    } catch (error) {
        console.error('Error loading TUF data:', error);
        return { 
            roles: [], 
            version: process.env.VERSION || '0.1.0', 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

// Function to get a list of available root versions
export async function getAvailableRootVersions(remoteUrl?: string): Promise<{ version: number; path: string }[]> {
    try {
        // If a remote URL is provided, we need to fetch versions differently
        if (remoteUrl) {
            return await getRemoteRootVersions(remoteUrl);
        }
        
        const metadataDir = path.join(process.cwd(), 'public', 'metadata');
        
        // Check if metadata directory exists
        if (!fs.existsSync(metadataDir)) {
            throw new Error('Metadata directory not found');
        }
        
        // Get all files in metadata directory
        const files = fs.readdirSync(metadataDir);
        
        // Filter for root files with version numbers
        const rootVersions: { version: number; path: string }[] = [];
        
        // Match both root.json and root.*.json files
        const currentRoot = files.find(file => file === 'root.json');
        if (currentRoot) {
            // Read current root to get its version
            const rootPath = path.join(metadataDir, currentRoot);
            try {
                const rootContent = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
                if (rootContent.signed && typeof rootContent.signed.version === 'number') {
                    rootVersions.push({
                        version: rootContent.signed.version,
                        path: rootPath
                    });
                }
            } catch (e) {
                console.error('Error parsing current root.json:', e);
            }
        }
        
        // Match root.<version>.json pattern
        const versionedRootRegex = /^root\.(\d+)\.json$/;
        files.forEach(file => {
            const match = file.match(versionedRootRegex);
            if (match && match[1]) {
                const version = parseInt(match[1], 10);
                if (!isNaN(version)) {
                    rootVersions.push({
                        version,
                        path: path.join(metadataDir, file)
                    });
                }
            }
        });
        
        // Sort by version (descending)
        return rootVersions.sort((a, b) => b.version - a.version);
    } catch (error) {
        console.error('Error getting available root versions:', error);
        return [];
    }
}

// Fetch root versions from a remote URL
async function getRemoteRootVersions(remoteUrl: string): Promise<{ version: number; path: string }[]> {
    try {
        const rootVersions: { version: number; path: string }[] = [];
        
        // First try to fetch timestamp.json to get latest metadata
        let url = new URL('timestamp.json', remoteUrl).toString();
        let response = await fetch(url, { next: { revalidate: 0 } });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch timestamp.json: ${response.status} ${response.statusText}`);
        }
        
        // Try to discover root versions by attempting requests
        // Start with unversioned root.json
        url = new URL('root.json', remoteUrl).toString();
        response = await fetch(url, { next: { revalidate: 0 } });
        
        if (response.ok) {
            const rootData = await response.json();
            if (rootData.signed && typeof rootData.signed.version === 'number') {
                rootVersions.push({
                    version: rootData.signed.version,
                    path: url
                });
            }
        }
        
        // Find all available versioned roots
        // This is a simplistic approach - in a real implementation we'd 
        // follow the TUF spec more precisely for discovering versions
        let version = 1;
        const maxAttempts = 100; // Prevent infinite loops
        
        for (let i = 0; i < maxAttempts; i++) {
            url = new URL(`${version}.root.json`, remoteUrl).toString();
            
            try {
                response = await fetch(url, { next: { revalidate: 0 } });
                
                if (response.ok) {
                    const rootData = await response.json();
                    if (rootData.signed && typeof rootData.signed.version === 'number') {
                        rootVersions.push({
                            version: rootData.signed.version,
                            path: url
                        });
                    }
                    version++;
                } else {
                    // If we get a 404, try the next version format
                    const altUrl = new URL(`root.${version}.json`, remoteUrl).toString();
                    response = await fetch(altUrl, { next: { revalidate: 0 } });
                    
                    if (response.ok) {
                        const rootData = await response.json();
                        if (rootData.signed && typeof rootData.signed.version === 'number') {
                            rootVersions.push({
                                version: rootData.signed.version,
                                path: altUrl
                            });
                        }
                    } else {
                        // If we've tried both formats and no file exists, we've probably reached the end
                        break;
                    }
                    version++;
                }
            } catch (error) {
                console.error(`Error fetching root version ${version}:`, error);
                // Keep trying the next version
                version++;
            }
        }
        
        // Sort by version (descending)
        return rootVersions.sort((a, b) => b.version - a.version);
    } catch (error) {
        console.error('Error getting remote root versions:', error);
        return [];
    }
}

// Function to load a specific root.json file by version
export async function loadRootByVersion(version: number, remoteUrl?: string): Promise<any> {
    try {
        const versions = await getAvailableRootVersions(remoteUrl);
        const versionData = versions.find(v => v.version === version);
        
        if (!versionData) {
            throw new Error(`Root version ${version} not found`);
        }
        
        if (remoteUrl) {
            // For remote URLs, fetch the file
            const response = await fetch(versionData.path, { next: { revalidate: 0 } });
            if (!response.ok) {
                throw new Error(`Failed to fetch root version ${version}: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } else {
            // For local files, read from disk
            const fileContent = fs.readFileSync(versionData.path, 'utf8');
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error(`Error loading root version ${version}:`, error);
        throw error;
    }
} 