import { RootDiff, KeyDiff, RoleDiff, SignatureDiff, TufRootMetadata, TufKey, TufRole } from './types';
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string for display in a consistent format
 * @param dateString - ISO date string to format
 * @returns Formatted date string or original string if parsing fails
 */
export function formatExpirationDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, "MMM d, yyyy HH:mm 'UTC'");
    } catch (e) {
        console.warn('Failed to parse date:', dateString);
        return dateString;
    }
}

/**
 * Truncates a keyid for display purposes
 * @param keyId - Full key ID to truncate
 * @returns First 8 characters of the key ID
 */
export function truncateKeyId(keyId: string): string {
    return keyId.substring(0, 8);
}

/**
 * Extracts the owner information from a key's metadata
 * @param key - Key object to extract owner from
 * @returns Owner string or undefined if not available
 */
export function getKeyOwner(key: TufKey): string | undefined {
    if (!key || typeof key !== 'object') return undefined;
    
    // Check for the x-tuf-on-ci-keyowner property
    if (key['x-tuf-on-ci-keyowner']) {
        return key['x-tuf-on-ci-keyowner'];
    }
    
    // Check for online key URI
    if (key['x-tuf-on-ci-online-uri']) {
        return 'Online Key';
    }
    
    return undefined;
}

/**
 * Compares two root.json files and generates a detailed diff
 * @param oldRoot - Previous version of root.json
 * @param newRoot - New version of root.json
 * @param oldSignatures - Signatures from previous version
 * @param newSignatures - Signatures from new version
 * @returns Detailed diff object containing all changes
 */
export function compareRootMetadata(
    oldRoot: TufRootMetadata, 
    newRoot: TufRootMetadata,
    oldSignatures: Array<{keyid: string, sig: string}>,
    newSignatures: Array<{keyid: string, sig: string}>
): RootDiff {
    // Compare versions and expiry
    const oldVersion = oldRoot.version;
    const newVersion = newRoot.version;
    const oldExpires = oldRoot.expires;
    const newExpires = newRoot.expires;
    
    // Compare keys
    const keyDiffs: KeyDiff[] = [];
    
    // Find added and changed keys
    Object.entries(newRoot.keys).forEach(([keyId, newKey]) => {
        const oldKey = oldRoot.keys[keyId];
        
        if (!oldKey) {
            // Key was added
            keyDiffs.push({
                keyid: keyId,
                status: 'added',
                keytype: newKey.keytype,
                scheme: newKey.scheme,
                keyowner: getKeyOwner(newKey)
            });
        } else if (
            oldKey.keytype !== newKey.keytype || 
            oldKey.scheme !== newKey.scheme ||
            JSON.stringify(oldKey.keyval) !== JSON.stringify(newKey.keyval)
        ) {
            // Key was changed
            keyDiffs.push({
                keyid: keyId,
                status: 'changed',
                keytype: newKey.keytype,
                scheme: newKey.scheme,
                oldKeytype: oldKey.keytype,
                oldScheme: oldKey.scheme,
                keyowner: getKeyOwner(newKey)
            });
        }
    });
    
    // Find removed keys
    Object.entries(oldRoot.keys).forEach(([keyId, oldKey]) => {
        if (!newRoot.keys[keyId]) {
            keyDiffs.push({
                keyid: keyId,
                status: 'removed',
                oldKeytype: oldKey.keytype,
                oldScheme: oldKey.scheme,
                keyowner: getKeyOwner(oldKey)
            });
        }
    });
    
    // Compare roles
    const roleDiffs: RoleDiff[] = [];
    const allRoleNames = new Set([
        ...Object.keys(oldRoot.roles),
        ...Object.keys(newRoot.roles)
    ]);
    
    allRoleNames.forEach(roleName => {
        const oldRole = oldRoot.roles[roleName];
        const newRole = newRoot.roles[roleName];
        
        if (!oldRole && newRole) {
            roleDiffs.push({
                roleName,
                addedKeyids: newRole.keyids,
                removedKeyids: [],
                newThreshold: newRole.threshold
            });
            return;
        }
        
        if (oldRole && !newRole) {
            roleDiffs.push({
                roleName,
                addedKeyids: [],
                removedKeyids: oldRole.keyids,
                oldThreshold: oldRole.threshold
            });
            return;
        }
        
        if (oldRole && newRole) {
            const thresholdChanged = oldRole.threshold !== newRole.threshold;
            const oldKeyIds = new Set(oldRole.keyids);
            const newKeyIds = new Set(newRole.keyids);
            
            const addedKeyids = newRole.keyids.filter(keyId => !oldKeyIds.has(keyId));
            const removedKeyids = oldRole.keyids.filter(keyId => !newKeyIds.has(keyId));
            
            if (thresholdChanged || addedKeyids.length > 0 || removedKeyids.length > 0) {
                roleDiffs.push({
                    roleName,
                    addedKeyids,
                    removedKeyids,
                    oldThreshold: thresholdChanged ? oldRole.threshold : undefined,
                    newThreshold: thresholdChanged ? newRole.threshold : undefined
                });
            }
        }
    });
    
    // Compare signatures
    const signatureDiffs: SignatureDiff[] = [];
    const oldSignedKeyIds = new Set(
        oldSignatures
            .filter(sig => sig.sig && sig.sig.length > 0)
            .map(sig => sig.keyid)
    );
    
    const newSignedKeyIds = new Set(
        newSignatures
            .filter(sig => sig.sig && sig.sig.length > 0)
            .map(sig => sig.keyid)
    );
    
    const allSignatureKeyIds = new Set([
        ...oldSignatures.map(sig => sig.keyid),
        ...newSignatures.map(sig => sig.keyid)
    ]);
    
    allSignatureKeyIds.forEach(keyId => {
        const oldSigned = oldSignedKeyIds.has(keyId);
        const newSigned = newSignedKeyIds.has(keyId);
        
        if (oldSigned !== newSigned) {
            signatureDiffs.push({
                keyid: keyId,
                oldSigned,
                newSigned,
                keyowner: getKeyOwner(oldRoot.keys[keyId] || newRoot.keys[keyId])
            });
        }
    });
    
    return {
        oldVersion,
        newVersion,
        oldExpires,
        newExpires,
        keyDiffs,
        roleDiffs,
        signatureDiffs
    };
} 