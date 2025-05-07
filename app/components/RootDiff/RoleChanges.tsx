import React from 'react';
import { Badge, Section, SectionTitle, KeyId } from './styles';
import { RoleDiff } from '../../utils/types';

interface RoleChangesProps {
  changes: RoleDiff[];
}

export function RoleChanges({ changes }: RoleChangesProps) {
  if (changes.length === 0) return null;

  return (
    <Section>
      <SectionTitle>Role Changes</SectionTitle>
      {changes.map(change => (
        <div key={change.roleName} style={{ marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>{change.roleName}</h4>
          
          {/* Threshold changes */}
          {change.oldThreshold !== undefined && change.newThreshold !== undefined && (
            <div style={{ marginBottom: '0.25rem' }}>
              <Badge $type="info">Threshold</Badge>
              <span style={{ marginLeft: '0.5rem' }}>
                Changed from {change.oldThreshold} to {change.newThreshold}
              </span>
            </div>
          )}
          
          {/* Key changes */}
          {change.addedKeyids.length > 0 && (
            <div style={{ marginBottom: '0.25rem' }}>
              <Badge $type="success">Added Keys</Badge>
              <span style={{ marginLeft: '0.5rem' }}>
                {change.addedKeyids.map(keyId => (
                  <KeyId key={keyId} style={{ marginLeft: '0.25rem' }}>
                    {keyId.substring(0, 8)}
                  </KeyId>
                ))}
              </span>
            </div>
          )}
          
          {change.removedKeyids.length > 0 && (
            <div style={{ marginBottom: '0.25rem' }}>
              <Badge $type="error">Removed Keys</Badge>
              <span style={{ marginLeft: '0.5rem' }}>
                {change.removedKeyids.map(keyId => (
                  <KeyId key={keyId} style={{ marginLeft: '0.25rem' }}>
                    {keyId.substring(0, 8)}
                  </KeyId>
                ))}
              </span>
            </div>
          )}
        </div>
      ))}
    </Section>
  );
} 