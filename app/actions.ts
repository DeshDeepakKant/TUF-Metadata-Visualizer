'use server';

import { getAvailableRootVersions, loadRootByVersion } from './utils/loadTufData';
import { compareRootMetadata } from './utils/diffUtils';
import { RootDiff } from './utils/types';

/**
 * Gets a list of available root versions for the version selector
 * @returns Array of version numbers
 */
export async function getAvailableRootVersionsAction(): Promise<{ version: number }[]> {
    const versions = await getAvailableRootVersions();
    return versions.map(v => ({ version: v.version }));
}

/**
 * Compares two root versions and generates a detailed diff
 * @param oldVersion - Previous version number
 * @param newVersion - New version number
 * @returns Object containing the diff and any error that occurred
 */
export async function compareRootVersionsAction(
    oldVersion: number, 
    newVersion: number
): Promise<{ diff: RootDiff | null; error: string | null }> {
    try {
        if (oldVersion === newVersion) {
            return { 
                diff: null, 
                error: 'Cannot compare a version to itself. Please select different versions.' 
            };
        }
        
        // Ensure we're comparing in chronological order
        const [older, newer] = oldVersion < newVersion 
            ? [oldVersion, newVersion] 
            : [newVersion, oldVersion];
        
        const oldRoot = await loadRootByVersion(older);
        const newRoot = await loadRootByVersion(newer);
        
        if (!oldRoot || !newRoot) {
            return { 
                diff: null, 
                error: 'Failed to load one of the root versions.' 
            };
        }
        
        const diff = compareRootMetadata(
            oldRoot.signed,
            newRoot.signed,
            oldRoot.signatures,
            newRoot.signatures
        );
        
        return { diff, error: null };
    } catch (error) {
        console.error('Error comparing root versions:', error);
        return { 
            diff: null, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
} 