import { RootDiff, KeyDiff, RoleDiff, SignatureDiff, TufRootMetadata, TufKey, TufRole } from './types';
import { format, parseISO } from 'date-fns';

/**
 * Formats a date string for display
 */
export function formatExpirationDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, "MMM d, yyyy HH:mm 'UTC'");
    } catch (e) {
        return dateString;
    }
}

/**
 * Truncates a keyid for display
 */
export function truncateKeyId(keyId: string): string {
    return keyId.substring(0, 8);
}

/**
 * Extracts the owner from the key metadata if available
 */
export function getKeyOwner(key: any): string | undefined {
    if (key && typeof key === 'object') {
        // Check for the x-tuf-on-ci-keyowner property
        if (key['x-tuf-on-ci-keyowner']) {
            return key['x-tuf-on-ci-keyowner'];
        }
        
        // Check for online key URI
        if (key['x-tuf-on-ci-online-uri']) {
            return 'Online Key';
        }
    }
    return undefined;
}

/**
 * Compare two root.json files and generate a diff object
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
            // Key was removed
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
    
    // Check all roles in both old and new root
    const allRoleNames = new Set([
        ...Object.keys(oldRoot.roles),
        ...Object.keys(newRoot.roles)
    ]);
    
    allRoleNames.forEach(roleName => {
        const oldRole = oldRoot.roles[roleName];
        const newRole = newRoot.roles[roleName];
        
        if (!oldRole && newRole) {
            // Role was added
            roleDiffs.push({
                roleName,
                addedKeyids: newRole.keyids,
                removedKeyids: [],
                newThreshold: newRole.threshold
            });
            return;
        }
        
        if (oldRole && !newRole) {
            // Role was removed
            roleDiffs.push({
                roleName,
                addedKeyids: [],
                removedKeyids: oldRole.keyids,
                oldThreshold: oldRole.threshold
            });
            return;
        }
        
        if (oldRole && newRole) {
            // Check for threshold changes
            const thresholdChanged = oldRole.threshold !== newRole.threshold;
            
            // Check for key changes
            const oldKeyIds = new Set(oldRole.keyids);
            const newKeyIds = new Set(newRole.keyids);
            
            const addedKeyids = newRole.keyids.filter(keyId => !oldKeyIds.has(keyId));
            const removedKeyids = oldRole.keyids.filter(keyId => !newKeyIds.has(keyId));
            
            // Only add to diffs if there are actual changes
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
    
    // Create sets of signed key IDs
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
    
    // All key IDs used in either signature set
    const allSignatureKeyIds = new Set([
        ...oldSignatures.map(sig => sig.keyid),
        ...newSignatures.map(sig => sig.keyid)
    ]);
    
    // Create signature diffs
    allSignatureKeyIds.forEach(keyId => {
        const oldSigned = oldSignedKeyIds.has(keyId);
        const newSigned = newSignedKeyIds.has(keyId);
        
        // Only include if signature status changed
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