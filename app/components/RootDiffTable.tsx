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

// Add these new components to the styled components section
const SignatureStatusBadge = styled.div`
  padding: 0.5rem;
  border-radius: 4px;
  background-color: var(--background-subtle);
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

const VerifiedBadge = styled.span`
  color: var(--success);
  font-weight: 500;
`;

const NotVerifiedBadge = styled.span`
  color: var(--error);
  font-weight: 500;
`;

const KeyCount = styled.span`
  background-color: var(--background-subtle);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-left: 0.5rem;
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
      
      {/* Overview tab with side-by-side comparison */}
      {activeTab === 'overview' && hasAnyChanges && (
        <SideBySideContainer>
          {/* Side-by-side overview */}
          <SideBySideTable>
            <thead>
              <tr>
                <SideBySideHeaderProperty>Property</SideBySideHeaderProperty>
                <SideBySideHeader>Changes</SideBySideHeader>
              </tr>
            </thead>
            <tbody>
              {/* Only show version change if it's unexpected (more than +1) */}
              {diff.newVersion - diff.oldVersion > 1 && (
                <tr>
                  <SideBySideCell>Version</SideBySideCell>
                  <SideBySideCell>
                    <ChangedBadge>Unexpected Version Jump</ChangedBadge>
                    {diff.oldVersion} → {diff.newVersion} 
                    (Expected: {diff.oldVersion + 1})
                  </SideBySideCell>
                </tr>
              )}
              <tr>
                <SideBySideCell>Expires</SideBySideCell>
                <SideBySideCell>
                  {expiryDiffDays !== 0 ? (
                    <>
                      {expiryDiffDays > 0 ? (
                        <AddedBadge>Extended by {expiryDiffDays} days</AddedBadge>
                      ) : (
                        <RemovedBadge>Shortened by {Math.abs(expiryDiffDays)} days</RemovedBadge>
                      )}
                      <div style={{ marginTop: '0.25rem' }}>
                        {formatExpirationDate(diff.oldExpires)} → {formatExpirationDate(diff.newExpires)}
                      </div>
                    </>
                  ) : (
                    'No change'
                  )}
                </SideBySideCell>
              </tr>
            </tbody>
          </SideBySideTable>

          {/* Key changes if any - simplified */}
          {hasKeyChanges && (
            <ComparisonSection>
              <ComparisonTitle>Key Changes</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
                    <SideBySideHeader>Changes</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.keyDiffs.map(keyDiff => (
                    <tr key={keyDiff.keyid}>
                      <SideBySideCell>
                        <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                        {keyDiff.keyowner && (
                          <div style={{ marginTop: '0.25rem' }}>
                            {keyDiff.keyowner}
                          </div>
                        )}
                      </SideBySideCell>
                      <SideBySideCell>
                        <div>
                          {keyDiff.status === 'added' && (
                            <AddedBadge>Added</AddedBadge>
                          )}
                          {keyDiff.status === 'removed' && (
                            <RemovedBadge>Removed</RemovedBadge>
                          )}
                          {keyDiff.status === 'changed' && (
                            <ChangedBadge>Changed</ChangedBadge>
                          )}
                        </div>
                        
                        {keyDiff.status === 'changed' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            {keyDiff.oldKeytype !== keyDiff.keytype && (
                              <div>Key type changed: {keyDiff.oldKeytype} → {keyDiff.keytype}</div>
                            )}
                            {keyDiff.oldScheme !== keyDiff.scheme && (
                              <div>Scheme changed: {keyDiff.oldScheme} → {keyDiff.scheme}</div>
                            )}
                          </div>
                        )}
                      </SideBySideCell>
                    </tr>
                  ))}
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}

          {/* Role changes if any - simplified */}
          {hasRoleChanges && (
            <ComparisonSection>
              <ComparisonTitle>Role Changes</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Role</SideBySideHeaderProperty>
                    <SideBySideHeader>Changes</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  {diff.roleDiffs.map(roleDiff => (
                    <tr key={roleDiff.roleName}>
                      <SideBySideCell>
                        <div>{roleDiff.roleName}</div>
                      </SideBySideCell>
                      <SideBySideCell>
                        {/* Threshold changes */}
                        {roleDiff.oldThreshold !== undefined && 
                         roleDiff.newThreshold !== undefined && 
                         roleDiff.oldThreshold !== roleDiff.newThreshold && (
                          <div>
                            <ChangedBadge>Threshold Change</ChangedBadge> {roleDiff.oldThreshold} → {roleDiff.newThreshold}
                            {roleDiff.oldThreshold < roleDiff.newThreshold ? (
                              <div style={{ marginTop: '0.25rem' }}>Security increased: requires more signatures</div>
                            ) : (
                              <div style={{ marginTop: '0.25rem' }}>Security reduced: requires fewer signatures</div>
                            )}
                          </div>
                        )}
                        
                        {/* Key changes summary */}
                        {(roleDiff.addedKeyids.length > 0 || roleDiff.removedKeyids.length > 0) && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <strong>Key Changes:</strong>
                            
                            {roleDiff.addedKeyids.length > 0 && (
                              <div style={{ marginTop: '0.25rem' }}>
                                <AddedBadge>Added</AddedBadge> {roleDiff.addedKeyids.length} key(s)
                                
                                {roleDiff.addedKeyids.length <= 5 && (
                                  <ul style={{ margin: '0.25rem 0 0 1rem' }}>
                                    {roleDiff.addedKeyids.map(keyId => (
                                      <li key={keyId}>
                                        <KeyId>{truncateKeyId(keyId)}</KeyId>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                            
                            {roleDiff.removedKeyids.length > 0 && (
                              <div style={{ marginTop: '0.25rem' }}>
                                <RemovedBadge>Removed</RemovedBadge> {roleDiff.removedKeyids.length} key(s)
                                
                                {roleDiff.removedKeyids.length <= 5 && (
                                  <ul style={{ margin: '0.25rem 0 0 1rem' }}>
                                    {roleDiff.removedKeyids.map(keyId => (
                                      <li key={keyId}>
                                        <KeyId>{truncateKeyId(keyId)}</KeyId>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {roleDiff.oldThreshold === roleDiff.newThreshold && 
                         roleDiff.addedKeyids.length === 0 && 
                         roleDiff.removedKeyids.length === 0 && (
                          <div>No significant changes</div>
                        )}
                      </SideBySideCell>
                    </tr>
                  ))}
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}

          {/* Signature changes if any - simplified */}
          {hasSignatureChanges && (
            <ComparisonSection>
              <ComparisonTitle>Signature Changes</ComparisonTitle>
              <SideBySideTable>
                <thead>
                  <tr>
                    <SideBySideHeaderProperty>Role</SideBySideHeaderProperty>
                    <SideBySideHeader>Signature Status</SideBySideHeader>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <SideBySideCell>Root</SideBySideCell>
                    <SideBySideCell>
                      {(() => {
                        const oldSignedCount = diff.signatureDiffs.filter(s => s.oldSigned).length;
                        const newSignedCount = diff.signatureDiffs.filter(s => s.newSigned).length;
                        const totalSigCount = Array.from(new Set([
                          ...diff.signatureDiffs.map(s => s.keyid)
                        ])).length;
                        const rootRole = diff.roleDiffs.find(r => r.roleName === 'root');
                        const oldThreshold = rootRole?.oldThreshold ?? 3;
                        const newThreshold = rootRole?.newThreshold ?? 3;
                        
                        return (
                          <>
                            <div>
                              <strong>Verification Status:</strong>
                              <div style={{ marginTop: '0.25rem' }}>
                                Old version: 
                                {oldSignedCount >= oldThreshold ? (
                                  <VerifiedBadge> ✓ Verified</VerifiedBadge>
                                ) : (
                                  <NotVerifiedBadge> ✗ Not Verified</NotVerifiedBadge>
                                )}
                              </div>
                              <div style={{ marginTop: '0.25rem' }}>
                                New version: 
                                {newSignedCount >= newThreshold ? (
                                  <VerifiedBadge> ✓ Verified</VerifiedBadge>
                                ) : (
                                  <NotVerifiedBadge> ✗ Not Verified</NotVerifiedBadge>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ marginTop: '0.75rem' }}>
                              <strong>Signature Summary:</strong>
                              <SignatureStatusBadge style={{ display: 'block', marginTop: '0.5rem' }}>
                                Old version: signed by {oldSignedCount} out of {oldThreshold} required signers 
                                ({totalSigCount} total keys)
                              </SignatureStatusBadge>
                              <SignatureStatusBadge style={{ display: 'block', marginTop: '0.5rem' }}>
                                New version: signed by {newSignedCount} out of {newThreshold} required signers 
                                ({totalSigCount} total keys)
                              </SignatureStatusBadge>
                            </div>
                            
                            <div style={{ marginTop: '0.75rem' }}>
                              <strong>Individual Changes:</strong>
                              <table style={{ width: '100%', marginTop: '0.5rem', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                      Key ID
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                      Change
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {diff.signatureDiffs.map(sigDiff => (
                                    <tr key={sigDiff.keyid}>
                                      <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                        <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                                        {sigDiff.keyowner && <div>{sigDiff.keyowner}</div>}
                                      </td>
                                      <td style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                        {!sigDiff.oldSigned && sigDiff.newSigned && (
                                          <AddedBadge>Newly Signed</AddedBadge>
                                        )}
                                        {sigDiff.oldSigned && !sigDiff.newSigned && (
                                          <RemovedBadge>Signature Removed</RemovedBadge>
                                        )}
                                        {sigDiff.oldSigned && sigDiff.newSigned && (
                                          <span>No change</span>
                                        )}
                                        {!sigDiff.oldSigned && !sigDiff.newSigned && (
                                          <span>Unsigned in both versions</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        );
                      })()}
                    </SideBySideCell>
                  </tr>
                </tbody>
              </SideBySideTable>
            </ComparisonSection>
          )}
        </SideBySideContainer>
      )}
      
      {/* Keys tab - detailed view with side-by-side comparison */}
      {activeTab === 'keys' && hasKeyChanges && (
        <SideBySideTable>
          <thead>
            <tr>
              <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
              <SideBySideHeader>Changes</SideBySideHeader>
            </tr>
          </thead>
          <tbody>
            {diff.keyDiffs.map(keyDiff => (
              <tr key={keyDiff.keyid}>
                <SideBySideCell>
                  <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                  {keyDiff.keyowner && (
                    <div style={{ marginTop: '0.25rem' }}>
                      {keyDiff.keyowner}
                    </div>
                  )}
                </SideBySideCell>
                <SideBySideCell>
                  <div>
                    {keyDiff.status === 'added' && (
                      <AddedBadge>Added</AddedBadge>
                    )}
                    {keyDiff.status === 'removed' && (
                      <RemovedBadge>Removed</RemovedBadge>
                    )}
                    {keyDiff.status === 'changed' && (
                      <ChangedBadge>Changed</ChangedBadge>
                    )}
                  </div>
                  
                  {keyDiff.status === 'changed' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {keyDiff.oldKeytype !== keyDiff.keytype && (
                        <div>Key type changed: {keyDiff.oldKeytype} → {keyDiff.keytype}</div>
                      )}
                      {keyDiff.oldScheme !== keyDiff.scheme && (
                        <div>Scheme changed: {keyDiff.oldScheme} → {keyDiff.scheme}</div>
                      )}
                    </div>
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
              <SideBySideHeader>Changes</SideBySideHeader>
            </tr>
          </thead>
          <tbody>
            {diff.roleDiffs.map(roleDiff => (
              <tr key={roleDiff.roleName}>
                <SideBySideCell>
                  <div>{roleDiff.roleName}</div>
                </SideBySideCell>
                <SideBySideCell>
                  {/* Threshold changes */}
                  {roleDiff.oldThreshold !== undefined && 
                   roleDiff.newThreshold !== undefined && 
                   roleDiff.oldThreshold !== roleDiff.newThreshold && (
                    <div>
                      <ChangedBadge>Threshold Change</ChangedBadge> {roleDiff.oldThreshold} → {roleDiff.newThreshold}
                      {roleDiff.oldThreshold < roleDiff.newThreshold ? (
                        <div style={{ marginTop: '0.25rem' }}>Security increased: requires more signatures</div>
                      ) : (
                        <div style={{ marginTop: '0.25rem' }}>Security reduced: requires fewer signatures</div>
                      )}
                    </div>
                  )}
                  
                  {/* Key changes summary */}
                  {(roleDiff.addedKeyids.length > 0 || roleDiff.removedKeyids.length > 0) && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Key Changes:</strong>
                      
                      {roleDiff.addedKeyids.length > 0 && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <AddedBadge>Added</AddedBadge> {roleDiff.addedKeyids.length} key(s)
                          
                          {roleDiff.addedKeyids.length <= 5 && (
                            <ul style={{ margin: '0.25rem 0 0 1rem' }}>
                              {roleDiff.addedKeyids.map(keyId => (
                                <li key={keyId}>
                                  <KeyId>{truncateKeyId(keyId)}</KeyId>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      {roleDiff.removedKeyids.length > 0 && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <RemovedBadge>Removed</RemovedBadge> {roleDiff.removedKeyids.length} key(s)
                          
                          {roleDiff.removedKeyids.length <= 5 && (
                            <ul style={{ margin: '0.25rem 0 0 1rem' }}>
                              {roleDiff.removedKeyids.map(keyId => (
                                <li key={keyId}>
                                  <KeyId>{truncateKeyId(keyId)}</KeyId>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {roleDiff.oldThreshold === roleDiff.newThreshold && 
                   roleDiff.addedKeyids.length === 0 && 
                   roleDiff.removedKeyids.length === 0 && (
                    <div>No significant changes</div>
                  )}
                </SideBySideCell>
              </tr>
            ))}
          </tbody>
        </SideBySideTable>
      )}
      
      {/* Signatures tab - detailed view with side-by-side comparison */}
      {activeTab === 'signatures' && hasSignatureChanges && (
        <SideBySideTable>
          <thead>
            <tr>
              <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
              <SideBySideHeader>Changes</SideBySideHeader>
            </tr>
          </thead>
          <tbody>
            {diff.signatureDiffs.map(sigDiff => (
              <tr key={sigDiff.keyid}>
                <SideBySideCell>
                  <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                  <div style={{ marginTop: '0.25rem' }}>
                    Owner: {sigDiff.keyowner || 'Unknown'}
                  </div>
                </SideBySideCell>
                <SideBySideCell>
                  {sigDiff.oldSigned ? (
                    <AddedBadge>Signed</AddedBadge>
                  ) : (
                    <RemovedBadge>Unsigned</RemovedBadge>
                  )}
                </SideBySideCell>
                <SideBySideCell>
                  {sigDiff.newSigned ? (
                    <AddedBadge>Signed</AddedBadge>
                  ) : (
                    <RemovedBadge>Unsigned</RemovedBadge>
                  )}
                </SideBySideCell>
              </tr>
            ))}
          </tbody>
        </SideBySideTable>
      )}
    </DiffTableContainer>
  );
} 