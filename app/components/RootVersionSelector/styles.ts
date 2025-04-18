import styled from 'styled-components';

export const VersionSelectorContainer = styled.div`
  margin: 2rem 0;
`;

export const VersionSelectorTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const VersionSelectorForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

export const VersionSelectorInput = styled.input`
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--background);
  color: var(--text);
  width: 100px;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

export const VersionSelectorButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: var(--background-subtle);
    color: var(--text-subtle);
    cursor: not-allowed;
  }
`;

export const VersionSelectorError = styled.div`
  color: var(--error);
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

export const VersionSelectorLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--text-subtle);
  font-size: 0.875rem;
`;

export const VersionSelectorSuccess = styled.div`
  color: var(--success);
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

export const VersionSelectorInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--background-subtle);
  border-radius: 4px;
`;

export const VersionSelectorInfoTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

export const VersionSelectorInfoList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

export const VersionSelectorInfoItem = styled.li`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
`;

export const VersionSelectorInfoLabel = styled.span`
  font-weight: 500;
  color: var(--text-subtle);
`;

export const VersionSelectorInfoValue = styled.span`
  color: var(--text);
`; 