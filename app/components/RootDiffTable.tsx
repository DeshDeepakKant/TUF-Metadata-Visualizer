'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { RootDiff, KeyDiff, RoleDiff, SignatureDiff } from '../utils/types';
import { truncateKeyId, formatExpirationDate } from '../utils/diffUtils';

// Styled components
const DiffTableContainer = styled.div`
  margin: 2rem 0;
`;

const DiffTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0;
`;

const DiffSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DiffSelectButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${props => props.$active ? 'var(--primary)' : 'var(--background)'};
  color: ${props => props.$active ? 'white' : 'var(--text)'};
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? 'var(--primary)' : 'var(--hover)'};
  }
`;

const DiffTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

const DiffTableHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
`;

const DiffTableRow = styled.tr`
  &:hover {
    background-color: var(--hover);
  }
`;

const DiffTableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
`;

// Status badges
const AddedBadge = styled.span`
  background-color: var(--success-light);
  color: var(--success);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const RemovedBadge = styled.span`
  background-color: var(--error-light);
  color: var(--error);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ChangedBadge = styled.span`
  background-color: var(--warning-light);
  color: var(--warning);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const KeyId = styled.span`
  font-family: 'Courier New', monospace;
  background-color: var(--background-subtle);
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
`;

// Summary component at the top
const DiffSummary = styled.div`
  background-color: var(--background-subtle);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const DiffSummaryTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DiffSummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const DiffSummaryLabel = styled.span`
  font-weight: 500;
`;

// Empty state
const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  background-color: var(--background-subtle);
  border-radius: 4px;
