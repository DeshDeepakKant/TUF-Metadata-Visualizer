import React from 'react';
import { DiffContainer, EmptyState } from './styles';
import { RootDiff } from '../../utils/types';
import { DiffSummary } from './DiffSummary';
import { KeyChanges } from './KeyChanges';
import { RoleChanges } from './RoleChanges';
import { SignatureStatus } from './SignatureStatus';

interface RootDiffViewProps {
  diff: RootDiff | null;
  loading?: boolean;
}

/**
 * RootDiffView component displays a detailed comparison between two root.json versions
 * @param diff - The diff data to display
 * @param loading - Whether the component is in a loading state
 */
export function RootDiffView({ diff, loading = false }: RootDiffViewProps) {
  if (loading) {
    return (
      <DiffContainer>
        <EmptyState>
          <p>Loading diff...</p>
        </EmptyState>
      </DiffContainer>
    );
  }

  if (!diff) {
    return (
      <DiffContainer>
        <EmptyState>
          <p>No diff data available.</p>
        </EmptyState>
      </DiffContainer>
    );
  }

  // Get required signatures from root role
  const requiredSignatures = diff.roleDiffs.find(r => r.roleName === 'root')?.newThreshold || 1;

  return (
    <DiffContainer>
      <DiffSummary diff={diff} />
      <KeyChanges changes={diff.keyDiffs} />
      <RoleChanges changes={diff.roleDiffs} />
      <SignatureStatus 
        signatures={diff.signatureDiffs}
        requiredSignatures={requiredSignatures}
      />
    </DiffContainer>
  );
} 