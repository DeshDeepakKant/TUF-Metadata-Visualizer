/**
 * DEPRECATED: This file is no longer used in the application.
 * The functionality has been moved to loadTufData.ts.
 * This file is kept for reference purposes only.
 */

'use client';

import fs from 'fs';
import path from 'path';
import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';
import { RoleInfo } from './types';

// Constants
const METADATA_FS_PATH = path.join(process.cwd(), 'public', 'metadata');
const METADATA_BASE_URL = '/metadata';

// TUF Repository class to manage TUF metadata
export class TufRepository {
    private rootMetadata: Metadata<Root> | null = null;
    private timestampMetadata: Metadata<Timestamp> | null = null;
    private snapshotMetadata: Metadata<Snapshot> | null = null;
    private targetsMetadata: Metadata<Targets> | null = null;
    private delegatedTargetsMetadata: Map<string, Metadata<Targets>> = new Map();
    private baseUrl: string;
    private remoteUrl: string | null;

    constructor(baseUrl: string = METADATA_BASE_URL, remoteUrl: string | null = null) {
        this.baseUrl = baseUrl;
        this.remoteUrl = remoteUrl;
    }

    async initialize(): Promise<void> {
        try {
            // If a remote URL is provided, use that to fetch metadata
            if (this.remoteUrl) {
                await this.initializeFromRemote();
            } else {
                // Check if metadata directory exists before proceeding
                if (!fs.existsSync(METADATA_FS_PATH)) {
                    console.error(`Metadata directory not found: ${METADATA_FS_PATH}`);
                    throw new Error(
                        `Metadata directory not found. Either create a metadata folder at ${METADATA_FS_PATH} with TUF metadata files, or use a remote URL.`
                    );
                }
                
                // Otherwise, try to load from local files
                await this.initializeFromLocal();
            }
        } catch (error) {
            console.error("Error initializing TUF repository:", error);
            throw error;
        }
    }

