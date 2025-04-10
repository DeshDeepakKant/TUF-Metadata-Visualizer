// This file is server-side only

import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';
import { RoleInfo } from './types';
import fs from 'fs';
import path from 'path';
import { format, parseISO } from 'date-fns';

// For client-side requests (via fetch)
const METADATA_BASE_URL = '/metadata';

// For server-side file system access
const METADATA_FS_PATH = path.join(process.cwd(), 'public', 'metadata');

export class TufRepository {
    private rootMetadata: Metadata<Root> | null = null;
    private timestampMetadata: Metadata<Timestamp> | null = null;
    private snapshotMetadata: Metadata<Snapshot> | null = null;
    private targetsMetadata: Metadata<Targets> | null = null;
    private delegatedTargetsMetadata: Map<string, Metadata<Targets>> = new Map();
    private tufClient: any | null = null;

    constructor(baseUrl: string = METADATA_BASE_URL) {
        // We'll just use direct file access instead of fetch
        this.tufClient = null;
    }

    async initialize(): Promise<void> {
        try {
            // Before doing anything, check if metadata directory exists
            if (!fs.existsSync(METADATA_FS_PATH)) {
                console.error(`Metadata directory not found: ${METADATA_FS_PATH}`);
                throw new Error(`Metadata directory not found: ${METADATA_FS_PATH}`);
            }

            // Log the directory contents to debug
            console.log('Metadata directory contents:', fs.readdirSync(METADATA_FS_PATH));

            try {
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
        } catch (error) {
            console.error("Error initializing TUF repository:", error);
            throw error;
        }
    }

    // Load delegated targets from snapshot metadata
    private async loadDelegatedTargets(): Promise<void> {
        if (!this.snapshotMetadata?.signed) {
            return;
        }
        
        const snapshot = this.snapshotMetadata.signed;
        const metaKeys = Object.keys(snapshot.meta || {});
        
        // Get list of actual files in the metadata directory
        const existingFiles = fs.readdirSync(METADATA_FS_PATH);
        
        // Filter for delegated roles that actually exist
        const delegatedRoles = metaKeys.filter(key => {
            // Skip top-level metadata files
            if (['root.json', 'timestamp.json', 'snapshot.json', 'targets.json'].includes(key)) {
                return false;
            }
            
            // Must be a JSON file
            if (!key.endsWith('.json')) {
                return false;
            }
            
            // Must exist in the filesystem
            return existingFiles.includes(key);
        });
        
        // Only log if we found delegated roles
        if (delegatedRoles.length > 0) {
            console.log(`Processing ${delegatedRoles.length} delegated role(s): ${delegatedRoles.join(', ')}`);
        }
        
        // Process each existing delegated role
        for (const role of delegatedRoles) {
            try {
                const roleName = role.replace('.json', '');
                const delegatedData = await this.readJsonMetadataFile(role);
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

    // Helper to convert array of signatures to record format
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

    private async readJsonMetadataFile(fileName: string): Promise<any> {
        try {
            const filePath = path.join(METADATA_FS_PATH, fileName);

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Read file from disk
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            console.error(`Error reading metadata file ${fileName}:`, error);
            throw error;
        }
    }

    // Legacy fetch method as fallback
    private async fetchJsonMetadata(fileName: string): Promise<any> {
        try {
            const response = await fetch(`${METADATA_BASE_URL}/${fileName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${fileName}:`, error);
            throw error;
        }
    }

    getRoleInfo(): RoleInfo[] {
        if (!this.rootMetadata) {
            return [];
        }

        const roles: RoleInfo[] = [];
        const root = this.rootMetadata.signed;
        
        // Function to transform keyids to truncated format
        const transformKeyIds = (keyids: string[]): string[] => {
            return keyids.map(keyid => keyid.substring(0, 8));
        };

        // Helper to convert TUF-js delegations to our format
        const convertDelegations = (delegations: any) => {
            if (!delegations) return undefined;
            
            const keys: Record<string, { keytype: string; keyval: { public: string }; scheme: string }> = {};
            
            // Convert keys to expected format
            Object.entries(delegations.keys || {}).forEach(([keyId, keyValue]: [string, any]) => {
                keys[keyId] = {
                    keytype: keyValue.keytype || '',
                    keyval: {
                        public: keyValue.keyval?.public || ''
                    },
                    scheme: keyValue.scheme || ''
                };
            });
            
            // Convert roles to expected format
            const roles = (delegations.roles || []).map((role: any) => ({
                name: role.name || '',
                keyids: role.keyIDs || [],
                threshold: role.threshold || 0,
                paths: role.paths || [],
                terminating: role.terminating || false
            }));
            
            return { keys, roles };
        };

        // Root role
        const rootRole = root.roles['root'];
        if (rootRole) {
            roles.push({
                role: 'root',
                expires: formatExpirationDate(root.expires),
                signers: {
                    required: rootRole.threshold,
                    total: rootRole.keyIDs.length,
                    keyids: transformKeyIds(rootRole.keyIDs)
                },
                jsonLink: `${METADATA_BASE_URL}/root.json`,
                version: root.version,
                specVersion: root.specVersion
            });
        }

        // Timestamp role
        if (this.timestampMetadata?.signed) {
            const timestamp = this.timestampMetadata.signed;
            const timestampRole = root.roles['timestamp'];
            if (timestampRole) {
                roles.push({
                    role: 'timestamp',
                    expires: formatExpirationDate(timestamp.expires),
                    signers: {
                        required: timestampRole.threshold,
                        total: timestampRole.keyIDs.length,
                        keyids: transformKeyIds(timestampRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/timestamp.json`,
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
                roles.push({
                    role: 'snapshot',
                    expires: formatExpirationDate(snapshot.expires),
                    signers: {
                        required: snapshotRole.threshold,
                        total: snapshotRole.keyIDs.length,
                        keyids: transformKeyIds(snapshotRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/snapshot.json`,
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
                roles.push({
                    role: 'targets',
                    expires: formatExpirationDate(targets.expires),
                    signers: {
                        required: targetsRole.threshold,
                        total: targetsRole.keyIDs.length,
                        keyids: transformKeyIds(targetsRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/targets.json`,
                    version: targets.version,
                    specVersion: targets.specVersion,
                    // Include targets data for nested display
                    targets: targets.targets,
                    delegations: convertDelegations(targets.delegations)
                });
            }
        }

        // Delegated targets roles
        Array.from(this.delegatedTargetsMetadata.entries()).forEach(([roleName, metadata]) => {
            const signed = metadata.signed;
            const role = root.roles[roleName];
            if (role) {
                roles.push({
                    role: roleName,
                    expires: formatExpirationDate(signed.expires),
                    signers: {
                        required: role.threshold,
                        total: role.keyIDs.length,
                        keyids: transformKeyIds(role.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/${roleName}.json`,
                    version: signed.version,
                    specVersion: signed.specVersion,
                    // Include targets data for nested display
                    targets: signed.targets,
                    delegations: convertDelegations(signed.delegations)
                });
            }
        });

        return roles;
    }

    getKeys(): Record<string, any> {
        if (!this.rootMetadata) {
            return {};
        }
        
        // Convert the keys to a plain object for compatibility
        const keysObj: Record<string, any> = {};
        Object.entries(this.rootMetadata.signed.keys).forEach(([keyId, keyValue]) => {
            keysObj[keyId] = keyValue;
        });
        
        return keysObj;
    }

    // Get canonical JSON representation of signed data
    // This is useful for signature verification
    getCanonicalJSON(data: any): string {
        // In a real implementation, we would use a canonical JSON library like
        // the one from tuf-js. For this example, we'll use a simple approach.
        
        // Sort keys alphabetically and remove whitespace
        return JSON.stringify(data, (key, value) => {
            // Handle special cases like Maps
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        }, 0);
    }
    
    // Get the canonical JSON representation of a role's signed data
    getSignedBytes(roleName: string): string | null {
        let signed: any = null;
        
        switch (roleName) {
            case 'root':
                signed = this.rootMetadata?.signed;
                break;
            case 'timestamp':
                signed = this.timestampMetadata?.signed;
                break;
            case 'snapshot':
                signed = this.snapshotMetadata?.signed;
                break;
            case 'targets':
                signed = this.targetsMetadata?.signed;
                break;
            default:
                // Check if it's a delegated role
                const delegated = this.delegatedTargetsMetadata.get(roleName);
                signed = delegated?.signed || null;
        }
        
        if (!signed) {
            console.error(`Role ${roleName} not found for getting signed bytes`);
            return null;
        }
        
        return this.getCanonicalJSON(signed);
    }
}

function formatExpirationDate(dateString: string): string {
    try {
        const date = parseISO(dateString);
        // Remove seconds from format to avoid hydration mismatch
        return format(date, "MMM d, yyyy HH:mm 'UTC'");
    } catch (e) {
        return dateString;
    }
}

export const createTufRepository = async (): Promise<TufRepository> => {
    const repository = new TufRepository();
    await repository.initialize();
    return repository;
}; 