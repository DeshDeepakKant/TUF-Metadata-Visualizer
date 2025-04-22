'use client';

import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';
import { RoleInfo } from './types';
import { parseISO, format } from 'date-fns';

/**
 * Utility for fetching and parsing TUF metadata from remote repositories
 * This client-side implementation handles remote TUF repositories
 */
export class RemoteTufRepository {
    private baseUrl: string;
    private rootMetadata: Metadata<Root> | null = null;
    private timestampMetadata: Metadata<Timestamp> | null = null;
    private snapshotMetadata: Metadata<Snapshot> | null = null;
    private targetsMetadata: Metadata<Targets> | null = null;
    private delegatedTargetsMetadata: Map<string, Metadata<Targets>> = new Map();
    private corsProxyUrl: string | null = null;

    constructor(baseUrl: string, corsProxyUrl: string | null = null) {
        // Ensure the base URL ends with a slash
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        this.corsProxyUrl = corsProxyUrl;
    }

    /**
     * Initialize the repository by fetching and parsing all metadata files
     */
    async initialize(): Promise<void> {
        try {
            console.log(`Initializing remote TUF repository from: ${this.baseUrl}`);

            // First, fetch timestamp to get the latest snapshot version
            const timestampData = await this.fetchJsonMetadata('timestamp.json');
            if (!timestampData) {
                throw new Error('Failed to fetch timestamp.json');
            }

            const timestampSigned = Timestamp.fromJSON(timestampData.signed);
            this.timestampMetadata = new Metadata<Timestamp>(
                timestampSigned,
                this.convertSignatures(timestampData.signatures)
            );

            // Next, fetch root.json
            const rootData = await this.fetchJsonMetadata('root.json');
            if (!rootData) {
                throw new Error('Failed to fetch root.json');
            }

            const rootSigned = Root.fromJSON(rootData.signed);
            this.rootMetadata = new Metadata<Root>(
                rootSigned,
                this.convertSignatures(rootData.signatures)
            );

            // Fetch snapshot.json
            const snapshotData = await this.fetchJsonMetadata('snapshot.json');
            if (!snapshotData) {
                throw new Error('Failed to fetch snapshot.json');
            }

            const snapshotSigned = Snapshot.fromJSON(snapshotData.signed);
            this.snapshotMetadata = new Metadata<Snapshot>(
                snapshotSigned,
                this.convertSignatures(snapshotData.signatures)
            );

            // Fetch targets.json
            const targetsData = await this.fetchJsonMetadata('targets.json');
            if (!targetsData) {
                throw new Error('Failed to fetch targets.json');
            }

            const targetsSigned = Targets.fromJSON(targetsData.signed);
            this.targetsMetadata = new Metadata<Targets>(
                targetsSigned,
                this.convertSignatures(targetsData.signatures)
            );

            // Load delegated targets from snapshot metadata
            await this.loadDelegatedTargets();

            console.log('Remote TUF repository initialized successfully');
        } catch (error) {
            console.error('Failed to initialize remote TUF repository:', error);
            throw error;
        }
    }

