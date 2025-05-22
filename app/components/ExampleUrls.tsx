'use client';

import React from 'react';
import { 
    ExampleUrlsContainer, 
    ExampleUrlsTitle, 
    ExampleUrlsList, 
    ExampleUrlItem, 
    ExampleUrlLink,
    ExampleUrlDescription 
} from '../styles/components';

interface ExampleUrlsProps {
    onUrlClick: (url: string) => void;
}

export default function ExampleUrls({ onUrlClick }: ExampleUrlsProps) {
    const examples = [
        {
            url: 'https://jku.github.io/tuf-demo/metadata/',
            description: 'TUF Demo Repository'
        },
        {
            url: 'https://tuf-repo-cdn.sigstore.dev/',
            description: 'Sigstore TUF Repository'
        }
    ];

    return (
        <ExampleUrlsContainer>
            <ExampleUrlsTitle>Example TUF Repositories</ExampleUrlsTitle>
            <ExampleUrlsList>
                {examples.map((example, index) => (
                    <ExampleUrlItem
                        key={index}
                        tabIndex={0}
                        role="button"
                        aria-label={`Visualize ${example.description}`}
                        onClick={() => onUrlClick(example.url)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onUrlClick(example.url);
                            }
                        }}
                    >
                        <ExampleUrlDescription>
                            {example.description}:
                        </ExampleUrlDescription>
                        <ExampleUrlLink as="span">
                            {example.url}
                        </ExampleUrlLink>
                    </ExampleUrlItem>
                ))}
            </ExampleUrlsList>
        </ExampleUrlsContainer>
    );
} 