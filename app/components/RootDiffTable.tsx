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

// Side-by-side comparison table
const SideBySideContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SideBySideTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

const SideBySideHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  width: 50%;
`;

const SideBySideHeaderProperty = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  width: 25%;
`;

const SideBySideCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
`;

const ComparisonSection = styled.div`
  margin-bottom: 2rem;
`;

const ComparisonTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
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

const VerifiedBadge = styled.span`
  background-color: var(--success-light);
  color: var(--success);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const UnverifiedBadge = styled.span`
  background-color: var(--error-light);
  color: var(--error);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
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
  const [activeTab, setActiveTab] = useState<'summary' | 'keys' | 'roles' | 'signatures'>('summary');
  
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
  
  // Helper function to format signature verification status
  const getVerificationStatus = (sigCount: number, reqCount: number) => {
    const isVerified = sigCount >= reqCount;
    return (
      <div>
        <div><strong>{sigCount}</strong> of <strong>{reqCount}</strong> required signatures present</div>
        <div style={{ marginTop: '0.5rem' }}>
          {isVerified ? (
            <VerifiedBadge>Verified</VerifiedBadge>
          ) : (
            <UnverifiedBadge>Not Verified</UnverifiedBadge>
          )}
        </div>
      </div>
    );
  };
  
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
  
  // Calculate if there are changes to display for each section
  const hasVersionChange = diff.oldVersion !== diff.newVersion;
  const hasExpiryChange = diff.oldExpires !== diff.newExpires;

  // Calculate tab counts for badges
  const keysCount = hasKeyChanges ? diff.keyDiffs.length : 0;
  const rolesCount = hasRoleChanges ? diff.roleDiffs.length : 0;
  const signaturesCount = hasSignatureChanges ? diff.signatureDiffs.length : 0;
  
  return (
    <DiffTableContainer>
      <DiffTitle>Root Metadata Diff (v{diff.oldVersion} → v{diff.newVersion})</DiffTitle>
      
      {/* Summary information */}
      <DiffSummary>
        <DiffSummaryTitle>Root Metadata Changes</DiffSummaryTitle>
        <DiffSummaryItem>
          <DiffSummaryLabel>Version:</DiffSummaryLabel>
          <span>{diff.oldVersion} → {diff.newVersion}</span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Expires:</DiffSummaryLabel>
          <span>{formatExpirationDate(diff.oldExpires)} → {formatExpirationDate(diff.newExpires)} ({expiryChangeText})</span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Verification:</DiffSummaryLabel>
          <span>
            {diff.oldSignatureStatus && 
              `v${diff.oldVersion}: ${diff.oldSignatureStatus.signed} of ${diff.oldSignatureStatus.required} required signatures`
            } →{' '}
            {diff.newSignatureStatus && 
              `v${diff.newVersion}: ${diff.newSignatureStatus.signed} of ${diff.newSignatureStatus.required} required signatures`
            }
          </span>
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
          $active={activeTab === 'summary'} 
          onClick={() => setActiveTab('summary')}
        >
          Summary
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
      
      {/* Overview tab with side-by-side comparison */}
      {activeTab === 'summary' && hasAnyChanges && (
        <SideBySideContainer>
          {/* Version and expiration summary - simplified */}
          <ComparisonSection>
            <ComparisonTitle>Version Information</ComparisonTitle>
            <SideBySideTable>
              <thead>
                <tr>
                  <SideBySideHeaderProperty>Property</SideBySideHeaderProperty>
                  <SideBySideHeader>Previous</SideBySideHeader>
                  <SideBySideHeader>Current</SideBySideHeader>
                </tr>
              </thead>
              <tbody>
                {hasVersionChange && (
                  <tr>
                    <SideBySideCell>Version</SideBySideCell>
                    <SideBySideCell>{diff.oldVersion}</SideBySideCell>
                    <SideBySideCell>
                      {diff.newVersion}
                      <div style={{ marginTop: '0.25rem' }}>
                        <ChangedBadge>Incremented by {diff.newVersion - diff.oldVersion}</ChangedBadge>
                      </div>
                    </SideBySideCell>
                  </tr>
                )}
                <tr>
                  <SideBySideCell>Expires</SideBySideCell>
                  <SideBySideCell>{formatExpirationDate(diff.oldExpires)}</SideBySideCell>
                  <SideBySideCell>
                    {formatExpirationDate(diff.newExpires)}
                    {expiryDiffDays !== 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {expiryDiffDays > 0 ? (
                          <AddedBadge>Extended by {expiryDiffDays} days</AddedBadge>
                        ) : (
                          <RemovedBadge>Shortened by {Math.abs(expiryDiffDays)} days</RemovedBadge>
                        )}
                      </div>
                    )}
                  </SideBySideCell>
                </tr>
              </tbody>
            </SideBySideTable>
          </ComparisonSection>

          {/* Key changes if any */}
          {hasKeyChanges && (
            <ComparisonSection>
              <ComparisonTitle>Key Changes</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
                    <SideBySideHeader>Previous Version</SideBySideHeader>
                    <SideBySideHeader>Current Version</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.keyDiffs.map(keyDiff => (
                    <tr key={keyDiff.keyid}>
                      <SideBySideCell>
                        <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                        <div style={{ marginTop: '0.25rem' }}>
                          Owner: {keyDiff.keyowner || 'Unknown'}
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          {keyDiff.status === 'added' && <AddedBadge>New key</AddedBadge>}
                          {keyDiff.status === 'removed' && <RemovedBadge>Removed key</RemovedBadge>}
                          {keyDiff.status === 'changed' && <ChangedBadge>Modified key</ChangedBadge>}
                        </div>
                      </SideBySideCell>
                      <SideBySideCell>
                        {keyDiff.status === 'removed' || keyDiff.status === 'changed' ? (
                          <div>Present</div>
                        ) : (
                          <div>Not present</div>
                        )}
                      </SideBySideCell>
                      <SideBySideCell>
                        {keyDiff.status === 'added' || keyDiff.status === 'changed' ? (
                          <div>Present</div>
                        ) : (
                          <div>Not present</div>
                        )}
                      </SideBySideCell>
                    </tr>
                  ))}
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}

          {/* Role changes if any */}
          {hasRoleChanges && (
            <ComparisonSection>
              <ComparisonTitle>Role Changes</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Role</SideBySideHeaderProperty>
                    <SideBySideHeader>Version {diff.oldVersion}</SideBySideHeader>
                    <SideBySideHeader>Version {diff.newVersion}</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.roleDiffs.map(roleDiff => (
                    <tr key={roleDiff.roleName}>
                      <SideBySideCell>
                        <div><strong>{roleDiff.roleName}</strong></div>
                        <div style={{ marginTop: '0.25rem' }}>
                          {!roleDiff.oldThreshold && roleDiff.newThreshold && <AddedBadge>Added</AddedBadge>}
                          {roleDiff.oldThreshold && !roleDiff.newThreshold && <RemovedBadge>Removed</RemovedBadge>}
                          {roleDiff.oldThreshold && roleDiff.newThreshold && <ChangedBadge>Changed</ChangedBadge>}
                        </div>
                      </SideBySideCell>
                      <SideBySideCell>
                        {roleDiff.oldThreshold ? (
                          <>
                            <div>Threshold: <strong>{roleDiff.oldThreshold}</strong></div>
                            <div style={{ marginTop: '0.25rem' }}>
                              {roleDiff.removedKeyids.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  Keys:
                                  <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
                                    {roleDiff.removedKeyids.map(keyId => (
                                      <li key={keyId}>
                                        <KeyId>{truncateKeyId(keyId)}</KeyId> <RemovedBadge>Removed</RemovedBadge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div>Not present</div>
                        )}
                      </SideBySideCell>
                      <SideBySideCell>
                        {roleDiff.newThreshold !== undefined ? (
                          <div>
                            Threshold: {roleDiff.newThreshold}
                            {roleDiff.oldThreshold !== undefined && roleDiff.oldThreshold !== roleDiff.newThreshold && (
                              <ChangedBadge style={{ marginLeft: '0.5rem' }}>
                                {roleDiff.oldThreshold < roleDiff.newThreshold ? 'Increased' : 'Decreased'}
                              </ChangedBadge>
                            )}
                          </div>
                        ) : (
                          <div>Not present</div>
                        )}
                        {roleDiff.addedKeyids.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            Keys:
                            <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
                              {roleDiff.addedKeyids.map(keyId => (
                                <li key={keyId}>
                                  <KeyId>{truncateKeyId(keyId)}</KeyId> <AddedBadge>Added</AddedBadge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </SideBySideCell>
                    </tr>
                  ))}
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}

          {/* Signature changes if any */}
          {hasSignatureChanges && (
            <ComparisonSection>
              <ComparisonTitle>Signature Verification Status</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Verification</SideBySideHeaderProperty>
                    <SideBySideHeader>Version {diff.oldVersion}</SideBySideHeader>
                    <SideBySideHeader>Version {diff.newVersion}</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <SideBySideCell>
                      <strong>Overall Status</strong>
                    </SideBySideCell>
                    <SideBySideCell>
                      {diff.oldSignatureStatus && 
                        getVerificationStatus(
                          diff.oldSignatureStatus.signed, 
                          diff.oldSignatureStatus.required
                        )
                      }
                    </SideBySideCell>
                    <SideBySideCell>
                      {diff.newSignatureStatus && 
                        getVerificationStatus(
                          diff.newSignatureStatus.signed, 
                          diff.newSignatureStatus.required
                        )
                      }
                    </SideBySideCell>
                  </tr>
                  {diff.signatureDiffs.map(sigDiff => (
                    <tr key={sigDiff.keyid}>
                      <SideBySideCell>
                        <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                        <div style={{ marginTop: '0.25rem' }}>
                          {!sigDiff.oldSigned && sigDiff.newSigned && <AddedBadge>Added</AddedBadge>}
                          {sigDiff.oldSigned && !sigDiff.newSigned && <RemovedBadge>Removed</RemovedBadge>}
                          {sigDiff.oldSigned !== sigDiff.newSigned && <ChangedBadge>Changed</ChangedBadge>}
                        </div>
                      </SideBySideCell>
                      <SideBySideCell>
                        {sigDiff.oldSigned ? (
                          <div>
                            <VerifiedBadge>Signed</VerifiedBadge>
                          </div>
                        ) : (
                          <div>
                            <UnverifiedBadge>Unsigned</UnverifiedBadge>
                          </div>
                        )}
                      </SideBySideCell>
                      <SideBySideCell>
                        {sigDiff.newSigned ? (
                          <div>
                            <VerifiedBadge>Signed</VerifiedBadge>
                          </div>
                        ) : (
                          <div>
                            <UnverifiedBadge>Unsigned</UnverifiedBadge>
                          </div>
                        )}
                      </SideBySideCell>
                    </tr>
                  ))}
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}
        </SideBySideContainer>
      )}
      
      {/* Keys tab - simplified view with side-by-side comparison */}
      {activeTab === 'keys' && hasKeyChanges && (
        <SideBySideTable>
          <thead>
            <tr>
              <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
              <SideBySideHeader>Previous Version</SideBySideHeader>
              <SideBySideHeader>Current Version</SideBySideHeader>
            </tr>
          </thead>
          <tbody>
            {diff.keyDiffs.map(keyDiff => (
              <tr key={keyDiff.keyid}>
                <SideBySideCell>
                  <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                  <div style={{ marginTop: '0.25rem' }}>
                    Owner: {keyDiff.keyowner || 'Unknown'}
                  </div>
                  <div style={{ marginTop: '0.25rem' }}>
                    {keyDiff.status === 'added' && <AddedBadge>New key</AddedBadge>}
                    {keyDiff.status === 'removed' && <RemovedBadge>Removed key</RemovedBadge>}
                    {keyDiff.status === 'changed' && <ChangedBadge>Modified key</ChangedBadge>}
                  </div>
                </SideBySideCell>
                <SideBySideCell>
                  {keyDiff.status === 'removed' || keyDiff.status === 'changed' ? (
                    <div>Present</div>
                  ) : (
                    <div>Not present</div>
                  )}
                </SideBySideCell>
                <SideBySideCell>
                  {keyDiff.status === 'added' || keyDiff.status === 'changed' ? (
                    <div>Present</div>
                  ) : (
                    <div>Not present</div>
                  )}
                </SideBySideCell>
              </tr>
            ))}
          </tbody>
        </SideBySideTable>
      )}
      
      {/* Roles tab - detailed view with side-by-side comparison */}
      {activeTab === 'roles' && hasRoleChanges && (
        <SideBySideTable>
          <thead>
            <tr>
              <SideBySideHeaderProperty>Role</SideBySideHeaderProperty>
              <SideBySideHeader>Previous Version</SideBySideHeader>
              <SideBySideHeader>Current Version</SideBySideHeader>
            </tr>
          </thead>
          <tbody>
            {diff.roleDiffs.map(roleDiff => (
              <tr key={roleDiff.roleName}>
                <SideBySideCell>
                  <div><strong>{roleDiff.roleName}</strong></div>
                  <div style={{ marginTop: '0.5rem' }}>
                    {roleDiff.oldThreshold !== roleDiff.newThreshold && (
                      <ChangedBadge>Threshold Changed</ChangedBadge>
                    )}
                    {roleDiff.addedKeyids.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <AddedBadge>Keys Added</AddedBadge>
                      </div>
                    )}
                    {roleDiff.removedKeyids.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <RemovedBadge>Keys Removed</RemovedBadge>
                      </div>
                    )}
                    {!roleDiff.oldThreshold && roleDiff.newThreshold && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <AddedBadge>Role Added</AddedBadge>
                      </div>
                    )}
                    {roleDiff.oldThreshold && !roleDiff.newThreshold && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <RemovedBadge>Role Removed</RemovedBadge>
                      </div>
                    )}
                  </div>
                </SideBySideCell>
                <SideBySideCell>
                  {roleDiff.oldThreshold ? (
                    <>
                      <div>Threshold: <strong>{roleDiff.oldThreshold}</strong></div>
                      <div style={{ marginTop: '0.5rem' }}><strong>Keys:</strong></div>
                      {roleDiff.removedKeyids.length > 0 ? (
                        <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
                          {roleDiff.removedKeyids.map(keyId => (
                            <li key={keyId}>
                              <KeyId>{truncateKeyId(keyId)}</KeyId>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No removed keys</div>
                      )}
                    </>
                  ) : (
                    <div>Role not present</div>
                  )}
                </SideBySideCell>
                <SideBySideCell>
                  {roleDiff.newThreshold !== undefined ? (
                    <>
                      <div><strong>Threshold:</strong> {roleDiff.newThreshold}</div>
                      {roleDiff.oldThreshold !== undefined && roleDiff.oldThreshold !== roleDiff.newThreshold && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <ChangedBadge>
                            {roleDiff.oldThreshold < roleDiff.newThreshold ? 'Increased' : 'Decreased'} 
                            from {roleDiff.oldThreshold}
                          </ChangedBadge>
                        </div>
                      )}
                      <div style={{ marginTop: '0.5rem' }}><strong>Keys:</strong></div>
                      {roleDiff.addedKeyids.length > 0 ? (
                        <ul style={{ margin: '0.25rem 0 0 1.25rem' }}>
                          {roleDiff.addedKeyids.map(keyId => (
                            <li key={keyId}>
                              <KeyId>{truncateKeyId(keyId)}</KeyId>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div>No added keys</div>
                      )}
                    </>
                  ) : (
                    <div>Role not present</div>
                  )}
                </SideBySideCell>
              </tr>
            ))}
          </tbody>
        </SideBySideTable>
      )}
      
      {/* Signatures tab with side-by-side comparison */}
      {activeTab === 'signatures' && hasSignatureChanges && (
        <DiffTableContainer>
          {/* Display overall verification status */}
          <DiffSummary style={{ marginBottom: '1.5rem' }}>
            <DiffSummaryTitle>Signature Verification Status</DiffSummaryTitle>
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Version {diff.oldVersion}:</strong>{' '}
                {diff.oldSignatureStatus && 
                  getVerificationStatus(
                    diff.oldSignatureStatus.signed, 
                    diff.oldSignatureStatus.required
                  )
                }
              </div>
              <div>
                <strong>Version {diff.newVersion}:</strong>{' '}
                {diff.newSignatureStatus && 
                  getVerificationStatus(
                    diff.newSignatureStatus.signed, 
                    diff.newSignatureStatus.required
                  )
                }
              </div>
            </div>
          </DiffSummary>
          
          <SideBySideTable>
            <thead>
              <tr>
                <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
                <SideBySideHeader>Version {diff.oldVersion}</SideBySideHeader>
                <SideBySideHeader>Version {diff.newVersion}</SideBySideHeader>
              </tr>
            </thead>
            <tbody>
              {diff.signatureDiffs.map(sigDiff => (
                <tr key={sigDiff.keyid}>
                  <SideBySideCell>
                    <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                    <div style={{ marginTop: '0.25rem' }}>
                      {!sigDiff.oldSigned && sigDiff.newSigned && <AddedBadge>Added</AddedBadge>}
                      {sigDiff.oldSigned && !sigDiff.newSigned && <RemovedBadge>Removed</RemovedBadge>}
                      {sigDiff.oldSigned !== sigDiff.newSigned && <ChangedBadge>Changed</ChangedBadge>}
                    </div>
                  </SideBySideCell>
                  <SideBySideCell>
                    {sigDiff.oldSigned ? (
                      <div>
                        <VerifiedBadge>Signed</VerifiedBadge>
                      </div>
                    ) : (
                      <div>
                        <UnverifiedBadge>Unsigned</UnverifiedBadge>
                      </div>
                    )}
                  </SideBySideCell>
                  <SideBySideCell>
                    {sigDiff.newSigned ? (
                      <div>
                        <VerifiedBadge>Signed</VerifiedBadge>
                      </div>
                    ) : (
                      <div>
                        <UnverifiedBadge>Unsigned</UnverifiedBadge>
                      </div>
                    )}
                  </SideBySideCell>
                </tr>
              ))}
            </tbody>
          </SideBySideTable>
        </DiffTableContainer>
      )}
    </DiffTableContainer>
  );
} 