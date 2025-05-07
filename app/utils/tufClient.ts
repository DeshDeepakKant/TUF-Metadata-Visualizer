/**
 * NOTE: This file is no longer used in the application.
 * The functionality has been moved to loadTufData.ts to support static export.
 * This file is kept for reference purposes only.
 */

// This file is server-side only

import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';
import { RoleInfo } from './types';
import { parseISO, format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';

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
            let roles = [];

            // Handle different formats of delegations.roles (array or object)
            if (delegations.roles) {
                if (Array.isArray(delegations.roles)) {
                    // If it's already an array, map it
                    roles = delegations.roles.map((role: any) => ({
                        name: role.name || '',
                        keyids: role.keyIDs || [],
                        threshold: role.threshold || 0,
                        paths: role.paths || [],
                        terminating: role.terminating || false
                    }));
                } else if (typeof delegations.roles === 'object') {
                    // If it's an object, convert it to an array
                    roles = Object.entries(delegations.roles).map(([name, role]: [string, any]) => ({
                        name: name,
                        keyids: role.keyIDs || [],
                        threshold: role.threshold || 0,
                        paths: role.paths || [],
                        terminating: role.terminating || false
                    }));
                } else {
                    console.warn('Unexpected format for delegations.roles:', delegations.roles);
                }
            }

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
                    targets: this.convertToPlainObject(targets.targets),
                    delegations: convertDelegations(targets.delegations)
                });
            }
        }

        // Add registry.npmjs.org role from targets delegations
        if (this.targetsMetadata?.signed?.delegations) {
            const targets = this.targetsMetadata.signed;
            const delegations = convertDelegations(targets.delegations);

            if (delegations && delegations.roles) {
                const registryRole = delegations.roles.find((role: any) => role.name === 'registry.npmjs.org');

                if (registryRole) {
                    // Find the delegated metadata if it exists
                    const registryMetadata = this.delegatedTargetsMetadata.get('registry.npmjs.org');
                    const registryExpires = registryMetadata?.signed?.expires || targets.expires;
                    const registryVersion = registryMetadata?.signed?.version || targets.version;
                    const registrySpecVersion = registryMetadata?.signed?.specVersion || targets.specVersion;

                    roles.push({
                        role: 'registry.npmjs.org',
                        expires: formatExpirationDate(registryExpires),
                        signers: {
                            required: registryRole.threshold,
                            total: registryRole.keyids.length,
                            keyids: transformKeyIds(registryRole.keyids)
                        },
                        jsonLink: `${METADATA_BASE_URL}/registry.npmjs.org.json`,
                        version: registryVersion,
                        specVersion: registrySpecVersion,
                        targets: this.convertToPlainObject(registryMetadata?.signed?.targets || {})
                    });
                }
            }
        }

        // Delegated targets roles (except registry.npmjs.org which we already added)
        Array.from(this.delegatedTargetsMetadata.entries()).forEach(([roleName, metadata]) => {
            // Skip registry.npmjs.org as we already added it
            if (roleName === 'registry.npmjs.org') return;

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
                    targets: this.convertToPlainObject(signed.targets),
                    delegations: convertDelegations(signed.delegations)
                });
            }
        });

        return roles;
    }

    // Helper method to convert objects with toJSON methods to plain objects
    private convertToPlainObject(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // If it's a primitive type, return as is
        if (typeof obj !== 'object') {
            return obj;
        }

        // If it's an array, convert each element
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertToPlainObject(item));
        }

        // It's an object, convert each property
        const result: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = this.convertToPlainObject(obj[key]);
            }
        }

        return result;
    }

    getKeys(): Record<string, any> {
        if (!this.rootMetadata) {
            return {};
        }
        
        const keysObj: Record<string, any> = {};
        
        Object.entries(this.rootMetadata.signed.keys).forEach(([keyId, keyValue]) => {
            keysObj[keyId] = keyValue;
        });

        return keysObj;
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