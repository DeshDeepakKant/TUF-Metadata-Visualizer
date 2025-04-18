/**
 * Core TUF metadata types for root.json analysis
 */

export interface TufKey {
    keyid_hash_algorithms: string[];
    keytype: string;
    keyval: {
        public: string;
    };
    scheme: string;
    'x-tuf-on-ci-keyowner'?: string;
    'x-tuf-on-ci-online-uri'?: string;
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

/**
 * Diff-related interfaces for comparing root.json versions
 */
export interface KeyDiff {
    keyid: string;
    status: 'added' | 'removed' | 'changed';
    keytype?: string;
    scheme?: string;
    oldKeytype?: string;
    oldScheme?: string;
    keyowner?: string; // From x-tuf-on-ci-keyowner
}

export interface RoleDiff {
    roleName: string;
    addedKeyids: string[];
    removedKeyids: string[];
    oldThreshold?: number;
    newThreshold?: number;
}

export interface SignatureDiff {
    keyid: string;
    oldSigned: boolean;
    newSigned: boolean;
    keyowner?: string;
}

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
 * Role information for display in the UI
 */
export interface RoleInfo {
    role: string;
    signingStarts?: string;
    expires: string;
    signers: {
        required: number;
        total: number;
        keyids: string[];
    };
    jsonLink: string;
    version?: number;
    specVersion?: string;
} 