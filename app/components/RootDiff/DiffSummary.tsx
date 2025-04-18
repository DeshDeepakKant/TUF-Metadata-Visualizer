import React from 'react';
import { DiffSummary as StyledDiffSummary, DiffTitle, DiffItem, DiffLabel, Badge } from './styles';
import { RootDiff } from '../../utils/types';
import { formatExpirationDate } from '../../utils/diffUtils';

interface DiffSummaryProps {
  diff: RootDiff;
}

export function DiffSummary({ diff }: DiffSummaryProps) {
  const hasVersionChange = diff.oldVersion !== diff.newVersion;
  const hasExpiryChange = diff.oldExpires !== diff.newExpires;
  const hasKeyChanges = diff.keyDiffs.length > 0;
  const hasRoleChanges = diff.roleDiffs.length > 0;
  const hasSignatureChanges = diff.signatureDiffs.length > 0;

  return (
    <StyledDiffSummary>
      <DiffTitle>Root Metadata Changes</DiffTitle>
      
      <DiffItem>
        <DiffLabel>Version</DiffLabel>
        <div>
          {diff.oldVersion} → {diff.newVersion}
          {hasVersionChange && (
            <Badge $type="info" style={{ marginLeft: '0.5rem' }}>Changed</Badge>
          )}
        </div>
      </DiffItem>
      
      <DiffItem>
        <DiffLabel>Expiry</DiffLabel>
        <div>
          {formatExpirationDate(diff.oldExpires)} → {formatExpirationDate(diff.newExpires)}
          {hasExpiryChange && (
            <Badge $type="info" style={{ marginLeft: '0.5rem' }}>Changed</Badge>
          )}
        </div>
      </DiffItem>
      
      <DiffItem>
        <DiffLabel>Changes</DiffLabel>
        <div>
          {hasKeyChanges && (
            <Badge $type="info" style={{ marginRight: '0.5rem' }}>
              {diff.keyDiffs.length} key{diff.keyDiffs.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasRoleChanges && (
            <Badge $type="info" style={{ marginRight: '0.5rem' }}>
              {diff.roleDiffs.length} role{diff.roleDiffs.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasSignatureChanges && (
            <Badge $type="info">
              {diff.signatureDiffs.length} signature{diff.signatureDiffs.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </DiffItem>
    </StyledDiffSummary>
  );
} 