'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { RoleInfo } from '../utils/types';

// Styled components for the tree view
const TreeContainer = styled.div`
  margin: 1rem 0;
  font-family: var(--font-mono);
`;

const TreeTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const TreeNode = styled.div`
  padding-left: 1.5rem;
`;

const TreeRoot = styled.div`
  padding: 0.5rem;
  margin-bottom: 0.5rem;
`;

const NodeItem = styled.div<{ $indentLevel: number }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  padding-left: ${props => props.$indentLevel * 1}rem;
`;

const ExpandButton = styled.button<{ $expanded?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
  font-size: 0.75rem;
`;

const NodeLabel = styled.span<{ $highlight?: boolean }>`
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 0.25rem;
  ${props => props.$highlight && `
    background-color: var(--highlight-bg);
    font-weight: 600;
  `}
  &:hover {
    background-color: var(--hover);
  }
`;

const EmptyNode = styled.div`
  width: 1.5rem;
`;

const RefLink = styled.span`
  margin-left: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

// Type for tree node data
interface TreeNodeData {
  id: string;
  label: string;
  children?: TreeNodeData[];
  metadata?: any; // Additional metadata for this node
  highlight?: boolean;
  link?: string;
}

interface TreeNodeProps {
  node: TreeNodeData;
  indentLevel: number;
  expandedNodes: Set<string>;
  toggleNode: (nodeId: string) => void;
}

// Single node component
const TreeNodeComponent: React.FC<TreeNodeProps> = ({ 
  node, 
  indentLevel,
  expandedNodes,
  toggleNode
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  return (
    <div>
      <NodeItem $indentLevel={indentLevel}>
        {hasChildren ? (
          <ExpandButton
            $expanded={isExpanded}
            onClick={() => toggleNode(node.id)}
          >
            ▶
          </ExpandButton>
        ) : (
          <EmptyNode />
        )}
        <NodeLabel 
          onClick={() => hasChildren && toggleNode(node.id)}
          $highlight={node.highlight}
        >
          {node.label}
        </NodeLabel>
        {node.link && (
          <RefLink>
            (<a href={node.link} target="_blank" rel="noopener noreferrer">json</a>)
          </RefLink>
        )}
      </NodeItem>
      
      {hasChildren && isExpanded && (
        <TreeNode>
          {node.children?.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              indentLevel={indentLevel + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </TreeNode>
      )}
    </div>
  );
};

// Main Tree View component
interface TreeViewProps {
  title: string;
  data: TreeNodeData;
  initiallyExpanded?: string[];
}

export const TreeView: React.FC<TreeViewProps> = ({ 
  title, 
  data,
  initiallyExpanded = []
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(initiallyExpanded)
  );

  const toggleNode = (nodeId: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  return (
    <TreeContainer>
      <TreeTitle>{title}</TreeTitle>
      <TreeRoot>
        <TreeNodeComponent
          node={data}
          indentLevel={0}
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        />
      </TreeRoot>
    </TreeContainer>
  );
};

// Helper functions to build different tree types
export const buildRootHistoryTree = (roles: RoleInfo[]): TreeNodeData => {
  const rootRole = roles.find(role => role.role === 'root');
  
  if (!rootRole || !rootRole.version) {
    return {
      id: 'root-history',
      label: 'Root History (Not Available)',
      children: []
    };
  }

  // For now, we just have the current version since we don't have history
  return {
    id: 'root-history',
    label: 'Root',
    children: [
      {
        id: `root-v${rootRole.version}`,
        label: `Version ${rootRole.version}`,
        highlight: true,
        link: rootRole.jsonLink
      }
    ]
  };
};

export const buildTopLevelDelegationTree = (roles: RoleInfo[]): TreeNodeData => {
  const rootRole = roles.find(role => role.role === 'root');
  
  if (!rootRole) {
    return {
      id: 'top-level-delegations',
      label: 'Top-Level Delegations (Not Available)',
      children: []
    };
  }

  return {
    id: 'top-level-delegations',
    label: 'Root',
    link: rootRole.jsonLink,
    children: roles
      .filter(role => ['timestamp', 'snapshot', 'targets'].includes(role.role))
      .map(role => ({
        id: role.role,
        label: role.role,
        link: role.jsonLink,
        children: []
      }))
  };
};

export const buildVersionReferencesTree = (roles: RoleInfo[]): TreeNodeData => {
  const timestamp = roles.find(role => role.role === 'timestamp');
  const snapshot = roles.find(role => role.role === 'snapshot');
  const targets = roles.find(role => role.role === 'targets');
  
  if (!timestamp || !snapshot) {
    return {
      id: 'version-references',
      label: 'Version References (Not Available)',
      children: []
    };
  }

  return {
    id: 'version-references',
    label: 'Timestamp',
    link: timestamp.jsonLink,
    children: [
      {
        id: 'snapshot-ref',
        label: `Snapshot (v${snapshot.version})`,
        link: snapshot.jsonLink,
        children: [
          {
            id: 'targets-ref',
            label: `Targets (v${targets?.version || 'unknown'})`,
            link: targets?.jsonLink,
            children: roles
              .filter(role => !['root', 'timestamp', 'snapshot', 'targets'].includes(role.role))
              .map(role => ({
                id: `delegated-${role.role}`,
                label: `${role.role} (v${role.version || 'unknown'})`,
                link: role.jsonLink
              }))
          }
        ]
      }
    ]
  };
};

export const buildTargetsDelegationTree = (roles: RoleInfo[]): TreeNodeData => {
  const targets = roles.find(role => role.role === 'targets');
  
  if (!targets || !targets.delegations) {
    return {
      id: 'targets-delegation',
      label: 'Targets Delegation (Not Available)',
      children: []
    };
  }

  // Get delegated roles from the targets role
  const delegatedRoles = targets.delegations.roles || [];
  
  return {
    id: 'targets-delegation',
    label: 'targets',
    link: targets.jsonLink,
    children: delegatedRoles.map(delegatedRole => {
      const role = roles.find(r => r.role === delegatedRole.name);
      return {
        id: `delegation-${delegatedRole.name}`,
        label: delegatedRole.name,
        link: role?.jsonLink,
        children: delegatedRole.paths ? delegatedRole.paths.map((path, index) => ({
          id: `path-${delegatedRole.name}-${index}`,
          label: path
        })) : []
      };
    })
  };
};

// Export a component that combines all trees
interface TufTreeViewsProps {
  roles: RoleInfo[];
}

const TufTreeViews: React.FC<TufTreeViewsProps> = ({ roles }) => {
  if (!roles || roles.length === 0) {
    return <div>No roles found for tree visualization.</div>;
  }

  return (
    <div>
      <TreeView 
        title="1. Root Metadata History" 
        data={buildRootHistoryTree(roles)} 
        initiallyExpanded={['root-history']}
      />
      
      <TreeView 
        title="2. Top-Level Delegations" 
        data={buildTopLevelDelegationTree(roles)} 
        initiallyExpanded={['top-level-delegations']}
      />
      
      <TreeView 
        title="3. Version References" 
        data={buildVersionReferencesTree(roles)} 
        initiallyExpanded={['version-references', 'snapshot-ref']}
      />
      
      <TreeView 
        title="4. Targets Delegation" 
        data={buildTargetsDelegationTree(roles)} 
        initiallyExpanded={['targets-delegation']}
      />
    </div>
  );
};

export default TufTreeViews; 