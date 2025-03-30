'use client';

import React from 'react';
import { GlobalStyle } from './styles/global';
import { Header, Container, Title, Footer } from './styles/components';
import StyledComponentsRegistry from './registry';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <StyledComponentsRegistry>
            <GlobalStyle />
            <Header>
                <Container>
                    <Title>TUF Repository Viewer</Title>
                </Container>
            </Header>
            <Container>
                {children}
            </Container>
            <Footer>
                <Container>
                    <p>Powered by Next.js and TUF</p>
                </Container>
            </Footer>
        </StyledComponentsRegistry>
    );
} 