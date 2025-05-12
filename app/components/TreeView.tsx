'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { RoleInfo } from '../utils/types';

// Styled components
const TreeContainer = styled.div`
  margin: 1rem 0;
  font-family: monospace;
  user-select: text;
  border-radius: 0.25rem;
  overflow: hidden;
`;

const TreeNode = styled.div`
  padding: 0.25rem 0;
`;

const TreeBranch = styled.div`
  margin-left: 1.5rem;
  padding-left: 1rem;
  border-left: 1px dashed var(--border);
`;

const NodeContent = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;

  &:hover {
    background-color: var(--hover);
  }
`;

const ToggleIcon = styled.span`
  display: inline-block;
  width: 1rem;
  text-align: center;
  margin-right: 0.5rem;
  transform-origin: center;
  transition: transform 0.2s ease;
  font-size: 0.75rem;
`;

const NodeLabel = styled.span<{ $isColor?: string }>`
  color: ${props => props.$isColor || 'inherit'};
  font-weight: ${props => props.$isColor ? '600' : 'normal'};

  // Apply specific styling for highlighted nodes
  ${props => props.$isColor && `
    background-color: ${props.$isColor}20; // 20 is for ~12% opacity
    padding: 2px 6px;
    border-radius: 0.25rem;
  `}
`;

const NodeDescription = styled.span`
  color: var(--fg-subtle);
  margin-left: 0.5rem;
  font-size: 0.9em;
`;

const NodeLink = styled.a`
  margin-left: 0.5rem;
  color: var(--link);
  text-decoration: none;
  font-size: 0.85em;

  &:hover {
    text-decoration: underline;
  }
`;

interface TreeNodeType {
  id: string;
  label: string;
  description?: string;
  link?: string;
  colorLabel?: string;
  children?: TreeNodeType[];
}

interface TreeViewProps {
  treeData: TreeNodeType[];
  title?: string;
  expandTopLevel?: boolean;
}

// Helper component for a single node
const TreeNodeComponent: React.FC<{ node: TreeNodeType, level: number, expandTopLevel?: boolean }> = ({
  node,
  level,
  expandTopLevel
}) => {
  const [expanded, setExpanded] = useState(expandTopLevel && level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <TreeNode>
      <NodeContent onClick={() => hasChildren && setExpanded(!expanded)}>
        {hasChildren ? (
          <ToggleIcon style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</ToggleIcon>
        ) : (
          <ToggleIcon>•</ToggleIcon>
        )}
        <NodeLabel $isColor={node.colorLabel}>{node.label}</NodeLabel>
        {node.description && <NodeDescription>{node.description}</NodeDescription>}
        {node.link && <NodeLink href={node.link} target="_blank" onClick={e => e.stopPropagation()}>json</NodeLink>}
      </NodeContent>

      {expanded && hasChildren && (
        <TreeBranch>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              expandTopLevel={expandTopLevel}
            />
          ))}
        </TreeBranch>
      )}
    </TreeNode>
  );
};

const TreeView: React.FC<TreeViewProps> = ({ treeData, title, expandTopLevel = false }) => {
  return (
    <TreeContainer>
      {title && <h3>{title}</h3>}
      {treeData.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          expandTopLevel={expandTopLevel}
        />
      ))}
    </TreeContainer>
  );
};

export default TreeView; 