'use client';

import React, { useState, useMemo } from 'react';
import { RootDiff, KeyDiff, RoleDiff, SignatureDiff } from '../utils/types';
import { truncateKeyId, formatExpirationDate } from '../utils/diffUtils';
import {
  DiffTableContainer,
  DiffTitle,
  DiffSelector,
  DiffSelectButton,
  DiffTable,
  DiffTableHeader,
  DiffTableRow,
  DiffTableCell,
  SideBySideContainer,
  SideBySideTable,
  SideBySideHeader,
  SideBySideHeaderProperty,
  SideBySideCell,
  ComparisonSection,
  ComparisonTitle,
  AddedBadge,
  RemovedBadge,
  ChangedBadge,
  KeyId,
  VerifiedBadge,
  UnverifiedBadge,
  DiffSummary,
  DiffSummaryTitle,
  DiffSummaryItem,
  DiffSummaryLabel,
  EmptyState
} from './RootDiff/styles';

interface RootDiffTableProps {
  diff: RootDiff | null;
  loading?: boolean;
}

type TabType = 'summary' | 'keys' | 'roles' | 'signatures';

export default function RootDiffTable({ diff, loading = false }: RootDiffTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  // Memoize computed values with null checks
  const hasVersionChange = useMemo(() => diff?.oldVersion !== diff?.newVersion, [diff]);
  const hasExpiryChange = useMemo(() => diff?.oldExpires !== diff?.newExpires, [diff]);
  const hasKeyChanges = useMemo(() => (diff?.keyDiffs?.length ?? 0) > 0, [diff]);
  const hasRoleChanges = useMemo(() => (diff?.roleDiffs?.length ?? 0) > 0, [diff]);
  const hasSignatureChanges = useMemo(() => (diff?.signatureDiffs?.length ?? 0) > 0, [diff]);

  const keysCount = useMemo(() => hasKeyChanges ? (diff?.keyDiffs?.length ?? 0) : 0, [hasKeyChanges, diff]);
  const rolesCount = useMemo(() => hasRoleChanges ? (diff?.roleDiffs?.length ?? 0) : 0, [hasRoleChanges, diff]);
  const signaturesCount = useMemo(() => hasSignatureChanges ? (diff?.signatureDiffs?.length ?? 0) : 0, [hasSignatureChanges, diff]);

  if (loading) {
    return (
      <DiffTableContainer>
        <EmptyState>
          <p>Loading diff...</p>
        </EmptyState>
      </DiffTableContainer>
    );
  }

  if (!diff) {
    return (
      <DiffTableContainer>
        <EmptyState>
          <p>No diff data available.</p>
        </EmptyState>
      </DiffTableContainer>
    );
  }

  // Calculate time difference between expiry dates
  const oldExpiryDate = new Date(diff.oldExpires);
  const newExpiryDate = new Date(diff.newExpires);
  const expiryChangeText = oldExpiryDate < newExpiryDate ? 'Extended' : 'Reduced';

  return (
    <DiffTableContainer>
      <DiffTitle>Root Metadata Diff (v{diff.oldVersion} → v{diff.newVersion})</DiffTitle>
      
      {/* Summary information */}
      <DiffSummary>
        <DiffSummaryTitle>Root Metadata Changes</DiffSummaryTitle>
        <DiffSummaryItem>
          <DiffSummaryLabel>Version:</DiffSummaryLabel>
          <span>
            {diff.oldVersion} → {diff.newVersion}
            {hasVersionChange && <ChangedBadge style={{ marginLeft: '0.5rem' }}>Changed</ChangedBadge>}
          </span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Expiry:</DiffSummaryLabel>
          <span>
            {formatExpirationDate(diff.oldExpires)} → {formatExpirationDate(diff.newExpires)}
            {hasExpiryChange && <ChangedBadge style={{ marginLeft: '0.5rem' }}>{expiryChangeText}</ChangedBadge>}
          </span>
        </DiffSummaryItem>
        <DiffSummaryItem>
          <DiffSummaryLabel>Changes:</DiffSummaryLabel>
          <span>
            {keysCount} key{keysCount !== 1 ? 's' : ''}, {rolesCount} role{rolesCount !== 1 ? 's' : ''}, {signaturesCount} signature{signaturesCount !== 1 ? 's' : ''}
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
      {!hasKeyChanges && !hasRoleChanges && !hasSignatureChanges && (
        <EmptyState>
          <p>No changes detected between these versions besides version number and expiry date.</p>
        </EmptyState>
      )}
      
      {/* Overview tab with side-by-side comparison */}
      {activeTab === 'summary' && (
        <SideBySideContainer>
          {/* Version and expiration summary */}
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
                    {hasExpiryChange && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <ChangedBadge>{expiryChangeText}</ChangedBadge>
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
        </SideBySideContainer>
      )}

      {/* Signatures tab - detailed view */}
      {activeTab === 'signatures' && hasSignatureChanges && diff?.signatureDiffs && (
        <SideBySideContainer>
          <ComparisonSection>
            <ComparisonTitle>Signature Changes</ComparisonTitle>
            <SideBySideTable>
              <thead>
                <tr>
                  <SideBySideHeaderProperty>Key ID</SideBySideHeaderProperty>
                  <SideBySideHeader>Previous Version</SideBySideHeader>
                  <SideBySideHeader>Current Version</SideBySideHeader>
                </tr>
              </thead>
              <tbody>
                {diff.signatureDiffs.map(sigDiff => (
                  <tr key={sigDiff.keyid}>
                    <SideBySideCell>
                      <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                      <div style={{ marginTop: '0.25rem' }}>
                        {sigDiff.keyowner || 'Unknown'}
                      </div>
                    </SideBySideCell>
                    <SideBySideCell>
                      {sigDiff.oldSigned ? (
                        <VerifiedBadge>Signed</VerifiedBadge>
                      ) : (
                        <UnverifiedBadge>Unsigned</UnverifiedBadge>
                      )}
                    </SideBySideCell>
                    <SideBySideCell>
                      {sigDiff.newSigned ? (
                        <VerifiedBadge>Signed</VerifiedBadge>
                      ) : (
                        <UnverifiedBadge>Unsigned</UnverifiedBadge>
                      )}
                    </SideBySideCell>
                  </tr>
                ))}
              </tbody>
            </SideBySideTable>
          </ComparisonSection>
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
    </DiffTableContainer>
  );
} 