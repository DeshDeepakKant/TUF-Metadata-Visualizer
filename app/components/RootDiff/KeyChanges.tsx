import React from 'react';
import { Badge, Section, SectionTitle, KeyId } from './styles';
import { KeyDiff } from '../../utils/types';

interface KeyChangesProps {
  changes: KeyDiff[];
}

export function KeyChanges({ changes }: KeyChangesProps) {
  if (changes.length === 0) return null;

  return (
    <Section>
      <SectionTitle>Key Changes</SectionTitle>
      {changes.map(change => (
        <div key={change.keyid} style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.25rem' }}>
            <KeyId>{change.keyid.substring(0, 8)}</KeyId>
            {change.keyowner && (
              <span style={{ marginLeft: '0.5rem' }}>({change.keyowner})</span>
            )}
          </div>
          
          {change.status === 'added' && (
            <Badge $type="success">Added</Badge>
          )}
          
          {change.status === 'removed' && (
            <Badge $type="error">Removed</Badge>
          )}
          
          {change.status === 'changed' && (
            <div>
              <Badge $type="warning">Changed</Badge>
              <div style={{ marginTop: '0.25rem' }}>
                {change.oldKeytype !== change.keytype && (
                  <div>
                    Key type: {change.oldKeytype} → {change.keytype}
                  </div>
                )}
                {change.oldScheme !== change.scheme && (
                  <div>
                    Scheme: {change.oldScheme} → {change.scheme}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </Section>
  );
} 