'use client';

import React, { useState } from 'react';
import {
    TableContainer,
    Table,
    TableRow,
    TableHeader,
    TableCell,
    Link,
    SignerInfo,
    RequiredSigners,
    TotalSigners,
    SignerName,
    OnlineKey,
    ThresholdInfo,
    SignersList
} from '../styles/components';
import { RoleInfo } from '../utils/types';
import styled from 'styled-components';

// Styled components for the nested table
const NestedTableContainer = styled.div`
  padding-left: 2rem;
  margin: 0.5rem 0;
`;

const NestedTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
`;

const NestedTableRow = styled.tr`
  &:hover {
    background-color: var(--hover);
  }
`;

const NestedTableHeader = styled.th`
  text-align: left;
  padding: 0.5rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
`;

const NestedTableCell = styled.td`
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
`;

const ExpandButton = styled.button<{ $expanded?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem;
  color: var(--link);
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const RoleName = styled.div`
  display: flex;
  align-items: center;
`;

const ExpandableArea = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

interface RoleTableProps {
    roles: RoleInfo[];
}

// Helper function to format the keyid for display (show as username)
const formatKeyId = (keyid: string): string => {
    // If it's already a username format with @, just return it
    if (keyid.startsWith('@')) {
        return keyid;
    }

    // If it's an online key, return as is
    if (keyid.toLowerCase() === 'online key') {
        return keyid;
    }

    // Check if the keyid looks like a hex string and truncate it for display
    if (keyid.match(/^[0-9a-f]+$/i)) {
        return `@${keyid.substring(0, 8)}`;
    }

    // Otherwise, add @ to make it look like a username
    return `@${keyid}`;
};

// Helper to determine if a key is an "online key"
const isOnlineKey = (keyid: string): boolean => {
    // If the key ID is already labeled as an online key
    if (keyid.toLowerCase() === 'online key') {
        return true;
    }

    // Check for common patterns in online key IDs
    if (keyid.toLowerCase().includes('online') ||
        keyid === '0c87432c' ||
        keyid === '5e3a4021') {
        return true;
    }

    return false;
};

export default function RoleTable({ roles }: RoleTableProps) {
    const [expandedRow, setExpandedRow] = useState<string | null>(null);


    if (!roles || roles.length === 0) {
        return <div>No roles found.</div>;
    }

    // Find the targets role
    const targetsRole = roles.find(role => role.role === 'targets');

    // Get delegations from targets role for registry.npmjs.org
    const registryDelegation = targetsRole?.delegations?.roles?.find(role => role.name === 'registry.npmjs.org');

    const handleRowExpand = (roleName: string) => {
        if (expandedRow === roleName) {
            setExpandedRow(null);
        } else {
            setExpandedRow(roleName);
        }
    };



    return (
        <TableContainer>
            <Table>
                <thead>
                    <TableRow>
                        <TableHeader>Role</TableHeader>
                        <TableHeader>Signing Starts</TableHeader>
                        <TableHeader>Version</TableHeader>
                        <TableHeader>Expires</TableHeader>
                        <TableHeader>Signers</TableHeader>
                    </TableRow>
                </thead>
                <tbody>
                    {roles.map((role) => (
                        <React.Fragment key={role.role}>
                            <TableRow>
                                <TableCell>
                                    <RoleName>
                                        {(role.role === 'targets' || role.role === 'registry.npmjs.org') ? (
                                            <ExpandableArea onClick={() => handleRowExpand(role.role)}>
                                                <ExpandButton $expanded={expandedRow === role.role}>
                                                    ▶
                                                </ExpandButton>
                                                {role.role}
                                            </ExpandableArea>
                                        ) : (
                                            <>
                                                <div style={{ width: '20px' }}></div>
                                                {role.role}
                                            </>
                                        )}
                                        {' '}(<Link href={role.jsonLink} target="_blank">json</Link>)
                                    </RoleName>
                                </TableCell>
                                <TableCell>{role.signingStarts || 'N/A'}</TableCell>
                                <TableCell>{role.version || '-'}</TableCell>
                                <TableCell>{role.expires}</TableCell>
                                <TableCell>
                                    {role.signers.keyids.length > 0 ? (
                                        <>
                                            {/* User keys */}
                                            {role.signers.keyids.some(keyid => !isOnlineKey(keyid)) && (
                                                <SignersList>
                                                    {role.signers.keyids
                                                        .filter(keyid => !isOnlineKey(keyid))
                                                        .map((keyid, index, filteredArray) => (
                                                            <React.Fragment key={keyid}>
                                                                <SignerName>{formatKeyId(keyid)}</SignerName>
                                                                {index < filteredArray.length - 1 && ', '}
                                                            </React.Fragment>
                                                        ))}
                                                    <ThresholdInfo>
                                                        {' '}({role.signers.required} of {role.signers.total} required)
                                                    </ThresholdInfo>
                                                </SignersList>
                                            )}

                                            {/* Online keys */}
                                            {role.signers.keyids.some(keyid => isOnlineKey(keyid)) && (
                                                <SignersList>
                                                    <OnlineKey>online key</OnlineKey>
                                                    <ThresholdInfo>
                                                        {' '}({role.signers.required} of {role.signers.total} required)
                                                    </ThresholdInfo>
                                                </SignersList>
                                            )}
                                        </>
                                    ) : (
                                        <SignerInfo>
                                            <RequiredSigners>{role.signers.required}</RequiredSigners>
                                            <TotalSigners>of {role.signers.total}</TotalSigners>
                                        </SignerInfo>
                                    )}
                                </TableCell>
                            </TableRow>

                            {/* Nested content for targets */}
                            {role.role === 'targets' && expandedRow === 'targets' && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <NestedTableContainer>
                                            {/* Targets content - only show paths directly */}
                                            {targetsRole?.targets && (
                                                <NestedTable>
                                                    <thead>
                                                        <NestedTableRow>
                                                            <NestedTableHeader>Path</NestedTableHeader>
                                                        </NestedTableRow>
                                                    </thead>
                                                    <tbody>
                                                        {Object.entries(targetsRole.targets).map(([path]) => (
                                                            <NestedTableRow key={path}>
                                                                <NestedTableCell>{path}</NestedTableCell>
                                                            </NestedTableRow>
                                                        ))}
                                                    </tbody>
                                                </NestedTable>
                                            )}
                                        </NestedTableContainer>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* Nested content for registry.npmjs.org */}
                            {role.role === 'registry.npmjs.org' && expandedRow === 'registry.npmjs.org' && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <NestedTableContainer>
                                            {/* Registry delegation details - show directly */}
                                            {registryDelegation && (
                                                <NestedTable>
                                                    <thead>
                                                        <NestedTableRow>
                                                            <NestedTableHeader>Property</NestedTableHeader>
                                                            <NestedTableHeader>Value</NestedTableHeader>
                                                        </NestedTableRow>
                                                    </thead>
                                                    <tbody>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Paths</NestedTableCell>
                                                            <NestedTableCell>
                                                                {registryDelegation.paths?.map((path, index) => (
                                                                    <div key={index}>{path}</div>
                                                                ))}
                                                            </NestedTableCell>
                                                        </NestedTableRow>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Terminating</NestedTableCell>
                                                            <NestedTableCell>{registryDelegation.terminating ? 'Yes' : 'No'}</NestedTableCell>
                                                        </NestedTableRow>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Threshold</NestedTableCell>
                                                            <NestedTableCell>{registryDelegation.threshold}</NestedTableCell>
                                                        </NestedTableRow>
                                                    </tbody>
                                                </NestedTable>
                                            )}
                                        </NestedTableContainer>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </TableContainer>
    );
}