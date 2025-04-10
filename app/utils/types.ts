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