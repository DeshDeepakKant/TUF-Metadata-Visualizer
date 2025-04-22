import { Root, Timestamp, Snapshot, Targets, Metadata } from '@tufjs/models';
import { RoleInfo } from './types';
import { parseISO, format } from 'date-fns';

export class RemoteTufRepository {
  private baseUrl: string;
  private rootMetadata: Metadata<Root> | null = null;
  private timestampMetadata: Metadata<Timestamp> | null = null;
  private snapshotMetadata: Metadata<Snapshot> | null = null;
  private targetsMetadata: Metadata<Targets> | null = null;
  private delegatedTargetsMetadata: Map<string, Metadata<Targets>> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  async initialize(): Promise<void> {
    try {
      console.log(`Initializing remote TUF repository at ${this.baseUrl}`);

      // First, fetch timestamp.json to discover the latest snapshot
      const timestampData = await this.fetchJsonMetadata('timestamp.json');
      const timestampSigned = Timestamp.fromJSON(timestampData.signed);
      this.timestampMetadata = new Metadata<Timestamp>(
        timestampSigned,
        this.convertSignatures(timestampData.signatures)
      );

      // Next, fetch snapshot.json to discover the latest metadata files
      const snapshotData = await this.fetchJsonMetadata('snapshot.json');
      const snapshotSigned = Snapshot.fromJSON(snapshotData.signed);
      this.snapshotMetadata = new Metadata<Snapshot>(
        snapshotSigned,
        this.convertSignatures(snapshotData.signatures)
      );

      // Fetch root.json
      const rootData = await this.fetchJsonMetadata('root.json');
      const rootSigned = Root.fromJSON(rootData.signed);
      this.rootMetadata = new Metadata<Root>(
        rootSigned,
        this.convertSignatures(rootData.signatures)
      );

      // Fetch targets.json
      const targetsData = await this.fetchJsonMetadata('targets.json');
      const targetsSigned = Targets.fromJSON(targetsData.signed);
      this.targetsMetadata = new Metadata<Targets>(
        targetsSigned,
        this.convertSignatures(targetsData.signatures)
      );

      // Fetch delegated targets if they exist in the snapshot metadata
      await this.loadDelegatedTargets();
    } catch (error) {
      console.error("Error initializing remote TUF repository:", error);
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

  private async fetchJsonMetadata(fileName: string): Promise<any> {
    try {
      // Use our API endpoint to avoid CORS issues
      const response = await fetch(`/api/tuf?url=${encodeURIComponent(this.baseUrl)}&file=${encodeURIComponent(fileName)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${fileName}:`, error);
      throw error;
    }
  }

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

  getRoleInfo(): RoleInfo[] {
    if (!this.rootMetadata) {
      return [];
    }

    const roles: RoleInfo[] = [];
    const root = this.rootMetadata.signed;

    // Format function for expiration dates
    const formatExpirationDate = (dateString: string): string => {
      try {
        const date = parseISO(dateString);
        return format(date, "MMM d, yyyy HH:mm 'UTC'");
      } catch (e) {
        return dateString;
      }
    };

    // Function to transform keyids to truncated format
    const transformKeyIds = (keyids: string[]): string[] => {
      return keyids.map(keyid => keyid.substring(0, 8));
    };

    // Root role
    if (this.rootMetadata) {
      roles.push({
        role: 'root',
        specVersion: root.specVersion,
        version: root.version,
        expires: formatExpirationDate(root.expires),
        signers: {
          required: root.roles['root'].threshold,
          total: root.roles['root'].keyIDs.length,
          keyids: transformKeyIds(root.roles['root'].keyIDs),
        },
        jsonLink: `${this.baseUrl}root.json`,
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
            keyids: transformKeyIds(timestampRole.keyIDs),
          },
          jsonLink: `${this.baseUrl}timestamp.json`,
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
            keyids: transformKeyIds(snapshotRole.keyIDs),
          },
          jsonLink: `${this.baseUrl}snapshot.json`,
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
            keyids: transformKeyIds(targetsRole.keyIDs),
          },
          jsonLink: `${this.baseUrl}targets.json`,
        });
      }
    }

    // Delegated targets roles
    const delegations = this.targetsMetadata?.signed.delegations;
    if (delegations?.roles) {
      for (const role of Object.values(delegations.roles)) {
        const roleName = role.name;
        const delegatedMetadata = this.delegatedTargetsMetadata.get(roleName);
        
        if (delegatedMetadata) {
          roles.push({
            role: roleName,
            expires: formatExpirationDate(delegatedMetadata.signed.expires),
            signers: {
              required: role.threshold,
              total: role.keyIDs.length,
              keyids: transformKeyIds(role.keyIDs),
            },
            jsonLink: `${this.baseUrl}${roleName}.json`,
          });
        }
      }
    }

    return roles;
  }

  getKeyName(keyId: string): string {
    // Try to get a friendly name for the key
    if (!this.rootMetadata) return keyId;
    
    const key = this.rootMetadata.signed.keys[keyId];
    if (!key) return keyId;
    
    // Return a shortened key ID
    return `${keyId.substring(0, 8)}...`;
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

export const createRemoteTufRepository = async (url: string): Promise<RemoteTufRepository> => {
  const repository = new RemoteTufRepository(url);
  await repository.initialize();
  return repository;
}; 