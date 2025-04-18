import React from 'react';
import { Badge, Section, SectionTitle } from './styles';
import { SignatureDiff } from '../../utils/types';

interface SignatureStatusProps {
  signatures: SignatureDiff[];
  requiredSignatures: number;
}

export function SignatureStatus({ signatures, requiredSignatures }: SignatureStatusProps) {
  const signedCount = signatures.filter(sig => sig.newSigned).length;
  const missingSigners = signatures
    .filter(sig => !sig.newSigned)
    .map(sig => sig.keyowner || 'Unknown')
    .join(', ');

  return (
    <Section>
      <SectionTitle>Signature Status</SectionTitle>
      <div>
        <p>
          Signed by <strong>{signedCount}</strong> out of <strong>{requiredSignatures}</strong> required signers
        </p>
        {signedCount < requiredSignatures && (
          <div style={{ marginTop: '0.5rem' }}>
            <Badge $type="warning">Missing Signatures</Badge>
            <p style={{ marginTop: '0.25rem' }}>
              Missing signatures from: {missingSigners}
            </p>
          </div>
        )}
      </div>
    </Section>
  );
} 