    /**
     * Fetch and parse delegated targets from snapshot metadata
     */
    private async loadDelegatedTargets(): Promise<void> {
        if (!this.snapshotMetadata?.signed) {
            return;
        }

        const snapshot = this.snapshotMetadata.signed;
        const metaKeys = Object.keys(snapshot.meta || {});

        // Filter for delegated roles
        const delegatedRoles = metaKeys.filter(key => {
            // Skip top-level metadata files
            return ![
                'root.json',
                'timestamp.json',
                'snapshot.json',
                'targets.json'
            ].includes(key) && key.endsWith('.json');
        });

        // Only log if we found delegated roles
        if (delegatedRoles.length > 0) {
            console.log(`Processing ${delegatedRoles.length} delegated role(s): ${delegatedRoles.join(', ')}`);
        }

        // Process each delegated role
        for (const role of delegatedRoles) {
            try {
                const roleName = role.replace('.json', '');
                const delegatedData = await this.fetchJsonMetadata(role);
                
                if (delegatedData) {
                    const delegatedSigned = Targets.fromJSON(delegatedData.signed);
                    this.delegatedTargetsMetadata.set(
                        roleName,
                        new Metadata<Targets>(
                            delegatedSigned,
                            this.convertSignatures(delegatedData.signatures)
                        )
                    );
                }
            } catch (e) {
                // Log error but continue processing other roles
                console.error(`Error processing delegated role ${role}:`, e);
            }
        }

        // Log final summary
        const loadedRoles = Array.from(this.delegatedTargetsMetadata.keys());
        if (loadedRoles.length > 0) {
            console.log(`Successfully loaded delegated role(s): ${loadedRoles.join(', ')}`);
        }
    }

    /**
     * Helper to convert array of signatures to record format
     */
    private convertSignatures(signatures: Array<{keyid: string, sig: string}>): Record<string, any> {
        if (!signatures || !Array.isArray(signatures)) {
            console.warn("No valid signatures array provided");
            return {};
        }
        
        const result: Record<string, any> = {};
        
        // Check for duplicate keyids
        const keyIds = new Set<string>();
        
        for (const sig of signatures) {
            if (!sig || typeof sig !== 'object' || !('keyid' in sig) || !('sig' in sig)) {
                console.warn("Skipping invalid signature:", sig);
                continue;
            }
            
            const { keyid, sig: signature } = sig;
            
            if (keyIds.has(keyid)) {
                console.warn(`Multiple signatures found for keyid ${keyid}`);
                // Latest one wins in case of duplicates
            }
            
            keyIds.add(keyid);
            
            result[keyid] = {
                keyid,
                sig: signature
            };
        }
        
        return result;
    }

    /**
     * Fetch JSON metadata from the remote repository
     * Handles CORS using a proxy if specified
     */
    private async fetchJsonMetadata(fileName: string): Promise<any> {
        try {
            let url = `${this.baseUrl}${fileName}`;
            
            // If a CORS proxy is specified, use it
            if (this.corsProxyUrl) {
                // Encode the target URL for the proxy
                const encodedUrl = encodeURIComponent(url);
                url = `${this.corsProxyUrl}${encodedUrl}`;
            }
            
            console.log(`Fetching ${fileName} from ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${fileName}:`, error);
            throw error;
        }
    }

