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
    const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
    const [expandedSection, setExpandedSection] = useState<{[key: string]: string}>({});

    if (!roles || roles.length === 0) {
        return <div>No roles found.</div>;
    }

    // Get spec_version from the first role (assuming it's the same for all)
    const specVersion = roles[0]?.specVersion || '-';

    const toggleExpand = (roleId: string) => {
        setExpandedRoles(prev => 
            prev.includes(roleId) 
                ? prev.filter(id => id !== roleId) 
                : [...prev, roleId]
        );
    };

    const toggleSection = (roleId: string, section: string) => {
        setExpandedSection(prev => ({
            ...prev,
            [roleId]: prev[roleId] === section ? '' : section
        }));
    };

    const isRoleExpanded = (roleId: string) => expandedRoles.includes(roleId);
    const getExpandedSection = (roleId: string) => expandedSection[roleId] || '';

    return (
        <TableContainer>
            <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                TUF Specification Version: {specVersion}
            </div>
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
                                    {role.role === 'targets' && (
                                        <button
                                            onClick={() => toggleExpand(role.role)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                marginRight: '5px',
                                                padding: '3px'
                                            }}
                                        >
                                            {isRoleExpanded(role.role) ? '▼' : '▶'}
                                        </button>
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
                            </TableRow>
                            
                            {/* Expanded content for targets row */}
                            {role.role === 'targets' && isRoleExpanded(role.role) && (
                                <TableRow>
                                    <TableCell colSpan={5} style={{ paddingLeft: '30px' }}>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                            <button
                                                onClick={() => toggleSection(role.role, 'targets')}
                                                style={{
                                                    background: getExpandedSection(role.role) === 'targets' ? '#f0f0f0' : 'transparent',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    padding: '5px 10px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Targets
                                            </button>
                                            <button
                                                onClick={() => toggleSection(role.role, 'delegations')}
                                                style={{
                                                    background: getExpandedSection(role.role) === 'delegations' ? '#f0f0f0' : 'transparent',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    padding: '5px 10px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delegations
                                            </button>
                                        </div>
                                        
                                        {/* Targets content */}
                                        {getExpandedSection(role.role) === 'targets' && (
                                            <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                                                <h4 style={{ marginTop: '0' }}>Target Paths</h4>
                                                {role.targets && Object.keys(role.targets).length > 0 ? (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Path</th>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Length</th>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Hashes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(role.targets).map(([path, details]) => (
                                                                <tr key={path}>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{path}</td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{details.length}</td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                        {details.hashes && Object.entries(details.hashes).map(([algorithm, hash]) => (
                                                                            <div key={algorithm}>
                                                                                <strong>{algorithm}:</strong> {hash.substring(0, 10)}...
                                                                            </div>
                                                                        ))}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p>No target paths found</p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Delegations content */}
                                        {getExpandedSection(role.role) === 'delegations' && (
                                            <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                                                <h4 style={{ marginTop: '0' }}>Delegated Roles</h4>
                                                {role.delegations && role.delegations.roles.length > 0 ? (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Role</th>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Threshold</th>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Paths</th>
                                                                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Terminating</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {role.delegations.roles.map((delegatedRole) => (
                                                                <tr key={delegatedRole.name}>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{delegatedRole.name}</td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                        {delegatedRole.threshold} of {delegatedRole.keyids.length}
                                                                    </td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                        {delegatedRole.paths ? 
                                                                            delegatedRole.paths.map((path, i) => (
                                                                                <div key={i}>{path}</div>
                                                                            )) 
                                                                            : 'No specific paths'
                                                                        }
                                                                    </td>
                                                                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                                                                        {delegatedRole.terminating ? 'Yes' : 'No'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <p>No delegations found</p>
                                                )}
                                            </div>
                                        )}
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