`;

interface RootDiffTableProps {
  diff: RootDiff | null;
  loading?: boolean;
}

export default function RootDiffTable({ diff, loading = false }: RootDiffTableProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'roles' | 'signatures'>('overview');
  
  if (loading) {
    return <EmptyState>Loading diff data...</EmptyState>;
  }
  
  if (!diff) {
    return (
      <EmptyState>
        <p>Select two root versions to compare</p>
      </EmptyState>
    );
  }
  
  // Calculate time difference between expiry dates
  const oldExpiryDate = new Date(diff.oldExpires);
  const newExpiryDate = new Date(diff.newExpires);
  const expiryDiffMillis = newExpiryDate.getTime() - oldExpiryDate.getTime();
  const expiryDiffDays = Math.round(expiryDiffMillis / (1000 * 60 * 60 * 24));
  
  // Determine if expiry was extended or shortened
  const expiryChangeText = expiryDiffDays > 0 
    ? `Extended by ${expiryDiffDays} days` 
    : expiryDiffDays < 0 
      ? `Shortened by ${Math.abs(expiryDiffDays)} days` 
      : 'No change';
  
  // Check if there are any changes
  const hasKeyChanges = diff.keyDiffs.length > 0;
  const hasRoleChanges = diff.roleDiffs.length > 0;
  const hasSignatureChanges = diff.signatureDiffs.length > 0;
  const hasAnyChanges = hasKeyChanges || hasRoleChanges || hasSignatureChanges;
  
  return (
    <DiffTableContainer>
      <DiffTitle>Root Metadata Diff (v{diff.oldVersion} → v{diff.newVersion})</DiffTitle>
      
      {/* Summary information */}
      <DiffSummary>
        <DiffSummaryTitle>Summary</DiffSummaryTitle>
        <DiffSummaryItem>
          <DiffSummaryLabel>Version:</DiffSummaryLabel>
          <span>{diff.oldVersion} → {diff.newVersion}</span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Expires:</DiffSummaryLabel>
          <span>{formatExpirationDate(diff.oldExpires)} → {formatExpirationDate(diff.newExpires)} ({expiryChangeText})</span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Changes:</DiffSummaryLabel>
          <span>
            {hasKeyChanges ? `${diff.keyDiffs.length} key(s)` : 'No key changes'} | 
            {hasRoleChanges ? `${diff.roleDiffs.length} role(s)` : 'No role changes'} | 
            {hasSignatureChanges ? `${diff.signatureDiffs.length} signature(s)` : 'No signature changes'}
          </span>
        </DiffSummaryItem>
      </DiffSummary>
      
      {/* Tab selector */}
      <DiffSelector>
        <DiffSelectButton 
          $active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </DiffSelectButton>
        <DiffSelectButton 
          $active={activeTab === 'keys'} 
          onClick={() => setActiveTab('keys')}
        >
          Keys {hasKeyChanges && `(${diff.keyDiffs.length})`}
        </DiffSelectButton>
        <DiffSelectButton 
          $active={activeTab === 'roles'} 
          onClick={() => setActiveTab('roles')}
        >
          Roles {hasRoleChanges && `(${diff.roleDiffs.length})`}
        </DiffSelectButton>
        <DiffSelectButton 
          $active={activeTab === 'signatures'} 
          onClick={() => setActiveTab('signatures')}
        >
          Signatures {hasSignatureChanges && `(${diff.signatureDiffs.length})`}
        </DiffSelectButton>
      </DiffSelector>
      
      {/* Empty state if no changes */}
      {!hasAnyChanges && (
        <EmptyState>
          <p>No changes detected between these versions besides version number and expiry date.</p>
        </EmptyState>
      )}
      
      {/* Overview tab */}
      {activeTab === 'overview' && hasAnyChanges && (
        <div>
          {/* Key changes summary */}
          {hasKeyChanges && (
            <>
              <h3>Key Changes</h3>
              <DiffTable>
                <thead>
                  <tr>
                    <DiffTableHeader>Key ID</DiffTableHeader>
                    <DiffTableHeader>Owner</DiffTableHeader>
                    <DiffTableHeader>Change</DiffTableHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.keyDiffs.map(keyDiff => (
                    <DiffTableRow key={keyDiff.keyid}>
                      <DiffTableCell>
                        <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                      </DiffTableCell>
                      <DiffTableCell>{keyDiff.keyowner || 'Unknown'}</DiffTableCell>
                      <DiffTableCell>
                        {keyDiff.status === 'added' && <AddedBadge>Added</AddedBadge>}
                        {keyDiff.status === 'removed' && <RemovedBadge>Removed</RemovedBadge>}
                        {keyDiff.status === 'changed' && <ChangedBadge>Changed</ChangedBadge>}
                      </DiffTableCell>
                    </DiffTableRow>
                  ))}
                </tbody>
              </DiffTable>
            </>
          )}
          
          {/* Role changes summary */}
          {hasRoleChanges && (
            <>
              <h3>Role Changes</h3>
              <DiffTable>
                <thead>
                  <tr>
                    <DiffTableHeader>Role</DiffTableHeader>
                    <DiffTableHeader>Threshold</DiffTableHeader>
                    <DiffTableHeader>Key Changes</DiffTableHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.roleDiffs.map(roleDiff => (
                    <DiffTableRow key={roleDiff.roleName}>
                      <DiffTableCell>{roleDiff.roleName}</DiffTableCell>
                      <DiffTableCell>
                        {roleDiff.oldThreshold !== undefined && roleDiff.newThreshold !== undefined ? (
                          `${roleDiff.oldThreshold} → ${roleDiff.newThreshold}`
                        ) : (
                          'No change'
                        )}
                      </DiffTableCell>
                      <DiffTableCell>
                        {roleDiff.addedKeyids.length > 0 && (
                          <div>
                            <AddedBadge>Added</AddedBadge> {roleDiff.addedKeyids.length} key(s)
                          </div>
                        )}
                        {roleDiff.removedKeyids.length > 0 && (
                          <div>
                            <RemovedBadge>Removed</RemovedBadge> {roleDiff.removedKeyids.length} key(s)
                          </div>
                        )}
                        {roleDiff.addedKeyids.length === 0 && roleDiff.removedKeyids.length === 0 && (
                          'No key changes'
                        )}
                      </DiffTableCell>
                    </DiffTableRow>
                  ))}
                </tbody>
              </DiffTable>
            </>
          )}
          
          {/* Signature changes summary */}
          {hasSignatureChanges && (
            <>
              <h3>Signature Changes</h3>
              <DiffTable>
                <thead>
                  <tr>
                    <DiffTableHeader>Key ID</DiffTableHeader>
                    <DiffTableHeader>Owner</DiffTableHeader>
                    <DiffTableHeader>Change</DiffTableHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.signatureDiffs.map(sigDiff => (
                    <DiffTableRow key={sigDiff.keyid}>
                      <DiffTableCell>
                        <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                      </DiffTableCell>
                      <DiffTableCell>{sigDiff.keyowner || 'Unknown'}</DiffTableCell>
                      <DiffTableCell>
                        {!sigDiff.oldSigned && sigDiff.newSigned && <AddedBadge>Signed</AddedBadge>}
                        {sigDiff.oldSigned && !sigDiff.newSigned && <RemovedBadge>Unsigned</RemovedBadge>}
                      </DiffTableCell>
                    </DiffTableRow>
                  ))}
                </tbody>
              </DiffTable>
            </>
          )}
        </div>
      )}
      
      {/* Keys tab - detailed view */}
      {activeTab === 'keys' && hasKeyChanges && (
        <DiffTable>
          <thead>
            <tr>
              <DiffTableHeader>Key ID</DiffTableHeader>
              <DiffTableHeader>Status</DiffTableHeader>
              <DiffTableHeader>Owner</DiffTableHeader>
              <DiffTableHeader>Key Type</DiffTableHeader>
              <DiffTableHeader>Scheme</DiffTableHeader>
            </tr>
          </thead>
          <tbody>
            {diff.keyDiffs.map(keyDiff => (
              <DiffTableRow key={keyDiff.keyid}>
                <DiffTableCell>
                  <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                </DiffTableCell>
                <DiffTableCell>
                  {keyDiff.status === 'added' && <AddedBadge>Added</AddedBadge>}
                  {keyDiff.status === 'removed' && <RemovedBadge>Removed</RemovedBadge>}
                  {keyDiff.status === 'changed' && <ChangedBadge>Changed</ChangedBadge>}
                </DiffTableCell>
                <DiffTableCell>{keyDiff.keyowner || 'Unknown'}</DiffTableCell>
                <DiffTableCell>
                  {keyDiff.status === 'changed' && keyDiff.oldKeytype !== keyDiff.keytype
                    ? `${keyDiff.oldKeytype} → ${keyDiff.keytype}`
                    : keyDiff.keytype || keyDiff.oldKeytype || 'Unknown'
                  }
                </DiffTableCell>
                <DiffTableCell>
                  {keyDiff.status === 'changed' && keyDiff.oldScheme !== keyDiff.scheme
                    ? `${keyDiff.oldScheme} → ${keyDiff.scheme}`
                    : keyDiff.scheme || keyDiff.oldScheme || 'Unknown'
                  }
                </DiffTableCell>
              </DiffTableRow>
            ))}
          </tbody>
        </DiffTable>
      )}
      
      {/* Roles tab - detailed view */}
      {activeTab === 'roles' && hasRoleChanges && (
        <DiffTable>
          <thead>
            <tr>
              <DiffTableHeader>Role</DiffTableHeader>
              <DiffTableHeader>Threshold</DiffTableHeader>
              <DiffTableHeader>Added Keys</DiffTableHeader>
              <DiffTableHeader>Removed Keys</DiffTableHeader>
            </tr>
          </thead>
          <tbody>
            {diff.roleDiffs.map(roleDiff => (
              <DiffTableRow key={roleDiff.roleName}>
                <DiffTableCell>{roleDiff.roleName}</DiffTableCell>
                <DiffTableCell>
                  {roleDiff.oldThreshold !== undefined && roleDiff.newThreshold !== undefined
                    ? `${roleDiff.oldThreshold} → ${roleDiff.newThreshold}`
                    : roleDiff.oldThreshold !== undefined
                      ? `${roleDiff.oldThreshold} → Removed`
                      : `Added → ${roleDiff.newThreshold}`
                  }
                </DiffTableCell>
                <DiffTableCell>
                  {roleDiff.addedKeyids.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                      {roleDiff.addedKeyids.map(keyId => (
                        <li key={keyId}>
                          <KeyId>{truncateKeyId(keyId)}</KeyId>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'None'
                  )}
                </DiffTableCell>
                <DiffTableCell>
                  {roleDiff.removedKeyids.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                      {roleDiff.removedKeyids.map(keyId => (
                        <li key={keyId}>
                          <KeyId>{truncateKeyId(keyId)}</KeyId>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'None'
                  )}
                </DiffTableCell>
              </DiffTableRow>
            ))}
          </tbody>
        </DiffTable>
      )}
      
      {/* Signatures tab - detailed view */}
      {activeTab === 'signatures' && hasSignatureChanges && (
        <DiffTable>
          <thead>
            <tr>
              <DiffTableHeader>Key ID</DiffTableHeader>
              <DiffTableHeader>Owner</DiffTableHeader>
              <DiffTableHeader>Previous Status</DiffTableHeader>
              <DiffTableHeader>New Status</DiffTableHeader>
            </tr>
          </thead>
          <tbody>
            {diff.signatureDiffs.map(sigDiff => (
              <DiffTableRow key={sigDiff.keyid}>
                <DiffTableCell>
                  <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                </DiffTableCell>
                <DiffTableCell>{sigDiff.keyowner || 'Unknown'}</DiffTableCell>
                <DiffTableCell>
                  {sigDiff.oldSigned ? (
                    <AddedBadge>Signed</AddedBadge>
                  ) : (
                    <RemovedBadge>Unsigned</RemovedBadge>
                  )}
                </DiffTableCell>
                <DiffTableCell>
                  {sigDiff.newSigned ? (
                    <AddedBadge>Signed</AddedBadge>
                  ) : (
                    <RemovedBadge>Unsigned</RemovedBadge>
                  )}
                </DiffTableCell>
              </DiffTableRow>
            ))}
          </tbody>
        </DiffTable>
      )}
    </DiffTableContainer>
  );
} 