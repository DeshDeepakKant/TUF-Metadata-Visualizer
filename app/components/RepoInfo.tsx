'use client';

import React from 'react';
import { TimestampInfo } from '../styles/components';

interface RepoInfoProps {
    lastUpdated?: string;
    commit?: string;
    toolVersion?: string;
}

export default function RepoInfo({ lastUpdated, commit, toolVersion }: RepoInfoProps) {
    return (
        <TimestampInfo>
            <p>
                Last updated: {lastUpdated || new Date().toUTCString()}
                {commit && <span> | Commit: {commit}</span>}
                {toolVersion && <span> | {toolVersion}</span>}
            </p>
        </TimestampInfo>
    );
} 