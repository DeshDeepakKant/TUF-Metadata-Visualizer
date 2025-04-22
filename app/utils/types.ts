/**
 * Types for TUF metadata representation
 * 
 * USAGE STATUS:
 * - RoleInfo: USED DIRECTLY by TufRepository, RoleTable, and TufViewerClient components
 * - TufKey: USED INDIRECTLY in TufTargetsMetadata and TufRootMetadata
 * - TufRole: USED INDIRECTLY in TufRootMetadata
 * - TufRootMetadata: UNUSED directly, but kept for reference to TUF specification
 * - TufTimestampMetadata: UNUSED directly, but kept for reference to TUF specification
 * - TufSnapshotMetadata: UNUSED directly, but kept for reference to TUF specification
 * - TufTargetsMetadata: UNUSED directly, but kept for reference to TUF specification
 * - TufSignedMetadata: UNUSED directly, but kept for reference to TUF specification
 * 
 * NOTE: These interfaces could be replaced with direct imports from @tufjs/models
 * in the future, as those would be more up-to-date with the TUF specification.
 * For now, we're keeping them for reference and potential future use.
 */

export interface TufKey {
    keyid_hash_algorithms: string[];
    keytype: string;
    keyval: {
        public: string;
    };
    scheme: string;
}

export interface TufRole {
    keyids: string[];
    threshold: number;
}

export interface TufRootMetadata {
    _type: string;
    consistent_snapshot: boolean;
    expires: string;
    keys: Record<string, TufKey>;
    roles: {
        root: TufRole;
        snapshot: TufRole;
        targets: TufRole;
        timestamp: TufRole;
        [key: string]: TufRole;
    };
    spec_version: string;
    version: number;
    specification_version?: string;
}

export interface TufTimestampMetadata {
    _type: string;
    expires: string;
    meta: {
        [key: string]: {
            hashes: {
                [algorithm: string]: string;
            };
            length: number;
            version: number;
        };
    };
    spec_version: string;
    version: number;
}

export interface TufSnapshotMetadata {
    _type: string;
    expires: string;
    meta: {
        [key: string]: {
            hashes?: {
                [algorithm: string]: string;
            };
            length: number;
            version: number;
        };
    };
    spec_version: string;
    version: number;
}

export interface TufTargetsMetadata {
    _type: string;
    expires: string;
    spec_version: string;
    targets: Record<string, {
        hashes: Record<string, string>;
        length: number;
        custom?: any;
    }>;
    version: number;
    delegations?: {
        keys: Record<string, TufKey>;
        roles: Array<{
            name: string;
            keyids: string[];
            threshold: number;
            paths?: string[];
            path_hash_prefixes?: string[];
        }>;
    };
}

export interface TufSignedMetadata<T> {
    signatures: Array<{
        keyid: string;
        sig: string;
    }>;
    signed: T;
}

export interface RoleInfo {
    name: string;
    type: string;
    version: number;
    expires: string;
    signatures: number;
    keyIds: string[];
    threshold: number;
    specVersion: string;
    originalExpires: string;
    
    role?: string;
    signingStarts?: string;
    signers?: {
        required: number;
        total: number;
        keyids: string[];
    };
    jsonLink?: string;
}

/**
 * Interface for repository source configuration
 */
export interface RepositorySource {
    type: 'local' | 'remote';
    url: string;
    corsProxyUrl?: string;
}

/**
 * Interface for root diff comparison
 */
export interface RootDiff {
    oldVersion: number;
    newVersion: number;
    oldExpires: string;
    newExpires: string;
    keyDiffs: KeyDiff[];
    roleDiffs: RoleDiff[];
    signatureDiffs: SignatureDiff[];
}

/**
 * Interface for key changes in root diff
 */
export interface KeyDiff {
    keyId: string;
    type: 'added' | 'removed' | 'modified';
    oldKey?: any;
    newKey?: any;
}

/**
 * Interface for role changes in root diff
 */
export interface RoleDiff {
    roleName: string;
    type: 'added' | 'removed' | 'modified';
    changes: {
        keyids?: {
            added: string[];
            removed: string[];
        };
        threshold?: {
            old: number;
            new: number;
        };
    };
}

/**
 * Interface for signature changes in root diff
 */
export interface SignatureDiff {
    keyId: string;
    type: 'added' | 'removed' | 'modified';
} 