    /**
     * Get information about all roles in the repository
     */
    getRoleInfo(): RoleInfo[] {
        const roles: RoleInfo[] = [];
        
        // Add top-level roles if they exist
        if (this.rootMetadata) {
            const root = this.rootMetadata.signed;
            roles.push({
                name: 'root',
                type: 'Root',
                version: root.version,
                expires: formatExpirationDate(root.expires),
                signatures: Object.keys(this.rootMetadata.signatures).length,
                keyIds: this.getKeyIdsForRole('root'),
                threshold: root.roles.root.threshold,
                specVersion: root.specification_version || '',
                originalExpires: root.expires
            });
        }
        
        if (this.timestampMetadata) {
            const timestamp = this.timestampMetadata.signed;
            roles.push({
                name: 'timestamp',
                type: 'Timestamp',
                version: timestamp.version,
                expires: formatExpirationDate(timestamp.expires),
                signatures: Object.keys(this.timestampMetadata.signatures).length,
                keyIds: this.getKeyIdsForRole('timestamp'),
                threshold: this.rootMetadata?.signed.roles.timestamp.threshold || 0,
                specVersion: this.rootMetadata?.signed.specification_version || '',
                originalExpires: timestamp.expires
            });
        }
        
        if (this.snapshotMetadata) {
            const snapshot = this.snapshotMetadata.signed;
            roles.push({
                name: 'snapshot',
                type: 'Snapshot',
                version: snapshot.version,
                expires: formatExpirationDate(snapshot.expires),
                signatures: Object.keys(this.snapshotMetadata.signatures).length,
                keyIds: this.getKeyIdsForRole('snapshot'),
                threshold: this.rootMetadata?.signed.roles.snapshot.threshold || 0,
                specVersion: this.rootMetadata?.signed.specification_version || '',
                originalExpires: snapshot.expires
            });
        }
        
        if (this.targetsMetadata) {
            const targets = this.targetsMetadata.signed;
            roles.push({
                name: 'targets',
                type: 'Targets',
                version: targets.version,
                expires: formatExpirationDate(targets.expires),
                signatures: Object.keys(this.targetsMetadata.signatures).length,
                keyIds: this.getKeyIdsForRole('targets'),
                threshold: this.rootMetadata?.signed.roles.targets.threshold || 0,
                specVersion: this.rootMetadata?.signed.specification_version || '',
                originalExpires: targets.expires
            });
        }
        
        // Add delegated targets
        for (const [name, metadata] of this.delegatedTargetsMetadata.entries()) {
            const delegated = metadata.signed;
            roles.push({
                name,
                type: 'Delegated',
                version: delegated.version,
                expires: formatExpirationDate(delegated.expires),
                signatures: Object.keys(metadata.signatures).length,
                keyIds: Object.keys(metadata.signatures),
                threshold: this.findDelegatedRoleThreshold(name) || 1,
                specVersion: this.rootMetadata?.signed.specification_version || '',
                originalExpires: delegated.expires
            });
        }
        
        return roles;
    }

    /**
     * Find the threshold for a delegated role
     */
    private findDelegatedRoleThreshold(roleName: string): number | null {
        // Check in targets.delegations
        if (this.targetsMetadata?.signed.delegations?.roles) {
            const role = this.targetsMetadata.signed.delegations.roles.find(
                r => r.name === roleName
            );
            if (role) {
                return role.threshold;
            }
        }
        
        // Check in other delegated targets that might have nested delegations
        for (const [name, metadata] of this.delegatedTargetsMetadata.entries()) {
            if (metadata.signed.delegations?.roles) {
                const role = metadata.signed.delegations.roles.find(
                    r => r.name === roleName
                );
                if (role) {
                    return role.threshold;
                }
            }
        }
        
        return null;
    }

    /**
     * Get key IDs for a specific role
     */
    private getKeyIdsForRole(roleName: string): string[] {
        if (!this.rootMetadata?.signed.roles[roleName]) {
            return [];
        }
        
        return this.rootMetadata.signed.roles[roleName].keyids || [];
    }

    /**
     * Get all keys from the repository
     */
    getKeys(): Record<string, any> {
        if (!this.rootMetadata?.signed.keys) {
            return {};
        }
        
        return this.rootMetadata.signed.keys;
    }
}

/**
 * Format an expiration date for display
 */
function formatExpirationDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM d, yyyy h:mm a');
    } catch (e) {
        return dateString;
    }
}

/**
 * Discover TUF repository metadata from a base URL
 */
export async function discoverTufRepository(baseUrl: string): Promise<boolean> {
    try {
        // Normalize the base URL
        const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        
        // Check if timestamp.json exists (minimum requirement for a TUF repo)
        const response = await fetch(`${normalizedUrl}timestamp.json`, {
            method: 'HEAD'
        });
        
        return response.ok;
    } catch (error) {
        console.error('Error discovering TUF repository:', error);
        return false;
    }
}

/**
 * Create a RemoteTufRepository instance and initialize it
 */
export const createRemoteTufRepository = async (
    baseUrl: string,
    corsProxyUrl: string | null = null
): Promise<RemoteTufRepository> => {
    const repository = new RemoteTufRepository(baseUrl, corsProxyUrl);
    await repository.initialize();
    return repository;
}; 