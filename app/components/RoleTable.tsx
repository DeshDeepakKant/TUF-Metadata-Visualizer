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
  margin-right: 0.5rem;
  padding: 0.25rem;
  color: #fff;
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0)'};
  transition: transform 0.2s ease;
`;

const ClickableTableRow = styled(TableRow)<{ $expandable?: boolean }>`
  ${props => props.$expandable ? 'cursor: pointer;' : ''}
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

    // Helper to determine if a role has expandable content (targets or delegations)
    const hasExpandableContent = (role: RoleInfo): boolean => {
        return !!(
            (role.targets && Object.keys(role.targets).length > 0) || 
            (role.delegations?.roles && role.delegations.roles.length > 0)
        );
    };

    const handleRowExpand = (roleName: string) => {
        if (expandedRow === roleName) {
            setExpandedRow(null);
        } else {
            setExpandedRow(roleName);
        }
    };

    // Find delegation info for a specific delegated role
    const findDelegationInfo = (delegatedRoleName: string) => {
        if (!targetsRole?.delegations?.roles) return null;
        
        return targetsRole.delegations.roles.find(role => role.name === delegatedRoleName);
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
                            <ClickableTableRow
                                $expandable={hasExpandableContent(role)}
                                onClick={hasExpandableContent(role) ? (e => {
                                    // Prevent row expand if clicking a link
                                    if ((e.target as HTMLElement).closest('a')) return;
                                    handleRowExpand(role.role);
                                }) : undefined}
                                tabIndex={hasExpandableContent(role) ? 0 : undefined}
                                onKeyDown={hasExpandableContent(role) ? (e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleRowExpand(role.role);
                                    }
                                }) : undefined}
                            >
                                <TableCell>
                                    {hasExpandableContent(role) && (
                                        <ExpandButton
                                            $expanded={expandedRow === role.role}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleRowExpand(role.role);
                                            }}
                                        >
                                            ▶
                                        </ExpandButton>
                                    )}
                                    {role.role} (<Link href={role.jsonLink} target="_blank">json</Link>)
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
                            </ClickableTableRow>

                            {/* Show targets content for any role with targets data when expanded */}
                            {role.targets && Object.keys(role.targets).length > 0 && expandedRow === role.role && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <NestedTableContainer>
                                            <NestedTable>
                                                <thead>
                                                    <NestedTableRow>
                                                        <NestedTableHeader>Path</NestedTableHeader>
                                                    </NestedTableRow>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(role.targets).map(([path]) => (
                                                        <NestedTableRow key={path}>
                                                            <NestedTableCell>{path}</NestedTableCell>
                                                        </NestedTableRow>
                                                    ))}
                                                </tbody>
                                            </NestedTable>
                                        </NestedTableContainer>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* For delegated roles, show delegation info if available */}
                            {role.role !== 'root' && role.role !== 'timestamp' && role.role !== 'snapshot' && role.role !== 'targets' && 
                             expandedRow === role.role && (
                                <TableRow>
                                    <TableCell colSpan={5}>
                                        <NestedTableContainer>
                                            {/* Delegation details - generic for any delegated role */}
                                            {findDelegationInfo(role.role) && (
                                                <NestedTable>
                                                    <thead>
                                                        <NestedTableRow>
                                                            <NestedTableHeader>Property</NestedTableHeader>
                                                            <NestedTableHeader>Value</NestedTableHeader>
                                                        </NestedTableRow>
                                                    </thead>
                                                    <tbody>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Delegation Source</NestedTableCell>
                                                            <NestedTableCell>
                                                                "targets" role delegates to "{role.role}"
                                                            </NestedTableCell>
                                                        </NestedTableRow>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Paths</NestedTableCell>
                                                            <NestedTableCell>
                                                                {findDelegationInfo(role.role)?.paths?.map((path, index) => (
                                                                    <div key={index}>{path}</div>
                                                                ))}
                                                            </NestedTableCell>
                                                        </NestedTableRow>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Terminating</NestedTableCell>
                                                            <NestedTableCell>{findDelegationInfo(role.role)?.terminating ? 'Yes' : 'No'}</NestedTableCell>
                                                        </NestedTableRow>
                                                        <NestedTableRow>
                                                            <NestedTableCell>Threshold</NestedTableCell>
                                                            <NestedTableCell>{findDelegationInfo(role.role)?.threshold}</NestedTableCell>
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