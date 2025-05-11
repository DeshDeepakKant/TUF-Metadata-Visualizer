'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TimestampInfo } from '../styles/components';

const RepoInfoContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--background-subtle);
  border-radius: 4px;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  font-weight: 500;
  margin-right: 0.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RemoteUrlContainer = styled.div`
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
`;

const RemoteUrlInput = styled.input`
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  width: 100%;
  margin-right: 0.5rem;
`;

const RemoteUrlButton = styled.button`
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

const RemoteUrlForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

interface RepoInfoProps {
    lastUpdated?: string;
    commit?: string;
    toolVersion?: string;
    onRemoteUrlChange?: (url: string) => void;
    remoteUrl?: string;
}

export default function RepoInfo({ lastUpdated, commit, toolVersion, onRemoteUrlChange, remoteUrl }: RepoInfoProps) {
    const [urlInput, setUrlInput] = useState(remoteUrl || '');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (remoteUrl) {
            setUrlInput(remoteUrl);
        }
    }, [remoteUrl]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onRemoteUrlChange && urlInput) {
            let formattedUrl = urlInput.trim();
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
                formattedUrl = 'https://' + formattedUrl;
            }
            
            if (!formattedUrl.endsWith('/')) {
                formattedUrl += '/';
            }
            
            setIsLoading(true);
            try {
                await onRemoteUrlChange(formattedUrl);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <RepoInfoContainer>
            <InfoRow>
                <InfoLabel>Last Updated:</InfoLabel>
                <span>{lastUpdated || new Date().toUTCString()}</span>
            </InfoRow>
            <InfoRow>
                <InfoLabel>Commit:</InfoLabel>
                <span>{commit}</span>
            </InfoRow>
            <InfoRow>
                <InfoLabel>TUF Viewer Version:</InfoLabel>
                <span>{toolVersion}</span>
            </InfoRow>
            
            <RemoteUrlContainer>
                <InfoRow>
                    <InfoLabel>Remote Repository:</InfoLabel>
                    {remoteUrl ? (
                        <span>{remoteUrl}</span>
                    ) : (
                        <span>Using local metadata</span>
                    )}
                </InfoRow>
                
                <RemoteUrlForm onSubmit={handleSubmit}>
                    <RemoteUrlInput
                        type="url"
                        placeholder="Enter remote TUF repository URL (e.g., https://tuf-repo-cdn.sigstore.dev/)"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        required
                    />
                    <RemoteUrlButton 
                        type="submit"
                        disabled={isLoading || !urlInput}
                    >
                        {isLoading ? 'Loading...' : 'Load Repository'}
                    </RemoteUrlButton>
                </RemoteUrlForm>
            </RemoteUrlContainer>
        </RepoInfoContainer>
    );
} 