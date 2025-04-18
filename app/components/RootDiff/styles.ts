import styled from 'styled-components';

/**
 * Container styles
 */
export const DiffContainer = styled.div`
  margin: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 4px;
`;

export const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  background-color: var(--background-subtle);
  border-radius: 4px;
  color: var(--text-subtle);
`;

/**
 * Summary styles
 */
export const DiffSummary = styled.div`
  background-color: var(--background-subtle);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

export const DiffSummaryTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

export const DiffSummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

export const DiffSummaryLabel = styled.span`
  font-weight: 500;
`;

/**
 * Table styles
 */
export const DiffTableContainer = styled.div`
  margin: 2rem 0;
`;

export const DiffTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

export const DiffTableHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
`;

export const DiffTableRow = styled.tr`
  &:hover {
    background-color: var(--hover);
  }
`;

export const DiffTableCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
`;

/**
 * Section styles
 */
export const Section = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: var(--background);
  border-radius: 4px;
`;

export const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

/**
 * Badge styles
 */
export const Badge = styled.span<{ $type: 'success' | 'error' | 'warning' | 'info' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch (props.$type) {
      case 'success': return 'var(--success-light)';
      case 'error': return 'var(--error-light)';
      case 'warning': return 'var(--warning-light)';
      case 'info': return 'var(--info-light)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return 'var(--success)';
      case 'error': return 'var(--error)';
      case 'warning': return 'var(--warning)';
      case 'info': return 'var(--info)';
    }
  }};
`;

export const AddedBadge = styled(Badge).attrs({ $type: 'success' })``;
export const RemovedBadge = styled(Badge).attrs({ $type: 'error' })``;
export const ChangedBadge = styled(Badge).attrs({ $type: 'warning' })``;
export const VerifiedBadge = styled(Badge).attrs({ $type: 'success' })``;
export const UnverifiedBadge = styled(Badge).attrs({ $type: 'error' })``;

/**
 * Key ID display
 */
export const KeyId = styled.span`
  font-family: 'Courier New', monospace;
  background-color: var(--background-subtle);
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
`;

/**
 * Title and selector styles
 */
export const DiffTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1rem 0;
`;

export const DiffSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const DiffSelectButton = styled.button<{ $active?: boolean }>`
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

/**
 * Side-by-side comparison styles
 */
export const SideBySideContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SideBySideTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

export const SideBySideHeader = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  width: 50%;
`;

export const SideBySideHeaderProperty = styled.th`
  text-align: left;
  padding: 0.75rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  width: 25%;
`;

export const SideBySideCell = styled.td`
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
`;

export const ComparisonSection = styled.div`
  margin-bottom: 2rem;
`;

export const ComparisonTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;

/**
 * Diff item styles
 */
export const DiffItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: var(--background);
  border-radius: 4px;
`;

export const DiffLabel = styled.span`
  font-weight: 500;
`; 