'use client';

import React from 'react';
import { TableContainer, Table, TableRow, TableHeader, TableCell, Link, SignerInfo, RequiredSigners, TotalSigners } from '../styles/components';
import { RoleInfo } from '../utils/types';

interface RoleTableProps {
    roles: RoleInfo[];
}

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
                                <SignerInfo>
                                    <RequiredSigners>{role.signers.required}</RequiredSigners>
                                    <TotalSigners>of {role.signers.total}</TotalSigners>
                                </SignerInfo>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </Table>
        </TableContainer>
    );
} 