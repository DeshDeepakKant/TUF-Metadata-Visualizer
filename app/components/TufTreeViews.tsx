'use client';

import React from 'react';
import { RoleInfo } from '../utils/types';
import TreeView from './TreeView';
import styled from 'styled-components';

const TreeViewsContainer = styled.div`
  margin: 2rem 0;
`;

const TreeViewWrapper = styled.div`
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: var(--bg-subtle);
  border-radius: 0.5rem;
`;

const TreeTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--fg);
`;

const NoDataMessage = styled.div`
  padding: 1rem;
  background-color: var(--bg);
  border: 1px dashed var(--border);
  border-radius: 0.25rem;
  text-align: center;
  color: var(--fg-subtle);
`;

interface TufTreeViewsProps {
  roles: RoleInfo[];
}

const TufTreeViews: React.FC<TufTreeViewsProps> = ({ roles }) => {
  if (!roles || roles.length === 0) {
    return <NoDataMessage>No roles found for tree visualization.</NoDataMessage>;
  }

  // 1. Build Root History tree
  const buildRootHistoryTree = () => {
    const rootRole = roles.find(role => role.role === 'root');
    
    if (!rootRole || !rootRole.version) {
      return [{
        id: 'root-history-na',
        label: 'Root history data not available',
        description: '(no version information found)',
      }];
    }

    // Show all versions from current down to 1
    const currentVersion = rootRole.version;
    const historyNodes = [];
    
    // Add current version with full details
    historyNodes.push({
      id: `root-v${currentVersion}`,
      label: `Version ${currentVersion}`,
      description: `(current, expires: ${rootRole.expires})`,
      colorLabel: '#0070f3',
      link: rootRole.jsonLink,
      children: [
        {
          id: `root-v${currentVersion}-signers`,
          label: 'Signing Keys',
          children: rootRole.signers.keyids.map(keyid => ({
            id: `root-v${currentVersion}-key-${keyid}`,
            label: keyid,
            description: '(root key)'
          }))
        },
        {
          id: `root-v${currentVersion}-threshold`,
          label: `Threshold: ${rootRole.signers.required} of ${rootRole.signers.total}`
        }
      ]
    });
    
    // Function to create link for versioned root files
    const createVersionedRootLink = (version: number) => {
      if (!rootRole.jsonLink) return undefined;
      
      // Handle both numbered and non-numbered root links
      if (rootRole.jsonLink.includes('root.json')) {
        // If it's already versioned (like "3.root.json"), replace the version
        if (rootRole.jsonLink.includes('.root.json') && /\d+\.root\.json/.test(rootRole.jsonLink)) {
          return rootRole.jsonLink.replace(/\d+\.root\.json/, `${version}.root.json`);
        }
        // Otherwise, try to insert the version before root.json
        return rootRole.jsonLink.replace('root.json', `${version}.root.json`);
      }
      
      return undefined;
    };
    
    // Add all previous versions with signing keys and threshold
    // Note: In a real implementation, we would fetch the actual metadata for each version
    // For this demo, we'll simulate info for previous versions based on current data
    for (let i = currentVersion - 1; i >= 1; i--) {
      // Simulated expiry date (just for demonstration)
      const simulatedExpiry = new Date();
      simulatedExpiry.setFullYear(simulatedExpiry.getFullYear() - (currentVersion - i));
      const expiryStr = simulatedExpiry.toISOString().split('T')[0];
      
      historyNodes.push({
        id: `root-v${i}`,
        label: `Version ${i}`,
        description: i === 1 ? `(initial version, expires: ${expiryStr})` : `(previous version, expires: ${expiryStr})`,
        link: createVersionedRootLink(i),
        children: [
          {
            id: `root-v${i}-signers`,
            label: 'Signing Keys',
            children: rootRole.signers.keyids.map(keyid => ({
              id: `root-v${i}-key-${keyid}`,
              label: keyid,
              description: '(root key)'
            }))
          },
          {
            id: `root-v${i}-threshold`,
            label: `Threshold: ${rootRole.signers.required} of ${rootRole.signers.total}`
          }
        ]
      });
    }

    return [{
      id: 'root-history',
      label: 'Root Metadata History',
      children: historyNodes
    }];
  };

  // 2. Build Top-level Delegations tree
  const buildTopLevelDelegationsTree = () => {
    const rootRole = roles.find(role => role.role === 'root');
    
    if (!rootRole) {
      return [{
        id: 'top-level-delegations-na',
        label: 'Top-level delegation data not available',
        description: '(root role not found)',
      }];
    }

    // Get all top-level roles and their keys from the roles array
    const topLevelRoles = ['root', 'timestamp', 'snapshot', 'targets'];
    const topLevelRoleNodes = topLevelRoles.map(roleName => {
      const role = roles.find(r => r.role === roleName);
      
      if (!role) {
        return {
          id: roleName,
          label: roleName,
          description: '(not found)'
        };
      }
      
      // For key visualization
      const keyDetails = role.signers.keyids.length > 0 
        ? role.signers.keyids.map(keyid => ({
            id: `${roleName}-key-${keyid}`,
            label: keyid,
            description: '(signing key)'
          }))
        : [{
            id: `${roleName}-no-keys`,
            label: 'No explicit keys found',
            description: '(role may use threshold only)'
          }];

      return {
        id: roleName,
        label: roleName,
        description: `(threshold: ${role.signers.required} of ${role.signers.total})`,
        link: role.jsonLink,
        children: keyDetails
      };
    });

    // Create a tree showing how root authorizes other roles
    return [{
      id: 'top-level-delegations',
      label: 'Root Role (Trust Anchor)',
      description: `(authorizes all top-level roles)`,
      link: rootRole.jsonLink,
      children: [
        {
          id: 'root-auth-details',
          label: 'Root Authorization Details',
          children: [
            {
              id: 'root-consistent-snapshot',
              label: `Consistent Snapshot: ${rootRole.specVersion ? 'Yes' : 'Unknown'}`,
              description: '(determines if repos use versioned metadata)'
            },
            {
              id: 'root-spec-version',
              label: `TUF Spec Version: ${rootRole.specVersion || 'Unknown'}`
            }
          ]
        },
        {
          id: 'authorized-roles',
          label: 'Authorized Top-Level Roles',
          children: topLevelRoleNodes
        }
      ]
    }];
  };

  // 3. Build Version References tree
  const buildVersionReferencesTree = () => {
    const timestamp = roles.find(role => role.role === 'timestamp');
    const snapshot = roles.find(role => role.role === 'snapshot');
    const targets = roles.find(role => role.role === 'targets');
    
    if (!timestamp || !snapshot) {
      return [{
        id: 'version-references-na',
        label: 'Version reference data not available',
        description: '(required roles missing)',
      }];
    }

    // Get delegated roles (non top-level roles)
    const delegatedRoles = roles.filter(role => 
      !['root', 'timestamp', 'snapshot', 'targets'].includes(role.role)
    );

    // Create the version reference tree with more detailed information
    return [{
      id: 'version-references',
      label: 'Metadata Update Chain',
      description: '(how clients verify and update metadata)',
      children: [{
        id: 'timestamp-ref',
        label: `timestamp.json (v${timestamp.version || '?'})`,
        description: `(updated most frequently, expires: ${timestamp.expires})`,
        link: timestamp.jsonLink,
        children: [{
          id: 'snapshot-ref',
          label: `snapshot.json (v${snapshot.version || '?'})`,
          description: `(contains file versions, expires: ${snapshot.expires})`,
          link: snapshot.jsonLink,
          children: [
            // Show how snapshot references targets
            targets ? {
              id: 'targets-ref-chain',
              label: `targets.json (v${targets.version || '?'})`,
              description: `(contains target file info, expires: ${targets.expires})`,
              link: targets.jsonLink,
              children: [
                delegatedRoles.length > 0 ? {
                  id: 'delegated-targets-group',
                  label: 'Delegated Target Roles',
                  description: `(${delegatedRoles.length} role${delegatedRoles.length > 1 ? 's' : ''})`,
                  children: delegatedRoles.map(role => ({
                    id: `${role.role}-ref`,
                    label: `${role.role}.json (v${role.version || '?'})`,
                    description: `(expires: ${role.expires})`,
                    link: role.jsonLink
                  }))
                } : {
                  id: 'no-delegated-roles',
                  label: 'No delegated roles',
                  description: '(all targets defined in targets.json)'
                },
                {
                  id: 'targets-file-count',
                  label: 'Target Files',
                  description: targets.targets ? 
                    `(${Object.keys(targets.targets).length} file${Object.keys(targets.targets).length !== 1 ? 's' : ''})` :
                    '(no target files defined)'
                }
              ]
            } : {
              id: 'targets-missing',
              label: 'targets.json not found',
              description: '(metadata incomplete)'
            }
          ]
        }]
      }]
    }];
  };

  // 4. Build Targets Delegation tree
  const buildTargetsDelegationTree = () => {
    const targets = roles.find(role => role.role === 'targets');
    
    if (!targets) {
      return [{
        id: 'targets-delegation-missing',
        label: 'Targets delegation data not available',
        description: '(targets role not found)',
      }];
    }
    
    if (!targets.delegations || !targets.delegations.roles || targets.delegations.roles.length === 0) {
      // If there are no delegations but the targets role has target files,
      // show information about those files
      if (targets.targets && Object.keys(targets.targets).length > 0) {
        const targetFiles = Object.entries(targets.targets).map(([path, info], index) => ({
          id: `target-file-${index}`,
          label: path,
          description: `(size: ${info.length} bytes)`
        }));
        
        return [{
          id: 'targets-no-delegation',
          label: 'Targets (No Delegations)',
          description: `(manages ${Object.keys(targets.targets).length} target files directly)`,
          link: targets.jsonLink,
          children: [{
            id: 'targets-files',
            label: 'Target Files',
            children: targetFiles
          }]
        }];
      }
      
      return [{
        id: 'targets-delegation-empty',
        label: 'No target delegations found',
        description: '(the targets role does not delegate to other roles)',
      }];
    }

    // For better visualization, group delegations by path pattern where possible
    const pathPatterns = new Map();
    targets.delegations.roles.forEach(delegatedRole => {
      if (delegatedRole.paths && delegatedRole.paths.length > 0) {
        // Look for common prefixes or patterns
        const pathPrefix = getCommonPrefix(delegatedRole.paths);
        if (pathPrefix) {
          if (!pathPatterns.has(pathPrefix)) {
            pathPatterns.set(pathPrefix, []);
          }
          pathPatterns.get(pathPrefix).push(delegatedRole.name);
        }
      }
    });

    // Create nodes for delegated roles with their paths
    const delegationNodes = targets.delegations.roles.map(delegatedRole => {
      const childRole = roles.find(r => r.role === delegatedRole.name);
      const paths = delegatedRole.paths || [];
      const hasTargets = childRole?.targets && Object.keys(childRole.targets).length > 0;
      
      // Check if this role has sub-delegations (we'd need to examine its metadata)
      const mightHaveSubDelegations = childRole?.delegations?.roles && 
                                     childRole.delegations.roles.length > 0;
      
      return {
        id: `delegation-${delegatedRole.name}`,
        label: delegatedRole.name,
        description: `(threshold: ${delegatedRole.threshold}, terminating: ${delegatedRole.terminating ? 'yes' : 'no'})`,
        link: childRole?.jsonLink,
        children: [
          {
            id: `${delegatedRole.name}-keys`,
            label: 'Signing Keys',
            description: `(${delegatedRole.keyids.length} key${delegatedRole.keyids.length !== 1 ? 's' : ''})`,
            children: delegatedRole.keyids.length > 0
              ? delegatedRole.keyids.map(keyid => ({
                  id: `${delegatedRole.name}-key-${keyid}`,
                  label: keyid
                }))
              : [{
                  id: `${delegatedRole.name}-no-keys`,
                  label: 'No keys specified'
                }]
          },
          {
            id: `${delegatedRole.name}-paths`,
            label: 'Delegated Paths',
            description: `(${paths.length} path pattern${paths.length !== 1 ? 's' : ''})`,
            children: paths.length > 0
              ? paths.map((path, index) => ({
                  id: `${delegatedRole.name}-path-${index}`,
                  label: path
                }))
              : [{
                  id: `${delegatedRole.name}-no-paths`,
                  label: 'No paths specified'
                }]
          },
          // For target files
          ...(hasTargets ? [{
            id: `${delegatedRole.name}-target-files`,
            label: 'Target Files',
            description: `(${Object.keys(childRole!.targets!).length} file${Object.keys(childRole!.targets!).length !== 1 ? 's' : ''})`,
            children: Object.keys(childRole!.targets!).slice(0, 5).map((path, idx) => ({
              id: `${delegatedRole.name}-target-${idx}`,
              label: path,
              description: idx === 4 && Object.keys(childRole!.targets!).length > 5 ? 
                          `(+ ${Object.keys(childRole!.targets!).length - 5} more files)` : undefined
            }))
          }] : [{
            id: `${delegatedRole.name}-no-targets`,
            label: 'No target files',
            description: '(role may delegate further or have no files yet)'
          }]),
          // For sub-delegations
          ...(mightHaveSubDelegations ? [{
            id: `${delegatedRole.name}-subdelegations`,
            label: 'Further Delegations',
            description: '(this role delegates to other roles)',
            children: childRole!.delegations!.roles.map(subRole => ({
              id: `${delegatedRole.name}-subrole-${subRole.name}`,
              label: subRole.name,
              description: `(sub-delegation)`
            }))
          }] : [])
        ]
      };
    });
    
    // Create the main targets delegation tree
    return [{
      id: 'targets-delegation',
      label: 'Targets Delegation Hierarchy',
      description: `(${targets.delegations.roles.length} delegated role${targets.delegations.roles.length !== 1 ? 's' : ''})`,
      link: targets.jsonLink,
      children: [
        // Show path patterns if we found any
        ...(pathPatterns.size > 0 ? [{
          id: 'delegation-path-patterns',
          label: 'Path Delegation Patterns',
          children: Array.from(pathPatterns.entries()).map(([pattern, roleNames], idx) => ({
            id: `path-pattern-${idx}`,
            label: pattern || '(no common pattern)',
            description: `(delegated to: ${roleNames.join(', ')})`
          }))
        }] : []),
        // Show delegation structure
        {
          id: 'delegation-structure',
          label: 'Delegation Structure',
          children: delegationNodes
        }
      ]
    }];
  };

  // Helper function to find common prefix in an array of paths
  const getCommonPrefix = (paths: string[]): string => {
    if (!paths || paths.length === 0) return '';
    if (paths.length === 1) return paths[0].split('/')[0] + '/';
    
    // Find common prefix among the paths
    let prefix = '';
    const firstPath = paths[0];
    
    // Try directory by directory
    const dirs = firstPath.split('/');
    for (let i = 0; i < dirs.length; i++) {
      const currentPrefix = dirs.slice(0, i + 1).join('/') + '/';
      if (paths.every(path => path.startsWith(currentPrefix))) {
        prefix = currentPrefix;
      } else {
        break;
      }
    }
    
    return prefix;
  };

  return (
    <TreeViewsContainer>
      <TreeViewWrapper>
        <TreeTitle>1. Root Metadata History</TreeTitle>
        <TreeView treeData={buildRootHistoryTree()} expandTopLevel={true} />
      </TreeViewWrapper>
      
      <TreeViewWrapper>
        <TreeTitle>2. Top-level Role Delegations</TreeTitle>
        <TreeView treeData={buildTopLevelDelegationsTree()} expandTopLevel={true} />
      </TreeViewWrapper>
      
      <TreeViewWrapper>
        <TreeTitle>3. Version References</TreeTitle>
        <TreeView treeData={buildVersionReferencesTree()} expandTopLevel={true} />
      </TreeViewWrapper>
      
      <TreeViewWrapper>
        <TreeTitle>4. Targets Delegation</TreeTitle>
        <TreeView treeData={buildTargetsDelegationTree()} expandTopLevel={true} />
      </TreeViewWrapper>
    </TreeViewsContainer>
  );
};

export default TufTreeViews; 