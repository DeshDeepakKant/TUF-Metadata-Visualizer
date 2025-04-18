'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getAvailableRootVersionsAction, compareRootVersionsAction } from '../actions';
import RootDiffTable from './RootDiffTable';
import { RootDiff } from '../utils/types';
import {
  VersionSelectorContainer,
  VersionSelectorTitle,
  VersionSelectorForm,
  VersionSelectorInput,
  VersionSelectorButton,
  VersionSelectorError,
  VersionSelectorLoading,
  VersionSelectorSuccess,
  VersionSelectorInfo,
  VersionSelectorInfoTitle,
  VersionSelectorInfoList,
  VersionSelectorInfoItem,
  VersionSelectorInfoLabel,
  VersionSelectorInfoValue
} from './RootVersionSelector/styles';

// Styled components
const SelectorContainer = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: var(--background-subtle);
  border-radius: 4px;
`;

const SelectorTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const SelectorForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const SelectorGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const SelectorLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const SelectorSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--background);
`;

const SelectorButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: var(--primary-dark);
  }
  
  &:disabled {
    background-color: var(--border);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  color: var(--error);
  background-color: var(--error-light);
  border-radius: 4px;
`;

interface RootVersion {
  version: number;
}

export default function RootVersionSelector() {
  // State for available versions and selections
  const [versions, setVersions] = useState<RootVersion[]>([]);
  const [oldVersion, setOldVersion] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diff, setDiff] = useState<RootDiff | null>(null);
  
  // Load available versions on mount
  useEffect(() => {
    async function loadVersions() {
      try {
        const availableVersions = await getAvailableRootVersionsAction();
        setVersions(availableVersions);
        
        // Auto-select the latest two versions if available
        if (availableVersions.length >= 2) {
          setNewVersion(availableVersions[0].version);
          setOldVersion(availableVersions[1].version);
        } else if (availableVersions.length === 1) {
          setNewVersion(availableVersions[0].version);
        }
      } catch (error) {
        console.error('Error loading root versions:', error);
        setError('Failed to load available root versions');
      }
    }
    
    loadVersions();
  }, []);
  
  // Handle compare button click
  const handleCompare = async () => {
    if (!oldVersion || !newVersion) {
      setError('Please select both versions to compare');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await compareRootVersionsAction(oldVersion, newVersion);
      
      if (result.error) {
        setError(result.error);
        setDiff(null);
      } else {
        setDiff(result.diff);
      }
    } catch (error) {
      console.error('Error comparing versions:', error);
      setError('Failed to compare root versions');
      setDiff(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <SelectorContainer>
        <SelectorTitle>Compare Root Versions</SelectorTitle>
        <SelectorForm>
          <SelectorGroup>
            <SelectorLabel htmlFor="oldVersion">Old Version</SelectorLabel>
            <SelectorSelect 
              id="oldVersion" 
              value={oldVersion || ''} 
              onChange={(e) => setOldVersion(Number(e.target.value))}
            >
              <option value="">Select a version</option>
              {versions.map((v) => (
                <option key={`old-${v.version}`} value={v.version}>
                  Version {v.version}
                </option>
              ))}
            </SelectorSelect>
          </SelectorGroup>
          
          <SelectorGroup>
            <SelectorLabel htmlFor="newVersion">New Version</SelectorLabel>
            <SelectorSelect 
              id="newVersion" 
              value={newVersion || ''} 
              onChange={(e) => setNewVersion(Number(e.target.value))}
            >
              <option value="">Select a version</option>
              {versions.map((v) => (
                <option key={`new-${v.version}`} value={v.version}>
                  Version {v.version}
                </option>
              ))}
            </SelectorSelect>
          </SelectorGroup>
          
          <SelectorButton 
            onClick={handleCompare}
            disabled={loading || !oldVersion || !newVersion}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </SelectorButton>
        </SelectorForm>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        {versions.length === 0 && !error && (
          <div style={{ marginTop: '1rem' }}>
            No historical root versions found. You need at least two different root versions to use this feature.
          </div>
        )}
      </SelectorContainer>
      
      <RootDiffTable diff={diff} loading={loading} />
    </>
  );
}