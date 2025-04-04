'use client';

import React from 'react';
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
    if (!roles || roles.length === 0) {
        return <div>No roles found.</div>;
    }

    return (
        <TableContainer>
            <Table>
                <thead>
                    <TableRow>
                        <TableHeader>Role</TableHeader>
                        <TableHeader>Signing Starts</TableHeader>
                        <TableHeader>Expires</TableHeader>
                        <TableHeader>Signers</TableHeader>
                    </TableRow>
                </thead>
                <tbody>
                    {roles.map((role) => (
                        <TableRow key={role.role}>
                            <TableCell>
                                {role.role} (<Link href={role.jsonLink} target="_blank">json</Link>)
                            </TableCell>
                            <TableCell>{role.signingStarts || 'N/A'}</TableCell>
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
                    ))}
                </tbody>
            </Table>
        </TableContainer>
    );
} 