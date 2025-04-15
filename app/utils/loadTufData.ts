'use server';

import { createTufRepository } from './tufClient';
import { RoleInfo } from './types';
import fs from 'fs';
import path from 'path';

// Function to load TUF data
export async function loadTufData(): Promise<{ roles: RoleInfo[], version: string, error: string | null }> {
    try {
        const repository = await createTufRepository();
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
export async function getAvailableRootVersions(): Promise<{ version: number; path: string }[]> {
    try {
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

// Function to load a specific root.json file by version
export async function loadRootByVersion(version: number): Promise<any> {
    try {
        const versions = await getAvailableRootVersions();
        const versionData = versions.find(v => v.version === version);
        
        if (!versionData) {
            throw new Error(`Root version ${version} not found`);
        }
        
        // Read and parse the file
        const fileContent = fs.readFileSync(versionData.path, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading root version ${version}:`, error);
        throw error;
    }
} 