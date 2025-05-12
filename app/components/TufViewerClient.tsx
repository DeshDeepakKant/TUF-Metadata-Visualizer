'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createTufRepository } from '../utils/tufClient';
import RoleTable from './RoleTable';
import TufTreeViews from './TufTreeViews';
import { RoleInfo } from '../utils/types';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: var(--fg-subtle);
  margin-bottom: 2rem;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  background: var(--bg-subtle);
  color: var(--fg);

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: var(--accent-hover);
  }

  &:disabled {
    background: var(--bg-subtle);
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  margin-top: 1rem;
  padding: 1rem;
  background: var(--error-bg);
  border-radius: 0.25rem;
`;

const LoadingMessage = styled.div`
  color: var(--fg-subtle);
  margin-top: 1rem;
`;

const TufViewerClient: React.FC = () => {
  const [remoteUrl, setRemoteUrl] = useState<string>('');
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const repository = await createTufRepository(remoteUrl);
      const roleInfo = repository.getRoleInfo();
      setRoles(roleInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>TUF Metadata Visualizer</Title>
        <Description>
          Visualize TUF metadata from a remote repository or local files.
        </Description>
      </Header>

      <form onSubmit={handleSubmit}>
        <InputContainer>
          <Input
            type="text"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="Enter remote repository URL"
          />
          <Button type="submit" disabled={loading || !remoteUrl}>
            {loading ? 'Loading...' : 'Load Metadata'}
          </Button>
        </InputContainer>
      </form>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading && <LoadingMessage>Loading metadata...</LoadingMessage>}

      {roles.length > 0 && (
        <>
          <TufTreeViews roles={roles} />
          <RoleTable roles={roles} />
        </>
      )}
    </Container>
  );
};

export default TufViewerClient;
