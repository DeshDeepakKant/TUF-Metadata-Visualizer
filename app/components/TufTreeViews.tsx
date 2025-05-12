'use client';

import React from 'react';
import styled from 'styled-components';
import TreeView from './TreeView';
import { RoleInfo } from '../utils/types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 2rem 0;
`;

const TreeViewContainer = styled.div`
  background: var(--bg-subtle);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

interface TufTreeViewsProps {
  roles: RoleInfo[];
}

const TufTreeViews: React.FC<TufTreeViewsProps> = ({ roles }) => {
  // Convert roles to tree data
  const roleTreeData = roles.map(role => ({
    id: role.role,
    label: role.role,
    description: `Version ${role.version}`,
    link: role.jsonLink,
    colorLabel: role.role === 'root' ? '#4CAF50' : 
                role.role === 'targets' ? '#2196F3' :
                role.role === 'snapshot' ? '#FF9800' :
                role.role === 'timestamp' ? '#9C27B0' : '#757575',
    children: role.delegations?.roles?.map(delegation => ({
      id: delegation.name,
      label: delegation.name,
      description: `Threshold: ${delegation.threshold}`,
      colorLabel: '#FF5722',
      children: delegation.paths?.map(path => ({
        id: path,
        label: path,
        colorLabel: '#607D8B'
      }))
    }))
  }));

  // Create targets tree data
  const targetsTreeData = roles
    .filter(role => role.targets)
    .map(role => ({
      id: role.role,
      label: role.role,
      description: `Version ${role.version}`,
      link: role.jsonLink,
      colorLabel: role.role === 'targets' ? '#2196F3' : '#FF5722',
      children: Object.entries(role.targets || {}).map(([target, info]) => ({
        id: target,
        label: target,
        description: `Size: ${info.length} bytes`,
        colorLabel: '#607D8B'
      }))
    }));

  return (
    <Container>
      <TreeViewContainer>
        <TreeView 
          treeData={roleTreeData} 
          title="Role Hierarchy" 
          expandTopLevel={true}
        />
      </TreeViewContainer>

      <TreeViewContainer>
        <TreeView 
          treeData={targetsTreeData} 
          title="Targets" 
          expandTopLevel={true}
        />
      </TreeViewContainer>
    </Container>
  );
};

export default TufTreeViews; 