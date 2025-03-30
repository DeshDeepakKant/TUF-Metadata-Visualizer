// This file is server-side only

import { TufRootMetadata, TufTimestampMetadata, TufSnapshotMetadata, TufTargetsMetadata, TufSignedMetadata, RoleInfo } from './types';
import { parseISO, format } from 'date-fns';
import * as path from 'path';
import * as fs from 'fs';

// Import directly from tuf-js without trying to use non-existent enums
import * as tufJs from 'tuf-js';

// For client-side requests (via fetch)
const METADATA_BASE_URL = '/metadata';

// For server-side file system access
const METADATA_FS_PATH = path.join(process.cwd(), 'public', 'metadata');

export class TufRepository {
    private rootMetadata: TufSignedMetadata<TufRootMetadata> | null = null;
    private timestampMetadata: TufSignedMetadata<TufTimestampMetadata> | null = null;
    private snapshotMetadata: TufSignedMetadata<TufSnapshotMetadata> | null = null;
    private targetsMetadata: TufSignedMetadata<TufTargetsMetadata> | null = null;
    private delegatedTargetsMetadata: Map<string, TufSignedMetadata<TufTargetsMetadata>> = new Map();
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

            // Read metadata files directly from the file system on the server
            this.rootMetadata = await this.readJsonMetadataFile('root.json') as TufSignedMetadata<TufRootMetadata>;
            this.timestampMetadata = await this.readJsonMetadataFile('timestamp.json') as TufSignedMetadata<TufTimestampMetadata>;
            this.snapshotMetadata = await this.readJsonMetadataFile('snapshot.json') as TufSignedMetadata<TufSnapshotMetadata>;
            this.targetsMetadata = await this.readJsonMetadataFile('targets.json') as TufSignedMetadata<TufTargetsMetadata>;

            // Fetch delegated targets if they exist
            if (this.targetsMetadata?.signed.delegations) {
                for (const role of this.targetsMetadata.signed.delegations.roles) {
                    try {
                        const delegatedData = await this.readJsonMetadataFile(`${role.name}.json`) as TufSignedMetadata<TufTargetsMetadata>;
                        if (delegatedData) {
                            this.delegatedTargetsMetadata.set(role.name, delegatedData);
                        }
                    } catch (e) {
                        console.warn(`Failed to read delegated role file: ${role.name}.json`);
                    }
                }
            }
        } catch (error) {
            console.error("Error initializing TUF repository:", error);
            throw error;
        }
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
        const rootSigned = this.rootMetadata.signed;

        // Root role
        roles.push({
            role: 'root',
            expires: formatExpirationDate(rootSigned.expires),
            signers: {
                required: rootSigned.roles.root.threshold,
                total: rootSigned.roles.root.keyids.length,
                keyids: rootSigned.roles.root.keyids
            },
            jsonLink: `${METADATA_BASE_URL}/root.json`
        });

        // Timestamp role
        if (this.timestampMetadata) {
            roles.push({
                role: 'timestamp',
                expires: formatExpirationDate(this.timestampMetadata.signed.expires),
                signers: {
                    required: rootSigned.roles.timestamp.threshold,
                    total: rootSigned.roles.timestamp.keyids.length,
                    keyids: rootSigned.roles.timestamp.keyids
                },
                jsonLink: `${METADATA_BASE_URL}/timestamp.json`
            });
        }

        // Snapshot role
        if (this.snapshotMetadata) {
            roles.push({
                role: 'snapshot',
                expires: formatExpirationDate(this.snapshotMetadata.signed.expires),
                signers: {
                    required: rootSigned.roles.snapshot.threshold,
                    total: rootSigned.roles.snapshot.keyids.length,
                    keyids: rootSigned.roles.snapshot.keyids
                },
                jsonLink: `${METADATA_BASE_URL}/snapshot.json`
            });
        }

        // Targets role
        if (this.targetsMetadata) {
            roles.push({
                role: 'targets',
                expires: formatExpirationDate(this.targetsMetadata.signed.expires),
                signers: {
                    required: rootSigned.roles.targets.threshold,
                    total: rootSigned.roles.targets.keyids.length,
                    keyids: rootSigned.roles.targets.keyids
                },
                jsonLink: `${METADATA_BASE_URL}/targets.json`
            });
        }

        // Delegated targets roles
        if (this.targetsMetadata?.signed.delegations) {
            for (const role of this.targetsMetadata.signed.delegations.roles) {
                const delegatedData = this.delegatedTargetsMetadata.get(role.name);
                if (delegatedData) {
                    roles.push({
                        role: role.name,
                        expires: formatExpirationDate(delegatedData.signed.expires),
                        signers: {
                            required: role.threshold,
                            total: role.keyids.length,
                            keyids: role.keyids
                        },
                        jsonLink: `${METADATA_BASE_URL}/${role.name}.json`
                    });
                }
            }
        }

        return roles;
    }

    getKeys(): Record<string, any> {
        if (!this.rootMetadata) {
            return {};
        }
        return this.rootMetadata.signed.keys;
    }

    // Basic verification without using tuf-js
    async verifyTarget(targetPath: string): Promise<boolean> {
        try {
            if (!this.targetsMetadata) {
                return false;
            }

            // Check if the target exists in the targets metadata
            return Object.keys(this.targetsMetadata.signed.targets).includes(targetPath);
        } catch (error) {
            console.error(`Error verifying target ${targetPath}:`, error);
            return false;
        }
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