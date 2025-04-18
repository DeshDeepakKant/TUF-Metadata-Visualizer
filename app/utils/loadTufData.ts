'use server';

import { createTufRepository } from './tufClient';
import { RoleInfo } from './types';
import fs from 'fs';
import path from 'path';

/**
 * Loads TUF repository data and returns role information
 * @returns Object containing roles, version, and any error that occurred
 */
export async function loadTufData(): Promise<{ roles: RoleInfo[], version: string, error: string | null }> {
    try {
        const repository = await createTufRepository();
        const roles = repository.getRoleInfo();
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

/**
 * Gets a list of available root.json versions from the metadata directory
 * @returns Array of objects containing version numbers and file paths
 */
export async function getAvailableRootVersions(): Promise<{ version: number; path: string }[]> {
    try {
        const metadataDir = path.join(process.cwd(), 'public', 'metadata');
        console.log('Checking metadata directory:', metadataDir);
        
        if (!fs.existsSync(metadataDir)) {
            console.error('Metadata directory not found:', metadataDir);
            throw new Error('Metadata directory not found');
        }
        
        const files = fs.readdirSync(metadataDir);
        console.log('Found files in metadata directory:', files);
        
        const rootVersions: { version: number; path: string }[] = [];
        
        // Check for current root.json
        const currentRoot = files.find(file => file === 'root.json');
        if (currentRoot) {
            try {
                const rootPath = path.join(metadataDir, currentRoot);
                console.log('Reading current root.json:', rootPath);
                const rootContent = JSON.parse(fs.readFileSync(rootPath, 'utf8'));
                if (rootContent.signed?.version) {
                    console.log('Found current root version:', rootContent.signed.version);
                    rootVersions.push({
                        version: rootContent.signed.version,
                        path: rootPath
                    });
                }
            } catch (e) {
                console.error('Error parsing current root.json:', e);
            }
        }
        
        // Check for versioned root files
        const versionedRootRegex = /^root\.(\d+)\.json$/;
        files.forEach(file => {
            const match = file.match(versionedRootRegex);
            if (match?.[1]) {
                const version = parseInt(match[1], 10);
                if (!isNaN(version)) {
                    console.log('Found versioned root file:', file, 'version:', version);
                    rootVersions.push({
                        version,
                        path: path.join(metadataDir, file)
                    });
                }
            }
        });
        
        console.log('Total root versions found:', rootVersions.length);
        return rootVersions.sort((a, b) => b.version - a.version);
    } catch (error) {
        console.error('Error getting available root versions:', error);
        return [];
    }
}

/**
 * Loads a specific root.json file by version number
 * @param version - The version number to load
 * @returns Parsed root.json content
 * @throws Error if version not found or file cannot be loaded
 */
export async function loadRootByVersion(version: number): Promise<any> {
    try {
        const versions = await getAvailableRootVersions();
        console.log('Available versions:', versions);
        const versionData = versions.find(v => v.version === version);
        
        if (!versionData) {
            console.error('Version not found:', version);
            throw new Error(`Root version ${version} not found`);
        }
        
        console.log('Loading root version:', version, 'from:', versionData.path);
        const fileContent = fs.readFileSync(versionData.path, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading root version ${version}:`, error);
        throw error;
    }
} 