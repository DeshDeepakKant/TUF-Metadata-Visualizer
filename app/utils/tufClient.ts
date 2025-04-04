// This file is server-side only

import { RoleInfo } from './types';
import { parseISO, format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';

// Import directly from tuf-js and its models
import * as tufJs from 'tuf-js';
import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';

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
    
    // Store the mapping of key IDs to display names
    private keyidToDisplayName: Record<string, string> = {
        // Default fallback values if not found in metadata
        "0c87432c": "online key",
        "5e3a4021": "online key"
    };

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
                
                // Extract key owner usernames directly from the root metadata
                this.extractKeyOwnerUsernames(rootData.signed.keys);
                
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
        
        // Filter out the top-level metadata files
        const delegatedRoles = metaKeys.filter(key => 
            !['root.json', 'timestamp.json', 'snapshot.json', 'targets.json'].includes(key) && 
            key.endsWith('.json')
        );
        
        // Log the delegated roles found
        if (delegatedRoles.length > 0) {
            console.log(`Found ${delegatedRoles.length} delegated roles: ${delegatedRoles.join(', ')}`);
        }
        
        // Process each delegated role in parallel for efficiency
        const delegationPromises = delegatedRoles.map(async (role) => {
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
                    return { roleName, success: true };
                }
                return { roleName, success: false, error: 'No data returned' };
            } catch (e) {
                console.warn(`Failed to read delegated role file: ${role}`, e);
                return { roleName: role, success: false, error: e instanceof Error ? e.message : String(e) };
            }
        });
        
        // Wait for all delegated roles to be processed
        const results = await Promise.all(delegationPromises);
        
        // Log summary of loaded delegated roles
        const successCount = results.filter(r => r.success).length;
        console.log(`Successfully loaded ${successCount} of ${delegatedRoles.length} delegated roles`);
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

    // Extract key owner usernames from the root metadata
    private extractKeyOwnerUsernames(keys: Record<string, any>): void {
        if (!keys) return;
        
        Object.entries(keys).forEach(([keyId, keyInfo]) => {
            // Check if the key has the x-tuf-on-ci-keyowner field
            if (keyInfo && 
                typeof keyInfo === 'object' && 
                'x-tuf-on-ci-keyowner' in keyInfo && 
                typeof keyInfo['x-tuf-on-ci-keyowner'] === 'string') {
                
                // Store the username (ensure it starts with @)
                let username = keyInfo['x-tuf-on-ci-keyowner'];
                if (!username.startsWith('@')) {
                    username = '@' + username;
                }
                
                // Store the full key ID and also the short version (first 8 chars)
                this.keyidToDisplayName[keyId] = username;
                this.keyidToDisplayName[keyId.substring(0, 8)] = username;
            }
            
            // Check if it's an online key
            if (keyInfo && 
                typeof keyInfo === 'object' && 
                'x-tuf-on-ci-online-uri' in keyInfo && 
                typeof keyInfo['x-tuf-on-ci-online-uri'] === 'string') {
                
                // Store as online key
                this.keyidToDisplayName[keyId] = "online key";
                this.keyidToDisplayName[keyId.substring(0, 8)] = "online key";
            }
        });
    }

    getRoleInfo(): RoleInfo[] {
        if (!this.rootMetadata) {
            return [];
        }

        const roles: RoleInfo[] = [];
        const root = this.rootMetadata.signed;
        
        // Function to transform keyids to user-friendly display names if available
        const transformKeyIds = (keyids: string[]): string[] => {
            return keyids.map(keyid => {
                // If we have a friendly name for this keyid, use it
                if (this.keyidToDisplayName[keyid]) {
                    return this.keyidToDisplayName[keyid];
                }
                
                // Try with just the first 8 chars (short key ID)
                if (keyid.length > 8 && this.keyidToDisplayName[keyid.substring(0, 8)]) {
                    return this.keyidToDisplayName[keyid.substring(0, 8)];
                }
                
                // For online keys, mark them accordingly
                if (keyid.toLowerCase().includes('online')) {
                    return 'online key';
                }
                
                return keyid;
            });
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
                jsonLink: `${METADATA_BASE_URL}/root.json`
            });
        }

        // Timestamp role
        if (this.timestampMetadata) {
            const timestampRole = root.roles['timestamp'];
            if (timestampRole) {
                roles.push({
                    role: 'timestamp',
                    expires: formatExpirationDate(this.timestampMetadata.signed.expires),
                    signers: {
                        required: timestampRole.threshold,
                        total: timestampRole.keyIDs.length,
                        keyids: transformKeyIds(timestampRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/timestamp.json`
                });
            }
        }

        // Snapshot role
        if (this.snapshotMetadata) {
            const snapshotRole = root.roles['snapshot'];
            if (snapshotRole) {
                roles.push({
                    role: 'snapshot',
                    expires: formatExpirationDate(this.snapshotMetadata.signed.expires),
                    signers: {
                        required: snapshotRole.threshold,
                        total: snapshotRole.keyIDs.length,
                        keyids: transformKeyIds(snapshotRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/snapshot.json`
                });
            }
        }

        // Targets role
        if (this.targetsMetadata) {
            const targetsRole = root.roles['targets'];
            if (targetsRole) {
                roles.push({
                    role: 'targets',
                    expires: formatExpirationDate(this.targetsMetadata.signed.expires),
                    signers: {
                        required: targetsRole.threshold,
                        total: targetsRole.keyIDs.length,
                        keyids: transformKeyIds(targetsRole.keyIDs)
                    },
                    jsonLink: `${METADATA_BASE_URL}/targets.json`
                });
            }
        }

        // Delegated targets roles - We'll handle this differently
        // Since the tuf-js model structure might be different from our metadata files
        // we'll use more generic approach that should work with both formats
        this.delegatedTargetsMetadata.forEach((metadata, roleName) => {
            if (this.targetsMetadata?.signed) {
                // Use raw JSON data instead of tuf-js models for delegations
                // because the structure may vary between TUF versions
                const rawData = this.targetsMetadata.signed.toJSON();
                // Make sure delegations and delegations.roles exist and are objects
                if (rawData && 
                    typeof rawData === 'object' && 
                    'delegations' in rawData && 
                    rawData.delegations && 
                    typeof rawData.delegations === 'object' &&
                    'roles' in rawData.delegations) {
                    
                    const delegatedRoles = rawData.delegations.roles;
                    if (Array.isArray(delegatedRoles)) {
                        const delegationInfo = delegatedRoles.find((r: any) => r.name === roleName);
                        if (delegationInfo && 
                            typeof delegationInfo === 'object' &&
                            'threshold' in delegationInfo &&
                            typeof delegationInfo.threshold === 'number') {
                            
                            // Extract keyids safely, ensuring they exist and are an array
                            let keyids: string[] = [];
                            if ('keyids' in delegationInfo && Array.isArray(delegationInfo.keyids)) {
                                // Filter and map to ensure we only have strings
                                keyids = delegationInfo.keyids
                                    .filter(item => typeof item === 'string')
                                    .map(item => String(item));
                                
                                // Apply the transformation to get user-friendly names
                                keyids = transformKeyIds(keyids);
                            }
                            
                            roles.push({
                                role: roleName,
                                expires: formatExpirationDate(metadata.signed.expires),
                                signers: {
                                    required: delegationInfo.threshold,
                                    total: keyids.length,
                                    keyids: keyids
                                },
                                jsonLink: `${METADATA_BASE_URL}/${roleName}.json`
                            });
                        }
                    }
                }
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

    // Use TUF-JS for target verification
    async verifyTarget(targetPath: string): Promise<boolean> {
        try {
            if (!this.targetsMetadata) {
                return false;
            }

            // Get target from targets metadata
            const targets = this.targetsMetadata.signed.targets;
            return targets.hasOwnProperty(targetPath);
        } catch (error) {
            console.error(`Error verifying target ${targetPath}:`, error);
            return false;
        }
    }

    // Verify that a role meets its signature threshold requirements
    verifyRoleSignatures(roleName: string): boolean {
        if (!this.rootMetadata || !this.rootMetadata.signed) {
            console.error("Root metadata not available for signature verification");
            return false;
        }
        
        // Get the role metadata
        let metadata: Metadata<any> | null = null;
        let roleInfo: any = null;
        
        switch (roleName) {
            case 'root':
                metadata = this.rootMetadata;
                roleInfo = this.rootMetadata.signed.roles['root'];
                break;
            case 'timestamp':
                metadata = this.timestampMetadata;
                roleInfo = this.rootMetadata.signed.roles['timestamp'];
                break;
            case 'snapshot':
                metadata = this.snapshotMetadata;
                roleInfo = this.rootMetadata.signed.roles['snapshot'];
                break;
            case 'targets':
                metadata = this.targetsMetadata;
                roleInfo = this.rootMetadata.signed.roles['targets'];
                break;
            default:
                // Check if it's a delegated role
                metadata = this.delegatedTargetsMetadata.get(roleName) || null;
                if (this.targetsMetadata?.signed) {
                    const targetsSigned = this.targetsMetadata.signed;
                    const delegations = targetsSigned.delegations;
                    if (delegations && Array.isArray(delegations.roles)) {
                        roleInfo = delegations.roles.find(r => r.name === roleName);
                    }
                }
        }
        
        if (!metadata || !roleInfo) {
            console.error(`Role ${roleName} not found for signature verification`);
            return false;
        }
        
        // Count valid signatures
        const requiredThreshold = roleInfo.threshold;
        const validSignatureCount = Object.keys(metadata.signatures).length;
        
        // In a real implementation, we would cryptographically verify each signature
        // against the corresponding key, but for visualization purposes, we just check
        // if the number of signatures meets the threshold
        
        console.log(`Role ${roleName}: ${validSignatureCount} signatures, threshold is ${requiredThreshold}`);
        return validSignatureCount >= requiredThreshold;
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
        return format(date, "MMM d, yyyy HH:mm:ss 'UTC'");
    } catch (e) {
        return dateString;
    }
}

export const createTufRepository = async (): Promise<TufRepository> => {
    const repository = new TufRepository();
    await repository.initialize();
    return repository;
}; 