'use server';

import { getAvailableRootVersions, loadRootByVersion } from './utils/loadTufData';
import { compareRootMetadata } from './utils/diffUtils';
import { RootDiff } from './utils/types';

/**
 * Get a list of available root versions
 */
export async function getAvailableRootVersionsAction(): Promise<{ version: number }[]> {
    const versions = await getAvailableRootVersions();
    // Return only the version numbers for the client
    return versions.map(v => ({ version: v.version }));
}

/**
 * Compare two root versions and generate a diff
 */
export async function compareRootVersionsAction(
    oldVersion: number, 
    newVersion: number
): Promise<{ diff: RootDiff | null; error: string | null }> {
    try {
        // Validate input
        if (oldVersion === newVersion) {
            return { 
                diff: null, 
                error: 'Cannot compare a version to itself. Please select different versions.' 
            };
        }
        
        // Make sure oldVersion is actually older than newVersion
        const [older, newer] = oldVersion < newVersion 
            ? [oldVersion, newVersion] 
            : [newVersion, oldVersion];
        
        // Load the root files
        const oldRoot = await loadRootByVersion(older);
        const newRoot = await loadRootByVersion(newer);
        
        if (!oldRoot || !newRoot) {
            return { 
                diff: null, 
                error: 'Failed to load one of the root versions.' 
            };
        }
        
        // Compare the metadata
        const diff = compareRootMetadata(
            oldRoot.signed,
            newRoot.signed,
            oldRoot.signatures,
            newRoot.signatures
        );
        
        return { 
            diff, 
            error: null 
        };
    } catch (error) {
        console.error('Error comparing root versions:', error);
        return { 
            diff: null, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
} 