    async initializeFromRemote(): Promise<void> {
        try {
            // Implement the TUF client workflow for remote fetching
            const rootData = await this.fetchLatestRoot();
            const rootSigned = Root.fromJSON(rootData.signed);
            this.rootMetadata = new Metadata<Root>(
                rootSigned,
                this.convertSignatures(rootData.signatures)
            );

            // Fetch timestamp.json (always latest)
            const timestampData = await this.fetchJsonMetadata('timestamp.json');
            const timestampSigned = Timestamp.fromJSON(timestampData.signed);
            this.timestampMetadata = new Metadata<Timestamp>(
                timestampSigned,
                this.convertSignatures(timestampData.signatures)
            );

            // Get the snapshot version from timestamp
            // Access as plain object since tufjs model might not expose the meta property correctly
            const timestampObj = timestampData.signed as any;
            const snapshotInfo = timestampObj.meta?.['snapshot.json'];
            const snapshotVersion = snapshotInfo?.version;
            
            // Fetch the specified snapshot version
            const snapshotFileName = snapshotVersion ? `${snapshotVersion}.snapshot.json` : 'snapshot.json';
            const snapshotData = await this.fetchJsonMetadata(snapshotFileName);
            const snapshotSigned = Snapshot.fromJSON(snapshotData.signed);
            this.snapshotMetadata = new Metadata<Snapshot>(
                snapshotSigned,
                this.convertSignatures(snapshotData.signatures)
            );

            // Get the targets version from snapshot
            // Access as plain object since tufjs model might not expose the meta property correctly
            const snapshotObj = snapshotData.signed as any;
            const targetsInfo = snapshotObj.meta?.['targets.json'];
            const targetsVersion = targetsInfo?.version;
            
            // Fetch the specified targets version
            const targetsFileName = targetsVersion ? `${targetsVersion}.targets.json` : 'targets.json';
            const targetsData = await this.fetchJsonMetadata(targetsFileName);
            const targetsSigned = Targets.fromJSON(targetsData.signed);
            this.targetsMetadata = new Metadata<Targets>(
                targetsSigned,
                this.convertSignatures(targetsData.signatures)
            );

            // Fetch delegated targets if they exist in the snapshot metadata
            await this.loadDelegatedTargetsFromRemote();
        } catch (error) {
            console.error("Error loading remote TUF metadata:", error);
            throw new Error(`Failed to load remote TUF metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // Fetch the latest root metadata following the TUF workflow
    private async fetchLatestRoot(): Promise<any> {
        let currentVersion = 1; // Start at version 1
        let latestRoot = null;
        
        while (true) {
            try {
                // Try to fetch the next version
                const nextVersion = currentVersion + 1;
                const rootData = await this.fetchJsonMetadata(`${nextVersion}.root.json`, false);
                
                if (rootData) {
                    // We found a valid next version
                    latestRoot = rootData;
                    currentVersion = nextVersion;
                } else {
                    // No higher version exists, use the current one
                    break;
                }
            } catch (error) {
                // If we get a 404, we've reached the highest version
                break;
            }
        }
        
        // If we didn't find any root version, try to fetch the unversioned root.json
        if (!latestRoot) {
            latestRoot = await this.fetchJsonMetadata('root.json');
        }
        
        if (!latestRoot) {
            throw new Error('Could not find any valid root metadata');
        }
        
        return latestRoot;
    }

    // Load delegated targets from remote
    private async loadDelegatedTargetsFromRemote(): Promise<void> {
        if (!this.snapshotMetadata?.signed) {
            return;
        }

        const snapshot = this.snapshotMetadata.signed;
        const metaKeys = Object.keys(snapshot.meta || {});

        // Filter for delegated roles
        const delegatedRoles = metaKeys.filter(key => {
            // Skip top-level metadata files
            if (['root.json', 'timestamp.json', 'snapshot.json', 'targets.json'].includes(key)) {
                return false;
            }

            // Must be a JSON file
            return key.endsWith('.json');
        });

        // Only log if we found delegated roles
        if (delegatedRoles.length > 0) {
            console.log(`Processing ${delegatedRoles.length} delegated role(s): ${delegatedRoles.join(', ')}`);
        }

        // Process each delegated role
        for (const role of delegatedRoles) {
            try {
                // Get version information from snapshot
                const roleInfo = snapshot.meta[role];
                const roleVersion = roleInfo?.version;
                
                // Use versioned filename if available
                const roleName = role.replace('.json', '');
                const roleFileName = roleVersion ? `${roleVersion}.${role}` : role;
                
                const delegatedData = await this.fetchJsonMetadata(roleFileName);
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

    async initializeFromLocal(): Promise<void> {
        try {
            // Log the directory contents to debug
            console.log('Metadata directory contents:', fs.readdirSync(METADATA_FS_PATH));

            // Read metadata files directly from the file system on the server
            const rootData = await this.readJsonMetadataFile('root.json');
            const rootSigned = Root.fromJSON(rootData.signed);
            this.rootMetadata = new Metadata<Root>(
                rootSigned,
                this.convertSignatures(rootData.signatures)
            );

            const timestampData = await this.readJsonMetadataFile('timestamp.json');
            const timestampSigned = Timestamp.fromJSON(timestampData.signed);
            this.timestampMetadata = new Metadata<Timestamp>(
                timestampSigned,
                this.convertSignatures(timestampData.signatures)
            );

            const snapshotData = await this.readJsonMetadataFile('snapshot.json');
            const snapshotSigned = Snapshot.fromJSON(snapshotData.signed);
            this.snapshotMetadata = new Metadata<Snapshot>(
                snapshotSigned,
                this.convertSignatures(snapshotData.signatures)
            );

            const targetsData = await this.readJsonMetadataFile('targets.json');
            const targetsSigned = Targets.fromJSON(targetsData.signed);
            this.targetsMetadata = new Metadata<Targets>(
                targetsSigned,
                this.convertSignatures(targetsData.signatures)
            );

            // Fetch delegated targets if they exist in the snapshot metadata
            await this.loadDelegatedTargets();
        } catch (error) {
            console.error("Error loading TUF metadata:", error);
            throw new Error(`Failed to load TUF metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // Load delegated targets from local filesystem
    private async loadDelegatedTargets(): Promise<void> {
        if (!this.snapshotMetadata?.signed) {
            return;
        }

        const snapshot = this.snapshotMetadata.signed;
        const metaKeys = Object.keys(snapshot.meta || {});

        // Filter for delegated roles
        const delegatedRoles = metaKeys.filter(key => {
            // Skip top-level metadata files
            if (['root.json', 'timestamp.json', 'snapshot.json', 'targets.json'].includes(key)) {
                return false;
            }

            // Must be a JSON file
            return key.endsWith('.json');
        });

        // Process each delegated role
        for (const role of delegatedRoles) {
            try {
                const delegatedData = await this.readJsonMetadataFile(role);
                if (delegatedData) {
                    const roleName = role.replace('.json', '');
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
                console.error(`Error processing delegated role ${role}:`, e);
            }
        }
    }

    // Convert TUF signatures to the format expected by the tufjs library
    private convertSignatures(signatures: any[]): Record<string, any> {
        const result: Record<string, any> = {};
        if (Array.isArray(signatures)) {
            for (const sig of signatures) {
                if (sig.keyid && sig.sig) {
                    result[sig.keyid] = {
                        keyid: sig.keyid,
                        sig: sig.sig
                    };
                }
            }
        }
        return result;
    }

    // Fetch metadata from remote URL
    private async fetchJsonMetadata(fileName: string, throwOnError: boolean = true): Promise<any> {
        try {
            if (!this.remoteUrl) {
                throw new Error('No remote URL provided');
            }

            // Normalize the URL
            const baseUrl = this.remoteUrl.endsWith('/') ? this.remoteUrl : `${this.remoteUrl}/`;
            const url = new URL(fileName, baseUrl).toString();
            
            // Fetch with no cache to ensure we get the latest data
            const response = await fetch(url, { 
                next: { revalidate: 0 },
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                if (!throwOnError) return null;
                throw new Error(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            if (!throwOnError) return null;
            console.error(`Error fetching ${fileName}:`, error);
            throw error;
        }
    }

    private async readJsonMetadataFile(fileName: string): Promise<any> {
        try {
            const filePath = path.join(METADATA_FS_PATH, fileName);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`Error reading metadata file ${fileName}:`, error);
            throw error;
        }
    }

    // Convert a complex object to a plain JS object for serialization
    private convertToPlainObject(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.convertToPlainObject(item));
        }

        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = this.convertToPlainObject(obj[key]);
            }
        }
        return result;
    }

    // Get information about all roles in the repository
    getRoleInfo(): RoleInfo[] {
        if (!this.rootMetadata?.signed) {
            throw new Error('Repository not initialized');
        }

        const roles: RoleInfo[] = [];
        const root = this.rootMetadata.signed;

        // Helper function to transform keyids
        const transformKeyIds = (keyids: string[]): string[] => {
            return keyids.map(keyid => {
                // Check if the key exists in the keys map
                const key = root.keys[keyid];
                if (key) {
                    // If it's an online key, label it as such
                    if (key.keyType === 'ecdsa-sha2-nistp256') {
                        return 'online key';
                    }
                }
                return keyid;
            });
        };

        // Root role
        const rootRole = root.roles['root'];
        if (rootRole) {
            const baseUrl = this.remoteUrl || METADATA_BASE_URL;
            const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}root.json`;
            
            roles.push({
                role: 'root',
                expires: formatExpirationDate(root.expires),
                signers: {
                    required: rootRole.threshold,
                    total: rootRole.keyIDs.length,
                    keyids: transformKeyIds(rootRole.keyIDs)
                },
                jsonLink,
                version: root.version,
                specVersion: root.specVersion
            });
        }

        // Timestamp role
        if (this.timestampMetadata?.signed) {
            const timestamp = this.timestampMetadata.signed;
            const timestampRole = root.roles['timestamp'];
            if (timestampRole) {
                const baseUrl = this.remoteUrl || METADATA_BASE_URL;
                const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}timestamp.json`;
                
                roles.push({
                    role: 'timestamp',
                    expires: formatExpirationDate(timestamp.expires),
                    signers: {
                        required: timestampRole.threshold,
                        total: timestampRole.keyIDs.length,
                        keyids: transformKeyIds(timestampRole.keyIDs)
                    },
                    jsonLink,
                    version: timestamp.version,
                    specVersion: timestamp.specVersion
                });
            }
        }

        // Snapshot role
        if (this.snapshotMetadata?.signed) {
            const snapshot = this.snapshotMetadata.signed;
            const snapshotRole = root.roles['snapshot'];
            if (snapshotRole) {
                const baseUrl = this.remoteUrl || METADATA_BASE_URL;
                const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}snapshot.json`;
                
                roles.push({
                    role: 'snapshot',
                    expires: formatExpirationDate(snapshot.expires),
                    signers: {
                        required: snapshotRole.threshold,
                        total: snapshotRole.keyIDs.length,
                        keyids: transformKeyIds(snapshotRole.keyIDs)
                    },
                    jsonLink,
                    version: snapshot.version,
                    specVersion: snapshot.specVersion
                });
            }
        }

        // Targets role
        if (this.targetsMetadata?.signed) {
            const targets = this.targetsMetadata.signed;
            const targetsRole = root.roles['targets'];
            if (targetsRole) {
                const baseUrl = this.remoteUrl || METADATA_BASE_URL;
                const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}targets.json`;
                
                roles.push({
                    role: 'targets',
                    expires: formatExpirationDate(targets.expires),
                    signers: {
                        required: targetsRole.threshold,
                        total: targetsRole.keyIDs.length,
                        keyids: transformKeyIds(targetsRole.keyIDs)
                    },
                    jsonLink,
                    version: targets.version,
                    specVersion: targets.specVersion,
                    // Include targets data for nested display
                    targets: this.convertToPlainObject(targets.targets),
                    delegations: targets.delegations ? {
                        keys: this.convertToPlainObject(targets.delegations.keys),
                        roles: this.convertToPlainObject(targets.delegations.roles)
                    } : undefined
                });

                // Check for registry.npmjs.org delegation
                if (targets.delegations?.roles) {
                    const registryRole = targets.delegations.roles.find((r: any) => r.name === 'registry.npmjs.org');
                    if (registryRole) {
                        // Get the registry metadata if available
                        const registryMetadata = this.delegatedTargetsMetadata.get('registry.npmjs.org');
                        const registryExpires = registryMetadata?.signed?.expires || targets.expires;
                        const registryVersion = registryMetadata?.signed?.version || targets.version;
                        const registrySpecVersion = registryMetadata?.signed?.specVersion || targets.specVersion;

                        const baseUrl = this.remoteUrl || METADATA_BASE_URL;
                        const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}registry.npmjs.org.json`;
                        
                        roles.push({
                            role: 'registry.npmjs.org',
                            expires: formatExpirationDate(registryExpires),
                            signers: {
                                required: registryRole.threshold,
                                total: registryRole.keyids.length,
                                keyids: transformKeyIds(registryRole.keyids)
                            },
                            jsonLink,
                            version: registryVersion,
                            specVersion: registrySpecVersion,
                            targets: this.convertToPlainObject(registryMetadata?.signed?.targets || {})
                        });
                    }
                }
            }
        }

        // Add other delegated roles
        for (const entry of this.delegatedTargetsMetadata.entries()) {
            const [roleName, metadata] = entry;
            // Skip registry.npmjs.org as it's already handled above
            if (roleName === 'registry.npmjs.org') continue;
            
            const signed = metadata.signed;
            const role = root.roles[roleName];
            if (role) {
                const baseUrl = this.remoteUrl || METADATA_BASE_URL;
                const jsonLink = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${roleName}.json`;
                
                roles.push({
                    role: roleName,
                    expires: formatExpirationDate(signed.expires),
                    signers: {
                        required: role.threshold,
                        total: role.keyIDs.length,
                        keyids: transformKeyIds(role.keyIDs)
                    },
                    jsonLink,
                    version: signed.version,
                    specVersion: signed.specVersion,
                    // Include targets data for nested display
                    targets: this.convertToPlainObject(signed.targets)
                });
            }
        }

        return roles;
    }
}

// Format expiration date for display
function formatExpirationDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Return original if parsing fails
        }

        // Format as YYYY-MM-DD HH:MM:SS UTC
        return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
    } catch {
        return dateString;
    }
}

export const createTufRepository = async (remoteUrl?: string): Promise<TufRepository> => {
    const repository = new TufRepository(METADATA_BASE_URL, remoteUrl || null);
    await repository.initialize();
    return repository;
};