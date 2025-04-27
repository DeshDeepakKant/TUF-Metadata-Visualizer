'use client';

import React, { useState, useMemo } from 'react';
import { RootDiff, KeyDiff, RoleDiff, SignatureDiff } from '../utils/types';
import { truncateKeyId, formatExpirationDate, formatExpiryTimespan, areVersionsConsecutive } from '../utils/diffUtils';
import {
  DiffTableContainer,
  DiffTitle,
  DiffSelector,
  DiffSelectButton,
  KeyId,
  DiffSummary,
  DiffSummaryTitle,
  DiffSummaryItem,
  DiffSummaryLabel,
  EmptyState,
  ChangedBadge,
  AddedBadge,
  RemovedBadge,
  ComparisonSection,
  ComparisonTitle,
  VerifiedBadge,
  UnverifiedBadge
} from './RootDiff/styles';
import styled from 'styled-components';

// Additional styled components for the new UI
const ListContainer = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background-color: var(--background-subtle);
  border-radius: 4px;
`;

const ChangeList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const ChangeItem = styled.li`
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: var(--background);
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const RoleNameBadge = styled.span`
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  background-color: var(--info-light);
  color: var(--info);
  border-radius: 4px;
`;

const WarningMessage = styled.div`
  padding: 0.75rem;
  margin: 1rem 0;
  background-color: var(--warning-light);
  color: var(--warning);
  border-radius: 4px;
  font-weight: 500;
`;

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
  
  // Check if versions are consecutive
  const areConsecutive = useMemo(() => diff ? areVersionsConsecutive(diff.oldVersion, diff.newVersion) : true, [diff]);

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

  return (
    <DiffTableContainer>
      <DiffTitle>Root Metadata Diff (v{diff.oldVersion} → v{diff.newVersion})</DiffTitle>
      
      {/* Warning for non-consecutive versions */}
      {!areConsecutive && (
        <WarningMessage>
          Warning: Root versions are not consecutive. According to the TUF specification, valid updates must be from version N to N+1.
        </WarningMessage>
      )}
      
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
            {formatExpiryTimespan(diff.newExpires)}
            {hasExpiryChange && <ChangedBadge style={{ marginLeft: '0.5rem' }}>
              {new Date(diff.oldExpires) < new Date(diff.newExpires) ? 'Extended' : 'Reduced'}
            </ChangedBadge>}
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
      
      {/* Summary tab - Concise overview of all changes */}
      {activeTab === 'summary' && (
        <>
          {/* Key changes list */}
          {hasKeyChanges && (
            <ComparisonSection>
              <ComparisonTitle>Key Changes</ComparisonTitle>
              <ListContainer>
                <ChangeList>
                  {diff.keyDiffs.map(keyDiff => (
                    <ChangeItem key={keyDiff.keyid}>
                      {keyDiff.status === 'added' && (
                        <AddedBadge>Added</AddedBadge>
                      )}
                      {keyDiff.status === 'removed' && (
                        <RemovedBadge>Removed</RemovedBadge>
                      )}
                      {keyDiff.status === 'changed' && (
                        <ChangedBadge>Changed</ChangedBadge>
                      )}
                      <div>
                        Key <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                        {keyDiff.keyowner && (
                          <span style={{ marginLeft: '0.5rem' }}>({keyDiff.keyowner})</span>
                        )}
                      </div>
                    </ChangeItem>
                  ))}
                </ChangeList>
              </ListContainer>
            </ComparisonSection>
          )}

          {/* Role changes list */}
          {hasRoleChanges && (
            <ComparisonSection>
              <ComparisonTitle>Role Changes</ComparisonTitle>
              <ListContainer>
                <ChangeList>
                  {diff.roleDiffs.map(roleDiff => (
                    <ChangeItem key={roleDiff.roleName}>
                      <RoleNameBadge>{roleDiff.roleName}</RoleNameBadge>
                      <div style={{ flex: 1 }}>
                        {/* Threshold changes */}
                        {roleDiff.oldThreshold !== undefined && roleDiff.newThreshold !== undefined && 
                          roleDiff.oldThreshold !== roleDiff.newThreshold && (
                          <div>
                            Threshold: {roleDiff.oldThreshold} → {roleDiff.newThreshold}
                          </div>
                        )}
                        
                        {/* Added role */}
                        {roleDiff.oldThreshold === undefined && roleDiff.newThreshold !== undefined && (
                          <div>
                            Role added with threshold: {roleDiff.newThreshold}
                          </div>
                        )}
                        
                        {/* Removed role */}
                        {roleDiff.oldThreshold !== undefined && roleDiff.newThreshold === undefined && (
                          <div>
                            Role removed (had threshold: {roleDiff.oldThreshold})
                          </div>
                        )}
                        
                        {/* Key changes */}
                        {roleDiff.addedKeyids.length > 0 && (
                          <div style={{ marginTop: '0.25rem' }}>
                            Added keys: {roleDiff.addedKeyids.map(keyId => (
                              <KeyId key={keyId} style={{ marginRight: '0.25rem' }}>
                                {truncateKeyId(keyId)}
                              </KeyId>
                            ))}
                          </div>
                        )}
                        
                        {roleDiff.removedKeyids.length > 0 && (
                          <div style={{ marginTop: '0.25rem' }}>
                            Removed keys: {roleDiff.removedKeyids.map(keyId => (
                              <KeyId key={keyId} style={{ marginRight: '0.25rem' }}>
                                {truncateKeyId(keyId)}
                              </KeyId>
                            ))}
                          </div>
                        )}
                      </div>
                    </ChangeItem>
                  ))}
                </ChangeList>
              </ListContainer>
            </ComparisonSection>
          )}

          {/* Signature changes list */}
          {hasSignatureChanges && (
            <ComparisonSection>
              <ComparisonTitle>Signature Changes</ComparisonTitle>
              <ListContainer>
                <ChangeList>
                  {/* Group signatures by their change type */}
                  {diff.signatureDiffs.some(sig => !sig.oldSigned && sig.newSigned) && (
                    <ChangeItem>
                      <AddedBadge>Added</AddedBadge>
                      <div>
                        New signatures from keys: {diff.signatureDiffs
                          .filter(sig => !sig.oldSigned && sig.newSigned)
                          .map(sig => (
                            <KeyId key={sig.keyid} style={{ marginRight: '0.25rem' }}>
                              {truncateKeyId(sig.keyid)}
                              {sig.keyowner && ` (${sig.keyowner})`}
                            </KeyId>
                          ))}
                      </div>
                    </ChangeItem>
                  )}
                  
                  {diff.signatureDiffs.some(sig => sig.oldSigned && !sig.newSigned) && (
                    <ChangeItem>
                      <RemovedBadge>Removed</RemovedBadge>
                      <div>
                        No more signatures from keys: {diff.signatureDiffs
                          .filter(sig => sig.oldSigned && !sig.newSigned)
                          .map(sig => (
                            <KeyId key={sig.keyid} style={{ marginRight: '0.25rem' }}>
                              {truncateKeyId(sig.keyid)}
                              {sig.keyowner && ` (${sig.keyowner})`}
                            </KeyId>
                          ))}
                      </div>
                    </ChangeItem>
                  )}
                </ChangeList>
              </ListContainer>
            </ComparisonSection>
          )}
        </>
      )}

      {/* Keys tab - Detailed view */}
      {activeTab === 'keys' && hasKeyChanges && (
        <ComparisonSection>
          <ListContainer>
            <ChangeList>
              {diff.keyDiffs.map(keyDiff => (
                <ChangeItem key={keyDiff.keyid}>
                  {keyDiff.status === 'added' && (
                    <AddedBadge>Added</AddedBadge>
                  )}
                  {keyDiff.status === 'removed' && (
                    <RemovedBadge>Removed</RemovedBadge>
                  )}
                  {keyDiff.status === 'changed' && (
                    <ChangedBadge>Changed</ChangedBadge>
                  )}
                  <div>
                    <div>
                      Key <KeyId>{truncateKeyId(keyDiff.keyid)}</KeyId>
                      {keyDiff.keyowner && (
                        <span style={{ marginLeft: '0.5rem' }}>({keyDiff.keyowner})</span>
                      )}
                    </div>
                    
                    {keyDiff.status === 'changed' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {keyDiff.oldKeytype !== keyDiff.keytype && (
                          <div>
                            Key type: {keyDiff.oldKeytype} → {keyDiff.keytype}
                          </div>
                        )}
                        {keyDiff.oldScheme !== keyDiff.scheme && (
                          <div>
                            Scheme: {keyDiff.oldScheme} → {keyDiff.scheme}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {keyDiff.status === 'added' && keyDiff.keytype && keyDiff.scheme && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div>Type: {keyDiff.keytype}</div>
                        <div>Scheme: {keyDiff.scheme}</div>
                      </div>
                    )}
                    
                    {keyDiff.status === 'removed' && keyDiff.oldKeytype && keyDiff.oldScheme && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div>Type: {keyDiff.oldKeytype}</div>
                        <div>Scheme: {keyDiff.oldScheme}</div>
                      </div>
                    )}
                  </div>
                </ChangeItem>
              ))}
            </ChangeList>
          </ListContainer>
        </ComparisonSection>
      )}
      
      {/* Roles tab - Detailed view */}
      {activeTab === 'roles' && hasRoleChanges && (
        <ComparisonSection>
          <ListContainer>
            <ChangeList>
              {diff.roleDiffs.map(roleDiff => (
                <ChangeItem key={roleDiff.roleName}>
                  <RoleNameBadge>{roleDiff.roleName}</RoleNameBadge>
                  <div style={{ flex: 1 }}>
                    {/* Role status */}
                    {!roleDiff.oldThreshold && roleDiff.newThreshold && (
                      <div><AddedBadge>New Role</AddedBadge></div>
                    )}
                    
                    {roleDiff.oldThreshold && !roleDiff.newThreshold && (
                      <div><RemovedBadge>Removed Role</RemovedBadge></div>
                    )}
                    
                    {/* Threshold changes */}
                    {roleDiff.oldThreshold !== undefined && roleDiff.newThreshold !== undefined && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div>
                          Threshold: {roleDiff.oldThreshold} → {roleDiff.newThreshold}
                          {roleDiff.oldThreshold !== roleDiff.newThreshold && (
                            <ChangedBadge style={{ marginLeft: '0.5rem' }}>
                              {roleDiff.oldThreshold < roleDiff.newThreshold ? 'Increased' : 'Decreased'}
                            </ChangedBadge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Added keys */}
                    {roleDiff.addedKeyids.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontWeight: '500' }}>Added keys:</div>
                        <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                          {roleDiff.addedKeyids.map(keyId => (
                            <li key={keyId}>
                              <KeyId>{truncateKeyId(keyId)}</KeyId>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Removed keys */}
                    {roleDiff.removedKeyids.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontWeight: '500' }}>Removed keys:</div>
                        <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                          {roleDiff.removedKeyids.map(keyId => (
                            <li key={keyId}>
                              <KeyId>{truncateKeyId(keyId)}</KeyId>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ChangeItem>
              ))}
            </ChangeList>
          </ListContainer>
        </ComparisonSection>
      )}

      {/* Signatures tab - Detailed view */}
      {activeTab === 'signatures' && hasSignatureChanges && (
        <ComparisonSection>
          <ListContainer>
            <ChangeList>
              {diff.signatureDiffs.map(sigDiff => (
                <ChangeItem key={sigDiff.keyid}>
                  {!sigDiff.oldSigned && sigDiff.newSigned && (
                    <AddedBadge>Added</AddedBadge>
                  )}
                  {sigDiff.oldSigned && !sigDiff.newSigned && (
                    <RemovedBadge>Removed</RemovedBadge>
                  )}
                  <div>
                    <KeyId>{truncateKeyId(sigDiff.keyid)}</KeyId>
                    {sigDiff.keyowner && (
                      <span style={{ marginLeft: '0.5rem' }}>({sigDiff.keyowner})</span>
                    )}
                    <div style={{ marginTop: '0.25rem' }}>
                      {sigDiff.oldSigned ? (
                        <VerifiedBadge style={{ marginRight: '0.5rem' }}>Previously signed</VerifiedBadge>
                      ) : (
                        <UnverifiedBadge style={{ marginRight: '0.5rem' }}>Previously unsigned</UnverifiedBadge>
                      )}
                      →
                      {sigDiff.newSigned ? (
                        <VerifiedBadge style={{ marginLeft: '0.5rem' }}>Now signed</VerifiedBadge>
                      ) : (
                        <UnverifiedBadge style={{ marginLeft: '0.5rem' }}>Now unsigned</UnverifiedBadge>
                      )}
                    </div>
                  </div>
                </ChangeItem>
              ))}
            </ChangeList>
          </ListContainer>
        </ComparisonSection>
      )}
    </DiffTableContainer>
  );
} 