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
    private remoteUrl: string | null = null;

    constructor(baseUrl: string = METADATA_BASE_URL, remoteUrl: string | null = null) {
        // We'll just use direct file access instead of fetch
        this.tufClient = null;
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

    // Load delegated targets from local filesystem
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

    // Fetch JSON metadata from remote URL
    private async fetchJsonMetadata(fileName: string, throwOnError: boolean = true): Promise<any> {
        try {
            if (!this.remoteUrl) {
                throw new Error('Remote URL not provided');
            }

            // First try direct access
            let url = new URL(fileName, this.remoteUrl).toString();
            console.log(`Fetching metadata from: ${url}`);
            
            try {
                const response = await fetch(url, { 
                    next: { revalidate: 0 }, // Don't cache the response
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Successfully fetched ${fileName} from ${url}`);
                    return data;
                }
                
                // If we got a CORS error or other issue, try using the proxy
                console.warn(`Failed to fetch ${fileName} from ${url}: ${response.status} ${response.statusText}`);
                
                // Try the proxy
                const parsedUrl = new URL(this.remoteUrl);
                const proxyUrl = `/api/tuf-metadata?url=${encodeURIComponent(this.remoteUrl)}&file=${encodeURIComponent(fileName)}`;
                
                console.log(`Trying proxy: ${proxyUrl}`);
                
                const proxyResponse = await fetch(proxyUrl, {
                    next: { revalidate: 0 }
                });
                
                if (!proxyResponse.ok) {
                    if (throwOnError) {
                        throw new Error(`Failed to fetch ${fileName} through proxy: ${proxyResponse.status} ${proxyResponse.statusText}`);
                    } else {
                        return null;
                    }
                }
                
                const data = await proxyResponse.json();
                console.log(`Successfully fetched ${fileName} through proxy`);
                return data;
            } catch (error) {
                console.warn(`Error fetching ${fileName} from ${url}:`, error);
                
                // Try another proxy approach - direct fetch might fail due to CORS
                const fallbackProxyUrl = `/proxy/${new URL(url).host}${new URL(url).pathname}`;
                console.log(`Trying fallback proxy: ${fallbackProxyUrl}`);
                
                try {
                    const fallbackResponse = await fetch(fallbackProxyUrl, {
                        next: { revalidate: 0 }
                    });
                    
                    if (!fallbackResponse.ok) {
                        if (throwOnError) {
                            throw new Error(`Failed to fetch ${fileName} through fallback proxy: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
                        } else {
                            return null;
                        }
                    }
                    
                    const data = await fallbackResponse.json();
                    console.log(`Successfully fetched ${fileName} through fallback proxy`);
                    return data;
                } catch (fallbackError) {
                    if (throwOnError) {
                        throw new Error(`Failed to fetch ${fileName} through all methods: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
                    } else {
                        return null;
                    }
                }
            }
        } catch (error) {
            console.error(`Error fetching metadata file ${fileName}:`, error);
            if (throwOnError) {
                throw error;
            } else {
                return null;
            }
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

    getRoleInfo(): RoleInfo[] {
        const roles: RoleInfo[] = [];
        const root = this.rootMetadata?.signed;
        const targets = this.targetsMetadata?.signed;

        if (!root || !targets) {
            return roles;
        }

        const transformKeyIds = (keyids: string[]): string[] => {
            return keyids.map(keyid => keyid.startsWith('@') ? keyid : `@${keyid}`);
        };

        const createJsonLink = (fileName: string, version?: number): string => {
            if (this.remoteUrl) {
                return `${this.remoteUrl}/${version ? `${version}.` : ''}${fileName}`;
            }
            return `${METADATA_BASE_URL}/${version ? `${version}.` : ''}${fileName}`;
        };

        const convertDelegations = (delegations: any) => {
            if (!delegations) return undefined;
            return {
                keys: delegations.keys || {},
                roles: delegations.roles?.map((role: any) => ({
                    name: role.name,
                    keyids: role.keyids,
                    threshold: role.threshold,
                    paths: role.paths,
                    terminating: role.terminating
                }))
            };
        };

        // Add root role
        roles.push({
            role: 'root',
            expires: formatExpirationDate(root.expires),
            signers: {
                required: root.roles.root.threshold,
                total: root.roles.root.keyIDs.length,
                keyids: transformKeyIds(root.roles.root.keyIDs)
            },
            jsonLink: createJsonLink('root.json', root.version),
            version: root.version,
            specVersion: root.specVersion
        });

        // Add timestamp role
        if (this.timestampMetadata?.signed) {
            const timestamp = this.timestampMetadata.signed;
            roles.push({
                role: 'timestamp',
                expires: formatExpirationDate(timestamp.expires),
                signers: {
                    required: root.roles.timestamp.threshold,
                    total: root.roles.timestamp.keyIDs.length,
                    keyids: transformKeyIds(root.roles.timestamp.keyIDs)
                },
                jsonLink: createJsonLink('timestamp.json'),
                version: timestamp.version,
                specVersion: timestamp.specVersion
            });
        }

        // Add snapshot role
        if (this.snapshotMetadata?.signed) {
            const snapshot = this.snapshotMetadata.signed;
            roles.push({
                role: 'snapshot',
                expires: formatExpirationDate(snapshot.expires),
                signers: {
                    required: root.roles.snapshot.threshold,
                    total: root.roles.snapshot.keyIDs.length,
                    keyids: transformKeyIds(root.roles.snapshot.keyIDs)
                },
                jsonLink: createJsonLink('snapshot.json', snapshot.version),
                version: snapshot.version,
                specVersion: snapshot.specVersion
            });
        }

        // Add targets role
        roles.push({
            role: 'targets',
            expires: formatExpirationDate(targets.expires),
            signers: {
                required: root.roles.targets.threshold,
                total: root.roles.targets.keyIDs.length,
                keyids: transformKeyIds(root.roles.targets.keyIDs)
            },
            jsonLink: createJsonLink('targets.json', targets.version),
            version: targets.version,
            specVersion: targets.specVersion,
            targets: this.convertToPlainObject(targets.targets),
            delegations: convertDelegations(targets.delegations)
        });

        // Add delegated roles
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
                    jsonLink: createJsonLink(`${roleName}.json`, signed.version),
                    version: signed.version,
                    specVersion: signed.specVersion,
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

        // Convert the keys to a plain object for compatibility
        const keysObj: Record<string, any> = {};
        
        Object.entries(this.rootMetadata.signed.keys).forEach(([keyId, keyValue]) => {
            keysObj[keyId] = keyValue;
        });

        return keysObj;
    }

}

function formatExpirationDate(dateString: string): string {
    try {
        return new Date(dateString).toLocaleString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

export const createTufRepository = async (remoteUrl?: string): Promise<TufRepository> => {
    try {
        // Create a new TUF repository instance
        const repository = new TufRepository(METADATA_BASE_URL, remoteUrl);
        
        // Initialize the repository
        await repository.initialize();
        
        return repository;
    } catch (error) {
        console.error('Error creating TUF repository:', error);
        throw error;
    }
};