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

  // Calculate time difference for expiry
  const formatExpiryDifference = useMemo(() => {
    if (!diff) return '';
    
    const oldDate = new Date(diff.oldExpires);
    const newDate = new Date(diff.newExpires);
    
    // Calculate difference in months
    const diffMs = newDate.getTime() - new Date().getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    let expiryText = 'expires in ';
    if (years > 0) {
      expiryText += `${years} year${years !== 1 ? 's' : ''}`;
      if (months > 0) {
        expiryText += ` and ${months} month${months !== 1 ? 's' : ''}`;
      }
    } else if (months > 0) {
      expiryText += `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      expiryText += `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    expiryText += ` (${formatExpirationDate(diff.newExpires)})`;
    return expiryText;
  }, [diff]);

  // Check if version jump is more than 1 (warning case)
  const hasVersionJumpWarning = useMemo(() => {
    if (!diff) return false;
    return Math.abs(diff.newVersion - diff.oldVersion) > 1;
  }, [diff]);

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

  // Group key diffs by status
  const addedKeys = diff.keyDiffs.filter(key => key.status === 'added');
  const removedKeys = diff.keyDiffs.filter(key => key.status === 'removed');
  const changedKeys = diff.keyDiffs.filter(key => key.status === 'changed');

  // Group signatures by change type
  const addedSignatures = diff.signatureDiffs.filter(sig => !sig.oldSigned && sig.newSigned);
  const removedSignatures = diff.signatureDiffs.filter(sig => sig.oldSigned && !sig.newSigned);

  return (
    <DiffTableContainer>
      <DiffTitle>Root Metadata Diff (v{diff.oldVersion} → v{diff.newVersion})</DiffTitle>
      
      {/* Summary information */}
      <DiffSummary>
        <DiffSummaryTitle>Root Metadata Changes</DiffSummaryTitle>
        {hasVersionJumpWarning && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#fff3cd', 
            color: '#856404', 
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            <strong>Warning:</strong> Version jump greater than 1 detected. This would not be a valid metadata update in a TUF client.
          </div>
        )}
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
            {formatExpiryDifference}
            {hasExpiryChange && (
              <ChangedBadge style={{ marginLeft: '0.5rem' }}>
                {new Date(diff.oldExpires) < new Date(diff.newExpires) ? 'Extended' : 'Reduced'}
              </ChangedBadge>
            )}
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
      
      {/* Overview tab with simplified enumeration of changes */}
      {activeTab === 'summary' && (
        <div>
          {/* No more Version Information table as it's redundant */}
          
          {/* Key changes if any */}
          {hasKeyChanges && (
            <ComparisonSection>
              <ComparisonTitle>Key Changes</ComparisonTitle>
              <ul style={{ padding: '0', margin: '0', listStyle: 'none' }}>
                {addedKeys.length > 0 && (
                  <>
                    <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Added keys:</li>
                    {addedKeys.map(key => (
                      <li key={`added-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                        <KeyId>{truncateKeyId(key.keyid)}</KeyId> 
                        {key.keytype && <span style={{ marginLeft: '0.5rem', color: '#666' }}>{key.keytype}</span>}
                        {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                      </li>
                    ))}
                  </>
                )}
                
                {removedKeys.length > 0 && (
                  <>
                    <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Removed keys:</li>
                    {removedKeys.map(key => (
                      <li key={`removed-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                        <KeyId>{truncateKeyId(key.keyid)}</KeyId>
                        {key.oldKeytype && <span style={{ marginLeft: '0.5rem', color: '#666' }}>{key.oldKeytype}</span>}
                        {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                      </li>
                    ))}
                  </>
                )}
                
                {changedKeys.length > 0 && (
                  <>
                    <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Changed keys:</li>
                    {changedKeys.map(key => (
                      <li key={`changed-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                        <KeyId>{truncateKeyId(key.keyid)}</KeyId>
                        {key.oldKeytype && key.keytype && key.oldKeytype !== key.keytype && (
                          <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                            Type: {key.oldKeytype} → {key.keytype}
                          </span>
                        )}
                        {key.oldScheme && key.scheme && key.oldScheme !== key.scheme && (
                          <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                            Scheme: {key.oldScheme} → {key.scheme}
                          </span>
                        )}
                        {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </ComparisonSection>
          )}

          {/* Role changes if any */}
          {hasRoleChanges && (
            <ComparisonSection>
              <ComparisonTitle>Role Changes</ComparisonTitle>
              {diff.roleDiffs.map(role => (
                <div key={`role-${role.roleName}`} style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{role.roleName}</h4>
                  <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                    {role.oldThreshold !== undefined && role.newThreshold !== undefined && role.oldThreshold !== role.newThreshold && (
                      <li style={{ margin: '0.25rem 0' }}>
                        Threshold: {role.oldThreshold} → {role.newThreshold}
                      </li>
                    )}
                    
                    {role.addedKeyids.length > 0 && (
                      <li style={{ margin: '0.25rem 0' }}>
                        Added keys: {role.addedKeyids.map(keyid => truncateKeyId(keyid)).join(', ')}
                      </li>
                    )}
                    
                    {role.removedKeyids.length > 0 && (
                      <li style={{ margin: '0.25rem 0' }}>
                        Removed keys: {role.removedKeyids.map(keyid => truncateKeyId(keyid)).join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </ComparisonSection>
          )}

          {/* Signature changes if any */}
          {hasSignatureChanges && (
            <ComparisonSection>
              <ComparisonTitle>Signature Changes</ComparisonTitle>
              {addedSignatures.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>New signatures from keys:</h4>
                  <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                    {addedSignatures.map(sig => (
                      <li key={`added-sig-${sig.keyid}`} style={{ margin: '0.25rem 0' }}>
                        <KeyId>{truncateKeyId(sig.keyid)}</KeyId>
                        {sig.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({sig.keyowner})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {removedSignatures.length > 0 && (
                <div>
                  <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>No more signatures from keys:</h4>
                  <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                    {removedSignatures.map(sig => (
                      <li key={`removed-sig-${sig.keyid}`} style={{ margin: '0.25rem 0' }}>
                        <KeyId>{truncateKeyId(sig.keyid)}</KeyId>
                        {sig.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({sig.keyowner})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ComparisonSection>
          )}
        </div>
      )}
      
      {/* Keys tab - simplified view with list */}
      {activeTab === 'keys' && hasKeyChanges && (
        <ComparisonSection>
          <ul style={{ padding: '0', margin: '0', listStyle: 'none' }}>
            {addedKeys.length > 0 && (
              <>
                <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Added keys:</li>
                {addedKeys.map(key => (
                  <li key={`added-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                    <KeyId>{truncateKeyId(key.keyid)}</KeyId> 
                    {key.keytype && <span style={{ marginLeft: '0.5rem', color: '#666' }}>{key.keytype}</span>}
                    {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                  </li>
                ))}
              </>
            )}
            
            {removedKeys.length > 0 && (
              <>
                <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Removed keys:</li>
                {removedKeys.map(key => (
                  <li key={`removed-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                    <KeyId>{truncateKeyId(key.keyid)}</KeyId>
                    {key.oldKeytype && <span style={{ marginLeft: '0.5rem', color: '#666' }}>{key.oldKeytype}</span>}
                    {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                  </li>
                ))}
              </>
            )}
            
            {changedKeys.length > 0 && (
              <>
                <li style={{ fontWeight: 'bold', marginTop: '0.75rem' }}>Changed keys:</li>
                {changedKeys.map(key => (
                  <li key={`changed-${key.keyid}`} style={{ margin: '0.5rem 0 0.5rem 1rem' }}>
                    <KeyId>{truncateKeyId(key.keyid)}</KeyId>
                    {key.oldKeytype && key.keytype && key.oldKeytype !== key.keytype && (
                      <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                        Type: {key.oldKeytype} → {key.keytype}
                      </span>
                    )}
                    {key.oldScheme && key.scheme && key.oldScheme !== key.scheme && (
                      <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                        Scheme: {key.oldScheme} → {key.scheme}
                      </span>
                    )}
                    {key.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({key.keyowner})</span>}
                  </li>
                ))}
              </>
            )}
          </ul>
        </ComparisonSection>
      )}
      
      {/* Roles tab - simplified view with list */}
      {activeTab === 'roles' && hasRoleChanges && (
        <ComparisonSection>
          {diff.roleDiffs.map(role => (
            <div key={`role-${role.roleName}`} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{role.roleName}</h4>
              <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                {role.oldThreshold !== undefined && role.newThreshold !== undefined && role.oldThreshold !== role.newThreshold && (
                  <li style={{ margin: '0.25rem 0' }}>
                    Threshold: {role.oldThreshold} → {role.newThreshold}
                  </li>
                )}
                
                {role.addedKeyids.length > 0 && (
                  <li style={{ margin: '0.25rem 0' }}>
                    Added keys: {role.addedKeyids.map(keyid => truncateKeyId(keyid)).join(', ')}
                  </li>
                )}
                
                {role.removedKeyids.length > 0 && (
                  <li style={{ margin: '0.25rem 0' }}>
                    Removed keys: {role.removedKeyids.map(keyid => truncateKeyId(keyid)).join(', ')}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </ComparisonSection>
      )}
      
      {/* Signatures tab - simplified view with list */}
      {activeTab === 'signatures' && hasSignatureChanges && diff?.signatureDiffs && (
        <ComparisonSection>
          {addedSignatures.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>New signatures from keys:</h4>
              <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                {addedSignatures.map(sig => (
                  <li key={`added-sig-${sig.keyid}`} style={{ margin: '0.25rem 0' }}>
                    <KeyId>{truncateKeyId(sig.keyid)}</KeyId>
                    {sig.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({sig.keyowner})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {removedSignatures.length > 0 && (
            <div>
              <h4 style={{ margin: '0.5rem 0', fontSize: '1rem' }}>No more signatures from keys:</h4>
              <ul style={{ padding: '0', margin: '0 0 0 1rem', listStyle: 'none' }}>
                {removedSignatures.map(sig => (
                  <li key={`removed-sig-${sig.keyid}`} style={{ margin: '0.25rem 0' }}>
                    <KeyId>{truncateKeyId(sig.keyid)}</KeyId>
                    {sig.keyowner && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>({sig.keyowner})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ComparisonSection>
      )}
    </DiffTableContainer>
  );
} 